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

    // Verify user is editor or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['editor', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { manuscriptIds, editorId, message } = await request.json()

    if (!manuscriptIds || !Array.isArray(manuscriptIds) || manuscriptIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid manuscript IDs' },
        { status: 400 }
      )
    }

    if (!editorId) {
      return NextResponse.json(
        { error: 'Editor ID is required' },
        { status: 400 }
      )
    }

    // Verify the target editor exists and has editor role
    const { data: targetEditor } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', editorId)
      .single()

    if (!targetEditor || !['editor', 'admin'].includes(targetEditor.role)) {
      return NextResponse.json(
        { error: 'Invalid editor' },
        { status: 400 }
      )
    }

    // Update manuscripts to assign the editor
    const { error: updateError } = await supabase
      .from('manuscripts')
      .update({ 
        editor_id: editorId,
        status: 'with_editor',
        updated_at: new Date().toISOString()
      })
      .in('id', manuscriptIds)

    if (updateError) {
      console.error('Error updating manuscripts:', updateError)
      return NextResponse.json(
        { error: 'Failed to assign editor' },
        { status: 500 }
      )
    }

    // Log the activity for each manuscript
    const activityLogs = manuscriptIds.map(manuscriptId => ({
      manuscript_id: manuscriptId,
      user_id: user.id,
      action: 'editor_assigned',
      details: {
        editor_id: editorId,
        editor_name: targetEditor.full_name,
        assigned_by: user.id,
        message: message || null
      }
    }))

    const { error: logError } = await supabase
      .from('activity_logs')
      .insert(activityLogs)

    if (logError) {
      console.error('Error logging activity:', logError)
      // Don't fail the request for logging errors
    }

    // Create notifications for the assigned editor
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: editorId,
        type: 'manuscript_assignment',
        title: 'New Manuscript Assignment',
        message: `You have been assigned ${manuscriptIds.length} manuscript${manuscriptIds.length > 1 ? 's' : ''} for editorial review.`,
        data: {
          manuscript_ids: manuscriptIds,
          assigned_by: user.id,
          message: message || null
        }
      })

    if (notificationError) {
      console.error('Error creating notification:', notificationError)
      // Don't fail the request for notification errors
    }

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${manuscriptIds.length} manuscripts to ${targetEditor.full_name}`
    })

  } catch (error) {
    console.error('Bulk assign editor error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}