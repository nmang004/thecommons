import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    
    // Parse query parameters
    const view = searchParams.get('view') || 'all'
    const status = searchParams.getAll('status')
    const field = searchParams.getAll('field')
    const editor = searchParams.get('editor')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const sortBy = searchParams.get('sortBy') || 'submitted_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build the base query
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
        review_assignments(
          id,
          status,
          due_date,
          profiles!reviewer_id(full_name)
        )
      `, { count: 'exact' })

    // Apply view-specific filters
    switch (view) {
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
          // Admins can see all manuscripts
          query = query.neq('status', 'draft')
        } else {
          // Regular editors see assigned manuscripts and unassigned submissions
          query = query
            .or(`editor_id.eq.${user.id},editor_id.is.null`)
            .neq('status', 'draft')
        }
    }

    // Apply additional filters
    if (status.length > 0) {
      query = query.in('status', status)
    }

    if (field.length > 0) {
      query = query.in('field_of_study', field)
    }

    if (editor) {
      query = query.eq('editor_id', editor)
    }

    if (search && search.trim()) {
      // Use full-text search on title and abstract
      const searchTerm = search.trim()
      query = query.or(`title.ilike.%${searchTerm}%,abstract.ilike.%${searchTerm}%`)
    }

    if (dateFrom) {
      query = query.gte('submitted_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('submitted_at', dateTo)
    }

    // Apply sorting
    const ascending = sortOrder === 'asc'
    switch (sortBy) {
      case 'title':
        query = query.order('title', { ascending })
        break
      case 'status':
        query = query.order('status', { ascending })
        break
      case 'field':
        query = query.order('field_of_study', { ascending })
        break
      default:
        query = query.order('submitted_at', { ascending, nullsFirst: false })
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: manuscripts, error, count } = await query

    if (error) {
      console.error('Error fetching manuscripts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch manuscripts' },
        { status: 500 }
      )
    }

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

    // Get summary statistics
    const { data: stats } = await supabase
      .from('manuscripts')
      .select('status, editor_id')
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
      revisions: stats?.filter(s => s.status === 'revisions_requested').length || 0
    }

    return NextResponse.json({
      manuscripts: manuscriptsWithUrgency,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      summary,
      filters: {
        view,
        status,
        field,
        editor,
        priority,
        search,
        dateFrom,
        dateTo,
        sortBy,
        sortOrder
      }
    })

  } catch (error) {
    console.error('Queue API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}