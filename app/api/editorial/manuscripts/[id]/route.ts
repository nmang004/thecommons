import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ManuscriptUpdateRequest } from '@/types/editorial'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const supabase = await createClient()
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is editor or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['editor', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Fetch manuscript with full editorial context
    const { data: manuscript, error } = await supabase
      .from('manuscripts')
      .select(`
        *,
        profiles!author_id(full_name, affiliation, email),
        editor:profiles!editor_id(full_name, email),
        manuscript_coauthors(name, email, is_corresponding, affiliation),
        editorial_assignments(
          id,
          status,
          priority,
          workload_score,
          assigned_at,
          assigned_by,
          notes,
          completed_at,
          profiles!assigned_by(full_name)
        ),
        editorial_decisions(
          id,
          decision,
          decision_letter,
          internal_notes,
          created_at,
          profiles!editor_id(full_name)
        ),
        review_assignments(
          id,
          status,
          invited_at,
          due_date,
          completed_at,
          reviewer:profiles!reviewer_id(full_name, email),
          review_reports(rating, recommendation, comments)
        ),
        reviewer_invitations(
          id,
          invitation_status,
          custom_message,
          review_deadline,
          response_deadline,
          responded_at,
          decline_reason,
          reviewer:profiles!reviewer_id(full_name, email)
        )
      `)
      .eq('id', params.id)
      .single()

    if (error || !manuscript) {
      return NextResponse.json(
        { error: 'Manuscript not found' },
        { status: 404 }
      )
    }

    // Check access permissions for non-admin users
    if (profile.role === 'editor' && manuscript.editor_id !== user.id && manuscript.editor_id !== null) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Calculate editorial timeline and metrics
    const timeline = []
    
    if (manuscript.submitted_at) {
      timeline.push({
        event: 'submitted',
        date: manuscript.submitted_at,
        description: 'Manuscript submitted'
      })
    }

    if (manuscript.editorial_assignments?.length > 0) {
      manuscript.editorial_assignments.forEach((assignment: any) => {
        timeline.push({
          event: 'assigned',
          date: assignment.assigned_at,
          description: `Assigned to editor`,
          details: { priority: assignment.priority, workload: assignment.workload_score }
        })
      })
    }

    if (manuscript.reviewer_invitations?.length > 0) {
      manuscript.reviewer_invitations.forEach((invitation: any) => {
        timeline.push({
          event: 'reviewer_invited',
          date: invitation.created_at,
          description: `Reviewer invited`,
          details: { status: invitation.invitation_status }
        })
      })
    }

    if (manuscript.review_assignments?.length > 0) {
      manuscript.review_assignments.forEach((review: any) => {
        if (review.completed_at) {
          timeline.push({
            event: 'review_completed',
            date: review.completed_at,
            description: 'Review completed',
            details: { 
              recommendation: review.review_reports?.[0]?.recommendation,
              rating: review.review_reports?.[0]?.rating
            }
          })
        }
      })
    }

    if (manuscript.editorial_decisions?.length > 0) {
      manuscript.editorial_decisions.forEach((decision: any) => {
        timeline.push({
          event: 'decision_made',
          date: decision.created_at,
          description: `Editorial decision: ${decision.decision}`,
          details: { decision: decision.decision }
        })
      })
    }

    // Sort timeline by date
    timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Calculate metrics
    const daysSinceSubmission = manuscript.submitted_at ? 
      Math.floor((new Date().getTime() - new Date(manuscript.submitted_at).getTime()) / (1000 * 60 * 60 * 24)) : 0
    
    const currentAssignment = manuscript.editorial_assignments?.find((a: any) => a.status === 'active')
    const daysSinceAssignment = currentAssignment ? 
      Math.floor((new Date().getTime() - new Date(currentAssignment.assigned_at).getTime()) / (1000 * 60 * 60 * 24)) : 0

    const activeReviews = manuscript.review_assignments?.filter((r: any) => 
      ['invited', 'accepted', 'in_progress'].includes(r.status)
    ).length || 0

    const completedReviews = manuscript.review_assignments?.filter((r: any) => 
      r.status === 'completed'
    ).length || 0

    const metrics = {
      days_since_submission: daysSinceSubmission,
      days_since_assignment: daysSinceAssignment,
      active_reviews: activeReviews,
      completed_reviews: completedReviews,
      total_invitations: manuscript.reviewer_invitations?.length || 0,
      pending_invitations: manuscript.reviewer_invitations?.filter((i: any) => 
        i.invitation_status === 'pending'
      ).length || 0,
      declined_invitations: manuscript.reviewer_invitations?.filter((i: any) => 
        i.invitation_status === 'declined'
      ).length || 0
    }

    return NextResponse.json({
      manuscript,
      timeline,
      metrics
    })

  } catch (error) {
    console.error('Editorial manuscript detail API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const supabase = await createClient()
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is editor or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['editor', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const updateData: ManuscriptUpdateRequest = await request.json()

    // Verify manuscript exists
    const { data: manuscript, error: fetchError } = await supabase
      .from('manuscripts')
      .select('id, title, editor_id, status')
      .eq('id', params.id)
      .single()

    if (fetchError || !manuscript) {
      return NextResponse.json(
        { error: 'Manuscript not found' },
        { status: 404 }
      )
    }

    // Start a transaction for complex updates
    const updates: any = {}
    
    if (updateData.status) {
      updates.status = updateData.status
    }

    if (updateData.priority) {
      updates.priority = updateData.priority
    }

    // Handle editor assignment
    if (updateData.assignedEditorId) {
      updates.editor_id = updateData.assignedEditorId
      
      // Check if editor has capacity
      const { data: workload } = await supabase
        .from('editorial_workload')
        .select('current_workload_score, capacity_limit, availability_status')
        .eq('editor_id', updateData.assignedEditorId)
        .single()

      if (workload && workload.availability_status !== 'available') {
        return NextResponse.json(
          { error: 'Editor is not available for new assignments' },
          { status: 400 }
        )
      }

      if (workload && workload.current_workload_score >= workload.capacity_limit) {
        return NextResponse.json(
          { error: 'Editor has reached capacity limit' },
          { status: 400 }
        )
      }

      // Create new editorial assignment
      const workloadScore = updateData.priority === 'urgent' ? 3 : 
                           updateData.priority === 'high' ? 2 : 1

      const { error: assignmentError } = await supabase
        .from('editorial_assignments')
        .insert({
          manuscript_id: params.id,
          editor_id: updateData.assignedEditorId,
          assigned_by: user.id,
          status: 'active',
          priority: updateData.priority || 'normal',
          workload_score: workloadScore,
          notes: updateData.notes
        })

      if (assignmentError) {
        console.error('Error creating editorial assignment:', assignmentError)
        return NextResponse.json(
          { error: 'Failed to create assignment' },
          { status: 500 }
        )
      }

      // Close previous assignments
      if (manuscript.editor_id && manuscript.editor_id !== updateData.assignedEditorId) {
        await supabase
          .from('editorial_assignments')
          .update({ 
            status: 'reassigned',
            reassigned_to: updateData.assignedEditorId,
            reassigned_at: new Date().toISOString()
          })
          .eq('manuscript_id', params.id)
          .eq('editor_id', manuscript.editor_id)
          .eq('status', 'active')
      }
    }

    // Update manuscript
    const { data: updatedManuscript, error: updateError } = await supabase
      .from('manuscripts')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating manuscript:', updateError)
      return NextResponse.json(
        { error: 'Failed to update manuscript' },
        { status: 500 }
      )
    }

    // Log the activity
    await supabase
      .from('activity_logs')
      .insert({
        manuscript_id: params.id,
        user_id: user.id,
        action: 'manuscript_updated',
        details: {
          updates: updateData,
          previous_editor: manuscript.editor_id,
          new_editor: updateData.assignedEditorId
        }
      })

    // Create notification if editor was assigned
    if (updateData.assignedEditorId && updateData.assignedEditorId !== manuscript.editor_id) {
      await supabase
        .from('notifications')
        .insert({
          user_id: updateData.assignedEditorId,
          type: 'manuscript_assigned',
          title: 'New Manuscript Assignment',
          message: `You have been assigned to handle "${manuscript.title}"`,
          data: {
            manuscript_id: params.id,
            priority: updateData.priority || 'normal'
          }
        })
    }

    return NextResponse.json({
      success: true,
      message: 'Manuscript updated successfully',
      manuscript: updatedManuscript,
      changes: updateData
    })

  } catch (error) {
    console.error('Editorial manuscript update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}