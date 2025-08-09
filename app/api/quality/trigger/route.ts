import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { QualityJobProcessor } from '@/lib/services/quality-job-processor';
import { QualityTriggers } from '@/lib/hooks/quality-triggers';

/**
 * POST /api/quality/trigger
 * Manually trigger quality analysis and system events
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user role - only admins can manually trigger system events
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action, target, params } = body;

    let result;

    switch (action) {
      case 'analyze_review':
        if (!target) {
          return NextResponse.json({ error: 'Review ID required' }, { status: 400 });
        }
        result = await handleAnalyzeReview(target, params);
        break;

      case 'batch_analyze':
        result = await handleBatchAnalyze(params);
        break;

      case 'daily_maintenance':
        result = await handleDailyMaintenance();
        break;

      case 'weekly_summary':
        result = await handleWeeklySummary();
        break;

      case 'consistency_check':
        if (!target) {
          return NextResponse.json({ error: 'Manuscript ID required' }, { status: 400 });
        }
        result = await handleConsistencyCheck(target);
        break;

      case 'test_notification':
        result = await handleTestNotification(user.id, params);
        break;

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      target,
      result
    });

  } catch (error) {
    console.error('Error in quality trigger:', error);
    return NextResponse.json(
      { error: 'Failed to execute trigger' },
      { status: 500 }
    );
  }
}

/**
 * Trigger analysis for a specific review
 */
async function handleAnalyzeReview(reviewId: string, params: any) {
  const analysisType = params?.type || 'full_analysis';
  const priority = params?.priority || 5;

  const jobId = await QualityJobProcessor.queueAnalysis(
    reviewId, 
    analysisType as any, 
    priority
  );

  return {
    message: 'Quality analysis queued',
    job_id: jobId,
    review_id: reviewId,
    analysis_type: analysisType
  };
}

/**
 * Trigger batch analysis for multiple reviews
 */
async function handleBatchAnalyze(params: any) {
  const supabase = await createClient();
  
  // Get reviews based on criteria
  let query = supabase
    .from('reviews')
    .select('id')
    .eq('status', 'submitted');

  if (params?.field) {
    query = query.eq('manuscripts.field', params.field);
  }

  if (params?.date_from) {
    query = query.gte('submitted_at', params.date_from);
  }

  if (params?.limit) {
    query = query.limit(params.limit);
  }

  const { data: reviews, error } = await query;

  if (error) {
    throw error;
  }

  if (!reviews || reviews.length === 0) {
    return { message: 'No reviews found for batch analysis' };
  }

  // Queue analysis for each review
  const jobIds = [];
  for (const review of reviews) {
    const jobId = await QualityJobProcessor.queueAnalysis(review.id, 'full_analysis', 3);
    jobIds.push(jobId);
  }

  return {
    message: `Batch analysis queued for ${reviews.length} reviews`,
    job_ids: jobIds,
    review_count: reviews.length
  };
}

/**
 * Trigger daily maintenance tasks
 */
async function handleDailyMaintenance() {
  await QualityTriggers.runDailyMaintenance();
  
  return {
    message: 'Daily maintenance tasks completed',
    timestamp: new Date().toISOString()
  };
}

/**
 * Trigger weekly summary generation
 */
async function handleWeeklySummary() {
  await QualityTriggers.runWeeklySummary();
  
  return {
    message: 'Weekly summaries generated and sent',
    timestamp: new Date().toISOString()
  };
}

/**
 * Trigger consistency analysis for a manuscript
 */
async function handleConsistencyCheck(manuscriptId: string) {
  const supabase = await createClient();
  
  // Get all reviews for the manuscript
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id')
    .eq('manuscript_id', manuscriptId)
    .eq('status', 'submitted');

  if (!reviews || reviews.length < 2) {
    return {
      message: 'Insufficient reviews for consistency analysis',
      manuscript_id: manuscriptId,
      review_count: reviews?.length || 0
    };
  }

  // Queue consistency analysis for the first review (will analyze all)
  const jobId = await QualityJobProcessor.queueAnalysis(
    reviews[0].id, 
    'consistency_analysis', 
    6 // High priority
  );

  return {
    message: 'Consistency analysis queued',
    job_id: jobId,
    manuscript_id: manuscriptId,
    review_count: reviews.length
  };
}

/**
 * Send test notification
 */
async function handleTestNotification(userId: string, params: any) {
  const supabase = await createClient();
  
  const testNotification = {
    user_id: userId,
    type: 'system_test',
    title: 'Quality System Test',
    message: params?.message || 'This is a test notification from the quality system.',
    priority: 'low',
    data: {
      test: true,
      timestamp: new Date().toISOString()
    }
  };

  const { data, error } = await supabase
    .from('notifications')
    .insert(testNotification)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return {
    message: 'Test notification sent',
    notification_id: data.id
  };
}

/**
 * GET /api/quality/trigger
 * Get available trigger actions and their descriptions
 */
export async function GET(_request: NextRequest) {
  const actions = {
    analyze_review: {
      description: 'Trigger quality analysis for a specific review',
      parameters: {
        target: 'Review ID (required)',
        params: {
          type: 'Analysis type: full_analysis|quick_check|consistency_analysis',
          priority: 'Job priority: 1-10 (default: 5)'
        }
      }
    },
    batch_analyze: {
      description: 'Trigger batch quality analysis for multiple reviews',
      parameters: {
        params: {
          field: 'Filter by academic field (optional)',
          date_from: 'Include reviews from this date (optional)',
          limit: 'Maximum number of reviews to analyze (optional)'
        }
      }
    },
    daily_maintenance: {
      description: 'Run daily maintenance tasks (cleanup, reminders)',
      parameters: {}
    },
    weekly_summary: {
      description: 'Generate and send weekly quality summaries',
      parameters: {}
    },
    consistency_check: {
      description: 'Trigger consistency analysis for a manuscript',
      parameters: {
        target: 'Manuscript ID (required)'
      }
    },
    test_notification: {
      description: 'Send test notification to current user',
      parameters: {
        params: {
          message: 'Custom message for the test notification (optional)'
        }
      }
    }
  };

  return NextResponse.json({
    available_actions: actions,
    usage: 'POST /api/quality/trigger with { action, target?, params? }'
  });
}