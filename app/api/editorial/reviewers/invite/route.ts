import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BulkReviewerInvitationRequest } from '@/types/editorial'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
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
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (!profile || !['editor', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { manuscriptId, invitations }: BulkReviewerInvitationRequest = await request.json()

    if (!manuscriptId || !invitations || invitations.length === 0) {
      return NextResponse.json(
        { error: 'Manuscript ID and invitations are required' },
        { status: 400 }
      )
    }

    // Verify manuscript exists and user has access
    const { data: manuscript, error: manuscriptError } = await supabase
      .from('manuscripts')
      .select('id, title, editor_id, status, field_of_study')
      .eq('id', manuscriptId)
      .single()

    if (manuscriptError || !manuscript) {
      return NextResponse.json(
        { error: 'Manuscript not found' },
        { status: 404 }
      )
    }

    // Check if user can invite reviewers for this manuscript
    if (profile.role === 'editor' && manuscript.editor_id !== user.id) {
      return NextResponse.json(
        { error: 'Can only invite reviewers for assigned manuscripts' },
        { status: 403 }
      )
    }

    // Check if manuscript is in correct status for reviewer invitations
    const validStatuses = ['submitted', 'with_editor', 'under_review']
    if (!validStatuses.includes(manuscript.status)) {
      return NextResponse.json(
        { error: `Cannot invite reviewers for manuscript with status: ${manuscript.status}` },
        { status: 400 }
      )
    }

    // Validate all reviewer IDs exist and are reviewers
    const reviewerIds = invitations.map(inv => inv.reviewerId)
    const { data: reviewers, error: reviewersError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .in('id', reviewerIds)

    if (reviewersError) {
      return NextResponse.json(
        { error: 'Failed to validate reviewers' },
        { status: 500 }
      )
    }

    const validReviewers = reviewers?.filter(r => r.role === 'reviewer') || []
    if (validReviewers.length !== reviewerIds.length) {
      return NextResponse.json(
        { error: 'Some reviewer IDs are invalid or not reviewer role' },
        { status: 400 }
      )
    }

    // Check for existing invitations
    const { data: existingInvitations } = await supabase
      .from('reviewer_invitations')
      .select('reviewer_id, invitation_status')
      .eq('manuscript_id', manuscriptId)
      .in('reviewer_id', reviewerIds)
      .in('invitation_status', ['pending', 'accepted'])

    if (existingInvitations && existingInvitations.length > 0) {
      const conflictingReviewers = existingInvitations.map(inv => 
        validReviewers.find(r => r.id === inv.reviewer_id)?.full_name
      ).join(', ')
      
      return NextResponse.json(
        { error: `Active invitations already exist for: ${conflictingReviewers}` },
        { status: 409 }
      )
    }

    // Check reviewer availability and conflicts
    const availabilityChecks = await Promise.all(
      invitations.map(async (invitation) => {
        const reviewer = validReviewers.find(r => r.id === invitation.reviewerId)
        if (!reviewer) return { reviewerId: invitation.reviewerId, available: false, reason: 'Reviewer not found' }

        // Check current workload
        const { data: activeReviews } = await supabase
          .from('review_assignments')
          .select('id')
          .eq('reviewer_id', invitation.reviewerId)
          .in('status', ['invited', 'accepted', 'in_progress'])

        if (activeReviews && activeReviews.length >= 3) {
          return { reviewerId: invitation.reviewerId, available: false, reason: 'Too many active reviews' }
        }

        // Check for conflicts of interest
        const { data: conflicts } = await supabase
          .from('reviewer_conflicts')
          .select('id')
          .eq('reviewer_id', invitation.reviewerId)
          .eq('manuscript_id', manuscriptId)

        if (conflicts && conflicts.length > 0) {
          return { reviewerId: invitation.reviewerId, available: false, reason: 'Conflict of interest' }
        }

        return { reviewerId: invitation.reviewerId, available: true }
      })
    )

    const unavailableReviewers = availabilityChecks.filter(check => !check.available)
    if (unavailableReviewers.length > 0) {
      return NextResponse.json({
        error: 'Some reviewers are not available',
        unavailable_reviewers: unavailableReviewers
      }, { status: 400 })
    }

    // Calculate response deadline (7 days from now by default)
    const responseDeadline = new Date()
    responseDeadline.setDate(responseDeadline.getDate() + 7)

    // Create invitation records
    const invitationRecords = invitations.map(invitation => ({
      manuscript_id: manuscriptId,
      reviewer_id: invitation.reviewerId,
      invited_by: user.id,
      invitation_status: 'pending' as const,
      custom_message: invitation.customMessage || null,
      review_deadline: new Date(invitation.reviewDeadline),
      response_deadline: responseDeadline,
      invitation_token: uuidv4()
    }))

    const { data: createdInvitations, error: insertError } = await supabase
      .from('reviewer_invitations')
      .insert(invitationRecords)
      .select(`
        id,
        reviewer_id,
        invitation_token,
        review_deadline,
        response_deadline,
        profiles!reviewer_id(full_name, email)
      `)

    if (insertError) {
      console.error('Error creating reviewer invitations:', insertError)
      return NextResponse.json(
        { error: 'Failed to create invitations' },
        { status: 500 }
      )
    }

    // Create notifications for reviewers
    const notifications = createdInvitations?.map(invitation => ({
      user_id: invitation.reviewer_id,
      type: 'review_invitation',
      title: 'New Review Invitation',
      message: `You have been invited to review "${manuscript.title}"`,
      data: {
        manuscript_id: manuscriptId,
        invitation_id: invitation.id,
        invitation_token: invitation.invitation_token,
        response_deadline: invitation.response_deadline,
        review_deadline: invitation.review_deadline
      }
    })) || []

    if (notifications.length > 0) {
      await supabase
        .from('notifications')
        .insert(notifications)
    }

    // Log the activity
    await supabase
      .from('activity_logs')
      .insert({
        manuscript_id: manuscriptId,
        user_id: user.id,
        action: 'reviewers_invited',
        details: {
          reviewer_count: invitations.length,
          reviewer_ids: reviewerIds
        }
      })

    // Update manuscript status to under_review if it's not already
    if (manuscript.status === 'submitted' || manuscript.status === 'with_editor') {
      await supabase
        .from('manuscripts')
        .update({ status: 'under_review' })
        .eq('id', manuscriptId)
    }

    // Prepare response data
    const invitationsSummary = createdInvitations?.map(invitation => ({
      id: invitation.id,
      reviewer: {
        id: invitation.reviewer_id,
        name: (invitation.profiles as any)?.full_name,
        email: (invitation.profiles as any)?.email
      },
      review_deadline: invitation.review_deadline,
      response_deadline: invitation.response_deadline,
      invitation_url: `${process.env.NEXT_PUBLIC_APP_URL}/review/invitation/${invitation.invitation_token}`
    })) || []

    return NextResponse.json({
      success: true,
      message: `Successfully sent ${invitations.length} reviewer invitations`,
      manuscript_id: manuscriptId,
      invitations: invitationsSummary,
      summary: {
        total_sent: invitations.length,
        response_deadline: responseDeadline.toISOString(),
        manuscript_status: manuscript.status === 'submitted' || manuscript.status === 'with_editor' 
          ? 'under_review' : manuscript.status
      }
    })

  } catch (error) {
    console.error('Reviewer invitation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve invitations for a manuscript
export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url)
    const manuscriptId = searchParams.get('manuscriptId')

    if (!manuscriptId) {
      return NextResponse.json(
        { error: 'Manuscript ID is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this manuscript
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

    // Get invitations for the manuscript
    const { data: invitations, error } = await supabase
      .from('reviewer_invitations')
      .select(`
        id,
        invitation_status,
        custom_message,
        review_deadline,
        response_deadline,
        responded_at,
        reminder_count,
        last_reminder_sent,
        decline_reason,
        created_at,
        updated_at,
        profiles!reviewer_id(
          id,
          full_name,
          email,
          affiliation
        ),
        inviter:profiles!invited_by(
          full_name
        )
      `)
      .eq('manuscript_id', manuscriptId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invitations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      )
    }

    // Calculate summary statistics
    const summary = {
      total: invitations?.length || 0,
      pending: invitations?.filter(i => i.invitation_status === 'pending').length || 0,
      accepted: invitations?.filter(i => i.invitation_status === 'accepted').length || 0,
      declined: invitations?.filter(i => i.invitation_status === 'declined').length || 0,
      expired: invitations?.filter(i => i.invitation_status === 'expired').length || 0,
      overdue: invitations?.filter(i => 
        i.invitation_status === 'pending' && 
        i.response_deadline && 
        new Date(i.response_deadline) < new Date()
      ).length || 0
    }

    return NextResponse.json({
      invitations: invitations || [],
      summary
    })

  } catch (error) {
    console.error('Get invitations API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}