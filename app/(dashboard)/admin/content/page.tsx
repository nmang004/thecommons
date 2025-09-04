import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ContentManagement } from '@/components/admin/content-management'

export const metadata: Metadata = {
  title: 'Content Management - Admin Dashboard',
  description: 'Manage manuscripts, reviews, and editorial workflow.',
}

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()
  
  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }
  
  return { user, profile }
}

async function getAllManuscripts() {
  const supabase = await createClient()
  
  // Get manuscripts
  const { data: manuscripts, error } = await supabase
    .from('manuscripts')
    .select(`
      id,
      title,
      abstract,
      keywords,
      field_of_study,
      subfield,
      author_id,
      corresponding_author_id,
      editor_id,
      status,
      submission_number,
      submitted_at,
      accepted_at,
      published_at,
      doi,
      view_count,
      download_count,
      citation_count,
      created_at,
      updated_at
    `)
    .order('submitted_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
  
  if (error || !manuscripts) {
    console.error('Error fetching manuscripts:', error)
    return []
  }

  // Get all unique user IDs
  const userIds = new Set([
    ...manuscripts.map(m => m.author_id),
    ...manuscripts.map(m => m.editor_id).filter(Boolean),
    ...manuscripts.map(m => m.corresponding_author_id).filter(Boolean)
  ])

  // Fetch user profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, affiliation')
    .in('id', Array.from(userIds))

  const profilesMap = new Map(profiles?.map(p => [p.id, p]) || [])

  // Combine manuscripts with profile data
  const manuscriptsWithProfiles = manuscripts.map(manuscript => ({
    ...manuscript,
    author: profilesMap.get(manuscript.author_id) || { full_name: 'Unknown', email: 'unknown@example.com' },
    editor: manuscript.editor_id ? (profilesMap.get(manuscript.editor_id) || undefined) : undefined,
    corresponding_author: manuscript.corresponding_author_id ? (profilesMap.get(manuscript.corresponding_author_id) || undefined) : undefined
  }))
  
  return manuscriptsWithProfiles as any
}

async function getContentStats() {
  const supabase = await createClient()
  
  const [
    { count: totalManuscripts },
    { count: published },
    { count: underReview },
    { count: pendingReview },
    { count: drafts },
    { count: rejected }
  ] = await Promise.all([
    supabase.from('manuscripts').select('*', { count: 'exact', head: true }),
    supabase.from('manuscripts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('manuscripts').select('*', { count: 'exact', head: true }).eq('status', 'under_review'),
    supabase.from('manuscripts').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
    supabase.from('manuscripts').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('manuscripts').select('*', { count: 'exact', head: true }).eq('status', 'rejected')
  ])
  
  return {
    total: totalManuscripts || 0,
    published: published || 0,
    underReview: underReview || 0,
    pending: pendingReview || 0,
    drafts: drafts || 0,
    rejected: rejected || 0
  }
}

async function getReviewStats() {
  const supabase = await createClient()
  
  const { count: totalReviews } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
  
  const { count: pendingAssignments } = await supabase
    .from('review_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'invited')
  
  return {
    totalReviews: totalReviews || 0,
    pendingAssignments: pendingAssignments || 0
  }
}

export default async function AdminContentPage() {
  await getAuthenticatedUser()
  
  const [manuscripts, contentStats, reviewStats] = await Promise.all([
    getAllManuscripts(),
    getContentStats(),
    getReviewStats()
  ])

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Page Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-4xl font-heading font-bold text-foreground mb-2">
          Content Management
        </h1>
        <p className="text-lg text-muted-foreground">
          Manage manuscripts, reviews, and editorial workflow across The Commons platform
        </p>
      </div>

      {/* Content Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <div className="card-academic p-6 text-center">
          <div className="text-3xl font-heading font-bold text-primary mb-2">
            {contentStats.total.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Total Manuscripts</div>
        </div>
        <div className="card-academic p-6 text-center">
          <div className="text-3xl font-heading font-bold text-green-600 mb-2">
            {contentStats.published.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Published</div>
        </div>
        <div className="card-academic p-6 text-center">
          <div className="text-3xl font-heading font-bold text-blue-600 mb-2">
            {contentStats.underReview.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Under Review</div>
        </div>
        <div className="card-academic p-6 text-center">
          <div className="text-3xl font-heading font-bold text-yellow-600 mb-2">
            {contentStats.pending.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Pending Review</div>
        </div>
        <div className="card-academic p-6 text-center">
          <div className="text-3xl font-heading font-bold text-gray-600 mb-2">
            {contentStats.drafts.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Drafts</div>
        </div>
        <div className="card-academic p-6 text-center">
          <div className="text-3xl font-heading font-bold text-red-600 mb-2">
            {contentStats.rejected.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Rejected</div>
        </div>
      </div>

      {/* Review Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-academic p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-heading font-bold text-foreground mb-1">
                {reviewStats.totalReviews.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Reviews Completed</div>
            </div>
            <div className="text-green-600 text-sm font-medium">
              Review Quality Score: 4.2/5
            </div>
          </div>
        </div>
        <div className="card-academic p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-heading font-bold text-foreground mb-1">
                {reviewStats.pendingAssignments.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Pending Review Assignments</div>
            </div>
            <div className="text-yellow-600 text-sm font-medium">
              Avg Response Time: 3.5 days
            </div>
          </div>
        </div>
      </div>

      {/* Content Management Component */}
      <ContentManagement initialManuscripts={manuscripts} />
    </div>
  )
}