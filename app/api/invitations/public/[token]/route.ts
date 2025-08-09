import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/invitations/public/:token
 * A public, secure endpoint for a reviewer to view the details of an invitation 
 * before accepting or declining. This endpoint is publicly accessible with just the token.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const params = await context.params
    const supabase = await createClient()
    const token = params.token

    if (!token) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      )
    }

    // Get invitation details - this is public so no auth required
    const { data: invitation, error } = await supabase
      .from('reviewer_invitations')
      .select(`
        id,
        manuscript_id,
        reviewer_id,
        invitation_status,
        response_deadline,
        review_deadline,
        created_at,
        custom_message,
        priority,
        manuscripts (
          title,
          abstract,
          field_of_study,
          keywords,
          author_id,
          profiles!manuscripts_author_id_fkey (
            full_name,
            affiliation
          )
        ),
        profiles!reviewer_id (
          full_name,
          email,
          expertise
        ),
        invited_by_profile:profiles!invited_by (
          full_name,
          email,
          role
        )
      `)
      .eq('invitation_token', token)
      .single()

    if (error || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found or invalid token' },
        { status: 404 }
      )
    }

    // Check if invitation is still valid
    const now = new Date()
    const responseDeadline = new Date(invitation.response_deadline)
    const isExpired = now > responseDeadline && invitation.invitation_status === 'pending'

    // Update status to expired if needed
    if (isExpired && invitation.invitation_status === 'pending') {
      await supabase
        .from('reviewer_invitations')
        .update({ invitation_status: 'expired' })
        .eq('id', invitation.id)
    }

    // Get additional manuscript context (conflicted reviewers, etc.)
    const { data: existingReviews } = await supabase
      .from('review_assignments')
      .select('id, status, profiles!reviewer_id (full_name)')
      .eq('manuscript_id', invitation.manuscript_id)
      .neq('reviewer_id', invitation.reviewer_id)

    // Get any conflicts for this reviewer with this manuscript
    const { data: conflicts } = await supabase
      .from('reviewer_conflicts')
      .select('conflict_type, description')
      .eq('reviewer_id', invitation.reviewer_id)
      .eq('manuscript_id', invitation.manuscript_id)

    // Prepare response data
    const invitationDetails = {
      id: invitation.id,
      status: isExpired ? 'expired' : invitation.invitation_status,
      responseDeadline: invitation.response_deadline,
      reviewDeadline: invitation.review_deadline,
      createdAt: invitation.created_at,
      customMessage: invitation.custom_message,
      priority: invitation.priority,
      
      manuscript: {
        title: (invitation.manuscripts as any)?.title,
        abstract: (invitation.manuscripts as any)?.abstract,
        fieldOfStudy: (invitation.manuscripts as any)?.field_of_study,
        keywords: (invitation.manuscripts as any)?.keywords,
        author: {
          name: (invitation.manuscripts as any)?.profiles?.full_name,
          affiliation: (invitation.manuscripts as any)?.profiles?.affiliation
        }
      },
      
      reviewer: {
        name: (invitation.profiles as any)?.full_name,
        email: (invitation.profiles as any)?.email,
        expertise: (invitation.profiles as any)?.expertise
      },
      
      editor: {
        name: (invitation.invited_by_profile as any)?.full_name,
        email: (invitation.invited_by_profile as any)?.email
      },
      
      context: {
        existingReviewers: existingReviews?.map(r => (r.profiles as any)?.full_name).filter(Boolean) || [],
        conflicts: conflicts || [],
        canRespond: invitation.invitation_status === 'pending' && !isExpired
      }
    }

    // Track that invitation was viewed
    await supabase
      .from('invitation_tracking')
      .upsert({
        assignment_id: invitation.id,
        viewed_at: new Date().toISOString(),
        last_viewed_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      invitation: invitationDetails
    })

  } catch (error) {
    console.error('Error fetching invitation details:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}