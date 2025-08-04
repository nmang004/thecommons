import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ConflictDetectionService } from '@/lib/services/conflict-detection-service'
import type { ConflictEvidence } from '@/types/database'

interface BulkInvitationRequest {
  manuscript_id: string
  reviewer_ids: string[]
  due_date: string
  message?: string
  template_id?: string
  staggered?: boolean
  stagger_hours?: number
  override_conflicts?: { [reviewer_id: string]: string } // reviewer_id -> override reason
}

interface InvitationResult {
  reviewer_id: string
  success: boolean
  assignment_id?: string
  error?: string
  conflicts?: ConflictEvidence[]
  scheduled_for?: string
}

export async function POST(_request: NextRequest) {
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

    const body: BulkInvitationRequest = await request.json()
    const {
      manuscript_id,
      reviewer_ids,
      due_date,
      message,
      template_id,
      staggered = false,
      stagger_hours = 24,
      override_conflicts = {}
    } = body

    // Validate required fields
    if (!manuscript_id || !reviewer_ids?.length || !due_date) {
      return NextResponse.json(
        { error: 'Missing required fields: manuscript_id, reviewer_ids, due_date' },
        { status: 400 }
      )
    }

    // Verify manuscript exists and editor has access
    const { data: manuscript, error: manuscriptError } = await supabase
      .from('manuscripts')
      .select('id, title, abstract, field_of_study, editor_id, author_id')
      .eq('id', manuscript_id)
      .single()

    if (manuscriptError || !manuscript) {
      return NextResponse.json(
        { error: 'Manuscript not found' },
        { status: 404 }
      )
    }

    // Run COI checks for all reviewers
    const conflictService = new ConflictDetectionService()
    const coiResults = await conflictService.checkMultipleReviewers(reviewer_ids, manuscript_id)
    
    const results: InvitationResult[] = []
    let successCount = 0
    let blockedCount = 0
    
    // Process each reviewer
    for (let i = 0; i < reviewer_ids.length; i++) {
      const reviewerId = reviewer_ids[i]
      const coiResult = coiResults.find(r => r.reviewer_id === reviewerId)
      
      try {
        // Check if reviewer is already assigned
        const { data: existingAssignment } = await supabase
          .from('review_assignments')
          .select('id, status')
          .eq('manuscript_id', manuscript_id)
          .eq('reviewer_id', reviewerId)
          .single()

        if (existingAssignment) {
          results.push({
            reviewer_id: reviewerId,
            success: false,
            error: `Already assigned (status: ${existingAssignment.status})`
          })
          continue
        }

        // Handle COI conflicts
        if (coiResult && !coiResult.is_eligible) {
          const overrideReason = override_conflicts[reviewerId]
          
          if (!overrideReason) {
            results.push({
              reviewer_id: reviewerId,
              success: false,
              error: 'Blocked by conflict of interest',
              conflicts: coiResult.conflicts
            })
            blockedCount++
            continue
          }
        }

        // Calculate invitation timing for staggered invitations
        const scheduledFor = staggered 
          ? new Date(Date.now() + (i * stagger_hours * 60 * 60 * 1000))
          : new Date()

        // Create review assignment
        const { data: assignment, error: assignmentError } = await supabase
          .from('review_assignments')
          .insert({
            manuscript_id: manuscript_id,
            reviewer_id: reviewerId,
            assigned_by: user.id,
            due_date: due_date,
            status: 'invited',
            coi_checked_at: new Date().toISOString(),
            coi_flags: coiResult?.conflicts || null,
            coi_override_reason: override_conflicts[reviewerId] || null,
            coi_approved_by: override_conflicts[reviewerId] ? user.id : null
          })
          .select()
          .single()

        if (assignmentError) {
          results.push({
            reviewer_id: reviewerId,
            success: false,
            error: `Assignment failed: ${assignmentError.message}`
          })
          continue
        }

        // Create notification
        await supabase
          .from('notifications')
          .insert({
            user_id: reviewerId,
            type: 'review_invitation',
            title: 'New Review Invitation',
            message: `You have been invited to review: ${manuscript.title}`,
            data: {
              manuscript_id: manuscript_id,
              assignment_id: assignment.id,
              due_date: due_date,
              custom_message: message,
              template_id: template_id
            }
          })

        // Log activity
        await supabase
          .from('activity_logs')
          .insert({
            manuscript_id: manuscript_id,
            user_id: user.id,
            action: 'bulk_reviewer_invitation',
            details: {
              reviewer_id: reviewerId,
              assignment_id: assignment.id,
              due_date: due_date,
              staggered: staggered,
              scheduled_for: scheduledFor.toISOString(),
              coi_override: !!override_conflicts[reviewerId],
              template_id: template_id
            }
          })

        results.push({
          reviewer_id: reviewerId,
          success: true,
          assignment_id: assignment.id,
          scheduled_for: scheduledFor.toISOString()
        })
        
        successCount++

      } catch (error) {
        console.error(`Error processing reviewer ${reviewerId}:`, error)
        results.push({
          reviewer_id: reviewerId,
          success: false,
          error: 'Internal processing error'
        })
      }
    }

    // Update manuscript status if any reviewers were successfully assigned
    if (successCount > 0) {
      await supabase
        .from('manuscripts')
        .update({ 
          status: 'under_review',
          editor_id: manuscript.editor_id || user.id
        })
        .eq('id', manuscript_id)

      // Log the overall bulk invitation
      await supabase
        .from('activity_logs')
        .insert({
          manuscript_id: manuscript_id,
          user_id: user.id,
          action: 'bulk_invitation_completed',
          details: {
            total_invitations: reviewer_ids.length,
            successful_invitations: successCount,
            blocked_by_coi: blockedCount,
            staggered: staggered,
            template_id: template_id
          }
        })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully invited ${successCount} of ${reviewer_ids.length} reviewers`,
      results: results,
      summary: {
        total: reviewer_ids.length,
        successful: successCount,
        failed: reviewer_ids.length - successCount,
        blocked_by_coi: blockedCount
      }
    })

  } catch (error) {
    console.error('Bulk invitation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve invitation templates
export async function GET(_request: NextRequest) {
  try {
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

    // Get invitation templates (this would be from a templates table if implemented)
    const defaultTemplates = [
      {
        id: 'standard',
        name: 'Standard Review Request',
        subject: 'Invitation to Review Manuscript: {{manuscript_title}}',
        body: `Dear {{reviewer_name}},

I hope this message finds you well. I am writing to invite you to serve as a reviewer for a manuscript submitted to our journal.

**Manuscript Details:**
- Title: {{manuscript_title}}
- Field: {{field_of_study}}
- Abstract: {{abstract_preview}}

**Review Timeline:**
- Due Date: {{due_date}}
- Expected Time Commitment: 2-4 hours

Your expertise in {{reviewer_expertise}} makes you an ideal candidate to evaluate this work. The review process is double-blind, and your identity will remain confidential to the authors.

Please confirm your availability by {{response_deadline}}. You can accept or decline this invitation through your reviewer dashboard.

Thank you for considering this request and for your continued contribution to scholarly publishing.

Best regards,
{{editor_name}}
{{journal_name}}`
      },
      {
        id: 'urgent',
        name: 'Urgent Review Request',
        subject: 'URGENT: Review Invitation - {{manuscript_title}}',
        body: `Dear {{reviewer_name}},

I hope you are well. I am reaching out with an urgent request for your expertise as a reviewer.

**Manuscript Details:**
- Title: {{manuscript_title}}
- Field: {{field_of_study}}
- **Due Date: {{due_date}}** (expedited timeline)

Due to the time-sensitive nature of this manuscript and its potential impact in {{field_of_study}}, we are working with an accelerated review timeline.

Your specialized knowledge in {{reviewer_expertise}} is particularly valuable for this evaluation. If you are available to complete this review by the due date, please confirm as soon as possible.

If you cannot accommodate this timeline, please let us know immediately so we can arrange alternative reviewers.

Thank you for your understanding and support.

Best regards,
{{editor_name}}
{{journal_name}}`
      },
      {
        id: 'resubmission',
        name: 'Resubmission Review Request',
        subject: 'Review Invitation: Revised Manuscript - {{manuscript_title}}',
        body: `Dear {{reviewer_name}},

Thank you for your previous review of this manuscript. The authors have now submitted a revised version addressing the reviewers' comments.

**Manuscript Details:**
- Title: {{manuscript_title}}
- Field: {{field_of_study}}
- Revision Round: {{revision_round}}
- Due Date: {{due_date}}

As you are already familiar with this work, your continued involvement in the review process would be invaluable. Please review the authors' response letter and the revised manuscript to assess whether your previous concerns have been adequately addressed.

The authors have provided a detailed response to your comments, which you can access through your reviewer dashboard.

Please confirm your availability for this follow-up review.

Thank you for your ongoing contribution to the peer review process.

Best regards,
{{editor_name}}
{{journal_name}}`
      }
    ]

    return NextResponse.json({
      templates: defaultTemplates
    })

  } catch (error) {
    console.error('Error fetching invitation templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}