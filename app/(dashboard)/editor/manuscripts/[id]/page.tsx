import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ManuscriptDetailView } from '@/components/dashboard/manuscript-detail-view'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ManuscriptDetailPage({ params }: PageProps) {
  const { id } = await params
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

  // Get comprehensive manuscript data
  const { data: manuscript, error: manuscriptError } = await supabase
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

  if (manuscriptError || !manuscript) {
    redirect('/editor/manuscripts')
  }

  // Get potential reviewers for assignment
  const { data: potentialReviewers } = await supabase
    .from('profiles')
    .select('id, full_name, email, affiliation, expertise, h_index')
    .eq('role', 'reviewer')
    .order('full_name')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ManuscriptDetailView 
          manuscript={manuscript}
          potentialReviewers={potentialReviewers || []}
          currentEditor={profile}
        />
      </div>
    </div>
  )
}