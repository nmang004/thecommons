import { createClient } from '@/lib/supabase/server'
import { NotificationService } from './notification-service'
import { InvitationTrackingService } from './invitation-tracking-service'
import { ReviewerMatchingService } from './reviewer-matching-service'
import { ConflictDetectionService } from './conflict-detection-service'
import { v4 as uuidv4 } from 'uuid'

export interface InvitationRequest {
  manuscriptId: string
  reviewerIds: string[]
  invitedBy: string
  reviewDeadline: Date
  responseDeadline?: Date
  customMessage?: string
  templateId?: string
  staggered?: boolean
  staggerIntervalHours?: number
  priority?: 'normal' | 'high' | 'urgent'
  sendReminders?: boolean
  reminderSchedule?: number[] // Days before deadline
}

export interface InvitationResult {
  success: boolean
  invitationId: string
  reviewerId: string
  invitationToken: string
  status: 'sent' | 'scheduled' | 'failed'
  error?: string
  scheduledFor?: Date
}

export interface BulkInvitationResult {
  results: InvitationResult[]
  totalInvited: number
  successCount: number
  failureCount: number
  metadata: {
    manuscriptId: string
    invitedBy: string
    templateUsed: string
    totalReviewersRequested: number
    conflictsDetected: number
    staggered: boolean
  }
}

export class InvitationService {
  private getSupabase: () => Promise<Awaited<ReturnType<typeof createClient>>>
  private notificationService: NotificationService
  private trackingService: InvitationTrackingService
  private matchingService: ReviewerMatchingService
  private conflictService: ConflictDetectionService

  constructor() {
    this.getSupabase = () => createClient()
    this.notificationService = new NotificationService()
    this.trackingService = new InvitationTrackingService()
    this.matchingService = new ReviewerMatchingService()
    this.conflictService = new ConflictDetectionService()
  }

