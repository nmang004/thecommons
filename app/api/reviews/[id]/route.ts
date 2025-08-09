import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/reviews/:id
 * Retrieves the full review object, including its current content and status
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the review with related data
    const { data: review, error } = await supabase
      .from('reviews')
      .select(`
        *,
        manuscripts (
          id,
          title,
          abstract,
          field_of_study
        ),
        reviewer_profile:profiles!reviewer_id (
          id,
          full_name,
          email
        ),
        review_template:review_templates (
          id,
          name,
          template_data
        )
      `)
      .eq('id', params.id)
      .single()

    if (error || !review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isEditor = profile?.role === 'editor' || profile?.role === 'admin'
    const isReviewer = review.reviewer_id === user.id

    if (!isEditor && !isReviewer) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get review annotations if they exist
    const { data: annotations } = await supabase
      .from('review_annotations')
      .select('*')
      .eq('review_id', params.id)
      .order('page_number', { ascending: true })

    // Get quality report if available (for editors or completed reviews)
    let qualityReport = null
    if (isEditor || review.submitted_at) {
      const { data: report } = await supabase
        .from('review_quality_reports')
        .select('*')
        .eq('review_id', params.id)
        .single()
      
      qualityReport = report
    }

    return NextResponse.json({
      success: true,
      review: {
        ...review,
        annotations: annotations || [],
        qualityReport: isEditor ? qualityReport : null
      }
    })

  } catch (error) {
    console.error('Error fetching review:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/reviews/:id
 * The primary endpoint for saving a review in progress (auto-saving)
 * Also used for status changes like withdrawing a review
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the review to check ownership
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('reviewer_id, submitted_at')
      .eq('id', params.id)
      .single()

    if (reviewError || !review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Check permissions - only reviewer can update their own review
    if (review.reviewer_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Prevent updates to submitted reviews
    if (review.submitted_at) {
      return NextResponse.json(
        { error: 'Cannot update submitted review' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { content, status, version } = body

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Update content if provided (for auto-save)
    if (content) {
      updateData.form_data = content
      
      // Update legacy fields for backward compatibility
      if (content.sections?.summary) {
        const summary = content.sections.summary
        if (summary.recommendation) updateData.recommendation = summary.recommendation
        if (summary.confidence) updateData.confidence_level = summary.confidence
        if (summary.overallAssessment) updateData.summary = summary.overallAssessment
      }
      
      if (content.sections?.detailedComments) {
        const comments = content.sections.detailedComments
        if (comments.majorIssues?.length > 0) {
          updateData.major_comments = comments.majorIssues
            .map((issue: any, index: number) => `${index + 1}. ${issue.text}`)
            .join('\n\n')
        }
        if (comments.minorIssues?.length > 0) {
          updateData.minor_comments = comments.minorIssues
            .map((issue: any, index: number) => `${index + 1}. ${issue.text}`)
            .join('\n\n')
        }
      }

      if (content.sections?.confidentialComments?.editorOnly) {
        updateData.comments_for_editor = content.sections.confidentialComments.editorOnly
      }
    }

    // Handle status changes (e.g., withdrawal)
    if (status) {
      if (status === 'withdrawn') {
        updateData.status = 'withdrawn'
        updateData.withdrawn_at = new Date().toISOString()
      }
    }

    // Version control (optional)
    if (version !== undefined) {
      updateData.version = version
    }

    // Update the review
    const { data: updatedReview, error: updateError } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating review:', updateError)
      return NextResponse.json(
        { error: 'Failed to update review' },
        { status: 500 }
      )
    }

    // Log the activity
    await supabase
      .from('activity_logs')
      .insert({
        manuscript_id: updatedReview.manuscript_id,
        user_id: user.id,
        action: status === 'withdrawn' ? 'review_withdrawn' : 'review_updated',
        details: {
          review_id: params.id,
          status,
          content_updated: !!content
        }
      })

    return NextResponse.json({
      success: true,
      message: status === 'withdrawn' ? 'Review withdrawn successfully' : 'Review updated successfully',
      review: updatedReview
    })

  } catch (error) {
    console.error('Error updating review:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}