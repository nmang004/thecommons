'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DecisionProcessingService } from '@/lib/services/decision-processing-service'

export interface DecisionDraftState {
  decision: string
  components: {
    editorSummary: string
    authorLetter: string
    reviewerComments: any[]
    internalNotes: string
    conditions: string[]
    nextSteps: string[]
    decisionRationale: string
  }
  actions: {
    notifyAuthor: boolean
    notifyReviewers: boolean
    schedulePublication?: string | null
    assignProductionEditor?: string | null
    generateDOI: boolean
    sendToProduction: boolean
    followUpDate?: string | null
  }
  selectedTemplate?: any
}

export interface UseDecisionDraftOptions {
  manuscriptId: string
  userId: string
  autoSaveInterval?: number // milliseconds, default 30000 (30 seconds)
  enabled?: boolean
}

export interface UseDecisionDraftReturn {
  draftState: DecisionDraftState | null
  isLoading: boolean
  isSaving: boolean
  lastSaved: Date | null
  error: string | null
  saveDraft: (state: DecisionDraftState) => Promise<boolean>
  loadDraft: () => Promise<void>
  deleteDraft: () => Promise<boolean>
  hasPendingChanges: boolean
}

export function useDecisionDraft({
  manuscriptId,
  userId,
  autoSaveInterval = 30000,
  enabled = true
}: UseDecisionDraftOptions): UseDecisionDraftReturn {
  const [draftState, setDraftState] = useState<DecisionDraftState | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasPendingChanges, setHasPendingChanges] = useState(false)
  
  const supabase = createClient()
  const decisionService = new DecisionProcessingService(supabase)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedStateRef = useRef<string>('')

  // Load existing draft on mount
  useEffect(() => {
    if (enabled) {
      loadDraft()
    }
  }, [manuscriptId, userId, enabled])

  // Set up auto-save when state changes
  useEffect(() => {
    if (!enabled || !draftState) return

    const currentStateString = JSON.stringify(draftState)
    
    // Check if state has actually changed
    if (currentStateString !== lastSavedStateRef.current) {
      setHasPendingChanges(true)
      
      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
      
      // Set new timer
      autoSaveTimerRef.current = setTimeout(() => {
        if (hasPendingChanges) {
          saveDraft(draftState)
        }
      }, autoSaveInterval)
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [draftState, autoSaveInterval, enabled, hasPendingChanges])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [])

  const loadDraft = useCallback(async () => {
    if (!enabled) return

    setIsLoading(true)
    setError(null)

    try {
      const drafts = await decisionService.getDraftDecisions(manuscriptId, userId)
      
      if (drafts.length > 0) {
        const latestDraft = drafts[0] // Most recent draft
        
        // Convert database format to hook format - using type assertion due to interface mismatches
        const draftState: DecisionDraftState = {
          decision: latestDraft.decision,
          components: {
            editorSummary: latestDraft.components?.editorSummary || '',
            authorLetter: latestDraft.decision_letter || latestDraft.components?.authorLetter || '',
            reviewerComments: latestDraft.components?.reviewerComments || [],
            internalNotes: latestDraft.internal_notes || latestDraft.components?.internalNotes || '',
            conditions: latestDraft.components?.conditions || [],
            nextSteps: latestDraft.components?.nextSteps || [],
            decisionRationale: latestDraft.components?.decisionRationale || ''
          },
          actions: {
            notifyAuthor: latestDraft.actions?.notifyAuthor ?? true,
            notifyReviewers: latestDraft.actions?.notifyReviewers ?? false,
            schedulePublication: Boolean(latestDraft.actions?.schedulePublication),
            assignProductionEditor: Boolean(latestDraft.actions?.assignProductionEditor),
            generateDOI: latestDraft.actions?.generateDOI ?? false,
            sendToProduction: latestDraft.actions?.sendToProduction ?? false,
            daysUntilFollowUp: (latestDraft.actions as any)?.daysUntilFollowUp || (latestDraft.actions as any)?.followUpDate
          } as any,
          selectedTemplate: latestDraft.template_id ? {
            id: latestDraft.template_id,
            version: latestDraft.template_version
          } : undefined
        }

        setDraftState(draftState)
        setLastSaved(new Date(latestDraft.updated_at || latestDraft.created_at))
        lastSavedStateRef.current = JSON.stringify(draftState)
        setHasPendingChanges(false)
      }
    } catch (err) {
      console.error('Error loading draft:', err)
      setError(err instanceof Error ? err.message : 'Failed to load draft')
    } finally {
      setIsLoading(false)
    }
  }, [manuscriptId, userId, enabled])

  const saveDraft = useCallback(async (state: DecisionDraftState): Promise<boolean> => {
    if (!enabled || isSaving) return false

    setIsSaving(true)
    setError(null)

    try {
      const result = await decisionService.saveDraftDecision({
        manuscriptId,
        editorId: userId,
        decision: state.decision as any,
        components: state.components,
        actions: state.actions as any,
        templateId: state.selectedTemplate?.id,
        templateVersion: state.selectedTemplate?.version,
        isDraft: true
      })

      if (result.success) {
        setLastSaved(new Date())
        setHasPendingChanges(false)
        lastSavedStateRef.current = JSON.stringify(state)
        return true
      } else {
        throw new Error(result.error || 'Failed to save draft')
      }
    } catch (err) {
      console.error('Error saving draft:', err)
      setError(err instanceof Error ? err.message : 'Failed to save draft')
      return false
    } finally {
      setIsSaving(false)
    }
  }, [manuscriptId, userId, enabled, isSaving])

  const deleteDraft = useCallback(async (): Promise<boolean> => {
    if (!enabled) return false

    try {
      // Get current drafts
      const drafts = await decisionService.getDraftDecisions(manuscriptId, userId)
      
      if (drafts.length > 0) {
        // Delete all drafts for this manuscript and user
        const { error } = await supabase
          .from('editorial_decisions')
          .delete()
          .eq('manuscript_id', manuscriptId)
          .eq('editor_id', userId)
          .eq('is_draft', true)

        if (error) {
          throw error
        }

        setDraftState(null)
        setLastSaved(null)
        setHasPendingChanges(false)
        lastSavedStateRef.current = ''
        
        return true
      }
      
      return true
    } catch (err) {
      console.error('Error deleting draft:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete draft')
      return false
    }
  }, [manuscriptId, userId, enabled, supabase])

  return {
    draftState,
    isLoading,
    isSaving,
    lastSaved,
    error,
    saveDraft,
    loadDraft,
    deleteDraft,
    hasPendingChanges
  }
}

