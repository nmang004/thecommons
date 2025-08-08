import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const assignmentSchema = z.object({
  editorId: z.string().uuid('Valid editor ID required'),
})

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const { id: manuscriptId } = params
    const supabase = await createClient()
    
    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify user has admin or editor role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'editor'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { editorId } = assignmentSchema.parse(body)

    // Verify editor exists and has editor role
    const { data: editor, error: editorError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', editorId)
      .eq('role', 'editor')
      .single()

    if (editorError || !editor) {
      return NextResponse.json(
        { error: 'Editor not found' },
        { status: 404 }
      )
    }

    // Get manuscript details
    const { data: manuscript, error: manuscriptError } = await supabase
      .from('manuscripts')
      .select(`
        *,
        profiles!manuscripts_author_id_fkey(full_name, email)
      `)
      .eq('id', manuscriptId)
      .single()

    if (manuscriptError || !manuscript) {
      return NextResponse.json(
        { error: 'Manuscript not found' },
        { status: 404 }
      )
    }

    // Update manuscript with editor assignment
    const { error: updateError } = await supabase
      .from('manuscripts')
      .update({
        editor_id: editorId,
        status: 'with_editor',
        updated_at: new Date().toISOString(),
      })
      .eq('id', manuscriptId)

    if (updateError) {
      console.error('Manuscript assignment error:', updateError)
      return NextResponse.json(
        { error: 'Failed to assign editor' },
        { status: 500 }
      )
    }

    // Log the assignment
    await supabase
      .from('activity_logs')
      .insert({
        manuscript_id: manuscriptId,
        user_id: user.id,
        action: 'editor_assigned',
        details: {
          editor_id: editorId,
          editor_name: editor.full_name,
        },
      })

    // Send email notifications
    try {
      const { EmailService } = await import('@/lib/email/service')
      
      // Notify the assigned editor
      await EmailService.sendEditorAssignment({
        editorEmail: editor.email,
        editorName: editor.full_name,
        manuscriptTitle: manuscript.title,
        submissionNumber: manuscript.submission_number,
        manuscriptId: manuscriptId,
        authorName: manuscript.profiles.full_name,
      })

      // Notify the author
      await EmailService.sendStatusUpdate({
        authorEmail: manuscript.profiles.email,
        authorName: manuscript.profiles.full_name,
        manuscriptTitle: manuscript.title,
        submissionNumber: manuscript.submission_number,
        manuscriptId: manuscriptId,
        newStatus: 'with_editor',
        statusMessage: `Your manuscript has been assigned to ${editor.full_name} for editorial review. The editor will evaluate your submission and may send it for peer review.`,
        editorName: editor.full_name,
      })
    } catch (emailError) {
      console.error('Email notification error:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Editor assigned successfully',
      editor: {
        id: editor.id,
        name: editor.full_name,
        email: editor.email,
      },
    })

  } catch (error) {
    console.error('Editor assignment error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid assignment data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}