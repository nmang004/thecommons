import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { QualityDashboardData } from '@/lib/types/quality';

/**
 * GET /api/quality/analytics
 * Get quality analytics data for the dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user role - only editors and admins can view analytics
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'editor' && userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range') || '30'; // days
    const field = searchParams.get('field') || undefined; // optional field filter

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeRange));

    // Get overview statistics
    const overview = await getOverviewStats(supabase, cutoffDate, field);
    
    // Get trend data
    const trends = await getTrendData(supabase, cutoffDate, field);
    
    // Get metrics breakdown
    const metricsBreakdown = await getMetricsBreakdown(supabase, cutoffDate);
    
    // Get top reviewers
    const topReviewers = await getTopReviewers(supabase, cutoffDate);
    
    // Get flagged reviews
    const flaggedReviews = await getFlaggedReviews(supabase, cutoffDate);

    const analytics: QualityDashboardData = {
      overview,
      trends,
      metrics_breakdown: metricsBreakdown,
      top_reviewers: topReviewers,
      flagged_reviews: flaggedReviews
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Error fetching quality analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

/**
 * Get overview statistics
 */
async function getOverviewStats(supabase: any, cutoffDate: Date, field?: string) {
  let baseQuery = supabase
    .from('review_quality_reports')
    .select('quality_score, status, flags, created_at')
    .gte('created_at', cutoffDate.toISOString());

  if (field) {
    // If field filter is provided, join with manuscripts to filter by field
    baseQuery = supabase
      .from('review_quality_reports')
      .select(`
        quality_score, 
        status, 
        flags,
        created_at,
        reviews!inner (
          manuscripts!inner (
            field
          )
        )
      `)
      .eq('reviews.manuscripts.field', field)
      .gte('created_at', cutoffDate.toISOString());
  }

  const { data: reports } = await baseQuery;

  if (!reports) {
    return {
      total_reviews: 0,
      average_quality: 0,
      reviews_flagged: 0,
      pending_editor_review: 0
    };
  }

  const totalReviews = reports.length;
  const qualityScores = reports
    .filter((r: any) => r.quality_score != null)
    .map((r: any) => r.quality_score);
  
  const averageQuality = qualityScores.length > 0 
    ? qualityScores.reduce((a: number, b: number) => a + b, 0) / qualityScores.length 
    : 0;

  const reviewsFlagged = reports.filter((r: any) => 
    r.flags && Array.isArray(r.flags) && r.flags.length > 0
  ).length;

  const pendingEditorReview = reports.filter((r: any) => 
    r.status === 'pending_editor_review'
  ).length;

  return {
    total_reviews: totalReviews,
    average_quality: Math.round(averageQuality * 100) / 100,
    reviews_flagged: reviewsFlagged,
    pending_editor_review: pendingEditorReview
  };
}

/**
 * Get trend data over time
 */
async function getTrendData(supabase: any, cutoffDate: Date, field?: string) {
  let baseQuery = supabase
    .from('review_quality_reports')
    .select('quality_score, created_at')
    .not('quality_score', 'is', null)
    .gte('created_at', cutoffDate.toISOString())
    .order('created_at');

  if (field) {
    baseQuery = supabase
      .from('review_quality_reports')
      .select(`
        quality_score,
        created_at,
        reviews!inner (
          manuscripts!inner (
            field
          )
        )
      `)
      .eq('reviews.manuscripts.field', field)
      .not('quality_score', 'is', null)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at');
  }

  const { data: reports } = await baseQuery;

  if (!reports) return [];

  // Group by date
  const dateGroups: Record<string, number[]> = {};
  
  for (const report of reports) {
    const date = new Date(report.created_at).toISOString().split('T')[0];
    if (!dateGroups[date]) {
      dateGroups[date] = [];
    }
    dateGroups[date].push(report.quality_score);
  }

  // Calculate averages for each date
  return Object.entries(dateGroups).map(([date, scores]) => ({
    date,
    average_quality: scores.reduce((a, b) => a + b, 0) / scores.length,
    review_count: scores.length
  }));
}

/**
 * Get breakdown of individual metrics
 */
async function getMetricsBreakdown(supabase: any, cutoffDate: Date) {
  const { data: reports } = await supabase
    .from('review_quality_reports')
    .select('automated_metrics, nlp_analysis, consistency_metrics')
    .gte('created_at', cutoffDate.toISOString());

  if (!reports) return [];

  // Calculate averages for each metric
  const metricSums: Record<string, number[]> = {};

  for (const report of reports) {
    // Process automated metrics
    if (report.automated_metrics) {
      for (const [metric, value] of Object.entries(report.automated_metrics)) {
        if (typeof value === 'number') {
          if (!metricSums[metric]) metricSums[metric] = [];
          metricSums[metric].push(value);
        }
      }
    }

    // Process NLP metrics
    if (report.nlp_analysis) {
      for (const [metric, value] of Object.entries(report.nlp_analysis)) {
        if (typeof value === 'number') {
          if (!metricSums[metric]) metricSums[metric] = [];
          metricSums[metric].push(value);
        }
      }
    }

    // Process consistency metrics
    if (report.consistency_metrics) {
      for (const [metric, value] of Object.entries(report.consistency_metrics)) {
        if (typeof value === 'number') {
          if (!metricSums[metric]) metricSums[metric] = [];
          metricSums[metric].push(value);
        }
      }
    }
  }

  // Calculate averages and trends (simplified)
  return Object.entries(metricSums).map(([metric, values]) => ({
    metric,
    average_score: values.reduce((a, b) => a + b, 0) / values.length,
    trend: 'stable' as const // Would need historical comparison for real trend
  }));
}

/**
 * Get top performing reviewers
 */
async function getTopReviewers(supabase: any, cutoffDate: Date) {
  const { data: profiles } = await supabase
    .from('reviewer_quality_profiles')
    .select(`
      *,
      users (
        full_name
      )
    `)
    .gte('updated_at', cutoffDate.toISOString())
    .order('average_quality_score', { ascending: false })
    .limit(10);

  if (!profiles) return [];

  return profiles.map((profile: any) => ({
    reviewer_id: profile.reviewer_id,
    name: profile.users?.full_name || 'Unknown',
    average_quality: profile.average_quality_score || 0,
    total_reviews: profile.total_reviews || 0,
    badges: profile.quality_badges || []
  }));
}

/**
 * Get recently flagged reviews
 */
async function getFlaggedReviews(supabase: any, cutoffDate: Date) {
  const { data: reports } = await supabase
    .from('review_quality_reports')
    .select(`
      *,
      reviews (
        id,
        submitted_at,
        reviewer_id,
        manuscripts (
          title
        ),
        users (
          full_name
        )
      )
    `)
    .not('flags', 'eq', '[]')
    .gte('created_at', cutoffDate.toISOString())
    .order('created_at', { ascending: false })
    .limit(20);

  if (!reports) return [];

  return reports.map((report: any) => ({
    review_id: report.review_id,
    manuscript_title: report.reviews?.manuscripts?.title || 'Unknown',
    reviewer_name: report.reviews?.users?.full_name || 'Anonymous',
    flags: report.flags || [],
    quality_score: report.quality_score || 0,
    submitted_at: report.reviews?.submitted_at || report.created_at
  }));
}