import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/security/rate-limiting'

interface WebVitalData {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  navigationType: string
  timestamp: number
  url: string
  userAgent: string
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request, {
      ...RATE_LIMITS.API_GENERAL,
      maxRequests: 100, // Allow more requests for analytics
    })
    
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const data: WebVitalData = await request.json()
    
    // Validate the data
    if (!data.name || typeof data.value !== 'number') {
      return NextResponse.json(
        { error: 'Invalid web vitals data' },
        { status: 400 }
      )
    }

    // Store in database for analysis
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('web_vitals_metrics')
      .insert({
        metric_name: data.name,
        metric_value: data.value,
        rating: data.rating,
        delta: data.delta,
        metric_id: data.id,
        navigation_type: data.navigationType,
        page_url: data.url,
        user_agent: data.userAgent,
        recorded_at: new Date(data.timestamp).toISOString(),
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Failed to store web vitals:', error)
      // Don't fail the request - analytics should be non-blocking
    }

    // Log performance issues
    if (data.rating === 'poor') {
      console.warn(`🔴 Poor ${data.name} performance:`, {
        value: data.value,
        url: data.url,
        userAgent: data.userAgent.substring(0, 100), // Truncate for logging
      })
    } else if (data.rating === 'needs-improvement') {
      console.log(`🟡 ${data.name} needs improvement:`, {
        value: data.value,
        url: data.url,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Web vitals API error:', error)
    return NextResponse.json(
      { error: 'Failed to process web vitals data' },
      { status: 500 }
    )
  }
}

// GET endpoint for retrieving web vitals analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('range') || '7d'
    const metric = searchParams.get('metric')
    
    const supabase = await createClient()
    
    // Calculate date range
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 1
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    let query = supabase
      .from('web_vitals_metrics')
      .select('*')
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: false })
    
    if (metric) {
      query = query.eq('metric_name', metric)
    }
    
    const { data, error } = await query.limit(1000)
    
    if (error) {
      throw error
    }
    
    // Aggregate the data
    const metrics = data || []
    const aggregated = {
      totalSamples: metrics.length,
      averageValues: {} as Record<string, number>,
      ratingDistribution: {} as Record<string, Record<string, number>>,
      trendData: [] as Array<{
        date: string
        metrics: Record<string, { value: number; count: number }>
      }>
    }
    
    // Calculate averages by metric
    const metricGroups = metrics.reduce((acc, metric) => {
      if (!acc[metric.metric_name]) {
        acc[metric.metric_name] = []
      }
      acc[metric.metric_name].push(metric.metric_value)
      return acc
    }, {} as Record<string, number[]>)
    
    Object.entries(metricGroups).forEach(([name, values]) => {
      aggregated.averageValues[name] = (values as number[]).reduce((sum, val) => sum + val, 0) / (values as number[]).length
    })
    
    // Calculate rating distribution
    metrics.forEach(metric => {
      if (!aggregated.ratingDistribution[metric.metric_name]) {
        aggregated.ratingDistribution[metric.metric_name] = {
          good: 0,
          'needs-improvement': 0,
          poor: 0
        }
      }
      aggregated.ratingDistribution[metric.metric_name][metric.rating]++
    })
    
    // Generate trend data (daily aggregates)
    const dailyMetrics = metrics.reduce((acc, metric) => {
      const date = metric.recorded_at.split('T')[0]
      if (!acc[date]) {
        acc[date] = {}
      }
      if (!acc[date][metric.metric_name]) {
        acc[date][metric.metric_name] = { total: 0, count: 0 }
      }
      acc[date][metric.metric_name].total += metric.metric_value
      acc[date][metric.metric_name].count++
      return acc
    }, {} as Record<string, Record<string, { total: number; count: number }>>)
    
    aggregated.trendData = Object.entries(dailyMetrics).map(([date, dayMetrics]) => ({
      date,
      metrics: Object.entries(dayMetrics as Record<string, { total: number; count: number }>).reduce((acc, [metricName, data]) => {
        acc[metricName] = {
          value: data.total / data.count,
          count: data.count
        }
        return acc
      }, {} as Record<string, { value: number; count: number }>)
    })).sort((a, b) => a.date.localeCompare(b.date))
    
    return NextResponse.json(aggregated)
  } catch (error) {
    console.error('Failed to fetch web vitals analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}