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

    if (!trackingId) {
      return new NextResponse('Invalid tracking ID', { status: 400 })
    }

    // Update invitation tracking record
    const { error } = await supabase
      .from('invitation_tracking')
      .update({
        opened_at: new Date().toISOString(),
        metadata: {
          opened_ip: request.headers.get('x-forwarded-for') || 'unknown',
          opened_user_agent: request.headers.get('user-agent') || 'unknown',
          opened_at: new Date().toISOString()
        }
      })
      .eq('id', trackingId)
      .is('opened_at', null) // Only update if not already opened

    if (error) {
      console.error('Error tracking email open:', error)
    }

    // Return a 1x1 transparent pixel
    const pixel = Buffer.from([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
      0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x21,
      0xF9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2C, 0x00, 0x00,
      0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x0C,
      0x0A, 0x00, 0x3B
    ])

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Content-Length': pixel.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Error in email open tracking:', error)
    
    // Still return a pixel even if tracking fails
    const pixel = Buffer.from([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
      0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x21,
      0xF9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2C, 0x00, 0x00,
      0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x0C,
      0x0A, 0x00, 0x3B
    ])

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Content-Length': pixel.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  }
}