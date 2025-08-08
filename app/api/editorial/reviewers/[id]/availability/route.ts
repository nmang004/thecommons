import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ReviewerAvailabilityResponse } from '@/types/editorial'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is editor or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['editor', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const reviewerId = params.id

    // Verify reviewer exists and is active
    const { data: reviewer, error: reviewerError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        affiliation,
        role,
        reviewer_profile(
          specializations,
          max_reviews_per_month,
          preferred_turnaround_days,
          availability_status,
          last_activity_date
        )
      `)
      .eq('id', reviewerId)
      .single()

    if (reviewerError || !reviewer || reviewer.role !== 'reviewer') {
      return NextResponse.json(
        { error: 'Reviewer not found' },
        { status: 404 }
      )
    }

    // Get current active review assignments
    const { data: activeReviews, error: activeReviewsError } = await supabase
      .from('review_assignments')
      .select(`
        id,
        status,
        invited_at,
        due_date,
        manuscripts(id, title, field_of_study)
      `)
      .eq('reviewer_id', reviewerId)
      .in('status', ['invited', 'accepted', 'in_progress'])
      .order('invited_at', { ascending: false })

    if (activeReviewsError) {
      console.error('Error fetching active reviews:', activeReviewsError)
      return NextResponse.json(
        { error: 'Failed to fetch reviewer data' },
        { status: 500 }
      )
    }

    // Get recent review history (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data: recentReviews, error: recentReviewsError } = await supabase
      .from('review_assignments')
      .select(`
        id,
        status,
        invited_at,
        due_date,
        completed_at,
        manuscripts(id, title, field_of_study)
      `)
      .eq('reviewer_id', reviewerId)
      .gte('invited_at', sixMonthsAgo.toISOString())
      .order('invited_at', { ascending: false })

    if (recentReviewsError) {
      console.error('Error fetching recent reviews:', recentReviewsError)
    }

    // Get pending invitations
    const { data: pendingInvitations, error: invitationsError } = await supabase
      .from('reviewer_invitations')
      .select(`
        id,
        invitation_status,
        review_deadline,
        response_deadline,
        manuscripts(id, title, field_of_study)
      `)
      .eq('reviewer_id', reviewerId)
      .eq('invitation_status', 'pending')

    if (invitationsError) {
      console.error('Error fetching pending invitations:', invitationsError)
    }

    // Calculate availability metrics
    const currentReviews = activeReviews?.length || 0
    const pendingInvitationsCount = pendingInvitations?.length || 0
    const totalCurrentLoad = currentReviews + pendingInvitationsCount

    const maxReviews = reviewer.reviewer_profile?.max_reviews_per_month || 3
    const preferredTurnaroundDays = reviewer.reviewer_profile?.preferred_turnaround_days || 21
    const availabilityStatus = reviewer.reviewer_profile?.availability_status || 'available'

    // Determine if reviewer is available
    const isOverloaded = totalCurrentLoad >= maxReviews
    const isUnavailable = availabilityStatus === 'unavailable' || availabilityStatus === 'on_leave'
    const isAvailable = !isOverloaded && !isUnavailable

    // Calculate next available date
    let nextAvailableDate = new Date()
    if (!isAvailable) {
      if (isOverloaded && activeReviews && activeReviews.length > 0) {
        // Find the earliest due date
        const earliestDue = activeReviews.reduce((earliest, review) => {
          const dueDate = new Date(review.due_date)
          return dueDate < earliest ? dueDate : earliest
        }, new Date(activeReviews[0].due_date))
        
        nextAvailableDate = new Date(earliestDue)
        nextAvailableDate.setDate(nextAvailableDate.getDate() + 7) // Add buffer
      } else if (isUnavailable) {
        // If manually set to unavailable, estimate 30 days
        nextAvailableDate.setDate(nextAvailableDate.getDate() + 30)
      }
    }

    // Calculate performance metrics
    const completedReviews = recentReviews?.filter(r => r.status === 'completed') || []
    const avgTurnaroundTime = completedReviews.length > 0 ? 
      completedReviews.reduce((sum, review) => {
        if (review.completed_at && review.invited_at) {
          const days = Math.floor(
            (new Date(review.completed_at).getTime() - new Date(review.invited_at).getTime()) / 
            (1000 * 60 * 60 * 24)
          )
          return sum + days
        }
        return sum
      }, 0) / completedReviews.length : null

    // Get specializations
    const specializations = reviewer.reviewer_profile?.specializations || []

    // Format recent manuscripts for response
    const recentManuscripts = (activeReviews || []).map(review => ({
      id: review.manuscripts?.id || '',
      title: review.manuscripts?.title || '',
      status: review.status,
      assignedDate: new Date(review.invited_at),
      dueDate: review.due_date ? new Date(review.due_date) : null,
      fieldOfStudy: review.manuscripts?.field_of_study
    }))

    const availabilityResponse: ReviewerAvailabilityResponse = {
      reviewerId,
      isAvailable,
      currentReviews: totalCurrentLoad,
      maxReviews,
      nextAvailableDate: isAvailable ? undefined : nextAvailableDate,
      specializations,
      recentManuscripts
    }

    // Additional metadata for editorial decision making
    const additionalInfo = {
      reviewer: {
        name: reviewer.full_name,
        email: reviewer.email,
        affiliation: reviewer.affiliation
      },
      workload: {
        active_reviews: currentReviews,
        pending_invitations: pendingInvitationsCount,
        completed_last_6_months: completedReviews.length,
        average_turnaround_days: avgTurnaroundTime ? Math.round(avgTurnaroundTime) : null,
        preferred_turnaround_days: preferredTurnaroundDays
      },
      availability: {
        status: availabilityStatus,
        is_overloaded: isOverloaded,
        capacity_remaining: Math.max(0, maxReviews - totalCurrentLoad),
        last_activity: reviewer.reviewer_profile?.last_activity_date
      },
      recent_activity: {
        total_reviews_6_months: recentReviews?.length || 0,
        completed_reviews_6_months: completedReviews.length,
        completion_rate: recentReviews?.length ? 
          Math.round((completedReviews.length / recentReviews.length) * 100) : null,
        on_time_completion_rate: completedReviews.length > 0 ?
          Math.round((completedReviews.filter(r => 
            r.completed_at && r.due_date && 
            new Date(r.completed_at) <= new Date(r.due_date)
          ).length / completedReviews.length) * 100) : null
      }
    }

    return NextResponse.json({
      ...availabilityResponse,
      ...additionalInfo
    })

  } catch (error) {
    console.error('Reviewer availability API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH endpoint to update reviewer availability status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin or the reviewer themselves
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const reviewerId = params.id
    const canModify = profile?.role === 'admin' || user.id === reviewerId

    if (!canModify) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const updateData = await request.json()
    const { availability_status, max_reviews_per_month, preferred_turnaround_days } = updateData

    // Validate availability status
    const validStatuses = ['available', 'busy', 'unavailable', 'on_leave']
    if (availability_status && !validStatuses.includes(availability_status)) {
      return NextResponse.json(
        { error: 'Invalid availability status' },
        { status: 400 }
      )
    }

    // Update reviewer profile
    const updates: any = {}
    if (availability_status) updates.availability_status = availability_status
    if (max_reviews_per_month) updates.max_reviews_per_month = max_reviews_per_month
    if (preferred_turnaround_days) updates.preferred_turnaround_days = preferred_turnaround_days

    const { error: updateError } = await supabase
      .from('reviewer_profile')
      .update(updates)
      .eq('profile_id', reviewerId)

    if (updateError) {
      console.error('Error updating reviewer availability:', updateError)
      return NextResponse.json(
        { error: 'Failed to update availability' },
        { status: 500 }
      )
    }

    // Log the change if done by admin
    if (profile?.role === 'admin' && user.id !== reviewerId) {
      await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          action: 'reviewer_availability_updated',
          details: {
            reviewer_id: reviewerId,
            updates: updates,
            updated_by_admin: true
          }
        })
    }

    return NextResponse.json({
      success: true,
      message: 'Reviewer availability updated successfully',
      updates
    })

  } catch (error) {
    console.error('Update reviewer availability API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}