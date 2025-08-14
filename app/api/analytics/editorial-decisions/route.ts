import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const timeRange = searchParams.get('timeRange') || '30d'
    // editorId filtering can be added in future iterations
    
    // Generate sample analytics data based on time range
    const generateSampleData = (range: string) => {
      const now = new Date()
      
      // Sample data generation varies by time range
      const rangeMultiplier = range === '7d' ? 0.2 : range === '90d' ? 3 : range === '1y' ? 12 : 1
      
      // Sample decision metrics (adjusted by time range)
      const baseTotal = Math.floor((Math.random() * 50 + 20) * rangeMultiplier)
      const decisionMetrics = {
        total: baseTotal,
        accepted: Math.floor((Math.random() * 15 + 5) * rangeMultiplier),
        rejected: Math.floor((Math.random() * 10 + 3) * rangeMultiplier),
        revisions: Math.floor((Math.random() * 20 + 8) * rangeMultiplier),
        avgProcessingTime: Math.floor(Math.random() * 15) + 12
      }
      
      // Generate monthly trends
      const monthlyTrends = []
      const monthsToGenerate = range === '1y' ? 12 : range === '90d' ? 3 : 1
      
      for (let i = monthsToGenerate - 1; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        monthlyTrends.push({
          month: date.toLocaleString('default', { month: 'short' }),
          accepted: Math.floor(Math.random() * 8) + 2,
          rejected: Math.floor(Math.random() * 5) + 1,
          revisions: Math.floor(Math.random() * 10) + 3
        })
      }
      
      // Decision type distribution
      const decisionsByType = [
        {
          type: 'Accepted',
          count: decisionMetrics.accepted,
          percentage: Math.round((decisionMetrics.accepted / decisionMetrics.total) * 100),
          color: '#10b981'
        },
        {
          type: 'Rejected', 
          count: decisionMetrics.rejected,
          percentage: Math.round((decisionMetrics.rejected / decisionMetrics.total) * 100),
          color: '#ef4444'
        },
        {
          type: 'Revisions',
          count: decisionMetrics.revisions,
          percentage: Math.round((decisionMetrics.revisions / decisionMetrics.total) * 100),
          color: '#f59e0b'
        }
      ]
      
      // Template usage data
      const templateUsage = [
        {
          templateName: 'Standard Acceptance Letter',
          usageCount: Math.floor(Math.random() * 15) + 5,
          lastUsed: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          templateName: 'Revision Request - Major',
          usageCount: Math.floor(Math.random() * 12) + 3,
          lastUsed: new Date(now.getTime() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          templateName: 'Revision Request - Minor',
          usageCount: Math.floor(Math.random() * 10) + 2,
          lastUsed: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          templateName: 'Standard Rejection Letter',
          usageCount: Math.floor(Math.random() * 8) + 1,
          lastUsed: new Date(now.getTime() - Math.random() * 21 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          templateName: 'Conditional Acceptance',
          usageCount: Math.floor(Math.random() * 6) + 1,
          lastUsed: new Date(now.getTime() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString()
        }
      ].sort((a, b) => b.usageCount - a.usageCount)
      
      // Performance metrics
      const performanceMetrics = {
        avgDecisionTime: decisionMetrics.avgProcessingTime,
        onTimeDecisions: Math.floor(Math.random() * decisionMetrics.total * 0.8) + Math.floor(decisionMetrics.total * 0.1),
        totalDecisions: decisionMetrics.total,
        efficiency: Math.floor(Math.random() * 20) + 75
      }
      
      return {
        decisionMetrics,
        monthlyTrends,
        decisionsByType,
        templateUsage,
        performanceMetrics
      }
    }
    
    const analyticsData = generateSampleData(timeRange)
    
    return NextResponse.json(analyticsData, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
  } catch (error) {
    console.error('Error in editorial-decisions analytics API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}