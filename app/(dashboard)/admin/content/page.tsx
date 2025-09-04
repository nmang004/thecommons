'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { ContentManagement } from '@/components/admin/content-management'
import { Card } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface Author {
  full_name: string
  email: string
  affiliation?: string
}

interface Editor {
  full_name: string
  email: string
  affiliation?: string
}

type ManuscriptStatus = 'draft' | 'submitted' | 'with_editor' | 'under_review' | 'revisions_requested' | 'accepted' | 'rejected' | 'published'

interface Manuscript {
  id: string
  title: string
  abstract: string
  keywords?: string[]
  field_of_study: string
  subfield?: string
  author_id: string
  corresponding_author_id?: string
  editor_id?: string
  status: ManuscriptStatus
  submission_number?: string
  submitted_at?: string
  accepted_at?: string
  published_at?: string
  doi?: string
  view_count: number
  download_count: number
  citation_count: number
  created_at: string
  updated_at: string
  author: Author
  editor?: Editor
  corresponding_author?: Author
}

interface ContentStats {
  total: number
  published: number
  underReview: number
  pending: number
  drafts: number
  rejected: number
}

interface ReviewStats {
  totalReviews: number
  pendingAssignments: number
}

export default function AdminContentPage() {
  const { user, isLoading, isAdmin } = useAuth()
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([])
  const [contentStats, setContentStats] = useState<ContentStats>({
    total: 0,
    published: 0,
    underReview: 0,
    pending: 0,
    drafts: 0,
    rejected: 0
  })
  const [reviewStats, setReviewStats] = useState<ReviewStats>({
    totalReviews: 0,
    pendingAssignments: 0
  })
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && user && isAdmin) {
      fetchContentData()
    }
  }, [user, isLoading, isAdmin])

  const fetchContentData = async () => {
    try {
      setDataLoading(true)
      setError(null)

      // Fetch content data in parallel
      const [manuscriptsResponse, contentStatsResponse, reviewStatsResponse] = await Promise.all([
        fetch('/api/admin/content/manuscripts'),
        fetch('/api/admin/content/stats'),
        fetch('/api/admin/content/reviews/stats')
      ])

      if (!manuscriptsResponse.ok || !contentStatsResponse.ok || !reviewStatsResponse.ok) {
        throw new Error('Failed to fetch content data')
      }

      const manuscriptsData = await manuscriptsResponse.json()
      const contentStatsData = await contentStatsResponse.json()
      const reviewStatsData = await reviewStatsResponse.json()

      setManuscripts(manuscriptsData.manuscripts || [])
      setContentStats(contentStatsData.stats || {
        total: 0,
        published: 0,
        underReview: 0,
        pending: 0,
        drafts: 0,
        rejected: 0
      })
      setReviewStats(reviewStatsData.stats || {
        totalReviews: 0,
        pendingAssignments: 0
      })
    } catch (err) {
      console.error('Error fetching content data:', err)
      setError('Failed to load content data')
    } finally {
      setDataLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card className="card-academic p-8 text-center">
          <h2 className="text-xl font-heading font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to access the admin panel.</p>
        </Card>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Card className="card-academic p-8 text-center">
          <h2 className="text-xl font-heading font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="card-academic p-8 text-center">
          <h2 className="text-xl font-heading font-semibold mb-2 text-red-600">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button 
            onClick={fetchContentData}
            className="btn-academic"
          >
            Try Again
          </button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Page Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-4xl font-heading font-bold text-foreground mb-2">
          Content Management
        </h1>
        <p className="text-lg text-muted-foreground">
          Manage manuscripts, reviews, and editorial workflow across The Commons platform
        </p>
      </div>

      {dataLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* Content Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            <div className="card-academic p-6 text-center">
              <div className="text-3xl font-heading font-bold text-primary mb-2">
                {contentStats.total.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Manuscripts</div>
            </div>
            <div className="card-academic p-6 text-center">
              <div className="text-3xl font-heading font-bold text-green-600 mb-2">
                {contentStats.published.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Published</div>
            </div>
            <div className="card-academic p-6 text-center">
              <div className="text-3xl font-heading font-bold text-blue-600 mb-2">
                {contentStats.underReview.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Under Review</div>
            </div>
            <div className="card-academic p-6 text-center">
              <div className="text-3xl font-heading font-bold text-yellow-600 mb-2">
                {contentStats.pending.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Pending Review</div>
            </div>
            <div className="card-academic p-6 text-center">
              <div className="text-3xl font-heading font-bold text-gray-600 mb-2">
                {contentStats.drafts.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Drafts</div>
            </div>
            <div className="card-academic p-6 text-center">
              <div className="text-3xl font-heading font-bold text-red-600 mb-2">
                {contentStats.rejected.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Rejected</div>
            </div>
          </div>

          {/* Review Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-academic p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-heading font-bold text-foreground mb-1">
                    {reviewStats.totalReviews.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Reviews Completed</div>
                </div>
                <div className="text-green-600 text-sm font-medium">
                  Review Quality Score: 4.2/5
                </div>
              </div>
            </div>
            <div className="card-academic p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-heading font-bold text-foreground mb-1">
                    {reviewStats.pendingAssignments.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending Review Assignments</div>
                </div>
                <div className="text-yellow-600 text-sm font-medium">
                  Avg Response Time: 3.5 days
                </div>
              </div>
            </div>
          </div>

          {/* Content Management Component */}
          <ContentManagement initialManuscripts={manuscripts} />
        </>
      )}
    </div>
  )
}