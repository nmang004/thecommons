import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ReviewForm } from '@/components/review/review-form'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FileText,
  Calendar,
  User,
  AlertTriangle
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ 
    assignment?: string
    token?: string
  }>
}

interface ManuscriptData {
  id: string
  title: string
  abstract: string
  field_of_study: string
  keywords: string[]
  authors: Array<{
    name: string
    email: string
    affiliation?: string
    is_corresponding: boolean
  }>
  created_at: string
}

interface AssignmentData {
  id: string
  status: string
  due_date: string
  assigned_at: string
  reviewer_id: string
}

async function getManuscriptAndAssignment(
  manuscriptId: string, 
  assignmentId?: string,
  userId?: string
): Promise<{ manuscript: ManuscriptData | null; assignment: AssignmentData | null }> {
  const supabase = await createClient()

  // Get manuscript details
  const { data: manuscript, error: manuscriptError } = await supabase
    .from('manuscripts')
    .select(`
      id,
      title,
      abstract,
      field_of_study,
      keywords,
      created_at,
      authors:manuscript_coauthors(
        name,
        email,
        affiliation,
        is_corresponding
      )
    `)
    .eq('id', manuscriptId)
    .single()

  if (manuscriptError) {
    console.error('Error fetching manuscript:', manuscriptError)
    return { manuscript: null, assignment: null }
  }

  // Get assignment if provided
  let assignment = null
  if (assignmentId && userId) {
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('review_assignments')
      .select('*')
      .eq('id', assignmentId)
      .eq('reviewer_id', userId)
      .eq('status', 'accepted')
      .single()

    if (assignmentError) {
      console.error('Error fetching assignment:', assignmentError)
    } else {
      assignment = assignmentData
    }
  } else if (userId && !assignmentId) {
    // Try to find any assignment for this manuscript and user
    const { data: assignmentData } = await supabase
      .from('review_assignments')
      .select('*')
      .eq('manuscript_id', manuscriptId)
      .eq('reviewer_id', userId)
      .eq('status', 'accepted')
      .single()

    if (assignmentData) {
      assignment = assignmentData
    }
  }

  return { 
    manuscript: manuscript as ManuscriptData, 
    assignment: assignment as AssignmentData | null 
  }
}

async function validateAccess(
  manuscriptId: string, 
  assignmentId?: string
): Promise<{ hasAccess: boolean; user: any; assignment?: AssignmentData }> {
  const supabase = await createClient()

  // Get the authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { hasAccess: false, user: null }
  }

  // Check if user has reviewer role or admin/editor permissions
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Admins and editors can access any review
  if (profile?.role === 'admin' || profile?.role === 'editor') {
    return { hasAccess: true, user }
  }

  // For reviewers, check assignment
  if (assignmentId) {
    const { data: assignment, error: assignmentError } = await supabase
      .from('review_assignments')
      .select('*')
      .eq('id', assignmentId)
      .eq('reviewer_id', user.id)
      .eq('status', 'accepted')
      .single()

    if (assignmentError || !assignment) {
      return { hasAccess: false, user }
    }

    return { hasAccess: true, user, assignment: assignment as AssignmentData }
  }

  // Check if user has any assignment for this manuscript
  const { data: assignment } = await supabase
    .from('review_assignments')
    .select('*')
    .eq('manuscript_id', manuscriptId)
    .eq('reviewer_id', user.id)
    .eq('status', 'accepted')
    .single()

  if (assignment) {
    return { hasAccess: true, user, assignment: assignment as AssignmentData }
  }

  return { hasAccess: false, user }
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          {/* Header skeleton */}
          <div className="bg-white rounded-lg p-6">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          
          {/* Form skeleton */}
          <div className="bg-white rounded-lg p-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="space-y-4">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="lg:col-span-3">
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AccessDeniedMessage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="p-8 max-w-md mx-auto">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to review this manuscript. Please check that you have an accepted review assignment.
          </p>
        </div>
      </Card>
    </div>
  )
}

function ManuscriptInfo({ manuscript, assignment }: { 
  manuscript: ManuscriptData
  assignment?: AssignmentData | null 
}) {
  return (
    <Card className="p-6 mb-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {manuscript.title}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <FileText className="w-4 h-4" />
                <span>{manuscript.field_of_study}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>
                  Submitted {new Date(manuscript.created_at).toLocaleDateString()}
                </span>
              </div>
              {assignment && (
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>
                    Due {new Date(assignment.due_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              {manuscript.field_of_study}
            </Badge>
            {assignment && (
              <Badge 
                variant={assignment.status === 'accepted' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {assignment.status}
              </Badge>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-medium text-gray-900 mb-2">Authors</h3>
          <div className="flex flex-wrap gap-2">
            {manuscript.authors.map((author, index) => (
              <span 
                key={index}
                className={`text-sm px-3 py-1 rounded-full ${
                  author.is_corresponding 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {author.name}
                {author.is_corresponding && ' (corresponding)'}
              </span>
            ))}
          </div>
        </div>

        {manuscript.keywords && manuscript.keywords.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {manuscript.keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="font-medium text-gray-900 mb-2">Abstract</h3>
          <p className="text-gray-700 leading-relaxed text-sm bg-gray-50 p-4 rounded-lg">
            {manuscript.abstract}
          </p>
        </div>
      </div>
    </Card>
  )
}

export default async function ManuscriptReviewPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams

  // Validate access first
  const { hasAccess, user, assignment } = await validateAccess(
    resolvedParams.id, 
    resolvedSearchParams.assignment
  )

  if (!user) {
    redirect('/auth/login')
  }

  if (!hasAccess) {
    return <AccessDeniedMessage />
  }

  // Get manuscript and assignment data
  const { manuscript } = await getManuscriptAndAssignment(
    resolvedParams.id,
    resolvedSearchParams.assignment,
    user.id
  )

  if (!manuscript) {
    notFound()
  }

  // Check if review is already submitted
  if (assignment) {
    const supabase = await createClient()
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id, submitted_at')
      .eq('manuscript_id', resolvedParams.id)
      .eq('reviewer_id', user.id)
      .single()

    if (existingReview && existingReview.submitted_at) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="p-8 max-w-md mx-auto">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Review Already Submitted
              </h2>
              <p className="text-gray-600">
                You have already submitted your review for this manuscript.
              </p>
            </div>
          </Card>
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <ManuscriptInfo 
          manuscript={manuscript} 
          assignment={assignment}
        />

        <Suspense fallback={<LoadingSkeleton />}>
          <ReviewForm 
            manuscriptId={resolvedParams.id}
            assignmentId={assignment?.id}
          />
        </Suspense>
      </div>
    </div>
  )
}