import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const assignmentId = params.id
    const body = await request.json()
    const { decline_reason } = body

    // Use the same authentication method as the dashboard API
    const cookieStore = await import('next/headers').then(m => m.cookies())
    const sessionCookie = (await cookieStore).get('auth-session')
    
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    let sessionData
    try {
      sessionData = JSON.parse(sessionCookie.value)
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Check if session is expired
    const now = new Date()
    const expiresAt = new Date(sessionData.expires)
    if (expiresAt < now) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Get user profile from Supabase using Auth0 ID
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('auth0_id', sessionData.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Verify user has reviewer role
    if (profile.role !== 'reviewer' && profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Reviewer role required.' },
        { status: 403 }
      )
    }

    // For demo purposes, since we're using hardcoded data, we'll just return success
    // In production, this would update the review_assignments table:
    /*
    const { data: updatedAssignment, error: updateError } = await supabase
      .from('review_assignments')
      .update({
        status: 'declined',
        responded_at: new Date().toISOString(),
        decline_reason: decline_reason || 'No reason provided'
      })
      .eq('id', assignmentId)
      .eq('reviewer_id', profile.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to decline review assignment' },
        { status: 500 }
      )
    }
    */

    // Return success response for demo
    return NextResponse.json({
      success: true,
      message: 'Review declined successfully',
      assignmentId,
      decline_reason
    })

  } catch (error) {
    console.error('Decline review API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}