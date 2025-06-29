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

    // Verify user is an editor
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'editor' && profile.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { manuscriptId, reviewerIds, dueDate } = body

    // Verify manuscript exists and editor has access
    const { data: manuscript, error: manuscriptError } = await supabase
      .from('manuscripts')
      .select('id, title, editor_id')
      .eq('id', manuscriptId)
      .single()

    if (manuscriptError || !manuscript) {
      return NextResponse.json(
        { error: 'Manuscript not found' },
        { status: 404 }
      )
    }

    // For now, allow any editor to assign reviewers
    // In production, you might want to restrict to assigned editor
    // if (manuscript.editor_id && manuscript.editor_id !== user.id) {
    //   return NextResponse.json(
    //     { error: 'Not authorized to assign reviewers to this manuscript' },
    //     { status: 403 }
    //   )
    // }

    const assignments = []
    const errors = []

    for (const reviewerId of reviewerIds) {
      // Check if reviewer is already assigned
      const { data: existingAssignment } = await supabase
        .from('review_assignments')
        .select('id')
        .eq('manuscript_id', manuscriptId)
        .eq('reviewer_id', reviewerId)
        .single()

      if (existingAssignment) {
        errors.push(`Reviewer ${reviewerId} is already assigned to this manuscript`)
        continue
      }

      // Create assignment
      const { data: assignment, error: assignmentError } = await supabase
        .from('review_assignments')
        .insert({
          manuscript_id: manuscriptId,
          reviewer_id: reviewerId,
          assigned_by: user.id,
          due_date: dueDate,
          status: 'invited'
        })
        .select()
        .single()

      if (assignmentError) {
        errors.push(`Failed to assign reviewer ${reviewerId}: ${assignmentError.message}`)
        continue
      }

      assignments.push(assignment)

      // Create notification for reviewer
      await supabase
        .from('notifications')
        .insert({
          user_id: reviewerId,
          type: 'review_invitation',
          title: 'New Review Invitation',
          message: `You have been invited to review: ${manuscript.title}`,
          data: {
            manuscript_id: manuscriptId,
            assignment_id: assignment.id
          }
        })

      // Log the activity
      await supabase
        .from('activity_logs')
        .insert({
          manuscript_id: manuscriptId,
          user_id: user.id,
          action: 'reviewer_assigned',
          details: {
            reviewer_id: reviewerId,
            assignment_id: assignment.id,
            due_date: dueDate
          }
        })
    }

    // Update manuscript status if this is the first assignment
    if (assignments.length > 0) {
      await supabase
        .from('manuscripts')
        .update({ 
          status: 'under_review',
          editor_id: user.id // Assign editor if not already assigned
        })
        .eq('id', manuscriptId)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${assignments.length} reviewers`,
      assignments,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Error in reviewer assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
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
    const { assignmentId, action, reason } = body // action: 'accept' | 'decline'

    // Get assignment details
    const { data: assignment, error: assignmentError } = await supabase
      .from('review_assignments')
      .select('*')
      .eq('id', assignmentId)
      .eq('reviewer_id', user.id)
      .eq('status', 'invited')
      .single()

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { error: 'Assignment not found or not accessible' },
        { status: 404 }
      )
    }

    const updateData: any = {
      responded_at: new Date().toISOString()
    }

    if (action === 'accept') {
      updateData.status = 'accepted'
    } else if (action === 'decline') {
      updateData.status = 'declined'
      updateData.decline_reason = reason
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    // Update assignment
    const { error: updateError } = await supabase
      .from('review_assignments')
      .update(updateData)
      .eq('id', assignmentId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update assignment' },
        { status: 500 }
      )
    }

    // Create notification for editor
    await supabase
      .from('notifications')
      .insert({
        user_id: assignment.assigned_by,
        type: 'review_response',
        title: `Review ${action}ed`,
        message: `Reviewer has ${action}ed the review invitation`,
        data: {
          manuscript_id: assignment.manuscript_id,
          assignment_id: assignmentId,
          action
        }
      })

    // Log the activity
    await supabase
      .from('activity_logs')
      .insert({
        manuscript_id: assignment.manuscript_id,
        user_id: user.id,
        action: `review_${action}ed`,
        details: {
          assignment_id: assignmentId,
          reason: action === 'decline' ? reason : undefined
        }
      })

    return NextResponse.json({
      success: true,
      message: `Review invitation ${action}ed successfully`
    })

  } catch (error) {
    console.error('Error in assignment response:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}