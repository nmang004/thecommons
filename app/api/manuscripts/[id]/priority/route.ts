import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, { params }: PageProps) {
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

    const { priority } = await request.json()

    if (!priority || !['low', 'normal', 'high', 'urgent'].includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority. Must be one of: low, normal, high, urgent' },
        { status: 400 }
      )
    }

    // Use the database function to update priority
    const { error } = await supabase
      .rpc('update_manuscript_priority', { 
        manuscript_id: manuscriptId, 
        new_priority: priority 
      })

    if (error) {
      console.error('Error updating priority:', error)
      return NextResponse.json(
        { error: 'Failed to update priority' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      priority,
      message: 'Priority updated successfully'
    })

  } catch (error) {
    console.error('Update priority error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}