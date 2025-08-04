import { SupabaseClient } from '@supabase/supabase-js'

export interface PostDecisionActionData {
  decisionId: string
  manuscriptId: string
  editorId: string
  decision: string
  recipientId?: string
  scheduledDate?: string
  reminderDate?: string
  [key: string]: any
}

export interface NotificationTemplate {
  type: string
  subject: string
  template: string
  variables: string[]
}

export class PostDecisionActionOrchestrator {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  async executeAction(actionType: string, data: PostDecisionActionData): Promise<boolean> {
    try {
      switch (actionType) {
        case 'notify_author':
          return await this.notifyAuthor(data)
        case 'notify_reviewers':
          return await this.notifyReviewers(data)
        case 'generate_doi':
          return await this.generateDOI(data)
        case 'assign_production_editor':
          return await this.assignProductionEditor(data)
        case 'schedule_publication':
          return await this.schedulePublication(data)
        case 'follow_up_reminder':
          return await this.scheduleFollowUpReminder(data)
        case 'send_to_production':
          return await this.sendToProduction(data)
        default:
          console.warn(`Unknown action type: ${actionType}`)
          return false
      }
    } catch (error) {
      console.error(`Error executing action ${actionType}:`, error)
      return false
    }
  }

  private async notifyAuthor(data: PostDecisionActionData): Promise<boolean> {
    try {
      // Get manuscript and decision details
      const { data: manuscript, error: manuscriptError } = await this.supabase
        .from('manuscripts')
        .select(`
          *,
          profiles!author_id(full_name, email),
          editorial_decisions!inner(decision_letter, decision, created_at)
        `)
        .eq('id', data.manuscriptId)
        .single()

      if (manuscriptError || !manuscript) {
        throw new Error('Manuscript not found')
      }

      const decision = manuscript.editorial_decisions[0]
      
      // Create notification record
      await this.supabase
        .from('notifications')
        .insert({
          user_id: manuscript.author_id,
          type: 'editorial_decision',
          title: `Editorial Decision: ${decision.decision.replace('_', ' ').toUpperCase()}`,
          message: `Your manuscript "${manuscript.title}" has received an editorial decision.`,
          data: {
            manuscript_id: data.manuscriptId,
            decision_id: data.decisionId,
            decision: decision.decision,
            decision_letter: decision.decision_letter
          }
        })

      // In a real implementation, this would also send an email
      await this.sendEmailNotification({
        to: manuscript.profiles.email,
        subject: `Editorial Decision for "${manuscript.title}"`,
        template: 'editorial_decision',
        variables: {
          author_name: manuscript.profiles.full_name,
          manuscript_title: manuscript.title,
          decision: decision.decision,
          decision_letter: decision.decision_letter,
          journal_name: 'The Commons'
        }
      })

      // Log the action
      await this.logAction('notify_author', data, { recipient: manuscript.profiles.email })

      return true
    } catch (error) {
      console.error('Error notifying author:', error)
      return false
    }
  }

  private async notifyReviewers(data: PostDecisionActionData): Promise<boolean> {
    try {
      // Get all reviewers who completed reviews for this manuscript
      const { data: reviewers, error } = await this.supabase
        .from('review_assignments')
        .select(`
          reviewer_id,
          profiles!reviewer_id(full_name, email),
          manuscripts!manuscript_id(title)
        `)
        .eq('manuscript_id', data.manuscriptId)
        .eq('status', 'completed')

      if (error || !reviewers) {
        throw new Error('Failed to fetch reviewers')
      }

      const manuscript = reviewers[0]?.manuscripts

      for (const reviewer of reviewers) {
        // Create notification
        await this.supabase
          .from('notifications')
          .insert({
            user_id: reviewer.reviewer_id,
            type: 'decision_published',
            title: 'Editorial Decision Published',
            message: `The editorial decision for "${manuscript.title}" has been published. Thank you for your review.`,
            data: {
              manuscript_id: data.manuscriptId,
              decision_id: data.decisionId
            }
          })

        // Send email
        await this.sendEmailNotification({
          to: reviewer.profiles.email,
          subject: `Editorial Decision Published - ${manuscript.title}`,
          template: 'reviewer_decision_notification',
          variables: {
            reviewer_name: reviewer.profiles.full_name,
            manuscript_title: manuscript.title,
            journal_name: 'The Commons'
          }
        })
      }

      await this.logAction('notify_reviewers', data, { reviewer_count: reviewers.length })

      return true
    } catch (error) {
      console.error('Error notifying reviewers:', error)
      return false
    }
  }

