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

    const body = await request.json()
    const { recipientId, manuscriptId, subject, message, messageType = 'general' } = body

    // Validate inputs
    if (!recipientId || !message) {
      return NextResponse.json(
        { error: 'Recipient and message are required' },
        { status: 400 }
      )
    }

    // Get sender profile
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single()

    // Get recipient profile
    const { data: recipientProfile } = await supabase
      .from('profiles')
      .select('full_name, email, role')
      .eq('id', recipientId)
      .single()

    if (!recipientProfile) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      )
    }

    // If manuscript ID is provided, verify access
    let manuscript = null
    if (manuscriptId) {
      const { data: manuscriptData } = await supabase
        .from('manuscripts')
        .select('id, title, author_id, editor_id')
        .eq('id', manuscriptId)
        .single()

      if (!manuscriptData) {
        return NextResponse.json(
          { error: 'Manuscript not found' },
          { status: 404 }
        )
      }

      // Check if user has access to this manuscript
      const hasAccess = 
        manuscriptData.author_id === user.id || 
        manuscriptData.editor_id === user.id ||
        senderProfile?.role === 'admin'

      if (!hasAccess) {
        // Check if user is an assigned reviewer
        const { data: reviewAssignment } = await supabase
          .from('review_assignments')
          .select('id')
          .eq('manuscript_id', manuscriptId)
          .eq('reviewer_id', user.id)
          .single()

        if (!reviewAssignment) {
          return NextResponse.json(
            { error: 'Access denied to this manuscript' },
            { status: 403 }
          )
        }
      }

      manuscript = manuscriptData
    }

    // Create message record (you might want to create a messages table for this)
    // For now, we'll use notifications as the messaging system
    const notificationData = {
      user_id: recipientId,
      type: 'message',
      title: subject || `Message from ${senderProfile?.full_name}`,
      message: message,
      data: {
        sender_id: user.id,
        sender_name: senderProfile?.full_name,
        sender_role: senderProfile?.role,
        manuscript_id: manuscriptId,
        manuscript_title: manuscript?.title,
        message_type: messageType,
        reply_to: user.id
      }
    }

    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single()

    if (notificationError) {
      console.error('Error creating message notification:', notificationError)
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      )
    }

    // Log the activity
    if (manuscriptId) {
      await supabase
        .from('activity_logs')
        .insert({
          manuscript_id: manuscriptId,
          user_id: user.id,
          action: 'message_sent',
          details: {
            recipient_id: recipientId,
            message_type: messageType,
            notification_id: notification.id
          }
        })
    }

    // Optionally send email notification
    // This would be implemented with your email service
    // await sendEmailNotification({
    //   to: recipientProfile.email,
    //   subject: `New message: ${subject}`,
    //   template: 'message_notification',
    //   data: { ... }
    // })

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      notificationId: notification.id
    })

  } catch (error) {
    console.error('Error sending message:', error)
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
    const conversationWith = searchParams.get('conversationWith')

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'message')
      .order('created_at', { ascending: false })

    if (manuscriptId) {
      query = query.eq('data->manuscript_id', manuscriptId)
    }

    if (conversationWith) {
      query = query.eq('data->sender_id', conversationWith)
    }

    const { data: messages, error: messagesError } = await query

    if (messagesError) {
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    return NextResponse.json({ messages })

  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}