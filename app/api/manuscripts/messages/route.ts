import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
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

    const { 
      manuscript_id, 
      recipient_id, 
      message, 
      message_type = 'general',
      parent_message_id 
    } = await request.json()

    if (!manuscript_id || !recipient_id || !message?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify user has access to this manuscript
    const { data: manuscript } = await supabase
      .from('manuscripts')
      .select('id, author_id, editor_id')
      .eq('id', manuscript_id)
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
      .select('role, full_name')
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

    // Verify recipient exists and has access to manuscript
    const { data: recipient } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', recipient_id)
      .single()

    if (!recipient) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      )
    }

    // Insert message
    const { data: newMessage, error: insertError } = await supabase
      .from('manuscript_messages')
      .insert({
        manuscript_id,
        sender_id: user.id,
        recipient_id,
        message: message.trim(),
        message_type,
        parent_message_id
      })
      .select(`
        id,
        manuscript_id,
        sender_id,
        recipient_id,
        message,
        message_type,
        parent_message_id,
        is_read,
        created_at,
        updated_at
      `)
      .single()

    if (insertError) {
      console.error('Error inserting message:', insertError)
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      )
    }

    // Add sender and recipient details to response
    const messageWithDetails = {
      ...newMessage,
      sender_name: profile?.full_name,
      sender_role: profile?.role,
      recipient_name: recipient.full_name,
      recipient_role: recipient.role
    }

    return NextResponse.json({
      message: messageWithDetails,
      success: true
    })

  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}