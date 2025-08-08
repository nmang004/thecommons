import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const params = await context.params
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignment')

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get manuscript details
    const { data: manuscript, error: manuscriptError } = await supabase
      .from('manuscripts')
      .select(`
        id,
        title,
        abstract,
        keywords,
        field_of_study,
        authors:manuscript_coauthors(name, email, affiliation)
      `)
      .eq('id', params.id)
      .single()

    if (manuscriptError || !manuscript) {
      return NextResponse.json(
        { error: 'Manuscript not found' },
        { status: 404 }
      )
    }

    // Verify reviewer has access (either through assignment or direct access)
    let assignment = null
    if (assignmentId) {
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('review_assignments')
        .select('*')
        .eq('id', assignmentId)
        .eq('reviewer_id', user.id)
        .eq('status', 'accepted')
        .single()

      if (assignmentError || !assignmentData) {
        return NextResponse.json(
          { error: 'Review assignment not found or not accessible' },
          { status: 403 }
        )
      }
      assignment = assignmentData
    } else {
      // Check if user has any assignment for this manuscript
      const { data: assignmentData } = await supabase
        .from('review_assignments')
        .select('*')
        .eq('manuscript_id', params.id)
        .eq('reviewer_id', user.id)
        .eq('status', 'accepted')
        .single()

      if (assignmentData) {
        assignment = assignmentData
      }
    }

    // Check if user is reviewer or has other access
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const hasAccess = assignment || 
      profile?.role === 'admin' || 
      profile?.role === 'editor'

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check for existing review
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id, form_data, template_id, submitted_at')
      .eq('manuscript_id', params.id)
      .eq('reviewer_id', user.id)
      .single()

    if (existingReview && existingReview.submitted_at) {
      return NextResponse.json(
        { error: 'Review already submitted' },
        { status: 400 }
      )
    }

    // Get appropriate template based on field of study
    let template = null
    const { data: templates } = await supabase
      .from('review_templates')
      .select('*')
      .or(`field_of_study.eq.${manuscript.field_of_study},field_of_study.eq.General`)
      .eq('is_public', true)
      .eq('is_active', true)
      .order('usage_count', { ascending: false })
      .limit(1)

    if (templates && templates.length > 0) {
      template = templates[0]
    }

    return NextResponse.json({
      success: true,
      manuscript: {
        id: manuscript.id,
        title: manuscript.title,
        abstract: manuscript.abstract,
        keywords: manuscript.keywords,
        authors: manuscript.authors?.map((author: any) => author.name).join(', '),
        fieldOfStudy: manuscript.field_of_study
      },
      assignment: assignment ? {
        id: assignment.id,
        dueDate: assignment.due_date,
        status: assignment.status
      } : null,
      template,
      reviewerId: user.id,
      existingReview: existingReview?.form_data || null
    })

  } catch (error) {
    console.error('Error loading review form:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}