  private async generateDOI(data: PostDecisionActionData): Promise<boolean> {
    try {
      // Generate a DOI (in real implementation, this would integrate with CrossRef or similar)
      const doi = `10.1000/commons.${data.manuscriptId.substring(0, 8)}`

      // Update manuscript with DOI
      const { error } = await this.supabase
        .from('manuscripts')
        .update({ doi })
        .eq('id', data.manuscriptId)

      if (error) {
        throw new Error('Failed to update manuscript with DOI')
      }

      await this.logAction('generate_doi', data, { doi })

      return true
    } catch (error) {
      console.error('Error generating DOI:', error)
      return false
    }
  }

  private async assignProductionEditor(data: PostDecisionActionData): Promise<boolean> {
    try {
      // Update manuscript with production editor
      const { error } = await this.supabase
        .from('manuscripts')
        .update({ 
          editor_id: data.recipientId,
          status: 'in_production' 
        })
        .eq('id', data.manuscriptId)

      if (error) {
        throw new Error('Failed to assign production editor')
      }

      // Notify the production editor
      await this.supabase
        .from('notifications')
        .insert({
          user_id: data.recipientId,
          type: 'production_assignment',
          title: 'New Production Assignment',
          message: 'You have been assigned as production editor for a new manuscript.',
          data: {
            manuscript_id: data.manuscriptId,
            decision_id: data.decisionId
          }
        })

      await this.logAction('assign_production_editor', data, { 
        production_editor_id: data.recipientId 
      })

      return true
    } catch (error) {
      console.error('Error assigning production editor:', error)
      return false
    }
  }

  private async schedulePublication(data: PostDecisionActionData): Promise<boolean> {
    try {
      // Update manuscript with scheduled publication date
      const { error } = await this.supabase
        .from('manuscripts')
        .update({ 
          status: 'scheduled_for_publication',
          // In a real implementation, you'd have a published_scheduled_date field
        })
        .eq('id', data.manuscriptId)

      if (error) {
        throw new Error('Failed to schedule publication')
      }

      // Create a scheduled job (in real implementation, this would use a job queue)
      await this.supabase
        .from('activity_logs')
        .insert({
          manuscript_id: data.manuscriptId,
          action: 'publication_scheduled',
          details: {
            scheduled_date: data.scheduledDate,
            decision_id: data.decisionId
          }
        })

      await this.logAction('schedule_publication', data, { 
        scheduled_date: data.scheduledDate 
      })

      return true
    } catch (error) {
      console.error('Error scheduling publication:', error)
      return false
    }
  }

  private async scheduleFollowUpReminder(data: PostDecisionActionData): Promise<boolean> {
    try {
      // Create a scheduled reminder (in real implementation, this would use a job queue)
      await this.supabase
        .from('activity_logs')
        .insert({
          manuscript_id: data.manuscriptId,
          user_id: data.editorId,
          action: 'follow_up_reminder_scheduled',
          details: {
            reminder_date: data.reminderDate,
            decision_id: data.decisionId,
            decision: data.decision
          }
        })

      await this.logAction('schedule_follow_up_reminder', data, { 
        reminder_date: data.reminderDate 
      })

      return true
    } catch (error) {
      console.error('Error scheduling follow-up reminder:', error)
      return false
    }
  }

