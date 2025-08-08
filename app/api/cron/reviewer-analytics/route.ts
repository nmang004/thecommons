import { NextRequest, NextResponse } from 'next/server'
import { reviewerAnalyticsService } from '@/lib/services/reviewer-analytics-service'

export async function POST(request: NextRequest) {
  try {
    // Verify this is a cron job request (check for cron secret or Vercel cron header)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    const vercelCronSecret = request.headers.get('x-vercel-cron-secret')

    if ((!cronSecret || authHeader !== `Bearer ${cronSecret}`) && 
        (!vercelCronSecret || vercelCronSecret !== process.env.CRON_SECRET)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const startTime = Date.now()
    console.log('Starting reviewer analytics update job...')

    // Update analytics for all reviewers
    const results = await reviewerAnalyticsService.updateAllReviewerAnalytics()

    const endTime = Date.now()
    const duration = endTime - startTime

    console.log(`Reviewer analytics update completed in ${duration}ms`)
    console.log(`Results: ${results.success} success, ${results.failed} failed`)

    return NextResponse.json({
      success: true,
      message: 'Reviewer analytics updated successfully',
      stats: {
        duration: `${duration}ms`,
        successful: results.success,
        failed: results.failed,
        total: results.success + results.failed
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in reviewer analytics cron job:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint for manual triggering (admin only)
export async function GET(request: NextRequest) {
  try {
    // This would require admin authentication in production
    const searchParams = request.nextUrl.searchParams
    const adminKey = searchParams.get('key')
    
    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin key required.' },
        { status: 401 }
      )
    }

    // Manually trigger the analytics update
    return await POST(request)

  } catch (error) {
    console.error('Error in manual analytics trigger:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}