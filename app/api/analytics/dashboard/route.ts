import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AnalyticsService } from '@/lib/analytics/service'
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/security/rate-limiting'

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request, RATE_LIMITS.API_GENERAL)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

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
    const dashboardType = searchParams.get('type') || 'executive'
    const timeRange = searchParams.get('range') || '30d'

    const analytics = new AnalyticsService()

    let data
    switch (dashboardType) {
      case 'executive':
        data = await analytics.getExecutiveDashboard()
        break
      case 'editorial':
        const weeks = timeRange === '7d' ? 1 : timeRange === '30d' ? 4 : 12
        data = await analytics.getEditorialPerformance(weeks)
        break
      case 'content':
        data = await analytics.getContentPerformance()
        break
      case 'reviewer':
        data = await analytics.getReviewerPerformance()
        break
      case 'funnel':
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
        data = await analytics.getManuscriptFunnel(days)
        break
      case 'geographic':
        data = await analytics.getGeographicDistribution()
        break
      case 'trends':
        data = await analytics.getFieldOfStudyTrends()
        break
      default:
        return NextResponse.json(
          { error: 'Invalid dashboard type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data,
      type: dashboardType,
      timeRange,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Analytics dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request, {
      ...RATE_LIMITS.API_GENERAL,
      maxRequests: 10, // Lower limit for refresh operations
    })
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // Check authentication and authorization
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check user role - only admins can refresh dashboards
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { action } = await request.json()

    if (action === 'refresh') {
      const analytics = new AnalyticsService()
      await analytics.refreshDashboards()
      
      return NextResponse.json({
        success: true,
        message: 'Dashboards refreshed successfully',
        refreshedAt: new Date().toISOString()
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Analytics dashboard refresh error:', error)
    return NextResponse.json(
      { error: 'Failed to refresh dashboards' },
      { status: 500 }
    )
  }
}