  private async sendToProduction(data: PostDecisionActionData): Promise<boolean> {
    try {
      // Update manuscript status to production
      const { error } = await this.supabase
        .from('manuscripts')
        .update({ status: 'in_production' })
        .eq('id', data.manuscriptId)

      if (error) {
        throw new Error('Failed to send manuscript to production')
      }

      // Create production task
      await this.supabase
        .from('activity_logs')
        .insert({
          manuscript_id: data.manuscriptId,
          action: 'sent_to_production',
          details: {
            decision_id: data.decisionId,
            sent_at: new Date().toISOString()
          }
        })

      await this.logAction('send_to_production', data)

      return true
    } catch (error) {
      console.error('Error sending to production:', error)
      return false
    }
  }

  private async sendEmailNotification(params: {
    to: string
    subject: string
    template: string
    variables: Record<string, any>
  }): Promise<boolean> {
    try {
      // In a real implementation, this would integrate with an email service like Resend
      console.log('Sending email notification:', params)
      
      // For now, just log the email that would be sent
      await this.supabase
        .from('activity_logs')
        .insert({
          action: 'email_sent',
          details: {
            recipient: params.to,
            subject: params.subject,
            template: params.template,
            sent_at: new Date().toISOString()
          }
        })

      return true
    } catch (error) {
      console.error('Error sending email notification:', error)
      return false
    }
  }

  private async logAction(
    actionType: string, 
    data: PostDecisionActionData, 
    result?: Record<string, any>
  ): Promise<void> {
    try {
      await this.supabase
        .from('activity_logs')
        .insert({
          manuscript_id: data.manuscriptId,
          user_id: data.editorId,
          action: `post_decision_${actionType}`,
          details: {
            decision_id: data.decisionId,
            action_type: actionType,
            executed_at: new Date().toISOString(),
            result: result || {}
          }
        })
    } catch (error) {
      console.error('Error logging action:', error)
    }
  }
}

// Email templates for different notification types
export const EMAIL_TEMPLATES: Record<string, NotificationTemplate> = {
  editorial_decision: {
    type: 'editorial_decision',
    subject: 'Editorial Decision for "{{manuscript_title}}"',
    template: `Dear {{author_name}},

{{decision_letter}}

If you have any questions about this decision, please don't hesitate to contact us.

Best regards,
The Editorial Team
{{journal_name}}`,
    variables: ['author_name', 'manuscript_title', 'decision_letter', 'journal_name']
  },

  reviewer_decision_notification: {
    type: 'reviewer_decision_notification',
    subject: 'Editorial Decision Published - {{manuscript_title}}',
    template: `Dear {{reviewer_name}},

Thank you for your valuable contribution as a reviewer for the manuscript "{{manuscript_title}}".

The editorial decision has now been published, and we greatly appreciate the time and expertise you dedicated to the peer review process.

Best regards,
The Editorial Team
{{journal_name}}`,
    variables: ['reviewer_name', 'manuscript_title', 'journal_name']
  },

  production_assignment: {
    type: 'production_assignment',
    subject: 'New Production Assignment - {{manuscript_title}}',
    template: `Dear {{editor_name}},

You have been assigned as the production editor for the manuscript "{{manuscript_title}}".

Please log into your dashboard to review the manuscript and begin the production process.

Best regards,
The Editorial Team
{{journal_name}}`,
    variables: ['editor_name', 'manuscript_title', 'journal_name']
  }
}

// Utility function to process email templates
export function processEmailTemplate(
  template: NotificationTemplate,
  variables: Record<string, string>
): { subject: string; body: string } {
  let subject = template.subject
  let body = template.template

  // Replace all variables in both subject and body
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`
    subject = subject.replace(new RegExp(placeholder, 'g'), value)
    body = body.replace(new RegExp(placeholder, 'g'), value)
  })

  return { subject, body }
}