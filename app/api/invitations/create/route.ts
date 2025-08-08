import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { InvitationService } from '@/lib/services/invitation-service'

interface CreateInvitationRequest {
  manuscriptId: string
  reviewerIds: string[]
  reviewDeadline: string
  responseDeadline?: string
  customMessage?: string
  templateId?: string
  staggered?: boolean
  staggerIntervalHours?: number
  priority?: 'normal' | 'high' | 'urgent'
  sendReminders?: boolean
  reminderSchedule?: number[]
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user (editor)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user has editor privileges
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !['editor', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Editor role required.' },
        { status: 403 }
      )
    }

    // Parse request body
    let requestData: CreateInvitationRequest
    try {
      requestData = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!requestData.manuscriptId || !requestData.reviewerIds || requestData.reviewerIds.length === 0) {
      return NextResponse.json(
        { error: 'manuscriptId and reviewerIds are required' },
        { status: 400 }
      )
    }

    if (!requestData.reviewDeadline) {
      return NextResponse.json(
        { error: 'reviewDeadline is required' },
        { status: 400 }
      )
    }

    // Validate dates
    const reviewDeadline = new Date(requestData.reviewDeadline)
    const responseDeadline = requestData.responseDeadline 
      ? new Date(requestData.responseDeadline)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default: 7 days from now

    if (isNaN(reviewDeadline.getTime()) || reviewDeadline <= new Date()) {
      return NextResponse.json(
        { error: 'Invalid review deadline. Must be a future date.' },
        { status: 400 }
      )
    }

    if (isNaN(responseDeadline.getTime()) || responseDeadline <= new Date()) {
      return NextResponse.json(
        { error: 'Invalid response deadline. Must be a future date.' },
        { status: 400 }
      )
    }

    if (responseDeadline >= reviewDeadline) {
      return NextResponse.json(
        { error: 'Response deadline must be before review deadline.' },
        { status: 400 }
      )
    }

    // Verify manuscript exists and user has access
    const { data: manuscript, error: manuscriptError } = await supabase
      .from('manuscripts')
      .select('id, title, status, assigned_editor')
      .eq('id', requestData.manuscriptId)
      .single()

    if (manuscriptError || !manuscript) {
      return NextResponse.json(
        { error: 'Manuscript not found' },
        { status: 404 }
      )
    }

    // Check if user is assigned editor or admin
    if (profile.role !== 'admin' && manuscript.assigned_editor !== user.id) {
      return NextResponse.json(
        { error: 'You can only invite reviewers for manuscripts assigned to you' },
        { status: 403 }
      )
    }

    // Validate reviewer IDs exist and are reviewers
    const { data: reviewers, error: reviewersError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .in('id', requestData.reviewerIds)
      .eq('role', 'reviewer')

    if (reviewersError || !reviewers || reviewers.length !== requestData.reviewerIds.length) {
      return NextResponse.json(
        { error: 'One or more reviewer IDs are invalid or not reviewer accounts' },
        { status: 400 }
      )
    }

    // Create invitations using the InvitationService
    const invitationService = new InvitationService()
    
    const result = await invitationService.sendInvitations({
      manuscriptId: requestData.manuscriptId,
      reviewerIds: requestData.reviewerIds,
      invitedBy: user.id,
      reviewDeadline,
      responseDeadline,
      customMessage: requestData.customMessage,
      templateId: requestData.templateId,
      staggered: requestData.staggered,
      staggerIntervalHours: requestData.staggerIntervalHours,
      priority: requestData.priority,
      sendReminders: requestData.sendReminders,
      reminderSchedule: requestData.reminderSchedule
    })

    // Log the invitation activity
    await supabase
      .from('manuscript_activity_log')
      .insert({
        manuscript_id: requestData.manuscriptId,
        user_id: user.id,
        activity_type: 'reviewer_invitations_sent',
        details: {
          reviewerIds: requestData.reviewerIds,
          successCount: result.successCount,
          failureCount: result.failureCount,
          template: requestData.templateId || 'standard-001',
          staggered: requestData.staggered || false
        },
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      message: `Invitations sent to ${result.successCount} reviewer(s)`,
      result: {
        totalInvited: result.totalInvited,
        successCount: result.successCount,
        failureCount: result.failureCount,
        invitations: result.results.map(r => ({
          reviewerId: r.reviewerId,
          status: r.status,
          success: r.success,
          error: r.error,
          scheduledFor: r.scheduledFor
        })),
        metadata: result.metadata
      }
    })

  } catch (error) {
    console.error('Error creating invitations:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const manuscriptId = url.searchParams.get('manuscriptId')

    if (!manuscriptId) {
      return NextResponse.json(
        { error: 'manuscriptId query parameter is required' },
        { status: 400 }
      )
    }

    // Get invitation statistics for the manuscript
    const invitationService = new InvitationService()
    const stats = await invitationService.getInvitationStats(manuscriptId)

    // Get detailed invitation data
    const { data: invitations, error } = await supabase
      .from('reviewer_invitations')
      .select(`
        id,
        invitation_status,
        created_at,
        responded_at,
        review_deadline,
        response_deadline,
        decline_reason,
        reminder_count,
        profiles (
          full_name,
          email,
          affiliation
        )
      `)
      .eq('manuscript_id', manuscriptId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invitations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch invitation data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      stats,
      invitations: invitations || []
    })

  } catch (error) {
    console.error('Error fetching invitation data:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}