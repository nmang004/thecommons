import { createClient } from '@/lib/supabase/server'

export interface InvitationTemplate {
  id: string
  name: string
  category: string
  subject_template: string
  body_template: string
  variables: Record<string, string>
  usage_count: number
  is_system_template: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface InvitationTracking {
  id: string
  assignment_id: string
  template_id?: string
  sent_at: string
  sent_by: string
  recipient_email: string
  subject: string
  body: string
  delivery_status: string
  opened_at?: string
  clicked_at?: string
  responded_at?: string
  response_type?: string
  reminder_count: number
  last_reminder_at?: string
  scheduled_for?: string
  metadata?: Record<string, unknown>
}

export interface InvitationAnalytics {
  period_start: string
  period_end: string
  template_id?: string
  field_of_study?: string
  total_sent: number
  total_delivered: number
  total_opened: number
  total_clicked: number
  total_accepted: number
  total_declined: number
  avg_response_time_hours?: number
  acceptance_rate: number
  open_rate: number
  click_rate: number
  bounce_rate: number
}

export interface InvitationVariables {
  reviewer_name?: string
  manuscript_title?: string
  journal_name?: string
  field_of_study?: string
  abstract_preview?: string
  submission_number?: string
  due_date?: string
  estimated_hours?: string
  reviewer_expertise?: string
  review_type?: string
  response_deadline?: string
  accept_link?: string
  decline_link?: string
  editor_name?: string
  editor_title?: string
  custom_message?: string
  [key: string]: string | undefined
}

export class InvitationTrackingService {
  private getSupabase: () => Promise<Awaited<ReturnType<typeof createClient>>>

  constructor() {
    this.getSupabase = () => createClient()
  }

  /**
   * Get all available invitation templates
   */
  async getTemplates(category?: string): Promise<InvitationTemplate[]> {
    const supabase = await this.getSupabase()
    let query = supabase
      .from('invitation_templates')
      .select('*')
      .eq('is_active', true)
      .order('usage_count', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data: templates, error } = await query

    if (error) {
      console.error('Error fetching invitation templates:', error)
      return []
    }

    return templates || []
  }

