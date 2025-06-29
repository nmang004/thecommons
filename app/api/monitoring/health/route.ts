import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { errorTracker } from '@/lib/monitoring/error-tracker'
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/security/rate-limiting'

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request, RATE_LIMITS.API_GENERAL)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const { searchParams } = new URL(request.url)
    const detailed = searchParams.get('detailed') === 'true'

    // Basic health check
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'unknown',
        storage: 'unknown',
        redis: 'unknown'
      },
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime()
    }

    try {
      // Test database connection
      const supabase = await createClient()
      const { error: dbError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
      
      healthCheck.services.database = dbError ? 'unhealthy' : 'healthy'
    } catch {
      healthCheck.services.database = 'unhealthy'
    }

    try {
      // Test Redis connection (if available)
      const { getRedisClient } = await import('@/lib/redis/client')
      const redis = getRedisClient()
      await redis.ping()
      healthCheck.services.redis = 'healthy'
    } catch {
      healthCheck.services.redis = 'unhealthy'
    }

    // Test storage (Supabase storage)
    try {
      const supabase = await createClient()
      const { error: storageError } = await supabase.storage
        .from('manuscripts')
        .list('', { limit: 1 })
      
      healthCheck.services.storage = storageError ? 'unhealthy' : 'healthy'
    } catch {
      healthCheck.services.storage = 'unhealthy'
    }

    // Determine overall status
    const unhealthyServices = Object.values(healthCheck.services)
      .filter(status => status === 'unhealthy').length
    
    if (unhealthyServices > 0) {
      healthCheck.status = unhealthyServices >= 2 ? 'critical' : 'degraded'
    }

    // Get detailed system health if requested
    let systemHealth = null
    if (detailed) {
      try {
        systemHealth = await errorTracker.getSystemHealth()
      } catch (error) {
        console.error('Failed to get system health:', error)
      }
    }

    const response = {
      ...healthCheck,
      ...(detailed && systemHealth && { systemHealth })
    }

    // Return appropriate HTTP status based on health
    const httpStatus = healthCheck.status === 'healthy' ? 200 : 
                      healthCheck.status === 'degraded' ? 200 : 503

    return NextResponse.json(response, { status: httpStatus })

  } catch (error) {
    console.error('Health check API error:', error)
    return NextResponse.json(
      {
        status: 'critical',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      },
      { status: 503 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request, {
      ...RATE_LIMITS.API_GENERAL,
      maxRequests: 50, // Lower limit for health metric posting
    })
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const healthData = await request.json()
    
    // Validate required fields
    if (!healthData.metricType || typeof healthData.metricValue !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: metricType, metricValue' },
        { status: 400 }
      )
    }

    // Track the system health metric
    await errorTracker.trackSystemHealth({
      metricType: healthData.metricType,
      metricValue: healthData.metricValue,
      endpoint: healthData.endpoint,
      serviceName: healthData.serviceName,
      statusCode: healthData.statusCode,
      additionalData: healthData.additionalData || {}
    })

    return NextResponse.json({ 
      success: true,
      tracked: 'system_health',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('System health tracking API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to track system health' },
      { status: 200 }
    )
  }
}