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
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (!profile || !['editor', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { manuscriptIds, priority, reason } = await request.json()

    if (!manuscriptIds || !Array.isArray(manuscriptIds) || manuscriptIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid manuscript IDs' },
        { status: 400 }
      )
    }

    if (!priority || !['low', 'medium', 'high'].includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority level' },
        { status: 400 }
      )
    }

    // Note: Since we don't have a priority column in the current schema,
    // we'll store this information in the activity logs and potentially
    // create a separate table for manuscript metadata or extend the schema
    
    // For now, let's log the priority setting as activities
    const activityLogs = manuscriptIds.map(manuscriptId => ({
      manuscript_id: manuscriptId,
      user_id: user.id,
      action: 'priority_set',
      details: {
        priority: priority,
        reason: reason || null,
        set_by: user.id,
        set_by_name: profile.full_name
      }
    }))

    const { error: logError } = await supabase
      .from('activity_logs')
      .insert(activityLogs)

    if (logError) {
      console.error('Error logging priority setting:', logError)
      return NextResponse.json(
        { error: 'Failed to set priority' },
        { status: 500 }
      )
    }

    // For a complete implementation, we would want to:
    // 1. Add a priority column to the manuscripts table
    // 2. Update the manuscripts with the priority
    // 3. Create notifications for relevant stakeholders

    /* 
    Future implementation would include:
    
    const { error: updateError } = await supabase
      .from('manuscripts')
      .update({ 
        priority: priority,
        updated_at: new Date().toISOString()
      })
      .in('id', manuscriptIds)
    */

    return NextResponse.json({
      success: true,
      message: `Successfully set ${priority} priority for ${manuscriptIds.length} manuscripts`
    })

  } catch (error) {
    console.error('Bulk set priority error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}