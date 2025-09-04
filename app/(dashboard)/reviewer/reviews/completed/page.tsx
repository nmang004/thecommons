'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { ReviewQueue } from '@/components/dashboard/reviewer/review-queue'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle, RefreshCw, ArrowLeft, CheckCircle } from 'lucide-react'
import { ReviewerDashboard } from '@/types/database'
import Link from 'next/link'

export default function CompletedReviewsPage() {
  const { user, isLoading, error, login, refreshAuth } = useAuth()
  const [dashboardData, setDashboardData] = useState<ReviewerDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)


  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reviewers/me/dashboard', {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load dashboard')
      }

      setDashboardData(result.data)
      setFetchError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setFetchError(errorMessage)
      console.error('Dashboard loading error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshData = () => {
    loadDashboardData()
  }

  // Loading state
  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading completed reviews...</p>
        </div>
      </div>
    )
  }

  // Authentication error - show login option
  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            {error ? 'There was an authentication error. Please sign in to access completed reviews.' : 'You must be signed in to access completed reviews.'}
          </p>
          <div className="space-y-3">
            <Button onClick={() => login()} className="w-full">
              Sign In
            </Button>
            <Button 
              variant="outline" 
              onClick={refreshAuth}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Check if user has reviewer role
  if (user.role !== 'reviewer' && user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You need reviewer permissions to access completed reviews. Your current role is: {user.role}.
          </p>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = `/${user.role}`}
            className="w-full"
          >
            Go to Your Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // Error loading dashboard data
  if (fetchError || !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to Load Completed Reviews
          </h2>
          <p className="text-gray-600 mb-4">
            {fetchError || 'There was a problem loading your completed reviews.'}
          </p>
          <Button onClick={handleRefreshData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </Card>
      </div>
    )
  }

  const completedQueue = {
    pending: [],
    inProgress: [],
    completed: dashboardData.queue.completed,
    declined: []
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/reviewer">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
                <div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <h1 className="text-3xl font-heading font-bold text-gray-900">
                      Completed Reviews
                    </h1>
                  </div>
                  <p className="text-gray-600 mt-1">
                    Your review history and submitted reviews
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Completed Reviews</p>
                  <p className="text-2xl font-bold text-green-600">
                    {completedQueue.completed.length}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleRefreshData}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {dashboardData.analytics.totalReviews}
                </div>
                <div className="text-sm text-gray-600">Total Reviews</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {dashboardData.analytics.qualityScore.toFixed(1)}/5.0
                </div>
                <div className="text-sm text-gray-600">Avg Quality Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round(dashboardData.analytics.timeliness * 100)}%
                </div>
                <div className="text-sm text-gray-600">On-time Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round(dashboardData.analytics.averageReviewTime)}d
                </div>
                <div className="text-sm text-gray-600">Avg Review Time</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {completedQueue.completed.length > 0 ? (
            <ReviewQueue 
              queue={completedQueue} 
              onRefreshData={handleRefreshData}
            />
          ) : (
            <Card className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Completed Reviews
              </h3>
              <p className="text-gray-600 mb-6">
                You haven't completed any reviews yet. Check your pending invitations to get started.
              </p>
              <div className="space-x-4">
                <Link href="/reviewer/reviews/pending">
                  <Button>
                    View Pending Reviews
                  </Button>
                </Link>
                <Link href="/reviewer">
                  <Button variant="outline">
                    Return to Dashboard
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    </ErrorBoundary>
  )
}