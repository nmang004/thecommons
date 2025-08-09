import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/reviews/assistance/feedback
 * Track user acceptance/rejection of assistance suggestions
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      review_id, 
      suggestion_type, 
      suggestion_id,
      accepted, 
      feedback_text,
      final_text 
    } = body;

    // Verify the user is the reviewer
    const { data: review } = await supabase
      .from('reviews')
      .select('reviewer_id')
      .eq('id', review_id)
      .single();

    if (!review || review.reviewer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get active session
    const { data: session } = await supabase
      .from('review_assistance_sessions')
      .select('*')
      .eq('review_id', review_id)
      .eq('reviewer_id', user.id)
      .is('session_end', null)
      .order('session_start', { ascending: false })
      .limit(1)
      .single();

    if (!session) {
      return NextResponse.json({ error: 'No active assistance session found' }, { status: 404 });
    }

    // Update accepted suggestions count
    if (accepted) {
      await supabase
        .from('review_assistance_sessions')
        .update({
          accepted_suggestions: (session.accepted_suggestions || 0) + 1
        })
        .eq('id', session.id);
    }

    // Log the feedback for analysis
    await supabase
      .from('assistance_feedback_logs')
      .insert({
        session_id: session.id,
        review_id,
        suggestion_type,
        suggestion_id,
        accepted,
        feedback_text,
        final_text,
        timestamp: new Date().toISOString()
      });

    // If user provided negative feedback, learn from it
    if (!accepted && feedback_text) {
      // This could be used to improve future suggestions
      await supabase
        .from('ai_feedback_logs')
        .insert({
          review_id,
          analysis_type: 'assistance_feedback',
          ai_provider: 'user_feedback',
          response: {
            suggestion_type,
            user_feedback: feedback_text,
            suggestion_rejected: true
          },
          status: 'completed'
        });
    }

    return NextResponse.json({
      message: 'Feedback recorded successfully',
      session_id: session.id
    });

  } catch (error) {
    console.error('Error recording assistance feedback:', error);
    return NextResponse.json(
      { error: 'Failed to record feedback' },
      { status: 500 }
    );
  }
}