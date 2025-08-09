import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { QualityFlag } from '@/lib/types/quality';

/**
 * POST /api/reviews/:id/flags
 * Flag a review for specific issues
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user role - only editors and admins can flag reviews
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'editor' && userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { flags, reason, urgent = false }: { 
      flags: QualityFlag[], 
      reason?: string,
      urgent?: boolean 
    } = body;

    if (!flags || flags.length === 0) {
      return NextResponse.json(
        { error: 'At least one flag must be provided' },
        { status: 400 }
      );
    }

    // Get the review details
    const { data: review } = await supabase
      .from('reviews')
      .select(`
        *,
        manuscripts (
          id,
          title,
          handling_editor_id,
          authors
        )
      `)
      .eq('id', params.id)
      .single();

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Update or create quality report with flags
    const { data: existingReport } = await supabase
      .from('review_quality_reports')
      .select('id, flags')
      .eq('review_id', params.id)
      .single();

    let allFlags = flags;
    if (existingReport) {
      // Merge with existing flags
      const existingFlags = existingReport.flags || [];
      allFlags = [...new Set([...existingFlags, ...flags])];

      await supabase
        .from('review_quality_reports')
        .update({
          flags: allFlags,
          status: 'flagged_for_review',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingReport.id);
    } else {
      // Create new report with flags
      await supabase
        .from('review_quality_reports')
        .insert({
          review_id: params.id,
          flags: allFlags,
          status: 'flagged_for_review'
        });
    }

    // Handle specific flag types
    const criticalFlags = ['bias_suspected', 'unprofessional_tone', 'ethical_concern'];
    const hasCriticalFlag = flags.some(f => criticalFlags.includes(f));

    if (hasCriticalFlag || urgent) {
      // Notify handling editor immediately
      if (review.manuscripts?.handling_editor_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: review.manuscripts.handling_editor_id,
            type: 'urgent_review_flag',
            title: 'Urgent: Review Flagged',
            message: `Review for "${review.manuscripts.title}" has been flagged: ${flags.join(', ')}`,
            priority: 'high',
            data: {
              review_id: params.id,
              manuscript_id: review.manuscript_id,
              flags,
              flagged_by: user.id,
              reason
            }
          });
      }

      // If bias suspected, trigger bias analysis
      if (flags.includes('bias_suspected')) {
        const { QualityJobProcessor } = await import('@/lib/services/quality-job-processor');
        await QualityJobProcessor.queueAnalysis(params.id, 'full_analysis', 9); // High priority
      }
    }

    // Log the flagging action
    await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'review_flagged',
        entity_type: 'review',
        entity_id: params.id,
        details: {
          flags,
          reason,
          urgent,
          manuscript_id: review.manuscript_id
        }
      });

    // Create administrative workflow if needed
    if (flags.includes('unprofessional_tone') || flags.includes('ethical_concern')) {
      // Create admin task
      await supabase
        .from('admin_tasks')
        .insert({
          type: 'review_investigation',
          priority: urgent ? 'high' : 'medium',
          title: `Investigate flagged review for ${review.manuscripts?.title}`,
          description: `Review has been flagged for: ${flags.join(', ')}. ${reason || ''}`,
          assigned_to: null, // Will be assigned by admin
          data: {
            review_id: params.id,
            manuscript_id: review.manuscript_id,
            reviewer_id: review.reviewer_id,
            flags,
            flagged_by: user.id
          },
          status: 'pending'
        });
    }

    return NextResponse.json({
      message: 'Review flagged successfully',
      flags: allFlags,
      workflow_initiated: hasCriticalFlag || urgent
    });

  } catch (error) {
    console.error('Error flagging review:', error);
    return NextResponse.json(
      { error: 'Failed to flag review' },
      { status: 500 }
    );
  }
}