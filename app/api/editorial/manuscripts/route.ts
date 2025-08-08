import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ManuscriptQueueRequest } from '@/types/editorial'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is editor or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, id, full_name')
      .eq('id', user.id)
      .single()

    if (!profile || !['editor', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    
    // Parse query parameters with type safety
    const queryParams: ManuscriptQueueRequest = {
      view: (searchParams.get('view') as any) || 'all',
      status: searchParams.getAll('status'),
      field: searchParams.getAll('field'),
      editor: searchParams.get('editor') || undefined,
      priority: (searchParams.get('priority') as any) || undefined,
      search: searchParams.get('search') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      sortBy: searchParams.get('sortBy') || 'submitted_at',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50')
    }

    // Build the base query with editorial assignments
    let query = supabase
      .from('manuscripts')
      .select(`
        id,
        title,
        abstract,
        field_of_study,
        subfield,
        status,
        submitted_at,
        created_at,
        updated_at,
        editor_id,
        submission_number,
        keywords,
        priority,
        profiles!author_id(full_name, affiliation, email),
        editor:profiles!editor_id(full_name, email),
        manuscript_coauthors(name, email, is_corresponding),
        editorial_assignments(
          id,
          status,
          priority,
          workload_score,
          assigned_at,
          notes
        ),
        review_assignments(
          id,
          status,
          due_date,
          profiles!reviewer_id(full_name)
        )
      `, { count: 'exact' })

    // Apply view-specific filters
    switch (queryParams.view) {
      case 'new_submissions':
        query = query.is('editor_id', null).eq('status', 'submitted')
        break
      case 'my_manuscripts':
        query = query.eq('editor_id', user.id)
        break
      case 'in_review':
        query = query.eq('status', 'under_review')
        break
      case 'awaiting_decision':
        query = query.eq('status', 'with_editor')
        break
      case 'revisions':
        query = query.eq('status', 'revisions_requested')
        break
      default:
        // For 'all' view, show manuscripts visible to this editor
        if (profile.role === 'admin') {
          query = query.neq('status', 'draft')
        } else {
          query = query
            .or(`editor_id.eq.${user.id},editor_id.is.null`)
            .neq('status', 'draft')
        }
    }

    // Apply additional filters
    if (queryParams.status && queryParams.status.length > 0) {
      query = query.in('status', queryParams.status)
    }

    if (queryParams.field && queryParams.field.length > 0) {
      query = query.in('field_of_study', queryParams.field)
    }

    if (queryParams.editor) {
      query = query.eq('editor_id', queryParams.editor)
    }

    if (queryParams.priority) {
      query = query.eq('priority', queryParams.priority)
    }

    if (queryParams.search && queryParams.search.trim()) {
      const searchTerm = queryParams.search.trim()
      query = query.or(`title.ilike.%${searchTerm}%,abstract.ilike.%${searchTerm}%`)
    }

    if (queryParams.dateFrom) {
      query = query.gte('submitted_at', queryParams.dateFrom)
    }

    if (queryParams.dateTo) {
      query = query.lte('submitted_at', queryParams.dateTo)
    }

    // Apply sorting
    const ascending = queryParams.sortOrder === 'asc'
    switch (queryParams.sortBy) {
      case 'title':
        query = query.order('title', { ascending })
        break
      case 'status':
        query = query.order('status', { ascending })
        break
      case 'field':
        query = query.order('field_of_study', { ascending })
        break
      case 'priority':
        query = query.order('priority', { ascending })
        break
      default:
        query = query.order('submitted_at', { ascending, nullsFirst: false })
    }

    // Apply pagination
    const from = (queryParams.page - 1) * queryParams.limit
    const to = from + queryParams.limit - 1
    query = query.range(from, to)

    const { data: manuscripts, error, count } = await query

    if (error) {
      console.error('Error fetching manuscripts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch manuscripts' },
        { status: 500 }
      )
    }

    // Add urgency indicators and editorial metrics
    const manuscriptsWithMetrics = manuscripts?.map(manuscript => {
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

      // Calculate editorial metrics
      const assignment = manuscript.editorial_assignments?.[0]
      const reviewCount = manuscript.review_assignments?.length || 0
      const activeReviews = manuscript.review_assignments?.filter(r => 
        ['invited', 'accepted', 'in_progress'].includes(r.status)
      ).length || 0

      return {
        ...manuscript,
        urgency,
        editorial_metrics: {
          assignment_status: assignment?.status || 'unassigned',
          workload_score: assignment?.workload_score || 1,
          days_since_assignment: assignment ? Math.floor(
            (new Date().getTime() - new Date(assignment.assigned_at).getTime()) / (1000 * 60 * 60 * 24)
          ) : null,
          review_count: reviewCount,
          active_reviews: activeReviews
        }
      }
    }) || []

    // Get enhanced summary statistics
    const { data: stats } = await supabase
      .from('manuscripts')
      .select(`
        status, 
        editor_id,
        editorial_assignments(status, priority)
      `)
      .or(profile.role === 'admin' ? 
        'status.neq.draft' : 
        `editor_id.eq.${user.id},editor_id.is.null`
      )
      .neq('status', 'draft')

    const summary = {
      total: count || 0,
      newSubmissions: stats?.filter(s => !s.editor_id && s.status === 'submitted').length || 0,
      myManuscripts: stats?.filter(s => s.editor_id === user.id).length || 0,
      inReview: stats?.filter(s => s.status === 'under_review').length || 0,
      awaitingDecision: stats?.filter(s => s.status === 'with_editor').length || 0,
      revisions: stats?.filter(s => s.status === 'revisions_requested').length || 0,
      highPriority: stats?.filter(s => 
        s.editorial_assignments?.[0]?.priority === 'high'
      ).length || 0,
      urgent: stats?.filter(s => 
        s.editorial_assignments?.[0]?.priority === 'urgent'
      ).length || 0
    }

    // Get editor workload if applicable
    let workloadInfo = null
    if (profile.role === 'editor') {
      const { data: workload } = await supabase
        .from('editorial_workload')
        .select('*')
        .eq('editor_id', user.id)
        .single()

      if (workload) {
        workloadInfo = {
          active_manuscripts: workload.active_manuscripts,
          capacity_limit: workload.capacity_limit,
          current_workload_score: workload.current_workload_score,
          availability_status: workload.availability_status,
          capacity_percentage: Math.round(
            (workload.current_workload_score / workload.capacity_limit) * 100
          )
        }
      }
    }

    return NextResponse.json({
      manuscripts: manuscriptsWithMetrics,
      pagination: {
        page: queryParams.page,
        limit: queryParams.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / queryParams.limit)
      },
      summary,
      workload: workloadInfo,
      filters: queryParams
    })

  } catch (error) {
    console.error('Editorial manuscripts API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}