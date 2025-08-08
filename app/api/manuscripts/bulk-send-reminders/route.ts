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
      .select('role, full_name, email')
      .eq('id', user.id)
      .single()

    if (!profile || !['editor', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { manuscriptIds, subject, message } = await request.json()

    if (!manuscriptIds || !Array.isArray(manuscriptIds) || manuscriptIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid manuscript IDs' },
        { status: 400 }
      )
    }

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      )
    }

    // Get review assignments for the specified manuscripts that need reminders
    const { data: reviewAssignments, error: fetchError } = await supabase
      .from('review_assignments')
      .select(`
        id,
        manuscript_id,
        reviewer_id,
        due_date,
        status,
        reminder_count,
        manuscripts(title, submission_number),
        profiles!reviewer_id(full_name, email)
      `)
      .in('manuscript_id', manuscriptIds)
      .in('status', ['invited', 'accepted']) // Only send reminders to active reviewers

    if (fetchError) {
      console.error('Error fetching review assignments:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch review assignments' },
        { status: 500 }
      )
    }

    if (!reviewAssignments || reviewAssignments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active reviewers found for the selected manuscripts',
        remindersSent: 0
      })
    }

    let remindersSent = 0
    const errors: string[] = []

    // Process each review assignment
    for (const assignment of reviewAssignments) {
      try {
        // Update reminder count and timestamp
        const { error: updateError } = await supabase
          .from('review_assignments')
          .update({
            reminder_count: (assignment.reminder_count || 0) + 1,
            last_reminder_at: new Date().toISOString()
          })
          .eq('id', assignment.id)

        if (updateError) {
          console.error('Error updating reminder count:', updateError)
          const reviewerName = Array.isArray(assignment.profiles) 
            ? assignment.profiles[0]?.full_name 
            : (assignment.profiles as any)?.full_name || 'Unknown'
          errors.push(`Failed to update reminder for reviewer ${reviewerName}`)
          continue
        }

        // Create notification for the reviewer
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: assignment.reviewer_id,
            type: 'review_reminder',
            title: subject,
            message: message,
            data: {
              manuscript_id: assignment.manuscript_id,
              manuscript_title: Array.isArray(assignment.manuscripts)
                ? assignment.manuscripts[0]?.title
                : (assignment.manuscripts as any)?.title || 'Unknown',
              submission_number: Array.isArray(assignment.manuscripts)
                ? assignment.manuscripts[0]?.submission_number
                : (assignment.manuscripts as any)?.submission_number || '',
              due_date: assignment.due_date,
              reminder_count: (assignment.reminder_count || 0) + 1,
              sent_by: user.id,
              sent_by_name: profile.full_name
            }
          })

        if (notificationError) {
          console.error('Error creating notification:', notificationError)
          const reviewerName = Array.isArray(assignment.profiles) 
            ? assignment.profiles[0]?.full_name 
            : (assignment.profiles as any)?.full_name || 'Unknown'
          errors.push(`Failed to send notification to ${reviewerName}`)
          continue
        }

        // Log the activity
        const { error: logError } = await supabase
          .from('activity_logs')
          .insert({
            manuscript_id: assignment.manuscript_id,
            user_id: user.id,
            action: 'reminder_sent',
            details: {
              reviewer_id: assignment.reviewer_id,
              reviewer_name: Array.isArray(assignment.profiles) 
                ? assignment.profiles[0]?.full_name 
                : (assignment.profiles as any)?.full_name || 'Unknown',
              reviewer_email: Array.isArray(assignment.profiles) 
                ? assignment.profiles[0]?.email 
                : (assignment.profiles as any)?.email || '',
              subject: subject,
              message: message,
              reminder_count: (assignment.reminder_count || 0) + 1,
              due_date: assignment.due_date
            }
          })

        if (logError) {
          console.error('Error logging reminder activity:', logError)
          // Don't fail for logging errors
        }

        // In a real implementation, you would also send an email here
        // using your email service (like Resend, SendGrid, etc.)
        /*
        await sendEmail({
          to: Array.isArray(assignment.profiles) 
            ? assignment.profiles[0]?.email 
            : (assignment.profiles as any)?.email || '',
          subject: subject,
          html: generateReminderEmailTemplate({
            reviewerName: Array.isArray(assignment.profiles) 
              ? assignment.profiles[0]?.full_name 
              : (assignment.profiles as any)?.full_name || 'Unknown',
            manuscriptTitle: Array.isArray(assignment.manuscripts)
              ? assignment.manuscripts[0]?.title
              : (assignment.manuscripts as any)?.title || 'Unknown',
            dueDate: assignment.due_date,
            message: message,
            reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reviewer/review/${assignment.id}`
          })
        })
        */

        remindersSent++
      } catch (error) {
        console.error('Error processing reminder for assignment:', assignment.id, error)
        const reviewerName = Array.isArray(assignment.profiles) 
          ? assignment.profiles[0]?.full_name 
          : (assignment.profiles as any)?.full_name || 'Unknown'
        errors.push(`Failed to process reminder for reviewer ${reviewerName}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully sent ${remindersSent} reminder${remindersSent !== 1 ? 's' : ''}`,
      remindersSent,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Bulk send reminders error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}