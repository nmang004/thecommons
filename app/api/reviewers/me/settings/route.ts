import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ReviewerSettings } from '@/types/database'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile and settings
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, reviewer_settings')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    if (profile.role !== 'reviewer' && profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Reviewer role required.' },
        { status: 403 }
      )
    }

    // Return current settings with defaults
    const defaultSettings: ReviewerSettings = {
      monthlyCapacity: 3,
      preferredDeadlines: 21,
      blackoutDates: [],
      autoDeclineRules: [],
      workloadPreferences: {
        maxConcurrentReviews: 3,
        preferredFields: [],
        availabilityStatus: 'available',
        notificationPreferences: {
          emailReminders: true,
          deadlineWarnings: true,
          achievementNotifications: true
        }
      }
    }

    const settings = { ...defaultSettings, ...profile.reviewer_settings }

    return NextResponse.json({
      success: true,
      data: settings
    })

  } catch (error) {
    console.error('Settings GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user has reviewer role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, reviewer_settings')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    if (profile.role !== 'reviewer' && profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Reviewer role required.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { settings } = body

    if (!settings) {
      return NextResponse.json(
        { error: 'Settings data required' },
        { status: 400 }
      )
    }

    // Validate settings structure
    if (settings.monthlyCapacity && (settings.monthlyCapacity < 1 || settings.monthlyCapacity > 20)) {
      return NextResponse.json(
        { error: 'Monthly capacity must be between 1 and 20' },
        { status: 400 }
      )
    }

    if (settings.preferredDeadlines && (settings.preferredDeadlines < 7 || settings.preferredDeadlines > 60)) {
      return NextResponse.json(
        { error: 'Preferred deadlines must be between 7 and 60 days' },
        { status: 400 }
      )
    }

    // Validate blackout dates format
    if (settings.blackoutDates && Array.isArray(settings.blackoutDates)) {
      const isValidDates = settings.blackoutDates.every((date: any) => {
        return typeof date === 'string' && !isNaN(Date.parse(date))
      })
      
      if (!isValidDates) {
        return NextResponse.json(
          { error: 'Invalid blackout date format. Use ISO date strings.' },
          { status: 400 }
        )
      }
    }

    // Merge with existing settings
    const currentSettings = profile.reviewer_settings || {}
    const updatedSettings = { ...currentSettings, ...settings }

    // Update profile with new settings
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        reviewer_settings: updatedSettings,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select('reviewer_settings')
      .single()

    if (updateError) {
      console.error('Settings update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      )
    }

    // Update availability status if changed
    if (settings.workloadPreferences?.availabilityStatus) {
      const { error: availabilityError } = await supabase
        .from('profiles')
        .update({
          availability_status: settings.workloadPreferences.availabilityStatus
        })
        .eq('id', user.id)
      
      if (availabilityError) {
        console.warn('Failed to update availability status:', availabilityError)
      }
    }

    // Log the settings change for audit purposes
    const { error: auditError } = await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'reviewer_settings_updated',
        details: {
          changes: Object.keys(settings),
          timestamp: new Date().toISOString()
        }
      })

    if (auditError) {
      console.warn('Failed to log settings update:', auditError)
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data: updatedProfile.reviewer_settings
    })

  } catch (error) {
    console.error('Settings PATCH API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}