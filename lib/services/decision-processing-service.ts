import { createClient } from '@/lib/supabase/server'
import { EditorialDecision, DecisionActions, ManuscriptStatus } from '@/types/database'

export interface ProcessDecisionInput {
  manuscriptId: string
  editorId: string
  decision: ManuscriptStatus
  components: {
    editorSummary?: string
    authorLetter: string
    reviewerComments: Array<{
      id: string
      review_id: string
      reviewer_name?: string
      comment_type: string
      content: string
      include_in_letter: boolean
      position?: number
    }>
    internalNotes?: string
    conditions?: string[]
    nextSteps?: string[]
    decisionRationale?: string
  }
  actions: DecisionActions & {
    schedulePublication?: string | null
    assignProductionEditor?: string | null
    followUpDate?: string | null
  }
  templateId?: string
  templateVersion?: number
  isDraft?: boolean
}

export interface ProcessDecisionResult {
  success: boolean
  decisionId?: string
  error?: string
  queuedActions?: string[]
}

export class DecisionProcessingService {
  private supabase: Awaited<ReturnType<typeof createClient>>

  constructor(supabase: Awaited<ReturnType<typeof createClient>>) {
    this.supabase = supabase
  }

  async processDecision(input: ProcessDecisionInput): Promise<ProcessDecisionResult> {
    const {
      manuscriptId,
      editorId,
      decision,
      components,
      actions,
      templateId,
      templateVersion,
      isDraft = false
    } = input

    try {
      // Start a transaction
      const { data: transactionResult, error: transactionError } = await this.supabase.rpc(
        'process_editorial_decision',
        {
          p_manuscript_id: manuscriptId,
          p_editor_id: editorId,
          p_decision: decision,
          p_components: components,
          p_actions: actions,
          p_template_id: templateId,
          p_template_version: templateVersion,
          p_is_draft: isDraft
        }
      )

      if (transactionError) {
        console.error('Transaction error:', transactionError)
        return {
          success: false,
          error: transactionError.message
        }
      }

      const decisionId = transactionResult?.decision_id

      if (!isDraft && decisionId) {
        // Queue post-decision actions asynchronously
        const queuedActions = await this.queuePostDecisionActions(
          decisionId,
          manuscriptId,
          actions
        )

        return {
          success: true,
          decisionId,
          queuedActions
        }
      }

      return {
        success: true,
        decisionId
      }

    } catch (error) {
      console.error('Decision processing error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async saveDraftDecision(input: ProcessDecisionInput): Promise<ProcessDecisionResult> {
    return this.processDecision({ ...input, isDraft: true })
  }

  async submitFinalDecision(draftId: string): Promise<ProcessDecisionResult> {
    try {
      // Get the draft decision
      const { data: draft, error: draftError } = await this.supabase
        .from('editorial_decisions')
        .select('*')
        .eq('id', draftId)
        .eq('is_draft', true)
        .single()

      if (draftError || !draft) {
        return {
          success: false,
          error: 'Draft decision not found'
        }
      }

      // Convert draft to final decision
      const input: ProcessDecisionInput = {
        manuscriptId: draft.manuscript_id,
        editorId: draft.editor_id,
        decision: draft.decision,
        components: draft.components || {
          authorLetter: draft.decision_letter,
          reviewerComments: []
        },
        actions: draft.actions || { notifyAuthor: true, notifyReviewers: false },
        templateId: draft.template_id || undefined,
        templateVersion: draft.template_version || undefined,
        isDraft: false
      }

      const result = await this.processDecision(input)

      if (result.success) {
        // Delete the draft
        await this.supabase
          .from('editorial_decisions')
          .delete()
          .eq('id', draftId)
      }

      return result

    } catch (error) {
      console.error('Submit final decision error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  private async queuePostDecisionActions(
    decisionId: string,
    manuscriptId: string,
    actions: DecisionActions & {
      schedulePublication?: string | null
      assignProductionEditor?: string | null
      followUpDate?: string | null
    }
  ): Promise<string[]> {
    const queuedActions: string[] = []

    try {
      // Get manuscript and decision details for notifications
      const { data: manuscript } = await this.supabase
        .from('manuscripts')
        .select(`
          *,
          profiles!author_id(full_name, email),
          editorial_decisions!inner(decision_letter, decision)
        `)
        .eq('id', manuscriptId)
        .single()

      if (!manuscript) {
        throw new Error('Manuscript not found')
      }

      // Queue author notification
      if (actions.notifyAuthor) {
        await this.queueNotification('author', {
          decisionId,
          manuscriptId,
          authorId: manuscript.author_id,
          type: 'editorial_decision',
          data: {
            decision: manuscript.editorial_decisions[0]?.decision,
            title: manuscript.title
          }
        } as any)
        queuedActions.push('notify_author')
      }

      // Queue reviewer notifications
      if (actions.notifyReviewers) {
        const { data: reviewers } = await this.supabase
          .from('review_assignments')
          .select('reviewer_id')
          .eq('manuscript_id', manuscriptId)
          .eq('status', 'completed')

        if (reviewers) {
          for (const reviewer of reviewers) {
            await this.queueNotification('reviewer', {
              decisionId,
              manuscriptId,
              reviewerId: reviewer.reviewer_id,
              type: 'decision_published',
              data: {
                title: manuscript.title
              }
            } as any)
          }
          queuedActions.push('notify_reviewers')
        }
      }

      // Queue DOI generation
      if (actions.generateDOI && manuscript.status === 'accepted') {
        await this.queueAction('generate_doi', {
          manuscriptId,
          decisionId
        })
        queuedActions.push('generate_doi')
      }

      // Queue production assignment
      if (actions.assignProductionEditor && actions.assignProductionEditor) {
        await this.queueAction('assign_production_editor', {
          manuscriptId,
          decisionId,
          editorId: actions.assignProductionEditor
        })
        queuedActions.push('assign_production_editor')
      }

      // Queue publication scheduling
      if (actions.schedulePublication && manuscript.status === 'accepted') {
        await this.queueAction('schedule_publication', {
          manuscriptId,
          decisionId,
          scheduledDate: actions.schedulePublication
        })
        queuedActions.push('schedule_publication')
      }

      // Queue follow-up reminder
      if (actions.followUpDate) {
        await this.queueAction('follow_up_reminder', {
          manuscriptId,
          decisionId,
          reminderDate: actions.followUpDate
        })
        queuedActions.push('follow_up_reminder')
      }

    } catch (error) {
      console.error('Error queueing post-decision actions:', error)
    }

    return queuedActions
  }

  private async queueNotification(_type: string, data: {
    manuscriptId: string
    manuscriptTitle: string
    authorId?: string
    reviewerId?: string
    decisionId?: string
    metadata?: Record<string, unknown>
  }): Promise<void> {
    // In a real implementation, this would use a proper job queue like BullMQ
    // For now, we'll create notifications directly
    await this.supabase
      .from('notifications')
      .insert({
        user_id: data.authorId || data.reviewerId,
        type: (data as any).type,
        title: this.getNotificationTitle((data as any).type, (data as any).data),
        message: this.getNotificationMessage((data as any).type, (data as any).data),
        data: {
          manuscript_id: data.manuscriptId,
          decision_id: data.decisionId,
          ...(data as any).data
        }
      })
  }

  private async queueAction(actionType: string, data: Record<string, unknown>): Promise<void> {
    // In a real implementation, this would use a proper job queue
    // For now, we'll log the action and could implement immediate processing
    console.log(`Queuing action: ${actionType}`, data)
    
    // Create an activity log entry for tracking
    await this.supabase
      .from('activity_logs')
      .insert({
        manuscript_id: data.manuscriptId,
        action: `queued_${actionType}`,
        details: data
      })
  }

  private getNotificationTitle(type: string, data: {
    manuscriptId: string
    manuscriptTitle: string
    authorId?: string
    reviewerId?: string
    decisionId?: string
    metadata?: Record<string, unknown>
  }): string {
    switch (type) {
      case 'editorial_decision':
        return `Editorial Decision: ${(data as any).decision?.replace('_', ' ').toUpperCase() || 'Unknown'}`
      case 'decision_published':
        return 'Editorial Decision Published'
      default:
        return 'Notification'
    }
  }

  private getNotificationMessage(type: string, data: {
    manuscriptId: string
    manuscriptTitle: string
    authorId?: string
    reviewerId?: string
    decisionId?: string
    metadata?: Record<string, unknown>
  }): string {
    switch (type) {
      case 'editorial_decision':
        return `Your manuscript "${(data as any).title}" has received an editorial decision.`
      case 'decision_published':
        return `The editorial decision for "${(data as any).title}" has been published.`
      default:
        return 'You have a new notification.'
    }
  }

  async getDecisionHistory(manuscriptId: string): Promise<EditorialDecision[]> {
    const { data, error } = await this.supabase
      .from('editorial_decisions')
      .select(`
        *,
        profiles!editor_id(full_name)
      `)
      .eq('manuscript_id', manuscriptId)
      .eq('is_draft', false)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch decision history: ${error.message}`)
    }

    return data || []
  }

  async getDraftDecisions(manuscriptId: string, editorId: string): Promise<EditorialDecision[]> {
    const { data, error } = await this.supabase
      .from('editorial_decisions')
      .select('*')
      .eq('manuscript_id', manuscriptId)
      .eq('editor_id', editorId)
      .eq('is_draft', true)
      .order('updated_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch draft decisions: ${error.message}`)
    }

    return data || []
  }
}