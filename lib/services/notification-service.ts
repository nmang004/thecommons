import { createClient } from '@/lib/supabase/server'
import { EmailService } from './email-service'
import { JobQueueService } from './job-queue-service'

export interface NotificationChannel {
  email?: EmailNotification
  inApp?: InAppNotification
  sms?: SMSNotification
}

export interface EmailNotification {
  to: string
  from?: string
  subject: string
  body: string
  templateId?: string
  trackingId?: string
  metadata?: Record<string, unknown>
}

export interface InAppNotification {
  userId: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  actionUrl?: string
  metadata?: Record<string, unknown>
}

export interface SMSNotification {
  to: string
  message: string
  metadata?: Record<string, unknown>
}

export interface NotificationRequest {
  channels: NotificationChannel
  priority: 'low' | 'normal' | 'high' | 'urgent'
  scheduleFor?: Date
  retryPolicy?: {
    maxAttempts: number
    backoffSeconds: number[]
  }
  metadata?: Record<string, unknown>
}

export interface NotificationResult {
  success: boolean
  results: {
    email?: { success: boolean; messageId?: string; error?: string }
    inApp?: { success: boolean; notificationId?: string; error?: string }
    sms?: { success: boolean; messageId?: string; error?: string }
  }
  metadata?: Record<string, unknown>
}

export class NotificationService {
  private getSupabase: () => Promise<Awaited<ReturnType<typeof createClient>>>
  private emailService: EmailService
  private jobQueue: JobQueueService

  constructor() {
    this.getSupabase = () => createClient()
    this.emailService = new EmailService()
    this.jobQueue = new JobQueueService()
  }

  /**
   * Send notifications through multiple channels
   */
  async sendNotification(
    request: NotificationRequest
  ): Promise<NotificationResult> {
    // If scheduled, queue for later processing
    if (request.scheduleFor && request.scheduleFor > new Date()) {
      await this.jobQueue.scheduleJob(
        'send_notification',
        { request },
        request.scheduleFor
      )
      
      return {
        success: true,
        results: { email: { success: true, messageId: 'scheduled' } },
        metadata: { scheduled: true, scheduleFor: request.scheduleFor }
      }
    }

    // Process immediately based on priority
    if (request.priority === 'urgent' || request.priority === 'high') {
      // Send synchronously for urgent notifications
      return await this.processNotificationSync(request)
    } else {
      // Queue for async processing
      await this.jobQueue.addJob('send_notification', { request }, {
        priority: request.priority === 'normal' ? 1 : 0,
        attempts: request.retryPolicy?.maxAttempts || 3,
        backoff: {
          type: 'exponential',
          settings: {
            initial: (request.retryPolicy?.backoffSeconds?.[0] || 10) * 1000,
            max: (request.retryPolicy?.backoffSeconds?.[2] || 300) * 1000
          }
        }
      })

      return {
        success: true,
        results: { email: { success: true, messageId: 'queued' } },
        metadata: { queued: true }
      }
    }
  }

