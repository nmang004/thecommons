import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
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

    // Verify user is an editor
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'editor' && profile.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { manuscriptId, decision, decisionLetter, internalNotes } = body

    // Verify manuscript exists and editor has access
    const { data: manuscript, error: manuscriptError } = await supabase
      .from('manuscripts')
      .select('id, title, author_id, editor_id, status')
      .eq('id', manuscriptId)
      .single()

    if (manuscriptError || !manuscript) {
      return NextResponse.json(
        { error: 'Manuscript not found' },
        { status: 404 }
      )
    }

    // For now, allow any editor to make decisions
    // In production, you might want to restrict to assigned editor
    // if (manuscript.editor_id && manuscript.editor_id !== user.id) {
    //   return NextResponse.json(
    //     { error: 'Not authorized to make decisions on this manuscript' },
    //     { status: 403 }
    //   )
    // }

    // Validate decision
    const validDecisions = ['accepted', 'revisions_requested', 'rejected']
    if (!validDecisions.includes(decision)) {
      return NextResponse.json(
        { error: 'Invalid decision' },
        { status: 400 }
      )
    }

    // Create editorial decision record
    const { data: editorialDecision, error: decisionError } = await supabase
      .from('editorial_decisions')
      .insert({
        manuscript_id: manuscriptId,
        editor_id: user.id,
        decision: decision,
        decision_letter: decisionLetter,
        internal_notes: internalNotes || null
      })
      .select()
      .single()

    if (decisionError) {
      console.error('Error creating editorial decision:', decisionError)
      return NextResponse.json(
        { error: 'Failed to save decision' },
        { status: 500 }
      )
    }

    // Update manuscript status
    const { error: updateError } = await supabase
      .from('manuscripts')
      .update({
        status: decision,
        editor_id: user.id, // Ensure editor is assigned
        ...(decision === 'accepted' && { accepted_at: new Date().toISOString() })
      })
      .eq('id', manuscriptId)

    if (updateError) {
      console.error('Error updating manuscript status:', updateError)
      // Continue anyway, the decision was saved
    }

    // Create notification for author
    await supabase
      .from('notifications')
      .insert({
        user_id: manuscript.author_id,
        type: 'editorial_decision',
        title: `Editorial Decision: ${decision.replace('_', ' ').toUpperCase()}`,
        message: `Your manuscript "${manuscript.title}" has received an editorial decision.`,
        data: {
          manuscript_id: manuscriptId,
          decision: decision,
          decision_id: editorialDecision.id
        }
      })

    // Log the activity
    await supabase
      .from('activity_logs')
      .insert({
        manuscript_id: manuscriptId,
        user_id: user.id,
        action: 'editorial_decision',
        details: {
          decision: decision,
          decision_id: editorialDecision.id
        }
      })

    // If revisions requested, we might want to update review assignments status
    if (decision === 'revisions_requested') {
      await supabase
        .from('review_assignments')
        .update({ status: 'completed' })
        .eq('manuscript_id', manuscriptId)
        .in('status', ['accepted', 'invited'])
    }

    return NextResponse.json({
      success: true,
      message: 'Editorial decision submitted successfully',
      decisionId: editorialDecision.id,
      decision: decision
    })

  } catch (error) {
    console.error('Error in editorial decision:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
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

    const { searchParams } = new URL(request.url)
    const manuscriptId = searchParams.get('manuscriptId')

    if (!manuscriptId) {
      return NextResponse.json(
        { error: 'Manuscript ID required' },
        { status: 400 }
      )
    }

    // Get editorial decisions for manuscript
    const { data: decisions, error: decisionsError } = await supabase
      .from('editorial_decisions')
      .select(`
        *,
        profiles!editor_id(full_name)
      `)
      .eq('manuscript_id', manuscriptId)
      .order('created_at', { ascending: false })

    if (decisionsError) {
      return NextResponse.json(
        { error: 'Failed to fetch decisions' },
        { status: 500 }
      )
    }

    return NextResponse.json({ decisions })

  } catch (error) {
    console.error('Error fetching editorial decisions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}