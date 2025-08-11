'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAuth } from '@/hooks/useAuth'
import { EnhancedReviewerDashboard } from '@/components/dashboard/enhanced-reviewer-dashboard'
import { ErrorBoundary } from '@/components/ui/error-boundary'

export default function ReviewerDashboardPage() {
  const { user } = useAuth()

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

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <ErrorBoundary>
        <EnhancedReviewerDashboard profile={profile} />
      </ErrorBoundary>
    </DashboardLayout>
  )
}