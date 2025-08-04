import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export async function GET(_request: NextRequest, { params }: PageProps) {
  try {
    const { id: manuscriptId } = await params
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

    // Verify user has access to this manuscript
    const { data: manuscript } = await supabase
      .from('manuscripts')
      .select('id, author_id, editor_id')
      .eq('id', manuscriptId)
      .single()

    if (!manuscript) {
      return NextResponse.json(
        { error: 'Manuscript not found' },
        { status: 404 }
      )
    }

    // Check if user has access (author, editor, or admin)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const hasAccess = 
      manuscript.author_id === user.id ||
      manuscript.editor_id === user.id ||
      profile?.role === 'admin'

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get messages using the database function
    const { data: messages, error } = await supabase
      .rpc('get_message_thread', { thread_manuscript_id: manuscriptId })

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      messages: messages || []
    })

  } catch (error) {
    console.error('Messages API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}