  /**
   * Process notification synchronously (for urgent notifications)
   */
  async processNotificationSync(
    request: NotificationRequest
  ): Promise<NotificationResult> {
    const results: NotificationResult['results'] = {}
    let overallSuccess = true

    // Send email notification
    if (request.channels.email) {
      try {
        const emailResult = await this.sendEmailNotification(request.channels.email)
        results.email = emailResult
        if (!emailResult.success) overallSuccess = false
      } catch (error) {
        results.email = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
        overallSuccess = false
      }
    }

    // Send in-app notification
    if (request.channels.inApp) {
      try {
        const inAppResult = await this.sendInAppNotification(request.channels.inApp)
        results.inApp = inAppResult
        if (!inAppResult.success) overallSuccess = false
      } catch (error) {
        results.inApp = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
        overallSuccess = false
      }
    }

    // Send SMS notification
    if (request.channels.sms) {
      try {
        const smsResult = await this.sendSMSNotification(request.channels.sms)
        results.sms = smsResult
        if (!smsResult.success) overallSuccess = false
      } catch (error) {
        results.sms = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
        overallSuccess = false
      }
    }

    return {
      success: overallSuccess,
      results,
      metadata: request.metadata
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    email: EmailNotification
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const result = await this.emailService.sendEmail({
        to: email.to,
        from: email.from,
        subject: email.subject,
        body: email.body,
        templateId: email.templateId,
        trackingId: email.trackingId,
        metadata: email.metadata
      })

      return {
        success: true,
        messageId: result.messageId
      }
    } catch (error) {
      console.error('Email notification failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send in-app notification
   */
  private async sendInAppNotification(
    notification: InAppNotification
  ): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      const supabase = await this.getSupabase()
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: notification.userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          action_url: notification.actionUrl,
          metadata: notification.metadata,
          is_read: false
        })
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        notificationId: data.id
      }
    } catch (error) {
      console.error('In-app notification failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send SMS notification (placeholder - integrate with Twilio/similar)
   */
  private async sendSMSNotification(
    sms: SMSNotification
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // TODO: Integrate with SMS provider (Twilio, AWS SNS, etc.)
      console.log('SMS would be sent to:', sms.to, 'Message:', sms.message)
      
      return {
        success: true,
        messageId: `sms_${Date.now()}`
      }
    } catch (error) {
      console.error('SMS notification failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send reviewer invitation notification
   */
  async sendReviewerInvitation(
    reviewerId: string,
    manuscriptId: string,
    invitationToken: string,
    templateVariables: Record<string, string>,
    customMessage?: string
  ): Promise<NotificationResult> {
    const supabase = await this.getSupabase()
    
    // Get reviewer and manuscript details
    const [reviewerResult, manuscriptResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', reviewerId)
        .single(),
      supabase
        .from('manuscripts')
        .select('title, field_of_study, abstract')
        .eq('id', manuscriptId)
        .single()
    ])

    if (reviewerResult.error || manuscriptResult.error) {
      throw new Error('Failed to fetch reviewer or manuscript details')
    }

    const reviewer = reviewerResult.data
    const manuscript = manuscriptResult.data

    // Generate response URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const acceptUrl = `${baseUrl}/review/respond/${invitationToken}?action=accept`
    const declineUrl = `${baseUrl}/review/respond/${invitationToken}?action=decline`
    const viewUrl = `${baseUrl}/review/respond/${invitationToken}`

    // Merge template variables
    const variables = {
      reviewer_name: reviewer.full_name,
      manuscript_title: manuscript.title,
      field_of_study: manuscript.field_of_study,
      accept_link: acceptUrl,
      decline_link: declineUrl,
      view_link: viewUrl,
      custom_message: customMessage || '',
      ...templateVariables
    }

    // Render email template
    const emailContent = await this.renderInvitationEmail('standard-001', variables)

    return await this.sendNotification({
      channels: {
        email: {
          to: reviewer.email,
          subject: emailContent.subject,
          body: emailContent.body,
          templateId: 'reviewer-invitation',
          trackingId: invitationToken,
          metadata: { manuscriptId, reviewerId, invitationToken }
        },
        inApp: {
          userId: reviewerId,
          title: `Review Invitation: ${manuscript.title}`,
          message: `You have been invited to review "${manuscript.title}" in ${manuscript.field_of_study}`,
          type: 'info',
          actionUrl: viewUrl,
          metadata: { manuscriptId, invitationToken }
        }
      },
      priority: 'normal',
      retryPolicy: {
        maxAttempts: 3,
        backoffSeconds: [10, 60, 300]
      },
      metadata: { type: 'reviewer_invitation', manuscriptId, reviewerId }
    })
  }

  /**
   * Send reviewer reminder notification
   */
  async sendReviewerReminder(
    reviewerId: string,
    invitationToken: string,
    reminderType: 'first' | 'second' | 'final',
    daysRemaining: number
  ): Promise<NotificationResult> {
    const supabase = await this.getSupabase()
    
    // Get invitation details
    const { data: invitation, error } = await supabase
      .from('reviewer_invitations')
      .select(`
        *,
        manuscripts (title, field_of_study),
        profiles (full_name, email)
      `)
      .eq('invitation_token', invitationToken)
      .single()

    if (error || !invitation) {
      throw new Error('Invitation not found')
    }

    const urgencyLevel = reminderType === 'final' ? 'high' : 'normal'
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const responseUrl = `${baseUrl}/review/respond/${invitationToken}`

    const variables = {
      reviewer_name: invitation.profiles.full_name,
      manuscript_title: invitation.manuscripts.title,
      field_of_study: invitation.manuscripts.field_of_study,
      days_remaining: daysRemaining.toString(),
      response_link: responseUrl,
      reminder_type: reminderType
    }

    const emailContent = await this.renderInvitationEmail('reminder-001', variables)

    return await this.sendNotification({
      channels: {
        email: {
          to: invitation.profiles.email,
          subject: emailContent.subject,
          body: emailContent.body,
          templateId: 'reviewer-reminder',
          trackingId: invitationToken,
          metadata: { reminderType, daysRemaining }
        },
        inApp: {
          userId: reviewerId,
          title: `Reminder: Review Due in ${daysRemaining} Days`,
          message: `Your review for "${invitation.manuscripts.title}" is due soon.`,
          type: reminderType === 'final' ? 'warning' : 'info',
          actionUrl: responseUrl,
          metadata: { reminderType, daysRemaining }
        }
      },
      priority: urgencyLevel as 'normal' | 'high',
      metadata: { type: 'reviewer_reminder', reminderType, daysRemaining }
    })
  }

  /**
   * Render email template with variables
   */
  private async renderInvitationEmail(
    templateId: string,
    variables: Record<string, string>
  ): Promise<{ subject: string; body: string }> {
    const supabase = await this.getSupabase()
    const { data: result, error } = await supabase
      .rpc('render_invitation_template', {
        template_id_param: templateId,
        variables_param: variables
      })

    if (error || !result || result.length === 0) {
      throw new Error(`Failed to render template: ${templateId}`)
    }

    return {
      subject: result[0].rendered_subject,
      body: result[0].rendered_body
    }
  }

  /**
   * Mark notification as delivered
   */
  async markAsDelivered(
    trackingId: string,
    _channel: 'email' | 'inApp' | 'sms',
    deliveryData?: Record<string, unknown>
  ): Promise<void> {
    const supabase = await this.getSupabase()
    
    await supabase
      .from('invitation_tracking')
      .update({
        delivery_status: 'delivered',
        metadata: deliveryData
      })
      .eq('id', trackingId)
  }

  /**
   * Track notification interaction (open, click, etc.)
   */
  async trackInteraction(
    trackingId: string,
    interactionType: 'opened' | 'clicked' | 'responded',
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const supabase = await this.getSupabase()
    
    const updateData: Record<string, unknown> = {
      [`${interactionType}_at`]: new Date().toISOString()
    }

    if (metadata) {
      updateData.metadata = metadata
    }

    await supabase
      .from('invitation_tracking')
      .update(updateData)
      .eq('id', trackingId)
  }
}