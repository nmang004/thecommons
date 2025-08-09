import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { QualityJobProcessor } from '@/lib/services/quality-job-processor';

/**
 * GET /api/reviews/:id/quality-report
 * Get the quality report for a specific review
 */
export async function GET(
  _request: NextRequest,
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

    // Check user role - editors and admins can view all, reviewers can view their own
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isEditor = userData?.role === 'editor' || userData?.role === 'admin';

    // Get the review to check ownership
    const { data: review } = await supabase
      .from('reviews')
      .select('reviewer_id')
      .eq('id', params.id)
      .single();

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Check permissions
    if (!isEditor && review.reviewer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the quality report
    const { data: report, error } = await supabase
      .from('review_quality_reports')
      .select(`
        *,
        editor_reviewed_by:users!review_quality_reports_editor_reviewed_by_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq('review_id', params.id)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      throw error;
    }

    if (!report) {
      // No report exists yet - trigger analysis
      const jobId = await QualityJobProcessor.queueAnalysis(params.id, 'full_analysis');
      
      return NextResponse.json({
        status: 'analysis_queued',
        message: 'Quality analysis has been queued',
        job_id: jobId
      });
    }

    // Get reviewer profile if exists
    const { data: reviewerProfile } = await supabase
      .from('reviewer_quality_profiles')
      .select('*')
      .eq('reviewer_id', review.reviewer_id)
      .single();

    // Get consistency scores if available
    const { data: consistencyScore } = await supabase
      .from('review_consistency_scores')
      .select('*')
      .eq('manuscript_id', report.review_id)
      .single();

    return NextResponse.json({
      report,
      reviewer_profile: reviewerProfile,
      consistency_analysis: consistencyScore
    });

  } catch (error) {
    console.error('Error fetching quality report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quality report' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews/:id/quality-report
 * Trigger quality analysis for a review
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

    // Check user role - only editors and admins can trigger analysis
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'editor' && userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      analysis_type = 'full', 
      priority = 5,
      force_reanalysis = false 
    } = body;

    // Check if analysis already exists and is recent
    if (!force_reanalysis) {
      const { data: existingReport } = await supabase
        .from('review_quality_reports')
        .select('*')
        .eq('review_id', params.id)
        .single();

      if (existingReport && existingReport.analysis_completed_at) {
        const analysisAge = Date.now() - new Date(existingReport.analysis_completed_at).getTime();
        const oneHour = 60 * 60 * 1000;

        if (analysisAge < oneHour) {
          return NextResponse.json({
            message: 'Recent analysis already exists',
            report: existingReport
          });
        }
      }
    }

    // Queue the analysis job
    const jobType = analysis_type === 'quick' ? 'quick_check' : 
                    analysis_type === 'consistency' ? 'consistency_analysis' : 
                    'full_analysis';

    const jobId = await QualityJobProcessor.queueAnalysis(params.id, jobType, priority);

    return NextResponse.json({
      message: 'Quality analysis queued successfully',
      job_id: jobId,
      estimated_time: analysis_type === 'quick' ? '30 seconds' : '2-3 minutes'
    });

  } catch (error) {
    console.error('Error triggering quality analysis:', error);
    return NextResponse.json(
      { error: 'Failed to trigger quality analysis' },
      { status: 500 }
    );
  }
}