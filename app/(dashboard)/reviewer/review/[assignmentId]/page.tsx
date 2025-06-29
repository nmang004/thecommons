import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ReviewSubmissionForm } from '@/components/forms/review-submission-form'

interface PageProps {
  params: Promise<{
    assignmentId: string
  }>
}

export default async function ReviewSubmissionPage({ params }: PageProps) {
  const { assignmentId } = await params
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

  if (!profile || (profile.role !== 'reviewer' && profile.role !== 'admin')) {
    redirect(`/${profile?.role || 'author'}`)
  }

  // Get the review assignment
  const { data: assignment } = await supabase
    .from('review_assignments')
    .select(`
      *,
      manuscripts(
        id,
        title,
        abstract,
        field_of_study,
        subfield,
        keywords,
        manuscript_files!inner(
          file_path,
          file_name,
          file_type,
          file_size
        )
      )
    `)
    .eq('id', assignmentId)
    .eq('reviewer_id', user.id)
    .single()

  if (!assignment) {
    redirect('/reviewer')
  }

  // Check if user has already submitted a review
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('*')
    .eq('manuscript_id', assignment.manuscript_id)
    .eq('reviewer_id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ReviewSubmissionForm 
          assignment={assignment}
          existingReview={existingReview}
          manuscript={assignment.manuscripts}
        />
      </div>
    </div>
  )
}