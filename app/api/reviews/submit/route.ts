import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { assignmentId, manuscriptId, reviewData, draftId, isDraft } = body

    if (!manuscriptId || !reviewData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify the reviewer has access to this assignment (if provided)
    let assignment = null
    if (assignmentId) {
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('review_assignments')
        .select('*')
        .eq('id', assignmentId)
        .eq('reviewer_id', user.id)
        .eq('status', 'accepted')
        .single()

      if (assignmentError || !assignmentData) {
        return NextResponse.json(
          { error: 'Review assignment not found or not accessible' },
          { status: 404 }
        )
      }
      assignment = assignmentData
    }

    if (isDraft) {
      return NextResponse.json({ 
        success: true, 
        message: 'Draft saved successfully' 
      })
    }

    // Validate required fields for submission
    const validationErrors: Record<string, string[]> = {}
    
    if (!reviewData.sections?.summary?.recommendation) {
      validationErrors.summary = ['Recommendation is required']
    }
    
    if (!reviewData.sections?.summary?.confidence) {
      if (!validationErrors.summary) validationErrors.summary = []
      validationErrors.summary.push('Confidence level is required')
    }
    
    if (!reviewData.sections?.summary?.expertise) {
      if (!validationErrors.summary) validationErrors.summary = []
      validationErrors.summary.push('Expertise level is required')
    }
    
    // Check quality assessment
    const qa = reviewData.sections?.qualityAssessment
    if (!qa || !qa.originality?.score || !qa.significance?.score || !qa.methodology?.score || 
        !qa.clarity?.score || !qa.references?.score) {
      validationErrors.qualityAssessment = ['All quality assessment scores are required']
    }
    
    // Check detailed comments
    const dc = reviewData.sections?.detailedComments
    if (!dc || (dc.majorIssues?.length === 0 && dc.minorIssues?.length === 0)) {
      validationErrors.detailedComments = ['At least one major or minor issue must be provided']
    }
    
    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          validationErrors 
        },
        { status: 400 }
      )
    }

    // Check if review already exists
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id, submitted_at')
      .eq('manuscript_id', manuscriptId)
      .eq('reviewer_id', user.id)
      .single()

    if (existingReview && existingReview.submitted_at) {
      return NextResponse.json(
        { error: 'Review already submitted' },
        { status: 400 }
      )
    }

    // Convert new review form structure to database format
    const sections = reviewData.sections
    const summary = sections.summary
    const detailedComments = sections.detailedComments
    const confidentialComments = sections.confidentialComments

    // Build detailed comments summary
    const buildCommentsText = (comments: any[]) => {
      if (!comments || comments.length === 0) return ''
      return comments.map((c: any, index: number) => 
        `${index + 1}. ${c.text}${c.type ? ` (${c.type})` : ''}`
      ).join('\n\n')
    }

    const reviewPayload = {
      manuscript_id: manuscriptId,
      reviewer_id: user.id,
      recommendation: summary.recommendation,
      summary: summary.overallAssessment || 'Overall assessment provided via structured review form.',
      major_comments: buildCommentsText(detailedComments.majorIssues),
      minor_comments: buildCommentsText(detailedComments.minorIssues),
      comments_for_editor: confidentialComments?.editorOnly || null,
      confidence_level: summary.confidence,
      time_spent_hours: reviewData.progress?.timeSpent ? Math.round(reviewData.progress.timeSpent / 60 * 100) / 100 : null,
      round: 1, // For now, assuming first round
      form_data: reviewData, // Store complete form data as JSONB
      template_id: reviewData.templateId || null,
      draft_id: draftId || null,
      submitted_at: new Date().toISOString()
    }

    let reviewResult
    if (existingReview) {
      // Update existing review
      reviewResult = await supabase
        .from('reviews')
        .update(reviewPayload)
        .eq('id', existingReview.id)
        .select()
        .single()
    } else {
      // Insert new review
      reviewResult = await supabase
        .from('reviews')
        .insert(reviewPayload)
        .select()
        .single()
    }

    if (reviewResult.error) {
      console.error('Error saving review:', reviewResult.error)
      return NextResponse.json(
        { error: 'Failed to save review' },
        { status: 500 }
      )
    }

    // Update assignment status to completed (if assignment exists)
    if (assignment) {
      const { error: updateError } = await supabase
        .from('review_assignments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', assignmentId)

      if (updateError) {
        console.error('Error updating assignment status:', updateError)
        // Don't fail the whole operation for this
      }
    }

    // Delete the draft now that review is submitted
    if (draftId) {
      await supabase
        .from('review_drafts')
        .delete()
        .eq('id', draftId)
    }

    // Check if all reviews are complete and update manuscript status
    const { data: allAssignments } = await supabase
      .from('review_assignments')
      .select('status')
      .eq('manuscript_id', manuscriptId)

    const allComplete = allAssignments?.every((a: any) => a.status === 'completed')
    
    if (allComplete && allAssignments && allAssignments.length > 0) {
      // Update manuscript status to indicate reviews are complete
      await supabase
        .from('manuscripts')
        .update({ status: 'with_editor' })
        .eq('id', manuscriptId)
    }

    // Log the activity
    await supabase
      .from('activity_logs')
      .insert({
        manuscript_id: manuscriptId,
        user_id: user.id,
        action: 'review_submitted',
        details: {
          assignment_id: assignmentId,
          recommendation: summary.recommendation,
          review_id: reviewResult.data.id,
          confidence_level: summary.confidence,
          expertise_level: summary.expertise
        }
      })

    // Create notification for editor
    const { data: manuscript } = await supabase
      .from('manuscripts')
      .select('title, editor_id')
      .eq('id', manuscriptId)
      .single()

    if (manuscript && manuscript.editor_id) {
      await supabase
        .from('notifications')
        .insert({
          user_id: manuscript.editor_id,
          type: 'review_completed',
          title: 'Review Completed',
          message: `A review has been submitted for: ${manuscript.title}`,
          data: {
            manuscript_id: manuscriptId,
            review_id: reviewResult.data.id,
            recommendation: summary.recommendation
          }
        })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Review submitted successfully',
      reviewId: reviewResult.data.id
    })

  } catch (error) {
    console.error('Error in review submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}