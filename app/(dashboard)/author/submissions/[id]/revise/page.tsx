import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RevisionForm from '@/components/forms/revision-form'

export default async function ReviseManuscriptPage({ 
  params 
}: { 
  params: Promise<{ id: string }>
}) {
  const { id: manuscriptId } = await params
  const supabase = await createClient()
  
  // Get the authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // Get manuscript details with reviews
  const { data: manuscript, error: manuscriptError } = await supabase
    .from('manuscripts')
    .select(`
      *,
      manuscript_files(*),
      reviews(
        *,
        profiles!reviews_reviewer_id_fkey(full_name)
      ),
      editorial_decisions(*)
    `)
    .eq('id', manuscriptId)
    .eq('author_id', user.id)
    .single()

  if (manuscriptError || !manuscript) {
    redirect('/author')
  }

  // Check if manuscript is in revision status
  if (manuscript.status !== 'revisions_requested') {
    redirect(`/author/submissions/${manuscriptId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-heading font-bold text-gray-900">
              Submit Revised Manuscript
            </h1>
            <p className="text-gray-600 mt-1">
              Address the reviewer comments and upload your revised manuscript
            </p>
          </div>
          
          <RevisionForm manuscript={manuscript} />
        </div>
      </div>
    </div>
  )
}