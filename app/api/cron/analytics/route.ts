import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRedisClient } from '@/lib/redis/client';

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    const redis = getRedisClient();
    
    const timestamp = new Date().toISOString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD format

    // 1. Aggregate daily manuscript statistics
    const { data: dailyManuscripts } = await supabase
      .from('manuscripts')
      .select('status, created_at, published_at')
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', new Date().toISOString());

    const manuscriptStats = {
      submitted: dailyManuscripts?.filter(m => m.created_at >= yesterday.toISOString()).length || 0,
      published: dailyManuscripts?.filter(m => 
        m.published_at && 
        new Date(m.published_at) >= yesterday &&
        new Date(m.published_at) < new Date()
      ).length || 0
    };

    // 2. Aggregate daily user activity
    const { data: dailyActivity } = await supabase
      .from('activity_logs')
      .select('user_id, action')
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', new Date().toISOString());

    const activityStats = {
      unique_users: new Set(dailyActivity?.map(a => a.user_id)).size || 0,
      total_actions: dailyActivity?.length || 0,
      login_actions: dailyActivity?.filter(a => a.action.includes('login')).length || 0
    };

    // 3. Aggregate daily review activity
    const { data: dailyReviews } = await supabase
      .from('reviews')
      .select('id, submitted_at')
      .gte('submitted_at', yesterday.toISOString())
      .lt('submitted_at', new Date().toISOString());

    const reviewStats = {
      reviews_submitted: dailyReviews?.length || 0
    };

    // 4. Calculate system performance metrics
    const performanceStats = {
      timestamp,
      response_time_avg: await redis?.get(`performance:avg_response_time:${yesterdayStr}`) || 0,
      error_rate: await redis?.get(`performance:error_rate:${yesterdayStr}`) || 0,
      uptime_percentage: await redis?.get(`performance:uptime:${yesterdayStr}`) || 100
    };

    // 5. Store aggregated data
    const dailyReport = {
      date: yesterdayStr,
      manuscripts: manuscriptStats,
      user_activity: activityStats,
      reviews: reviewStats,
      performance: performanceStats,
      generated_at: timestamp
    };

    // Store in cache for quick access
    await redis?.setex(`analytics:daily:${yesterdayStr}`, 86400 * 7, JSON.stringify(dailyReport)); // Keep for 7 days

    // Store in database for long-term tracking
    await supabase.from('activity_logs').insert({
      action: 'daily_analytics_generated',
      details: dailyReport
    });

    // 6. Generate weekly report (if it's Sunday)
    if (yesterday.getDay() === 0) { // Sunday
      const weekStart = new Date(yesterday.getTime() - 6 * 24 * 60 * 60 * 1000);
      const weekStartStr = weekStart.toISOString().split('T')[0];

      const { data: weeklyData } = await supabase
        .from('activity_logs')
        .select('details')
        .eq('action', 'daily_analytics_generated')
        .gte('created_at', weekStart.toISOString())
        .lt('created_at', new Date().toISOString());

      if (weeklyData && weeklyData.length > 0) {
        const weeklyReport = {
          week_start: weekStartStr,
          week_end: yesterdayStr,
          daily_reports: weeklyData.map(d => d.details),
          generated_at: timestamp
        };

        await redis?.setex(`analytics:weekly:${weekStartStr}`, 86400 * 30, JSON.stringify(weeklyReport)); // Keep for 30 days
      }
    }

    // 7. Update cache counters for real-time dashboard
    const { data: totalStats } = await supabase
      .from('manuscripts')
      .select('status');

    if (totalStats) {
      const statusCounts = totalStats.reduce((acc, manuscript) => {
        acc[manuscript.status] = (acc[manuscript.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      await redis?.hmset('stats:manuscripts', statusCounts);
      await redis?.expire('stats:manuscripts', 3600); // Expire in 1 hour
    }

    return NextResponse.json({
      success: true,
      timestamp,
      daily_report: dailyReport,
      message: 'Analytics processing completed successfully'
    });
    
  } catch (error) {
    console.error('Analytics cron job failed:', error);
    
    // Log the error
    try {
      const supabase = createClient();
      await supabase.from('activity_logs').insert({
        action: 'analytics_processing_failed',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      });
    } catch (logError) {
      console.error('Failed to log analytics error:', logError);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Analytics processing failed',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}