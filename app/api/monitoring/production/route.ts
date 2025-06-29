import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRedisClient } from '@/lib/redis/client';

interface SystemMetrics {
  timestamp: string;
  database: {
    status: 'healthy' | 'degraded' | 'down';
    connection_time_ms: number;
    active_connections: number;
    query_performance: {
      avg_query_time_ms: number;
      slow_queries: number;
    };
  };
  redis: {
    status: 'healthy' | 'degraded' | 'down';
    connection_time_ms: number;
    memory_usage: {
      used_memory_mb: number;
      peak_memory_mb: number;
      memory_fragmentation_ratio: number;
    };
    hit_rate: number;
  };
  application: {
    uptime_seconds: number;
    memory_usage_mb: number;
    cpu_usage_percent: number;
    active_users_24h: number;
    error_rate_24h: number;
  };
  academic_metrics: {
    manuscripts_submitted_24h: number;
    reviews_completed_24h: number;
    new_registrations_24h: number;
    payment_success_rate_24h: number;
  };
  alerts: Array<{
    type: 'warning' | 'error' | 'critical';
    message: string;
    timestamp: string;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    // Verify monitoring access
    const authHeader = request.headers.get('authorization');
    const monitoringKey = process.env.MONITORING_API_KEY;
    
    if (!monitoringKey || authHeader !== `Bearer ${monitoringKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startTime = Date.now();
    const metrics: SystemMetrics = {
      timestamp: new Date().toISOString(),
      database: {
        status: 'healthy',
        connection_time_ms: 0,
        active_connections: 0,
        query_performance: {
          avg_query_time_ms: 0,
          slow_queries: 0
        }
      },
      redis: {
        status: 'healthy',
        connection_time_ms: 0,
        memory_usage: {
          used_memory_mb: 0,
          peak_memory_mb: 0,
          memory_fragmentation_ratio: 0
        },
        hit_rate: 0
      },
      application: {
        uptime_seconds: process.uptime(),
        memory_usage_mb: process.memoryUsage().heapUsed / 1024 / 1024,
        cpu_usage_percent: 0,
        active_users_24h: 0,
        error_rate_24h: 0
      },
      academic_metrics: {
        manuscripts_submitted_24h: 0,
        reviews_completed_24h: 0,
        new_registrations_24h: 0,
        payment_success_rate_24h: 0
      },
      alerts: []
    };

    // Test database connection and performance
    try {
      const dbStartTime = Date.now();
      const supabase = createClient();
      
      // Test basic connectivity
      const { data: healthCheck, error: healthError } = await supabase
        .rpc('production_health_check');
      
      if (healthError) {
        throw healthError;
      }

      metrics.database.connection_time_ms = Date.now() - dbStartTime;
      
      // Get database statistics
      const { data: dbStats } = await supabase
        .from('pg_stat_activity')
        .select('count')
        .eq('state', 'active');
      
      metrics.database.active_connections = dbStats?.length || 0;

      // Check for slow queries (placeholder - would need actual monitoring)
      const { data: slowQueries } = await supabase
        .rpc('get_slow_queries', { threshold_ms: 1000 });
      
      metrics.database.query_performance.slow_queries = slowQueries?.length || 0;

    } catch (error) {
      metrics.database.status = 'down';
      metrics.alerts.push({
        type: 'critical',
        message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      });
    }

    // Test Redis connection and performance
    try {
      const redisStartTime = Date.now();
      const redis = getRedisClient();
      
      if (redis) {
        // Test basic connectivity
        await redis.ping();
        metrics.redis.connection_time_ms = Date.now() - redisStartTime;
        
        // Get Redis info
        const info = await redis.info('memory');
        const memoryInfo = info.split('\r\n').reduce((acc, line) => {
          const [key, value] = line.split(':');
          if (key && value) acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
        
        metrics.redis.memory_usage = {
          used_memory_mb: parseInt(memoryInfo.used_memory || '0') / 1024 / 1024,
          peak_memory_mb: parseInt(memoryInfo.used_memory_peak || '0') / 1024 / 1024,
          memory_fragmentation_ratio: parseFloat(memoryInfo.mem_fragmentation_ratio || '0')
        };

        // Get hit rate from stats
        const stats = await redis.info('stats');
        const statsInfo = stats.split('\r\n').reduce((acc, line) => {
          const [key, value] = line.split(':');
          if (key && value) acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
        
        const hits = parseInt(statsInfo.keyspace_hits || '0');
        const misses = parseInt(statsInfo.keyspace_misses || '0');
        metrics.redis.hit_rate = hits + misses > 0 ? hits / (hits + misses) : 0;
      }
    } catch (error) {
      metrics.redis.status = 'down';
      metrics.alerts.push({
        type: 'error',
        message: `Redis connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      });
    }

    // Get application metrics
    try {
      const supabase = createClient();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Active users in last 24 hours
      const { count: activeUsers } = await supabase
        .from('activity_logs')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString());
      
      metrics.application.active_users_24h = activeUsers || 0;

      // Error rate in last 24 hours
      const { count: totalLogs } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString());
      
      const { count: errorLogs } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString())
        .like('action', '%error%');
      
      metrics.application.error_rate_24h = totalLogs ? (errorLogs || 0) / totalLogs : 0;

    } catch (error) {
      metrics.alerts.push({
        type: 'warning',
        message: `Failed to get application metrics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      });
    }

    // Get academic-specific metrics
    try {
      const supabase = createClient();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Manuscripts submitted in last 24 hours
      const { count: manuscriptsSubmitted } = await supabase
        .from('manuscripts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString());
      
      metrics.academic_metrics.manuscripts_submitted_24h = manuscriptsSubmitted || 0;

      // Reviews completed in last 24 hours
      const { count: reviewsCompleted } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .gte('submitted_at', yesterday.toISOString());
      
      metrics.academic_metrics.reviews_completed_24h = reviewsCompleted || 0;

      // New registrations in last 24 hours
      const { count: newRegistrations } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString());
      
      metrics.academic_metrics.new_registrations_24h = newRegistrations || 0;

      // Payment success rate (if payments exist)
      const { count: totalPayments } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString());
      
      const { count: successfulPayments } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString())
        .eq('status', 'succeeded');
      
      metrics.academic_metrics.payment_success_rate_24h = 
        totalPayments ? (successfulPayments || 0) / totalPayments : 1;

    } catch (error) {
      metrics.alerts.push({
        type: 'warning',
        message: `Failed to get academic metrics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      });
    }

    // System health checks and alerts
    if (metrics.database.connection_time_ms > 1000) {
      metrics.alerts.push({
        type: 'warning',
        message: `Database response time is high: ${metrics.database.connection_time_ms}ms`,
        timestamp: new Date().toISOString()
      });
    }

    if (metrics.redis.connection_time_ms > 500) {
      metrics.alerts.push({
        type: 'warning',
        message: `Redis response time is high: ${metrics.redis.connection_time_ms}ms`,
        timestamp: new Date().toISOString()
      });
    }

    if (metrics.application.memory_usage_mb > 512) {
      metrics.alerts.push({
        type: 'warning',
        message: `High memory usage: ${metrics.application.memory_usage_mb.toFixed(2)}MB`,
        timestamp: new Date().toISOString()
      });
    }

    if (metrics.application.error_rate_24h > 0.05) {
      metrics.alerts.push({
        type: 'error',
        message: `High error rate: ${(metrics.application.error_rate_24h * 100).toFixed(2)}%`,
        timestamp: new Date().toISOString()
      });
    }

    // Cache metrics for dashboard
    try {
      const redis = getRedisClient();
      if (redis) {
        await redis.setex(
          'monitoring:production_metrics',
          300, // 5 minutes
          JSON.stringify(metrics)
        );
      }
    } catch (error) {
      // Non-critical error, don't fail the request
      console.warn('Failed to cache metrics:', error);
    }

    // Set response status based on overall health
    const hasErrors = metrics.alerts.some(alert => alert.type === 'error');
    const hasCritical = metrics.alerts.some(alert => alert.type === 'critical');
    const status = hasCritical ? 503 : hasErrors ? 207 : 200;

    return NextResponse.json(metrics, { status });

  } catch (error) {
    console.error('Production monitoring failed:', error);
    
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 'error',
        message: 'Production monitoring failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}