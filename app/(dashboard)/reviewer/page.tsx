'use client'

import { useAuth } from '@/hooks/useAuth'
import { EnhancedReviewerDashboard } from '@/components/dashboard/enhanced-reviewer-dashboard'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function ReviewerDashboardPage() {
  const { user, isLoading, error, login, refreshAuth } = useAuth()

  // Convert Auth0 user to profile format expected by the component
  const profile = user ? {
    id: user.id,
    email: user.email,
    full_name: user.name,
    role: user.role,
    affiliation: user.metadata.affiliation || null,
    orcid: user.metadata.orcid || null,
    bio: user.metadata.bio || null,
    expertise: user.metadata.expertise || null,
    avatar_url: user.metadata.avatar_url || null,
    linkedin_url: null,
    twitter_handle: null,
    website_url: null,
    h_index: user.metadata.h_index || null,
    total_publications: 0,
    current_review_load: null,
    avg_review_quality_score: null,
    response_rate: null,
    specializations: null,
    collaboration_history: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    notification_preferences: {},
    is_active: true,
    timezone: 'UTC'
  } : null

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reviewer dashboard...</p>
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
            {error ? 'There was an authentication error. Please sign in to access the reviewer dashboard.' : 'You must be signed in to access the reviewer dashboard.'}
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
            You need reviewer permissions to access this dashboard. Your current role is: {user.role}.
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

  return (
    <ErrorBoundary>
      <EnhancedReviewerDashboard profile={profile!} />
    </ErrorBoundary>
  )
}