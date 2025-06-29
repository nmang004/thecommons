import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { errorTracker } from '@/lib/monitoring/error-tracker'
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/security/rate-limiting'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request, {
      ...RATE_LIMITS.API_GENERAL,
      maxRequests: 200, // Higher limit for performance tracking
    })
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const performanceData = await request.json()
    
    // Validate required fields
    if (!performanceData.metricType || !performanceData.metricName || 
        typeof performanceData.durationMs !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: metricType, metricName, durationMs' },
        { status: 400 }
      )
    }

    // Get user if authenticated (optional for performance tracking)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Track the performance metric
    await errorTracker.trackPerformance({
      metricType: performanceData.metricType,
      metricName: performanceData.metricName,
      durationMs: performanceData.durationMs,
      pageUrl: performanceData.pageUrl,
      apiEndpoint: performanceData.apiEndpoint,
      queryName: performanceData.queryName,
      userId: user?.id,
      additionalData: performanceData.additionalData || {}
    })

    return NextResponse.json({ 
      success: true,
      tracked: 'performance',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Performance tracking API error:', error)
    // Return success to avoid breaking client applications
    return NextResponse.json(
      { success: false, error: 'Failed to track performance' },
      { status: 200 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'editor'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('range') as '1h' | '24h' | '7d' | '30d' || '24h'

    const analytics = await errorTracker.getPerformanceAnalytics(timeRange)

    return NextResponse.json({
      success: true,
      data: analytics,
      timeRange,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Performance monitoring API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    )
  }
}