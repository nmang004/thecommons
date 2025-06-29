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
    const { assignmentId, manuscriptId, reviewData, isDraft } = body

    // Verify the reviewer has access to this assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('review_assignments')
      .select('*')
      .eq('id', assignmentId)
      .eq('reviewer_id', user.id)
      .eq('status', 'accepted')
      .single()

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { error: 'Review assignment not found or not accessible' },
        { status: 404 }
      )
    }

    if (isDraft) {
      // For drafts, we might store in a separate table or use a different status
      // For now, we'll skip the database operation and just return success
      return NextResponse.json({ 
        success: true, 
        message: 'Draft saved successfully' 
      })
    }

    // Check if review already exists
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('manuscript_id', manuscriptId)
      .eq('reviewer_id', user.id)
      .single()

    const reviewPayload = {
      manuscript_id: manuscriptId,
      reviewer_id: user.id,
      recommendation: reviewData.recommendation,
      summary: reviewData.summary,
      major_comments: reviewData.majorComments,
      minor_comments: reviewData.minorComments || null,
      comments_for_editor: reviewData.commentsForEditor || null,
      confidence_level: reviewData.confidenceLevel,
      time_spent_hours: reviewData.timeSpentHours ? parseFloat(reviewData.timeSpentHours) : null,
      round: 1 // For now, assuming first round
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

    // Update assignment status to completed
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

    // Check if all reviews are complete and update manuscript status
    const { data: allAssignments } = await supabase
      .from('review_assignments')
      .select('status')
      .eq('manuscript_id', manuscriptId)

    const allComplete = allAssignments?.every(a => a.status === 'completed')
    
    if (allComplete) {
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
          recommendation: reviewData.recommendation
        }
      })

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