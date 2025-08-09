import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { NotificationService } from '@/lib/services/notification-service'

interface ResponsePayload {
  decision: 'accept' | 'decline'
  expertiseRating?: number
  conflictDeclaration?: {
    hasConflict: boolean
    conflictType?: string
    conflictDescription?: string
  }
  declineReason?: string
  alternativeReviewer?: {
    name: string
    email: string
    affiliation: string
    expertise: string
    reason: string
  }
  additionalComments?: string
  availabilityConfirmed?: boolean
}

/**
 * POST /api/invitations/public/:token/response
 * A public endpoint for the reviewer to submit their response (accept/decline). 
 * This action is authenticated by the secure token.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const params = await context.params
    const supabase = await createClient()
    const token = params.token

    // Validate token exists
    if (!token) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      )
    }

    // Parse request body
    let payload: ResponsePayload
    try {
      payload = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!payload.decision || !['accept', 'decline'].includes(payload.decision)) {
      return NextResponse.json(
        { error: 'Invalid decision. Must be "accept" or "decline"' },
        { status: 400 }
      )
    }

    if (payload.decision === 'accept') {
      if (!payload.availabilityConfirmed) {
        return NextResponse.json(
          { error: 'Availability confirmation is required when accepting' },
          { status: 400 }
        )
      }

      if (payload.conflictDeclaration?.hasConflict && !payload.conflictDeclaration?.conflictDescription) {
        return NextResponse.json(
          { error: 'Conflict description is required when declaring a conflict' },
          { status: 400 }
        )
      }
    }

    if (payload.decision === 'decline' && !payload.declineReason) {
      return NextResponse.json(
        { error: 'Decline reason is required when declining' },
        { status: 400 }
      )
    }

    // Get invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from('reviewer_invitations')
      .select(`
        *,
        manuscripts (
          id,
          title,
          field_of_study,
          author_id
        ),
        profiles (
          id,
          full_name,
          email
        ),
        invited_by_profile:profiles!invited_by (
          id,
          full_name,
          email
        )
      `)
      .eq('invitation_token', token)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found or invalid token' },
        { status: 404 }
      )
    }

    // Check if invitation is still valid
    if (invitation.invitation_status !== 'pending') {
      return NextResponse.json(
        { error: `Invitation already ${invitation.invitation_status}` },
        { status: 409 }
      )
    }

    // Check if response deadline has passed
    const now = new Date()
    const responseDeadline = new Date(invitation.response_deadline)
    if (now > responseDeadline) {
      // Update status to expired
      await supabase
        .from('reviewer_invitations')
        .update({ invitation_status: 'expired' })
        .eq('id', invitation.id)

      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 410 }
      )
    }

    // Prepare update data
    const updateData: any = {
      invitation_status: payload.decision === 'accept' ? 'accepted' : 'declined',
      responded_at: new Date().toISOString(),
      decline_reason: payload.decision === 'decline' ? payload.declineReason : null,
      suggested_alternative: payload.alternativeReviewer ? invitation.profiles.id : null,
      response_metadata: {
        expertiseRating: payload.expertiseRating,
        conflictDeclaration: payload.conflictDeclaration,
        alternativeReviewer: payload.alternativeReviewer,
        additionalComments: payload.additionalComments,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        timestamp: new Date().toISOString()
      }
    }

    // Update invitation status
    const { error: updateError } = await supabase
      .from('reviewer_invitations')
      .update(updateData)
      .eq('id', invitation.id)

    if (updateError) {
      console.error('Error updating invitation:', updateError)
      return NextResponse.json(
        { error: 'Failed to update invitation status' },
        { status: 500 }
      )
    }

    // Store alternative reviewer suggestion if provided
    if (payload.decision === 'decline' && payload.alternativeReviewer?.name) {
      await supabase
        .from('suggested_reviewers')
        .upsert({
          manuscript_id: invitation.manuscript_id,
          suggested_by: invitation.reviewer_id,
          reviewer_name: payload.alternativeReviewer.name,
          reviewer_email: payload.alternativeReviewer.email,
          reviewer_affiliation: payload.alternativeReviewer.affiliation,
          expertise_areas: payload.alternativeReviewer.expertise,
          suggestion_reason: payload.alternativeReviewer.reason,
          suggested_at: new Date().toISOString()
        })
        .select()
    }

    // If accepted, create review assignment
    if (payload.decision === 'accept') {
      const { error: assignmentError } = await supabase
        .from('review_assignments')
        .insert({
          manuscript_id: invitation.manuscript_id,
          reviewer_id: invitation.reviewer_id,
          assigned_by: invitation.invited_by,
          status: 'accepted',
          due_date: invitation.review_deadline,
          invited_at: invitation.created_at,
          accepted_at: new Date().toISOString(),
          expertise_rating: payload.expertiseRating,
          has_conflict: payload.conflictDeclaration?.hasConflict || false,
          conflict_details: payload.conflictDeclaration?.hasConflict ? {
            type: payload.conflictDeclaration.conflictType,
            description: payload.conflictDeclaration.conflictDescription
          } : null
        })

      if (assignmentError) {
        console.error('Error creating review assignment:', assignmentError)
        // Don't fail the response, as the invitation was already updated
      }
    }

    // Track the response
    await supabase
      .from('invitation_tracking')
      .update({
        responded_at: new Date().toISOString(),
        response_type: payload.decision === 'accept' ? 'accepted' : 'declined'
      })
      .eq('assignment_id', invitation.id)

    // Send notification to editor
    try {
      const notificationService = new NotificationService()
      
      const editorNotificationTitle = payload.decision === 'accept'
        ? `Review Accepted: ${(invitation.manuscripts as any)?.title}`
        : `Review Declined: ${(invitation.manuscripts as any)?.title}`

      const editorNotificationMessage = payload.decision === 'accept'
        ? `${(invitation.profiles as any)?.full_name} has accepted the review invitation for "${(invitation.manuscripts as any)?.title}".`
        : `${(invitation.profiles as any)?.full_name} has declined the review invitation for "${(invitation.manuscripts as any)?.title}". Reason: ${payload.declineReason}`

      await notificationService.sendNotification({
        channels: {
          email: {
            to: (invitation.invited_by_profile as any)?.email,
            subject: editorNotificationTitle,
            body: `
              <h2>${editorNotificationTitle}</h2>
              <p>${editorNotificationMessage}</p>
              
              <h3>Reviewer Details:</h3>
              <ul>
                <li><strong>Name:</strong> ${(invitation.profiles as any)?.full_name}</li>
                <li><strong>Email:</strong> ${(invitation.profiles as any)?.email}</li>
                ${payload.decision === 'accept' ? `<li><strong>Expertise Rating:</strong> ${payload.expertiseRating}/5</li>` : ''}
              </ul>

              ${payload.additionalComments ? `
                <h3>Additional Comments:</h3>
                <p>${payload.additionalComments}</p>
              ` : ''}

              ${payload.alternativeReviewer?.name ? `
                <h3>Suggested Alternative Reviewer:</h3>
                <ul>
                  <li><strong>Name:</strong> ${payload.alternativeReviewer.name}</li>
                  <li><strong>Email:</strong> ${payload.alternativeReviewer.email}</li>
                  <li><strong>Affiliation:</strong> ${payload.alternativeReviewer.affiliation}</li>
                  <li><strong>Expertise:</strong> ${payload.alternativeReviewer.expertise}</li>
                  <li><strong>Reason:</strong> ${payload.alternativeReviewer.reason}</li>
                </ul>
              ` : ''}

              ${payload.decision === 'accept' ? `
                <p>The reviewer has been automatically assigned and can now access the manuscript for review.</p>
              ` : `
                <p>You may need to find an alternative reviewer for this manuscript.</p>
              `}
            `,
            templateId: 'reviewer-response-notification'
          },
          inApp: {
            userId: invitation.invited_by,
            title: editorNotificationTitle,
            message: editorNotificationMessage,
            type: payload.decision === 'accept' ? 'success' : 'info',
            actionUrl: `/editor/manuscripts/${invitation.manuscript_id}`,
            metadata: {
              manuscriptId: invitation.manuscript_id,
              reviewerId: invitation.reviewer_id,
              decision: payload.decision
            }
          }
        },
        priority: 'normal',
        metadata: {
          type: 'reviewer_response',
          manuscriptId: invitation.manuscript_id,
          reviewerId: invitation.reviewer_id,
          decision: payload.decision
        }
      })
    } catch (notificationError) {
      console.error('Error sending editor notification:', notificationError)
      // Don't fail the response, as the core functionality succeeded
    }

    // Return success response
    return NextResponse.json({
      success: true,
      decision: payload.decision,
      message: payload.decision === 'accept' 
        ? 'Thank you for accepting this review. You will receive further instructions from the editor soon.'
        : 'Thank you for your response. The editor has been notified of your decision.',
      manuscriptTitle: (invitation.manuscripts as any)?.title,
      reviewDeadline: invitation.review_deadline,
      ...(payload.decision === 'accept' && {
        nextSteps: {
          dashboardUrl: '/reviewer/dashboard',
          manuscriptUrl: `/reviewer/manuscripts/${invitation.manuscript_id}`,
          contactEditor: (invitation.invited_by_profile as any)?.email
        }
      })
    })

  } catch (error) {
    console.error('Error processing reviewer response:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}