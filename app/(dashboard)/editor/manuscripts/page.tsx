import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EditorQueueView } from '@/components/dashboard/editor-queue-view'

export default async function EditorManuscriptsPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'editor' && profile.role !== 'admin')) {
    redirect(`/${profile?.role || 'author'}`)
  }

  // Get manuscripts for this editor with enhanced data
  const { data: manuscripts } = await supabase
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

  // Add urgency indicators
  const manuscriptsWithUrgency = manuscripts?.map(manuscript => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EditorQueueView
          manuscripts={manuscriptsWithUrgency}
          currentEditor={{
            id: profile.id,
            full_name: profile.full_name,
            role: profile.role
          }}
        />
      </div>
    </div>
  )
}