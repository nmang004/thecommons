import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EnhancedReviewerDashboard } from '@/components/dashboard/enhanced-reviewer-dashboard'
import { ErrorBoundary } from '@/components/ui/error-boundary'

export default async function ReviewerDashboardPage() {
  const supabase = await createClient()
  
  // Get the authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/register?step=profile')
  }

  // Verify user has reviewer role
  if (profile.role !== 'reviewer' && profile.role !== 'admin') {
    redirect(`/${profile.role}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ErrorBoundary>
        <EnhancedReviewerDashboard profile={profile} />
      </ErrorBoundary>
    </div>
  )
}