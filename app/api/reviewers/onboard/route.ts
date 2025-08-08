import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface OnboardingRequest {
  userId: string
  profile: {
    expertise: string[]
    orcid?: string
    h_index?: number
    total_publications?: number
    preferred_fields?: string[]
    bio?: string
    availability_status?: string
    max_concurrent_reviews?: number
    review_preferences?: {
      notification_frequency: string
      review_types: string[]
      time_commitment_hours: number
    }
  }
  onboardingCompleted: boolean
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    let requestData: OnboardingRequest
    try {
      requestData = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Validate user can update this profile
    if (requestData.userId !== user.id) {
      return NextResponse.json(
        { error: 'Can only update your own profile' },
        { status: 403 }
      )
    }

    // Validate required fields
    if (!requestData.profile.expertise || requestData.profile.expertise.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 expertise areas are required' },
        { status: 400 }
      )
    }

    if (!requestData.profile.bio || requestData.profile.bio.length < 100) {
      return NextResponse.json(
        { error: 'Bio must be at least 100 characters' },
        { status: 400 }
      )
    }

    // Verify user exists and is a reviewer
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, onboarding_status')
      .eq('id', user.id)
      .single()

    if (profileError || !existingProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    if (existingProfile.role !== 'reviewer') {
      return NextResponse.json(
        { error: 'Only reviewer accounts can complete reviewer onboarding' },
        { status: 403 }
      )
    }

    // Update profile with onboarding data
    const updateData: any = {
      expertise: requestData.profile.expertise,
      bio: requestData.profile.bio,
      orcid: requestData.profile.orcid || null,
      h_index: requestData.profile.h_index || null,
      total_publications: requestData.profile.total_publications || null,
      preferred_fields: requestData.profile.preferred_fields || [],
      availability_status: requestData.profile.availability_status || 'available',
      max_concurrent_reviews: requestData.profile.max_concurrent_reviews || 2,
      reviewer_preferences: requestData.profile.review_preferences || {},
      onboarding_status: requestData.onboardingCompleted ? 'completed' : 'in_progress',
      profile_updated_at: new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    // Initialize reviewer performance metrics if completing onboarding
    if (requestData.onboardingCompleted) {
      const { error: metricsError } = await supabase
        .from('reviewer_performance_metrics')
        .upsert({
          reviewer_id: user.id,
          period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of current month
          period_end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), // End of current month
          invitations_received: 0,
          invitations_accepted: 0,
          reviews_completed: 0,
          reviews_completed_on_time: 0,
          reliability_score: 1.0, // Start with perfect score
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'reviewer_id,period_start,period_end'
        })

      if (metricsError) {
        console.error('Error initializing performance metrics:', metricsError)
        // Don't fail the request, just log the error
      }

      // Set initial availability
      const { error: availabilityError } = await supabase
        .from('reviewer_availability')
        .upsert({
          reviewer_id: user.id,
          available_from: new Date(),
          max_reviews: requestData.profile.max_concurrent_reviews || 2,
          preferred_fields: requestData.profile.preferred_fields || [],
          notes: 'Initial availability set during onboarding',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'reviewer_id'
        })

      if (availabilityError) {
        console.error('Error setting availability:', availabilityError)
        // Don't fail the request, just log the error
      }

      // Log the completion activity
      await supabase
        .from('manuscript_activity_log')
        .insert({
          manuscript_id: null, // Global activity
          user_id: user.id,
          activity_type: 'reviewer_onboarding_completed',
          details: {
            expertise_areas: requestData.profile.expertise.length,
            bio_length: requestData.profile.bio.length,
            has_orcid: !!requestData.profile.orcid,
            has_h_index: !!requestData.profile.h_index,
            max_concurrent_reviews: requestData.profile.max_concurrent_reviews,
            notification_frequency: requestData.profile.review_preferences?.notification_frequency
          },
          created_at: new Date().toISOString()
        })
    }

    // Get updated profile to return
    const { data: updatedProfile, error: fetchError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        role,
        expertise,
        bio,
        orcid,
        h_index,
        total_publications,
        preferred_fields,
        availability_status,
        max_concurrent_reviews,
        reviewer_preferences,
        onboarding_status,
        created_at,
        profile_updated_at
      `)
      .eq('id', user.id)
      .single()

    if (fetchError) {
      console.error('Error fetching updated profile:', fetchError)
      // Still return success since the update worked
    }

    return NextResponse.json({
      success: true,
      message: requestData.onboardingCompleted 
        ? 'Reviewer onboarding completed successfully'
        : 'Profile updated successfully',
      profile: updatedProfile,
      onboardingCompleted: requestData.onboardingCompleted
    })

  } catch (error) {
    console.error('Error in reviewer onboarding:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get onboarding status and progress
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        role,
        expertise,
        bio,
        orcid,
        h_index,
        total_publications,
        preferred_fields,
        availability_status,
        max_concurrent_reviews,
        reviewer_preferences,
        onboarding_status,
        created_at,
        profile_updated_at
      `)
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Check onboarding completeness
    const onboardingChecks = {
      hasExpertise: profile.expertise && profile.expertise.length >= 2,
      hasBio: profile.bio && profile.bio.length >= 100,
      hasPreferences: profile.reviewer_preferences && 
                     Object.keys(profile.reviewer_preferences).length > 0,
      isReviewer: profile.role === 'reviewer'
    }

    const onboardingComplete = Object.values(onboardingChecks).every(check => check)
    const completedSteps = Object.values(onboardingChecks).filter(check => check).length
    const totalSteps = Object.keys(onboardingChecks).length

    return NextResponse.json({
      success: true,
      profile,
      onboarding: {
        status: profile.onboarding_status || 'not_started',
        isComplete: onboardingComplete,
        completedSteps,
        totalSteps,
        progress: Math.round((completedSteps / totalSteps) * 100),
        checks: onboardingChecks,
        nextStep: !onboardingChecks.isReviewer ? 'role_setup' :
                  !onboardingChecks.hasExpertise ? 'expertise' :
                  !onboardingChecks.hasBio ? 'bio' :
                  !onboardingChecks.hasPreferences ? 'preferences' : 'complete'
      }
    })

  } catch (error) {
    console.error('Error getting onboarding status:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}