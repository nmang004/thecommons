import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DecisionSendRequest } from '@/types/editorial'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const supabase = await createClient()
    
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

    const decisionId = params.id
    const sendRequest: DecisionSendRequest = await request.json()

    // Fetch the editorial decision with related data
    const { data: decision, error: decisionError } = await supabase
      .from('editorial_decisions')
      .select(`
        id,
        decision,
        decision_letter,
        internal_notes,
        is_draft,
        submitted_at,
        manuscript_id,
        editor_id,
        template_id,
        components,
        actions,
        manuscripts(
          id,
          title,
          author_id,
          status,
          profiles!author_id(full_name, email)
        ),
        editor:profiles!editor_id(full_name, email),
        editorial_templates(name, decision_type)
      `)
      .eq('id', decisionId)
      .single()

    if (decisionError || !decision) {
      return NextResponse.json(
        { error: 'Editorial decision not found' },
        { status: 404 }
      )
    }

    // Verify user has permission to send this decision
    if (profile.role === 'editor' && decision.editor_id !== user.id) {
      return NextResponse.json(
        { error: 'Can only send decisions you created' },
        { status: 403 }
      )
    }

    // Check if decision has already been sent
    if (decision.submitted_at && !sendRequest.sendImmediately) {
      return NextResponse.json(
        { error: 'Decision has already been sent' },
        { status: 400 }
      )
    }

    // Validate recipients
    if (!sendRequest.recipients || sendRequest.recipients.length === 0) {
      return NextResponse.json(
        { error: 'At least one recipient is required' },
        { status: 400 }
      )
    }

    // Default recipient is the manuscript author
    const defaultRecipients = (decision as any).manuscripts?.profiles ? [(decision as any).manuscripts.profiles.email] : []
    const allRecipients = [...new Set([...defaultRecipients, ...sendRequest.recipients])]

    // Validate all recipient emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = allRecipients.filter(email => !emailRegex.test(email))
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email addresses: ${invalidEmails.join(', ')}` },
        { status: 400 }
      )
    }

    // Process template variables in decision letter
    let processedDecisionLetter = decision.decision_letter || ''
    const manuscriptData = decision.manuscripts
    const editorData = decision.editor

    // Replace common template variables
    const variables = {
      '{{author_name}}': (manuscriptData as any)?.profiles?.full_name || 'Author',
      '{{manuscript_title}}': (manuscriptData as any)?.title || 'Your manuscript',
      '{{submission_id}}': (manuscriptData as any)?.id || '',
      '{{editor_name}}': (editorData as any)?.full_name || profile.full_name,
      '{{editor_email}}': (editorData as any)?.email || profile.email,
      '{{decision_date}}': new Date().toLocaleDateString(),
      '{{journal_name}}': 'The Commons Academic Journal'
    }

    Object.entries(variables).forEach(([placeholder, value]) => {
      processedDecisionLetter = processedDecisionLetter.replace(
        new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'),
        String(value)
      )
    })

    // Determine scheduled send time
    const sendTime = sendRequest.scheduledSendTime 
      ? new Date(sendRequest.scheduledSendTime)
      : new Date()

    // Create email record for tracking
    const emailData = {
      decision_id: decisionId,
      manuscript_id: decision.manuscript_id,
      sender_id: user.id,
      recipients: allRecipients,
      cc_recipients: sendRequest.ccRecipients || [],
      subject: `Editorial Decision: ${decision.decision.replace('_', ' ').toUpperCase()} - ${(manuscriptData as any)?.title}`,
      body: processedDecisionLetter,
      scheduled_send_time: sendTime.toISOString(),
      status: sendRequest.sendImmediately ? 'sent' : 'scheduled',
      attachments: sendRequest.attachments || []
    }

    // Insert email record
    const { data: emailRecord, error: emailError } = await supabase
      .from('editorial_emails')
      .insert(emailData)
      .select()
      .single()

    if (emailError) {
      console.error('Error creating email record:', emailError)
      return NextResponse.json(
        { error: 'Failed to schedule email' },
        { status: 500 }
      )
    }

    // Update decision as submitted if sending immediately
    const decisionUpdates: any = {
      is_draft: false
    }

    if (sendRequest.sendImmediately) {
      decisionUpdates.submitted_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('editorial_decisions')
      .update(decisionUpdates)
      .eq('id', decisionId)

    if (updateError) {
      console.error('Error updating decision:', updateError)
      // Continue anyway, the email was scheduled
    }

    // Update manuscript status based on decision
    const manuscriptStatusMap = {
      'accepted': 'accepted',
      'rejected': 'rejected',
      'revisions_requested': 'revisions_requested',
      'major_revision': 'revisions_requested',
      'minor_revision': 'revisions_requested'
    }

    const newStatus = manuscriptStatusMap[decision.decision as keyof typeof manuscriptStatusMap]
    if (newStatus && sendRequest.sendImmediately) {
      await supabase
        .from('manuscripts')
        .update({ 
          status: newStatus,
          ...(newStatus === 'accepted' && { accepted_at: new Date().toISOString() })
        })
        .eq('id', decision.manuscript_id)
    }

    // Create notifications
    const notifications = []

    // Notify author
    if (sendRequest.sendImmediately) {
      notifications.push({
        user_id: (manuscriptData as any)?.author_id,
        type: 'editorial_decision_sent',
        title: `Editorial Decision: ${decision.decision.replace('_', ' ').toUpperCase()}`,
        message: `The editorial decision for "${(manuscriptData as any)?.title}" has been sent to you.`,
        data: {
          manuscript_id: decision.manuscript_id,
          decision_id: decisionId,
          decision: decision.decision,
          email_id: emailRecord.id
        }
      })
    }

    // Notify other editors if CC'd
    if (sendRequest.ccRecipients && sendRequest.ccRecipients.length > 0) {
      const { data: ccProfiles } = await supabase
        .from('profiles')
        .select('id, role')
        .in('email', sendRequest.ccRecipients)
        .eq('role', 'editor')

      ccProfiles?.forEach(ccProfile => {
        notifications.push({
          user_id: ccProfile.id,
          type: 'editorial_decision_cc',
          title: 'Editorial Decision Sent (CC)',
          message: `You were copied on the editorial decision for "${(manuscriptData as any)?.title}"`,
          data: {
            manuscript_id: decision.manuscript_id,
            decision_id: decisionId,
            email_id: emailRecord.id
          }
        })
      })
    }

    if (notifications.length > 0) {
      await supabase
        .from('notifications')
        .insert(notifications)
    }

    // Execute post-decision actions if specified
    if (decision.actions && sendRequest.sendImmediately) {
      const actions = decision.actions as any
      
      if (actions.notifyReviewers) {
        // Notify reviewers about the decision
        const { data: reviewers } = await supabase
          .from('review_assignments')
          .select('reviewer_id, profiles!reviewer_id(email)')
          .eq('manuscript_id', decision.manuscript_id)
          .eq('status', 'completed')

        if (reviewers && reviewers.length > 0) {
          const reviewerNotifications = reviewers.map(reviewer => ({
            user_id: reviewer.reviewer_id,
            type: 'decision_notification',
            title: 'Editorial Decision Made',
            message: `The editorial decision has been made for a manuscript you reviewed: "${(manuscriptData as any)?.title}"`,
            data: {
              manuscript_id: decision.manuscript_id,
              decision: decision.decision
            }
          }))

          await supabase
            .from('notifications')
            .insert(reviewerNotifications)
        }
      }

      // Other actions could be implemented here (DOI generation, production workflow, etc.)
    }

    // Log the activity
    await supabase
      .from('activity_logs')
      .insert({
        manuscript_id: decision.manuscript_id,
        user_id: user.id,
        action: sendRequest.sendImmediately ? 'decision_sent' : 'decision_scheduled',
        details: {
          decision_id: decisionId,
          decision: decision.decision,
          recipients: allRecipients,
          scheduled_send_time: sendTime.toISOString(),
          email_id: emailRecord.id
        }
      })

    // Return success response
    return NextResponse.json({
      success: true,
      message: sendRequest.sendImmediately 
        ? 'Editorial decision sent successfully'
        : 'Editorial decision scheduled successfully',
      email_id: emailRecord.id,
      decision_id: decisionId,
      recipients: allRecipients,
      scheduled_send_time: sendTime.toISOString(),
      status: sendRequest.sendImmediately ? 'sent' : 'scheduled',
      manuscript_status: newStatus || (manuscriptData as any)?.status
    })

  } catch (error) {
    console.error('Send decision API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check decision send status
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const supabase = await createClient()
    
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

    // Get decision send status
    const { data: emailRecords, error } = await supabase
      .from('editorial_emails')
      .select(`
        id,
        recipients,
        cc_recipients,
        subject,
        scheduled_send_time,
        sent_at,
        status,
        delivery_status,
        error_message
      `)
      .eq('decision_id', params.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching decision send status:', error)
      return NextResponse.json(
        { error: 'Failed to fetch send status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      decision_id: params.id,
      emails: emailRecords || [],
      total_emails: emailRecords?.length || 0,
      has_been_sent: emailRecords?.some(email => email.status === 'sent') || false
    })

  } catch (error) {
    console.error('Get decision send status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}