import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

/**
 * POST /api/reviewers/complete-onboarding
 * Complete reviewer onboarding process
 */
export async function POST(request: NextRequest) {
  try {
    // Use the same authentication method as existing API routes
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('auth-session')
    
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { error: 'Authentication required' },
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
    
    if (now >= expiresAt) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      )
    }

    const userId = sessionData.user.id

    const { user_id } = await request.json()

    // Verify user ID matches session
    if (user_id !== userId) {
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', userId)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Update reviewer profile with onboarding completion
    const { error: updateError } = await supabase
      .from('reviewer_profile')
      .upsert({
        profile_id: userProfile.id,
        availability_status: 'available',
        max_reviews_per_month: 3, // Default moderate workload
        preferred_turnaround_days: 21,
        last_activity_date: new Date().toISOString(),
        onboarding_completed_at: new Date().toISOString()
      }, {
        onConflict: 'profile_id'
      })

    if (updateError) {
      console.error('Error updating reviewer profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to update reviewer profile' },
        { status: 500 }
      )
    }

    // Note: All role and preference management is handled in Supabase
    // Auth0 is only used for authentication, not role/metadata storage

    // Log onboarding completion
    await supabase
      .from('activity_logs')
      .insert({
        user_id: userProfile.id,
        action: 'reviewer_onboarding_completed',
        details: {
          completed_at: new Date().toISOString(),
          initial_settings: {
            availability_status: 'available',
            max_reviews_per_month: 3
          }
        }
      })

    // Send welcome notification
    try {
      await fetch(`${process.env.NEXTAUTH_URL}/api/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reviewer_onboarding_complete',
          recipient_id: userProfile.id,
          data: {
            reviewer_name: userProfile.full_name || userProfile.email,
            dashboard_url: '/reviewer'
          }
        })
      })
    } catch (notificationError) {
      console.error('Welcome notification error:', notificationError)
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      redirect_url: '/reviewer'
    })

  } catch (error) {
    console.error('Complete onboarding API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/reviewers/complete-onboarding
 * Check onboarding status for current user
 */
export async function GET(_request: NextRequest) {
  try {
    // Use the same authentication method as existing API routes
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('auth-session')
    
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { error: 'Authentication required' },
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
    
    if (now >= expiresAt) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      )
    }

    const userId = sessionData.user.id
    const supabase = await createClient()

    // Get user's onboarding status
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        id,
        reviewer_profile (
          onboarding_completed_at,
          availability_status,
          max_reviews_per_month
        )
      `)
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Onboarding status check error:', error)
      return NextResponse.json(
        { error: 'Failed to check onboarding status' },
        { status: 500 }
      )
    }

    const reviewerProfile = profile.reviewer_profile as any
    const isOnboardingComplete = !!reviewerProfile?.onboarding_completed_at

    return NextResponse.json({
      onboarding_complete: isOnboardingComplete,
      completed_at: reviewerProfile?.onboarding_completed_at,
      current_settings: {
        availability_status: reviewerProfile?.availability_status || 'unknown',
        max_reviews_per_month: reviewerProfile?.max_reviews_per_month || 0
      }
    })

  } catch (error) {
    console.error('Onboarding status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}