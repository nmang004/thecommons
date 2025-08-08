import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ trackingId: string }> }
) {
  try {
    const params = await context.params
    const supabase = await createClient()
    const trackingId = params.trackingId
    const url = new URL(request.url)
    const targetUrl = url.searchParams.get('url')

    if (!trackingId) {
      return NextResponse.json({ error: 'Invalid tracking ID' }, { status: 400 })
    }

    if (!targetUrl) {
      return NextResponse.json({ error: 'Missing target URL' }, { status: 400 })
    }

    // Validate the target URL to prevent redirect attacks
    let decodedUrl: string
    try {
      decodedUrl = decodeURIComponent(targetUrl)
      new URL(decodedUrl) // Validate URL format
    } catch (error) {
      return NextResponse.json({ error: 'Invalid target URL' }, { status: 400 })
    }

    // Update invitation tracking record
    const { error } = await supabase
      .from('invitation_tracking')
      .update({
        clicked_at: new Date().toISOString(),
        metadata: {
          clicked_ip: request.headers.get('x-forwarded-for') || 'unknown',
          clicked_user_agent: request.headers.get('user-agent') || 'unknown',
          clicked_url: decodedUrl,
          clicked_at: new Date().toISOString()
        }
      })
      .eq('id', trackingId)
      .is('clicked_at', null) // Only update if not already clicked

    if (error) {
      console.error('Error tracking email click:', error)
    }

    // Redirect to the target URL
    return NextResponse.redirect(decodedUrl, 302)

  } catch (error) {
    console.error('Error in email click tracking:', error)
    
    // Try to redirect to target URL even if tracking fails
    const url = new URL(request.url)
    const targetUrl = url.searchParams.get('url')
    
    if (targetUrl) {
      try {
        const decodedUrl = decodeURIComponent(targetUrl)
        new URL(decodedUrl) // Validate URL
        return NextResponse.redirect(decodedUrl, 302)
      } catch (redirectError) {
        console.error('Error redirecting after tracking failure:', redirectError)
      }
    }

    return NextResponse.json(
      { error: 'Tracking failed and unable to redirect' },
      { status: 500 }
    )
  }
}

// Handle POST requests for tracking without redirect
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ trackingId: string }> }
) {
  try {
    const params = await context.params
    const supabase = await createClient()
    const trackingId = params.trackingId

    if (!trackingId) {
      return NextResponse.json({ error: 'Invalid tracking ID' }, { status: 400 })
    }

    // Update invitation tracking record
    const { error } = await supabase
      .from('invitation_tracking')
      .update({
        clicked_at: new Date().toISOString(),
        metadata: {
          clicked_ip: request.headers.get('x-forwarded-for') || 'unknown',
          clicked_user_agent: request.headers.get('user-agent') || 'unknown',
          clicked_at: new Date().toISOString()
        }
      })
      .eq('id', trackingId)
      .is('clicked_at', null) // Only update if not already clicked

    if (error) {
      console.error('Error tracking email click:', error)
      return NextResponse.json({ error: 'Tracking failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in email click tracking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}