  /**
   * Send invitations to multiple reviewers
   */
  async sendInvitations(request: InvitationRequest): Promise<BulkInvitationResult> {
    const supabase = await this.getSupabase()
    const results: InvitationResult[] = []
    let conflictsDetected = 0

    // Validate manuscript exists and get details
    const { data: manuscript, error: manuscriptError } = await supabase
      .from('manuscripts')
      .select(`
        id,
        title,
        abstract,
        field_of_study,
        subfield,
        keywords,
        author_id,
        author_count
      `)
      .eq('id', request.manuscriptId)
      .single()

    if (manuscriptError || !manuscript) {
      throw new Error('Manuscript not found')
    }

    // Get reviewer details
    const { data: reviewers, error: reviewersError } = await supabase
      .from('profiles')
      .select('id, full_name, email, affiliation, expertise')
      .in('id', request.reviewerIds)
      .eq('role', 'reviewer')

    if (reviewersError || !reviewers) {
      throw new Error('Failed to fetch reviewer details')
    }

    // Check for conflicts of interest
    const coiResults = await this.conflictService.checkMultipleReviewers(
      request.reviewerIds,
      request.manuscriptId
    )

    const coiMap = new Map(coiResults.map(result => [result.reviewer_id, result]))

    // Get editor details
    const { data: editor, error: editorError } = await supabase
      .from('profiles')
      .select('full_name, email, role')
      .eq('id', request.invitedBy)
      .single()

    if (editorError || !editor) {
      throw new Error('Editor not found')
    }

    // Set default response deadline to 7 days from now if not provided
    const responseDeadline = request.responseDeadline || 
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    // Process each reviewer
    for (let i = 0; i < reviewers.length; i++) {
      const reviewer = reviewers[i]
      const coiResult = coiMap.get(reviewer.id)

      // Skip reviewers with blocking conflicts
      if (coiResult && !coiResult.is_eligible) {
        conflictsDetected++
        results.push({
          success: false,
          invitationId: '',
          reviewerId: reviewer.id,
          invitationToken: '',
          status: 'failed',
          error: `Conflict of interest: ${coiResult.conflicts?.map(c => c.type).join(', ')}`
        })
        continue
      }

      try {
        const invitationResult = await this.sendSingleInvitation({
          manuscriptId: request.manuscriptId,
          reviewerId: reviewer.id,
          invitedBy: request.invitedBy,
          reviewDeadline: request.reviewDeadline,
          responseDeadline,
          customMessage: request.customMessage,
          templateId: request.templateId || 'standard-001',
          priority: request.priority || 'normal',
          sendReminders: request.sendReminders !== false,
          reminderSchedule: request.reminderSchedule || [7, 3, 1],
          staggerDelay: request.staggered ? (i * (request.staggerIntervalHours || 2)) : 0,
          manuscript,
          reviewer,
          editor,
          hasConflictWarning: coiResult?.conflicts && coiResult.conflicts.length > 0
        })

        results.push(invitationResult)

        if (coiResult?.conflicts && coiResult.conflicts.length > 0) {
          conflictsDetected++
        }

      } catch (error) {
        console.error(`Error sending invitation to ${reviewer.id}:`, error)
        results.push({
          success: false,
          invitationId: '',
          reviewerId: reviewer.id,
          invitationToken: '',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.length - successCount

    return {
      results,
      totalInvited: reviewers.length,
      successCount,
      failureCount,
      metadata: {
        manuscriptId: request.manuscriptId,
        invitedBy: request.invitedBy,
        templateUsed: request.templateId || 'standard-001',
        totalReviewersRequested: request.reviewerIds.length,
        conflictsDetected,
        staggered: request.staggered || false
      }
    }
  }

  /**
   * Send invitation to a single reviewer
   */
  private async sendSingleInvitation({
    manuscriptId,
    reviewerId,
    invitedBy,
    reviewDeadline,
    responseDeadline,
    customMessage,
    templateId,
    priority,
    sendReminders,
    reminderSchedule,
    staggerDelay,
    manuscript,
    reviewer,
    editor,
    hasConflictWarning
  }: {
    manuscriptId: string
    reviewerId: string
    invitedBy: string
    reviewDeadline: Date
    responseDeadline: Date
    customMessage?: string
    templateId: string
    priority: 'normal' | 'high' | 'urgent'
    sendReminders: boolean
    reminderSchedule: number[]
    staggerDelay: number
    manuscript: any
    reviewer: any
    editor: any
    hasConflictWarning: boolean
  }): Promise<InvitationResult> {
    const supabase = await this.getSupabase()
    const invitationToken = uuidv4()
    const invitationId = uuidv4()

    // Create invitation record
    const { data: invitation, error: invitationError } = await supabase
      .from('reviewer_invitations')
      .insert({
        id: invitationId,
        manuscript_id: manuscriptId,
        reviewer_id: reviewerId,
        invited_by: invitedBy,
        invitation_status: 'pending',
        review_deadline: reviewDeadline.toISOString(),
        response_deadline: responseDeadline.toISOString(),
        custom_message: customMessage,
        invitation_token: invitationToken,
        reminder_count: 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (invitationError || !invitation) {
      throw new Error('Failed to create invitation record')
    }

    // Calculate send time (immediate or staggered)
    const sendTime = staggerDelay > 0 
      ? new Date(Date.now() + staggerDelay * 60 * 60 * 1000)
      : new Date()

    // Prepare template variables
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const responseUrl = `${baseUrl}/review/respond/${invitationToken}`
    const acceptUrl = `${responseUrl}?action=accept`
    const declineUrl = `${responseUrl}?action=decline`

    const templateVariables = {
      reviewer_name: reviewer.full_name,
      manuscript_title: manuscript.title,
      journal_name: 'The Commons',
      field_of_study: manuscript.field_of_study,
      subfield: manuscript.subfield || '',
      abstract_preview: manuscript.abstract.substring(0, 200) + '...',
      submission_number: manuscript.id.substring(0, 8).toUpperCase(),
      due_date: reviewDeadline.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      estimated_hours: '3-5',
      reviewer_expertise: reviewer.expertise.slice(0, 3).join(', '),
      review_type: 'double-blind peer review',
      response_deadline: responseDeadline.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric', 
        month: 'long',
        day: 'numeric'
      }),
      accept_link: acceptUrl,
      decline_link: declineUrl,
      view_link: responseUrl,
      editor_name: editor.full_name,
      editor_title: editor.role.charAt(0).toUpperCase() + editor.role.slice(1),
      custom_message: customMessage || '',
      conflict_warning: hasConflictWarning ? 'Please note: Our system detected potential minor conflicts that should be considered during your review.' : ''
    }

    try {
      // Send the notification
      const notificationResult = await this.notificationService.sendReviewerInvitation(
        reviewerId,
        manuscriptId,
        invitationToken,
        templateVariables,
        customMessage
      )

      // Track the invitation
      await this.trackingService.trackInvitation(
        invitationId,
        templateId,
        invitedBy,
        reviewer.email,
        `Invitation to Review: ${manuscript.title}`,
        '', // Body will be populated by notification service
        sendTime > new Date() ? sendTime : undefined,
        {
          manuscriptId,
          reviewerId,
          templateId,
          priority,
          hasConflictWarning,
          staggered: staggerDelay > 0
        }
      )

      // Schedule reminders if enabled
      if (sendReminders && reminderSchedule.length > 0) {
        await this.scheduleReminders(
          invitationToken,
          reviewDeadline,
          reminderSchedule
        )
      }

      return {
        success: notificationResult.success,
        invitationId,
        reviewerId,
        invitationToken,
        status: sendTime > new Date() ? 'scheduled' : 'sent',
        scheduledFor: sendTime > new Date() ? sendTime : undefined
      }

    } catch (error) {
      // Clean up invitation record if notification fails
      await supabase
        .from('reviewer_invitations')
        .delete()
        .eq('id', invitationId)

      throw error
    }
  }

  /**
   * Schedule reminder notifications
   */
  private async scheduleReminders(
    invitationToken: string,
    reviewDeadline: Date,
    reminderSchedule: number[]
  ): Promise<void> {
    const supabase = await this.getSupabase()

    // Get reviewer ID from invitation token
    const { data: invitation } = await supabase
      .from('reviewer_invitations')
      .select('reviewer_id')
      .eq('invitation_token', invitationToken)
      .single()

    if (!invitation) {
      throw new Error('Invitation not found for reminder scheduling')
    }

    const reminderTypes = ['first_reminder', 'second_reminder', 'final_reminder']
    
    for (let i = 0; i < reminderSchedule.length && i < reminderTypes.length; i++) {
      const daysBefore = reminderSchedule[i]
      const reminderDate = new Date(reviewDeadline.getTime() - daysBefore * 24 * 60 * 60 * 1000)
      
      // Don't schedule reminders in the past
      if (reminderDate <= new Date()) {
        continue
      }

      try {
        await this.notificationService.sendReviewerReminder(
          invitation.reviewer_id,
          invitationToken,
          reminderTypes[i] as 'first' | 'second' | 'final',
          daysBefore
        )
      } catch (error) {
        console.error(`Failed to schedule ${reminderTypes[i]}:`, error)
      }
    }
  }

  /**
   * Find and invite suitable reviewers automatically
   */
  async findAndInviteReviewers({
    manuscriptId,
    invitedBy,
    reviewDeadline,
    responseDeadline,
    customMessage,
    maxReviewers = 3,
    minExpertiseScore = 60,
    excludeReviewerIds = [],
    templateId,
    priority = 'normal'
  }: {
    manuscriptId: string
    invitedBy: string
    reviewDeadline: Date
    responseDeadline?: Date
    customMessage?: string
    maxReviewers?: number
    minExpertiseScore?: number
    excludeReviewerIds?: string[]
    templateId?: string
    priority?: 'normal' | 'high' | 'urgent'
  }): Promise<BulkInvitationResult> {
    const supabase = await this.getSupabase()

    // Get manuscript details
    const { data: manuscript, error } = await supabase
      .from('manuscripts')
      .select('*')
      .eq('id', manuscriptId)
      .single()

    if (error || !manuscript) {
      throw new Error('Manuscript not found')
    }

    // Find suitable reviewers
    const matchingResult = await this.matchingService.findReviewers(
      {
        manuscript_id: manuscriptId,
        field_of_study: manuscript.field_of_study,
        subfield: manuscript.subfield,
        keywords: manuscript.keywords,
        author_ids: [manuscript.author_id],
        exclude_reviewer_ids: excludeReviewerIds,
        min_publications: 5,
        max_current_load: 3
      },
      maxReviewers * 2 // Get more candidates to account for conflicts/declines
    )

    // Filter by expertise score and availability
    const suitableReviewers = matchingResult.matches
      .filter(match => 
        match.relevance_score >= minExpertiseScore &&
        match.availability_score >= 50 &&
        match.coi_eligibility?.is_eligible !== false
      )
      .slice(0, maxReviewers)

    if (suitableReviewers.length === 0) {
      throw new Error('No suitable reviewers found with the specified criteria')
    }

    // Send invitations
    return await this.sendInvitations({
      manuscriptId,
      reviewerIds: suitableReviewers.map(r => r.reviewer.id),
      invitedBy,
      reviewDeadline,
      responseDeadline,
      customMessage,
      templateId,
      priority,
      staggered: true,
      staggerIntervalHours: 1, // Stagger by 1 hour
      sendReminders: true
    })
  }

  /**
   * Cancel a pending invitation
   */
  async cancelInvitation(invitationToken: string, reason: string): Promise<void> {
    const supabase = await this.getSupabase()

    const { error } = await supabase
      .from('reviewer_invitations')
      .update({
        invitation_status: 'cancelled',
        decline_reason: reason,
        responded_at: new Date().toISOString()
      })
      .eq('invitation_token', invitationToken)
      .eq('invitation_status', 'pending')

    if (error) {
      throw new Error(`Failed to cancel invitation: ${error.message}`)
    }
  }

  /**
   * Get invitation statistics for a manuscript
   */
  async getInvitationStats(manuscriptId: string): Promise<{
    total: number
    pending: number
    accepted: number
    declined: number
    expired: number
    cancelled: number
    responseRate: number
    avgResponseTime: number
  }> {
    const supabase = await this.getSupabase()

    const { data: invitations, error } = await supabase
      .from('reviewer_invitations')
      .select('invitation_status, created_at, responded_at')
      .eq('manuscript_id', manuscriptId)

    if (error) {
      throw new Error(`Failed to get invitation stats: ${error.message}`)
    }

    const stats = {
      total: invitations.length,
      pending: 0,
      accepted: 0,
      declined: 0,
      expired: 0,
      cancelled: 0,
      responseRate: 0,
      avgResponseTime: 0
    }

    let totalResponseTime = 0
    let responseCount = 0

    invitations.forEach(invitation => {
      switch (invitation.invitation_status) {
        case 'pending':
          stats.pending++
          break
        case 'accepted':
          stats.accepted++
          break
        case 'declined':
          stats.declined++
          break
        case 'expired':
          stats.expired++
          break
        case 'cancelled':
          stats.cancelled++
          break
      }

      // Calculate response time for responded invitations
      if (invitation.responded_at && invitation.created_at) {
        const responseTime = new Date(invitation.responded_at).getTime() - 
          new Date(invitation.created_at).getTime()
        totalResponseTime += responseTime / (1000 * 60 * 60) // Convert to hours
        responseCount++
      }
    })

    const respondedCount = stats.accepted + stats.declined
    stats.responseRate = stats.total > 0 ? (respondedCount / stats.total) * 100 : 0
    stats.avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0

    return stats
  }
}