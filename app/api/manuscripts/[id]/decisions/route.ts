import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DecisionProcessingService } from '@/lib/services/decision-processing-service'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const manuscriptId = params.id
    
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

    // Verify user is an editor
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'editor' && profile.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      decision, 
      components, 
      actions, 
      templateId, 
      templateVersion,
      isDraft = false 
    } = body

    // Validate required fields
    if (!decision) {
      return NextResponse.json(
        { error: 'Decision is required' },
        { status: 400 }
      )
    }

    if (!components?.authorLetter && !isDraft) {
      return NextResponse.json(
        { error: 'Author letter is required for final decisions' },
        { status: 400 }
      )
    }

    // Validate decision type
    const validDecisions = ['accepted', 'revisions_requested', 'rejected']
    if (!validDecisions.includes(decision)) {
      return NextResponse.json(
        { error: 'Invalid decision type' },
        { status: 400 }
      )
    }

    // Verify manuscript exists and editor has access
    const { data: manuscript, error: manuscriptError } = await supabase
      .from('manuscripts')
      .select('id, title, author_id, editor_id, status')
      .eq('id', manuscriptId)
      .single()

    if (manuscriptError || !manuscript) {
      return NextResponse.json(
        { error: 'Manuscript not found' },
        { status: 404 }
      )
    }

    // Initialize the decision processing service
    const decisionService = new DecisionProcessingService(supabase)

    // Process the decision
    const result = await decisionService.processDecision({
      manuscriptId,
      editorId: user.id,
      decision,
      components: {
        editorSummary: components.editorSummary || '',
        authorLetter: components.authorLetter || '',
        reviewerComments: components.reviewerComments || [],
        internalNotes: components.internalNotes || '',
        conditions: components.conditions || [],
        nextSteps: components.nextSteps || [],
        decisionRationale: components.decisionRationale || ''
      },
      actions: {
        notifyAuthor: actions?.notifyAuthor ?? true,
        notifyReviewers: actions?.notifyReviewers ?? false,
        schedulePublication: actions?.schedulePublication || null,
        assignProductionEditor: actions?.assignProductionEditor || null,
        generateDOI: actions?.generateDOI ?? false,
        sendToProduction: actions?.sendToProduction ?? false,
        followUpDate: actions?.followUpDate || null
      },
      templateId: templateId || undefined,
      templateVersion: templateVersion || undefined,
      isDraft
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to process decision' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: isDraft ? 'Decision draft saved successfully' : 'Editorial decision processed successfully',
      data: {
        decisionId: result.decisionId,
        manuscriptId,
        decision,
        isDraft,
        queuedActions: result.queuedActions || []
      }
    })

  } catch (error) {
    console.error('Decision processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()  
    const manuscriptId = params.id
    
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

    // Get decision history for manuscript
    const decisionService = new DecisionProcessingService(supabase)
    const decisions = await decisionService.getDecisionHistory(manuscriptId)

    // Get draft decisions for current user
    const drafts = await decisionService.getDraftDecisions(manuscriptId, user.id)

    return NextResponse.json({
      decisions,
      drafts,
      total: decisions.length,
      hasDrafts: drafts.length > 0
    })

  } catch (error) {
    console.error('Error fetching decision history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const manuscriptId = params.id
    
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
    const { draftId } = body

    if (!draftId) {
      return NextResponse.json(
        { error: 'Draft ID is required' },
        { status: 400 }
      )
    }

    // Submit final decision from draft
    const decisionService = new DecisionProcessingService(supabase)
    const result = await decisionService.submitFinalDecision(draftId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to submit final decision' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Final decision submitted successfully',
      data: {
        decisionId: result.decisionId,
        queuedActions: result.queuedActions || []
      }
    })

  } catch (error) {
    console.error('Final decision submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}