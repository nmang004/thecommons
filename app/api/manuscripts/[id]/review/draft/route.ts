import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const params = await context.params
    const supabase = await createClient()

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

    // Get existing draft
    const { data: draft, error: draftError } = await supabase
      .from('review_drafts')
      .select('*')
      .eq('manuscript_id', params.id)
      .eq('reviewer_id', user.id)
      .single()

    if (draftError && draftError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching draft:', draftError)
      return NextResponse.json(
        { error: 'Failed to fetch draft' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      draft: draft || null
    })

  } catch (error) {
    console.error('Error loading review draft:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}