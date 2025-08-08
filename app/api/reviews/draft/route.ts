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
    const { 
      manuscriptId, 
      assignmentId, 
      formData, 
      timeSpent 
    } = body

    if (!manuscriptId || !formData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify reviewer has access
    if (assignmentId) {
      const { data: assignment, error: assignmentError } = await supabase
        .from('review_assignments')
        .select('id')
        .eq('id', assignmentId)
        .eq('reviewer_id', user.id)
        .eq('status', 'accepted')
        .single()

      if (assignmentError || !assignment) {
        return NextResponse.json(
          { error: 'Review assignment not found or not accessible' },
          { status: 403 }
        )
      }
    }

    // Check if draft already exists
    const { data: existingDraft } = await supabase
      .from('review_drafts')
      .select('id')
      .eq('manuscript_id', manuscriptId)
      .eq('reviewer_id', user.id)
      .single()

    const draftData = {
      manuscript_id: manuscriptId,
      reviewer_id: user.id,
      assignment_id: assignmentId || null,
      form_data: formData,
      time_spent_minutes: Math.max(0, timeSpent || 0),
      last_saved_at: new Date().toISOString()
    }

    let result
    if (existingDraft) {
      // Update existing draft
      result = await supabase
        .from('review_drafts')
        .update(draftData)
        .eq('id', existingDraft.id)
        .select()
        .single()
    } else {
      // Create new draft
      result = await supabase
        .from('review_drafts')
        .insert(draftData)
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error saving review draft:', result.error)
      return NextResponse.json(
        { error: 'Failed to save draft' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Draft saved successfully',
      draft: result.data
    })

  } catch (error) {
    console.error('Error in draft save:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}