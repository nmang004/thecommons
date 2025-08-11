import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ManuscriptSubmissionWizard from '@/components/forms/manuscript-submission-wizard'

export default async function SubmitManuscriptPage() {
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

  // Verify user has author role
  if (profile.role !== 'author' && profile.role !== 'admin') {
    redirect(`/${profile.role}`)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h1 className="text-2xl font-heading font-bold text-gray-900">
          Submit New Manuscript
        </h1>
        <p className="text-gray-600 mt-1">
          Follow the steps below to submit your manuscript for peer review
        </p>
      </div>
      
      <ManuscriptSubmissionWizard profile={profile} />
    </div>
  )
}