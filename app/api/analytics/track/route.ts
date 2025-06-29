import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AnalyticsService, ManuscriptAnalyticsEvent, UserEngagementEvent } from '@/lib/analytics/service'
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/security/rate-limiting'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting - more generous for tracking events
    const rateLimitResponse = await rateLimitMiddleware(request, {
      ...RATE_LIMITS.API_GENERAL,
      maxRequests: 200, // Higher limit for analytics tracking
    })
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const analytics = new AnalyticsService()
    const requestData = await request.json()
    const { eventType, ...eventData } = requestData

    // Get request metadata
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || ''
    const clientIP = headersList.get('x-forwarded-for') || 
                     headersList.get('x-real-ip') || 
                     '127.0.0.1'
    const referer = headersList.get('referer') || ''

    // Get user if authenticated (optional for analytics)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    switch (eventType) {
      case 'manuscript_view':
      case 'manuscript_download':
      case 'manuscript_share':
      case 'manuscript_citation': {
        if (!eventData.manuscriptId) {
          return NextResponse.json(
            { error: 'manuscriptId is required' },
            { status: 400 }
          )
        }

        const manuscriptEvent: ManuscriptAnalyticsEvent = {
          manuscriptId: eventData.manuscriptId,
          eventType: eventType.replace('manuscript_', '') as any,
          eventData: eventData.metadata || {},
          userId: user?.id,
          sessionId: eventData.sessionId,
          pageUrl: eventData.pageUrl || referer,
          referrer: referer,
          userAgent,
          ipAddress: clientIP,
          countryCode: eventData.countryCode
        }

        await analytics.trackManuscriptEvent(manuscriptEvent)
        break
      }

      case 'user_engagement': {
        if (!user) {
          return NextResponse.json(
            { error: 'Authentication required for user engagement tracking' },
            { status: 401 }
          )
        }

        const engagementEvent: UserEngagementEvent = {
          userId: user.id,
          sessionId: eventData.sessionId || `session_${Date.now()}`,
          action: eventData.action,
          resourceType: eventData.resourceType,
          resourceId: eventData.resourceId,
          durationSeconds: eventData.durationSeconds,
          metadata: {
            ...eventData.metadata,
            userAgent,
            pageUrl: eventData.pageUrl || referer,
            referrer: referer
          }
        }

        await analytics.trackUserEngagement(engagementEvent)
        break
      }

      case 'search': {
        if (!eventData.searchQuery) {
          return NextResponse.json(
            { error: 'searchQuery is required' },
            { status: 400 }
          )
        }

        await analytics.trackSearchEvent({
          searchQuery: eventData.searchQuery,
          searchType: eventData.searchType || 'basic',
          filtersApplied: eventData.filtersApplied || {},
          resultsCount: eventData.resultsCount || 0,
          resultsClicked: eventData.resultsClicked || 0,
          userId: user?.id,
          sessionId: eventData.sessionId,
          searchDurationMs: eventData.searchDurationMs
        })
        break
      }

      case 'page_view': {
        // Basic page view tracking - works for anonymous users
        if (user) {
          const pageViewEvent: UserEngagementEvent = {
            userId: user.id,
            sessionId: eventData.sessionId || `session_${Date.now()}`,
            action: 'page_view',
            metadata: {
              page: eventData.page,
              pageUrl: eventData.pageUrl || referer,
              referrer: referer,
              userAgent,
              loadTime: eventData.loadTime,
              ...eventData.metadata
            }
          }

          await analytics.trackUserEngagement(pageViewEvent)
        }
        break
      }

      default:
        return NextResponse.json(
          { error: 'Invalid event type' },
          { status: 400 }
        )
    }

    return NextResponse.json({ 
      success: true,
      tracked: eventType,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Analytics tracking error:', error)
    // Don't fail the request - analytics should be non-blocking
    return NextResponse.json(
      { success: false, error: 'Failed to track event' },
      { status: 200 } // Return 200 to avoid breaking client applications
    )
  }
}

// GET endpoint for real-time analytics data
export async function GET(request: NextRequest) {
  try {
    // Check authentication
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
    const metric = searchParams.get('metric')
    const timeRange = searchParams.get('range') || '24h'

    let hours = 24
    if (timeRange === '1h') hours = 1
    else if (timeRange === '6h') hours = 6
    else if (timeRange === '7d') hours = 168
    else if (timeRange === '30d') hours = 720

    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000)

    let data
    switch (metric) {
      case 'manuscript_events': {
        const { data: events } = await supabase
          .from('analytics.manuscript_analytics')
          .select('event_type, created_at')
          .gte('created_at', startTime.toISOString())
          .order('created_at', { ascending: false })
          .limit(1000)

        // Group by hour and event type
        data = events?.reduce((acc: any, event) => {
          const hour = event.created_at.substring(0, 13) // YYYY-MM-DDTHH
          if (!acc[hour]) acc[hour] = {}
          if (!acc[hour][event.event_type]) acc[hour][event.event_type] = 0
          acc[hour][event.event_type]++
          return acc
        }, {}) || {}
        break
      }

      case 'user_activity': {
        const { data: activity } = await supabase
          .from('analytics.user_engagement')
          .select('action, created_at')
          .gte('created_at', startTime.toISOString())
          .order('created_at', { ascending: false })
          .limit(1000)

        data = activity?.reduce((acc: any, event) => {
          const hour = event.created_at.substring(0, 13)
          if (!acc[hour]) acc[hour] = {}
          if (!acc[hour][event.action]) acc[hour][event.action] = 0
          acc[hour][event.action]++
          return acc
        }, {}) || {}
        break
      }

      case 'system_health': {
        const { data: health } = await supabase
          .from('analytics.system_health')
          .select('metric_type, metric_value, recorded_at')
          .gte('recorded_at', startTime.toISOString())
          .order('recorded_at', { ascending: false })
          .limit(1000)

        data = health || []
        break
      }

      default:
        return NextResponse.json(
          { error: 'Invalid metric type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      metric,
      timeRange,
      data,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Real-time analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch real-time data' },
      { status: 500 }
    )
  }
}