  /**
   * Create a new invitation template
   */
  async createTemplate(
    name: string,
    category: string,
    subjectTemplate: string,
    bodyTemplate: string,
    variables: Record<string, string>,
    createdBy: string
  ): Promise<InvitationTemplate | null> {
    const supabase = await this.getSupabase()
    const { data: template, error } = await supabase
      .from('invitation_templates')
      .insert({
        name,
        category,
        subject_template: subjectTemplate,
        body_template: bodyTemplate,
        variables,
        created_by: createdBy,
        is_system_template: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating invitation template:', error)
      throw new Error(`Failed to create template: ${error.message}`)
    }

    return template
  }

  /**
   * Render a template with variables
   */
  async renderTemplate(
    templateId: string,
    variables: InvitationVariables
  ): Promise<{ subject: string; body: string }> {
    const supabase = await this.getSupabase()
    const { data: result, error } = await supabase
      .rpc('render_invitation_template', {
        template_id_param: templateId,
        variables_param: variables
      })

    if (error) {
      console.error('Error rendering template:', error)
      throw new Error(`Failed to render template: ${error.message}`)
    }

    if (!result || result.length === 0) {
      throw new Error('Template not found or inactive')
    }

    return {
      subject: result[0].rendered_subject,
      body: result[0].rendered_body
    }
  }

  /**
   * Track a sent invitation
   */
  async trackInvitation(
    assignmentId: string,
    templateId: string | null,
    sentBy: string,
    recipientEmail: string,
    subject: string,
    body: string,
    scheduledFor?: Date,
    metadata?: Record<string, unknown>
  ): Promise<InvitationTracking> {
    const supabase = await this.getSupabase()
    const { data: tracking, error } = await supabase
      .from('invitation_tracking')
      .insert({
        assignment_id: assignmentId,
        template_id: templateId,
        sent_by: sentBy,
        recipient_email: recipientEmail,
        subject,
        body,
        scheduled_for: scheduledFor?.toISOString(),
        metadata,
        delivery_status: 'sent'
      })
      .select()
      .single()

    if (error) {
      console.error('Error tracking invitation:', error)
      throw new Error(`Failed to track invitation: ${error.message}`)
    }

    // Schedule automatic reminders
    if (tracking) {
      await this.scheduleReminders(tracking.id, assignmentId)
    }

    return tracking
  }

  /**
   * Update invitation delivery status
   */
  async updateDeliveryStatus(
    invitationId: string,
    status: 'delivered' | 'bounced' | 'failed',
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const supabase = await this.getSupabase()
    const { error } = await supabase
      .from('invitation_tracking')
      .update({
        delivery_status: status,
        metadata: metadata
      })
      .eq('id', invitationId)

    if (error) {
      console.error('Error updating delivery status:', error)
      throw new Error(`Failed to update delivery status: ${error.message}`)
    }
  }

  /**
   * Track invitation opened
   */
  async trackOpened(invitationId: string): Promise<void> {
    const supabase = await this.getSupabase()
    const { error } = await supabase
      .from('invitation_tracking')
      .update({
        opened_at: new Date().toISOString()
      })
      .eq('id', invitationId)
      .is('opened_at', null) // Only update if not already opened

    if (error) {
      console.error('Error tracking invitation opened:', error)
    }
  }

  /**
   * Track invitation link clicked
   */
  async trackClicked(invitationId: string): Promise<void> {
    const supabase = await this.getSupabase()
    const { error } = await supabase
      .from('invitation_tracking')
      .update({
        clicked_at: new Date().toISOString()
      })
      .eq('id', invitationId)
      .is('clicked_at', null) // Only update if not already clicked

    if (error) {
      console.error('Error tracking invitation clicked:', error)
    }
  }

  /**
   * Track invitation response
   */
  async trackResponse(
    invitationId: string,
    responseType: 'accepted' | 'declined'
  ): Promise<void> {
    const supabase = await this.getSupabase()
    const { error } = await supabase
      .from('invitation_tracking')
      .update({
        responded_at: new Date().toISOString(),
        response_type: responseType
      })
      .eq('id', invitationId)

    if (error) {
      console.error('Error tracking invitation response:', error)
      throw new Error(`Failed to track response: ${error.message}`)
    }
  }

  /**
   * Schedule automatic reminders for an invitation
   */
  private async scheduleReminders(
    invitationId: string,
    assignmentId: string
  ): Promise<void> {
    const supabase = await this.getSupabase()
    // Get the due date from the assignment
    const { data: assignment } = await supabase
      .from('review_assignments')
      .select('due_date')
      .eq('id', assignmentId)
      .single()

    if (!assignment?.due_date) {
      return
    }

    const { error } = await supabase
      .rpc('schedule_invitation_reminders', {
        invitation_id_param: invitationId,
        initial_due_date: assignment.due_date
      })

    if (error) {
      console.error('Error scheduling reminders:', error)
    }
  }

  /**
   * Send a reminder for an invitation
   */
  async sendReminder(
    invitationId: string,
    reminderType: string,
    _templateId?: string
  ): Promise<void> {
    const supabase = await this.getSupabase()
    // Get the original invitation details
    const { data: invitation } = await supabase
      .from('invitation_tracking')
      .select(`
        *,
        review_assignments (
          manuscript_id,
          due_date,
          manuscripts (
            title,
            field_of_study
          ),
          profiles (
            full_name,
            email
          )
        )
      `)
      .eq('id', invitationId)
      .single()

    if (!invitation) {
      throw new Error('Invitation not found')
    }

    // Update reminder count and last reminder date
    const { error: updateError } = await supabase
      .from('invitation_tracking')
      .update({
        reminder_count: invitation.reminder_count + 1,
        last_reminder_at: new Date().toISOString()
      })
      .eq('id', invitationId)

    if (updateError) {
      console.error('Error updating reminder count:', updateError)
    }

    // Mark reminder as sent
    await supabase
      .from('invitation_reminders')
      .update({
        sent_at: new Date().toISOString(),
        status: 'sent'
      })
      .eq('invitation_id', invitationId)
      .eq('reminder_type', reminderType)
  }

  /**
   * Get pending reminders that need to be sent
   */
  async getPendingReminders(): Promise<Array<{
    id: string
    invitation_id: string
    reminder_type: string
    scheduled_for: string
    sent_at?: string | null
    status: string
    invitation_tracking: {
      assignment_id: string
      recipient_email: string
      response_type?: string | null
      review_assignments: {
        manuscript_id: string
        due_date: string
        manuscripts: {
          title: string
          field_of_study: string
        }
        profiles: {
          full_name: string
          email: string
        }
      }
    }
  }>> {
    const supabase = await this.getSupabase()
    const { data: reminders, error } = await supabase
      .from('invitation_reminders')
      .select(`
        *,
        invitation_tracking (
          assignment_id,
          recipient_email,
          response_type,
          review_assignments (
            manuscript_id,
            due_date,
            manuscripts (
              title,
              field_of_study
            ),
            profiles (
              full_name,
              email
            )
          )
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .is('invitation_tracking.response_type', null) // Only for unanswered invitations

    if (error) {
      console.error('Error fetching pending reminders:', error)
      return []
    }

    return reminders || []
  }

  /**
   * Get invitation statistics for a manuscript
   */
  async getManuscriptInvitationStats(manuscriptId: string): Promise<{
    total_sent: number
    total_delivered: number
    total_opened: number
    total_responded: number
    total_accepted: number
    total_declined: number
    avg_response_time_hours: number
    pending_count: number
  }> {
    const supabase = await this.getSupabase()
    const { data: stats, error } = await supabase
      .from('invitation_tracking')
      .select(`
        delivery_status,
        opened_at,
        responded_at,
        response_type,
        sent_at,
        review_assignments!inner (
          manuscript_id
        )
      `)
      .eq('review_assignments.manuscript_id', manuscriptId)

    if (error) {
      console.error('Error fetching invitation stats:', error)
      return {
        total_sent: 0,
        total_delivered: 0,
        total_opened: 0,
        total_responded: 0,
        total_accepted: 0,
        total_declined: 0,
        avg_response_time_hours: 0,
        pending_count: 0
      }
    }

    const invitations = stats || []
    const responded = invitations.filter(i => i.responded_at)
    const responseTimeSum = responded.reduce((sum, inv) => {
      if (inv.responded_at && inv.sent_at) {
        return sum + (new Date(inv.responded_at).getTime() - new Date(inv.sent_at).getTime()) / (1000 * 60 * 60)
      }
      return sum
    }, 0)

    return {
      total_sent: invitations.length,
      total_delivered: invitations.filter(i => i.delivery_status === 'delivered').length,
      total_opened: invitations.filter(i => i.opened_at).length,
      total_responded: responded.length,
      total_accepted: invitations.filter(i => i.response_type === 'accepted').length,
      total_declined: invitations.filter(i => i.response_type === 'declined').length,
      avg_response_time_hours: responded.length > 0 ? responseTimeSum / responded.length : 0,
      pending_count: invitations.filter(i => !i.response_type).length
    }
  }

  /**
   * Get invitation analytics for a time period
   */
  async getAnalytics(
    startDate: Date,
    endDate: Date,
    templateId?: string,
    fieldOfStudy?: string
  ): Promise<InvitationAnalytics[]> {
    const supabase = await this.getSupabase()
    let query = supabase
      .from('invitation_analytics')
      .select('*')
      .gte('period_start', startDate.toISOString().split('T')[0])
      .lte('period_end', endDate.toISOString().split('T')[0])

    if (templateId) {
      query = query.eq('template_id', templateId)
    }

    if (fieldOfStudy) {
      query = query.eq('field_of_study', fieldOfStudy)
    }

    const { data: analytics, error } = await query.order('period_start', { ascending: false })

    if (error) {
      console.error('Error fetching invitation analytics:', error)
      return []
    }

    return analytics || []
  }

  /**
   * Calculate and store analytics for a time period
   */
  async calculateAnalytics(startDate: Date, endDate: Date): Promise<void> {
    const supabase = await this.getSupabase()
    const { error } = await supabase
      .rpc('calculate_invitation_analytics', {
        start_date_param: startDate.toISOString().split('T')[0],
        end_date_param: endDate.toISOString().split('T')[0]
      })

    if (error) {
      console.error('Error calculating invitation analytics:', error)
      throw new Error(`Failed to calculate analytics: ${error.message}`)
    }
  }

  /**
   * Get template performance comparison
   */
  async getTemplatePerformance(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{
    template_name: string
    template_id: string
    total_sent: number
    acceptance_rate: number
    avg_response_time_hours: number
    open_rate: number
  }>> {
    const supabase = await this.getSupabase()
    const { data: performance, error } = await supabase
      .from('invitation_analytics')
      .select(`
        template_id,
        SUM(total_sent) as total_sent,
        AVG(acceptance_rate) as acceptance_rate,
        AVG(avg_response_time_hours) as avg_response_time_hours,
        AVG(open_rate) as open_rate,
        invitation_templates (
          name
        )
      `)
      .gte('period_start', startDate.toISOString().split('T')[0])
      .lte('period_end', endDate.toISOString().split('T')[0])
      .not('template_id', 'is', null)

    if (error) {
      console.error('Error fetching template performance:', error)
      return []
    }

    return (performance || []).map((p: any) => ({
      template_name: p.invitation_templates?.name || 'Unknown Template',
      template_id: p.template_id,
      total_sent: p.total_sent || 0,
      acceptance_rate: p.acceptance_rate || 0,
      avg_response_time_hours: p.avg_response_time_hours || 0,
      open_rate: p.open_rate || 0
    }))
  }

  /**
   * Get reviewer response patterns
   */
  async getReviewerResponsePatterns(
    reviewerId: string,
    months: number = 12
  ): Promise<{
    total_invitations: number
    accepted: number
    declined: number
    no_response: number
    avg_response_time_hours: number
    preferred_fields: string[]
  }> {
    const supabase = await this.getSupabase()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    const { data: invitations, error } = await supabase
      .from('invitation_tracking')
      .select(`
        response_type,
        responded_at,
        sent_at,
        review_assignments!inner (
          reviewer_id,
          manuscripts (
            field_of_study
          )
        )
      `)
      .eq('review_assignments.reviewer_id', reviewerId)
      .gte('sent_at', startDate.toISOString())

    if (error) {
      console.error('Error fetching reviewer response patterns:', error)
      return {
        total_invitations: 0,
        accepted: 0,
        declined: 0,
        no_response: 0,
        avg_response_time_hours: 0,
        preferred_fields: []
      }
    }

    const data = invitations || []
    const responded = data.filter(i => i.responded_at && i.sent_at)
    const responseTimeSum = responded.reduce((sum, inv) => {
      return sum + (new Date(inv.responded_at).getTime() - new Date(inv.sent_at).getTime()) / (1000 * 60 * 60)
    }, 0)

    // Calculate preferred fields based on acceptance rate
    const fieldStats: { [field: string]: { total: number; accepted: number } } = {}
    data.forEach(inv => {
      const field = (inv as any).review_assignments?.manuscripts?.field_of_study
      if (field) {
        if (!fieldStats[field]) {
          fieldStats[field] = { total: 0, accepted: 0 }
        }
        fieldStats[field].total++
        if (inv.response_type === 'accepted') {
          fieldStats[field].accepted++
        }
      }
    })

    const preferredFields = Object.entries(fieldStats)
      .filter(([_, stats]) => stats.total >= 2 && stats.accepted / stats.total >= 0.6)
      .map(([field, _]) => field)

    return {
      total_invitations: data.length,
      accepted: data.filter(i => i.response_type === 'accepted').length,
      declined: data.filter(i => i.response_type === 'declined').length,
      no_response: data.filter(i => !i.response_type).length,
      avg_response_time_hours: responded.length > 0 ? responseTimeSum / responded.length : 0,
      preferred_fields: preferredFields
    }
  }
}