import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const revisionSchema = z.object({
  responseToReviewers: z.string().min(50, 'Response must be at least 50 characters'),
  changesDescription: z.string().min(50, 'Please describe the changes made'),
  coverLetter: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: manuscriptId } = await params
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

    // Verify user owns the manuscript and it's in revision status
    const { data: manuscript, error: manuscriptError } = await supabase
      .from('manuscripts')
      .select('*, profiles!manuscripts_author_id_fkey(full_name, email)')
      .eq('id', manuscriptId)
      .eq('author_id', user.id)
      .single()

    if (manuscriptError || !manuscript) {
      return NextResponse.json(
        { error: 'Manuscript not found or access denied' },
        { status: 404 }
      )
    }

    if (manuscript.status !== 'revisions_requested') {
      return NextResponse.json(
        { error: 'Manuscript is not in revision status' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = revisionSchema.parse(body)

    // Check if revision files were uploaded
    const { data: revisionFiles } = await supabase
      .from('manuscript_files')
      .select('*')
      .eq('manuscript_id', manuscriptId)
      .eq('file_type', 'revision')
      .gte('uploaded_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes

    if (!revisionFiles || revisionFiles.length === 0) {
      return NextResponse.json(
        { error: 'At least one revised manuscript file must be uploaded' },
        { status: 400 }
      )
    }

    // Update manuscript status to submitted (for re-review)
    const { error: updateError } = await supabase
      .from('manuscripts')
      .update({
        status: 'under_review',
        updated_at: new Date().toISOString(),
      })
      .eq('id', manuscriptId)

    if (updateError) {
      console.error('Manuscript update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update manuscript status' },
        { status: 500 }
      )
    }

    // Create revision record in activity logs
    await supabase
      .from('activity_logs')
      .insert({
        manuscript_id: manuscriptId,
        user_id: user.id,
        action: 'revision_submitted',
        details: {
          response_to_reviewers: validatedData.responseToReviewers,
          changes_description: validatedData.changesDescription,
          cover_letter: validatedData.coverLetter,
          files_uploaded: revisionFiles.length,
        },
      })

    // Create notification for user
    await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'revision_submitted',
        title: 'Revision Submitted Successfully',
        message: 'Your revised manuscript has been submitted for re-review.',
        data: {
          manuscript_id: manuscriptId,
        },
      })

    // Send email notification
    try {
      const { EmailService } = await import('@/lib/email/service')
      
      await EmailService.sendStatusUpdate({
        authorEmail: manuscript.profiles.email,
        authorName: manuscript.profiles.full_name,
        manuscriptTitle: manuscript.title,
        submissionNumber: manuscript.submission_number,
        manuscriptId: manuscriptId,
        newStatus: 'under_review',
        statusMessage: 'Your revised manuscript has been submitted and is now under review again. Thank you for addressing the reviewer comments.',
      })
    } catch (emailError) {
      console.error('Email notification error:', emailError)
      // Don't fail the request if email fails
    }

    // Notify editors about the revision
    try {
      // Get editors to notify
      const { data: editors } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('role', 'editor')

      if (editors && editors.length > 0) {
        const { EmailService } = await import('@/lib/email/service')
        
        for (const editor of editors) {
          await EmailService.sendEmail({
            to: editor.email,
            subject: `Revision Submitted: ${manuscript.submission_number}`,
            html: `
              <h2>Revision Submitted</h2>
              <p>Dear ${editor.full_name},</p>
              <p>A revised manuscript has been submitted:</p>
              <ul>
                <li><strong>Title:</strong> ${manuscript.title}</li>
                <li><strong>Submission Number:</strong> ${manuscript.submission_number}</li>
                <li><strong>Author:</strong> ${manuscript.profiles.full_name}</li>
              </ul>
              <p>The manuscript is ready for re-review.</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/editor/manuscripts/${manuscriptId}">Review Manuscript</a></p>
              <p>Best regards,<br>The Commons Editorial System</p>
            `,
          })
        }
      }
    } catch (editorNotificationError) {
      console.error('Editor notification error:', editorNotificationError)
      // Don't fail the request if editor notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Revision submitted successfully',
      manuscript: {
        id: manuscriptId,
        status: 'under_review',
        title: manuscript.title,
      },
    })

  } catch (error) {
    console.error('Revision submission error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid revision data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}