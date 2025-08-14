'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { EnhancedManuscriptDetailView } from '@/components/dashboard/enhanced-manuscript-detail-view'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function ManuscriptDetailPage() {
  const { id } = useParams()
  const { user, isLoading: authLoading } = useAuth()
  const [manuscript, setManuscript] = useState<any>(null)
  const [potentialReviewers, setPotentialReviewers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || authLoading || !id) return

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()

        // Get comprehensive manuscript data
        const { data: manuscriptData, error: manuscriptError } = await supabase
          .from('manuscripts')
          .select(`
            *,
            profiles!author_id(full_name, email, affiliation, orcid),
            manuscript_coauthors(*),
            manuscript_files(*),
            review_assignments(
              *,
              profiles!reviewer_id(full_name, email, affiliation)
            ),
            reviews(
              *,
              profiles!reviewer_id(full_name)
            ),
            editorial_decisions(
              *,
              profiles!editor_id(full_name)
            )
          `)
          .eq('id', id)
          .single()

        if (manuscriptError) throw manuscriptError
        if (!manuscriptData) throw new Error('Manuscript not found')

        // Get potential reviewers for assignment
        const { data: reviewersData, error: reviewersError } = await supabase
          .from('profiles')
          .select('id, full_name, email, affiliation, expertise, h_index')
          .eq('role', 'reviewer')
          .order('full_name')

        if (reviewersError) throw reviewersError

        setManuscript(manuscriptData)
        setPotentialReviewers(reviewersData || [])
      } catch (err) {
        console.error('Error fetching manuscript data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load manuscript')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, authLoading, id])

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
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Manuscript</h3>
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

  if (!manuscript) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Manuscript Not Found</h3>
        <p className="text-gray-600">The requested manuscript could not be found.</p>
      </div>
    )
  }

  return (
    <EnhancedManuscriptDetailView 
      manuscript={manuscript}
      potentialReviewers={potentialReviewers}
      currentEditor={{
        id: user.id,
        full_name: user.name,
        role: user.role
      }}
    />
  )
}