'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { EditorQueueView } from '@/components/dashboard/editor-queue-view'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function EditorManuscriptsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [manuscripts, setManuscripts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || authLoading) return

    const fetchManuscripts = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()

        // Get manuscripts for this editor with enhanced data
        const { data: manuscriptsData, error: manuscriptsError } = await supabase
          .from('manuscripts')
          .select(`
            *,
            profiles!author_id(full_name, affiliation, email),
            manuscript_coauthors(name, email, is_corresponding),
            review_assignments(
              id,
              status,
              due_date,
              profiles!reviewer_id(full_name)
            )
          `)
          .or(`editor_id.eq.${user.id},editor_id.is.null`)
          .neq('status', 'draft')
          .order('submitted_at', { ascending: false })

        if (manuscriptsError) throw manuscriptsError

        // Add urgency indicators
        const manuscriptsWithUrgency = manuscriptsData?.map(manuscript => {
          const daysSinceSubmission = Math.floor(
            (new Date().getTime() - new Date(manuscript.submitted_at || manuscript.created_at).getTime()) / (1000 * 60 * 60 * 24)
          )
          
          let urgency = null
          if (manuscript.status === 'submitted' && daysSinceSubmission > 3) {
            urgency = { level: 'high', message: 'Needs assignment' }
          } else if (manuscript.status === 'with_editor' && daysSinceSubmission > 7) {
            urgency = { level: 'medium', message: 'Needs reviewers' }
          } else if (manuscript.status === 'under_review' && daysSinceSubmission > 21) {
            urgency = { level: 'medium', message: 'Follow up needed' }
          }

          return {
            ...manuscript,
            urgency
          }
        }) || []

        setManuscripts(manuscriptsWithUrgency)
      } catch (err) {
        console.error('Error fetching manuscripts:', err)
        setError(err instanceof Error ? err.message : 'Failed to load manuscripts')
      } finally {
        setIsLoading(false)
      }
    }

    fetchManuscripts()
  }, [user, authLoading])

  if (authLoading || isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Manuscripts</h3>
        <p className="text-gray-600">{error}</p>
      </div>
    )
  }

  if (!user || (user.role !== 'editor' && user.role !== 'admin')) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You need editor privileges to access this page.</p>
      </div>
    )
  }

  return (
    <EditorQueueView
      manuscripts={manuscripts}
      currentEditor={{
        id: user.id,
        full_name: user.name,
        role: user.role
      }}
      onRefresh={() => window.location.reload()}
    />
  )
}