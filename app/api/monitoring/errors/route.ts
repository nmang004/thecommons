import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { errorTracker } from '@/lib/monitoring/error-tracker'
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/security/rate-limiting'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request, {
      ...RATE_LIMITS.API_GENERAL,
      maxRequests: 100, // Higher limit for error tracking
    })
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const errorData = await request.json()
    
    // Validate required fields
    if (!errorData.errorType || !errorData.errorMessage || !errorData.pageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: errorType, errorMessage, pageUrl' },
        { status: 400 }
      )
    }

    // Get user if authenticated (optional for error tracking)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Track the error
    await errorTracker.trackError({
      errorType: errorData.errorType,
      errorMessage: errorData.errorMessage,
      errorStack: errorData.errorStack,
      pageUrl: errorData.pageUrl,
      userAgent: errorData.userAgent,
      userId: user?.id,
      sessionId: errorData.sessionId,
      additionalData: errorData.additionalData || {},
      severity: errorData.severity || 'medium'
    })

    return NextResponse.json({ 
      success: true,
      tracked: 'error',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error tracking API error:', error)
    // Return success to avoid breaking client applications
    return NextResponse.json(
      { success: false, error: 'Failed to track error' },
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
    const action = searchParams.get('action')

    if (action === 'analytics') {
      const analytics = await errorTracker.getErrorAnalytics(timeRange)
      return NextResponse.json({
        success: true,
        data: analytics,
        timeRange,
        generatedAt: new Date().toISOString()
      })
    }

    if (action === 'resolve' && searchParams.get('errorId')) {
      await errorTracker.resolveError(searchParams.get('errorId')!)
      return NextResponse.json({
        success: true,
        message: 'Error marked as resolved'
      })
    }

    // Get recent errors
    const hours = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000)

    const { data: errors, error } = await supabase
      .from('error_logs')
      .select(`
        id,
        error_type,
        error_message,
        severity,
        page_url,
        user_id,
        resolved,
        created_at
      `)
      .gte('created_at', startTime.toISOString())
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: errors || [],
      timeRange,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error monitoring API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch error data' },
      { status: 500 }
    )
  }
}