// Hook for managing multiple drafts (if needed)
export function useDecisionDrafts(manuscriptId: string) {
  const [drafts, setDrafts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const loadDrafts = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('editorial_decisions')
        .select(`
          *,
          profiles!editor_id(full_name, email)
        `)
        .eq('manuscript_id', manuscriptId)
        .eq('is_draft', true)
        .order('updated_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      setDrafts(data || [])
    } catch (err) {
      console.error('Error loading drafts:', err)
      setError(err instanceof Error ? err.message : 'Failed to load drafts')
    } finally {
      setIsLoading(false)
    }
  }, [manuscriptId, supabase])

  useEffect(() => {
    loadDrafts()
  }, [loadDrafts])

  return {
    drafts,
    isLoading,
    error,
    reload: loadDrafts
  }
}

// Utility hook for draft status indicator
export function useDraftStatus(manuscriptId: string, userId: string) {
  const { draftState, lastSaved, isSaving, hasPendingChanges } = useDecisionDraft({
    manuscriptId,
    userId,
    enabled: true
  })

  const getStatusText = () => {
    if (isSaving) return 'Saving...'
    if (hasPendingChanges) return 'Unsaved changes'
    if (lastSaved) return `Saved ${lastSaved.toLocaleTimeString()}`
    return 'No draft'
  }

  const getStatusColor = () => {
    if (isSaving) return 'text-blue-600'
    if (hasPendingChanges) return 'text-amber-600'
    if (lastSaved) return 'text-green-600'
    return 'text-gray-500'
  }

  return {
    statusText: getStatusText(),
    statusColor: getStatusColor(),
    hasDraft: !!draftState,
    isAutoSaving: isSaving,
    hasUnsavedChanges: hasPendingChanges
  }
}