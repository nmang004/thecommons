import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ReviewerDashboard, ReviewAssignment, Badge, DateRange, AutoDeclineRule } from '@/types/database'

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

    // Fetch data in parallel for optimal performance
    const [
      reviewAssignmentsResult,
      reviewerAnalyticsResult,
      profileBadgesResult,
      workloadHistoryResult
    ] = await Promise.all([
      // Get review assignments with manuscript details
      supabase
        .from('review_assignments')
        .select(`
          *,
          manuscripts(id, title, abstract, field_of_study, submitted_at),
          profiles!assigned_by(full_name)
        `)
        .eq('reviewer_id', user.id)
        .order('invited_at', { ascending: false })
        .limit(50),

      // Get reviewer analytics
      supabase
        .from('reviewer_analytics')
        .select('*')
        .eq('reviewer_id', user.id)
        .single(),

      // Get profile badges with badge details
      supabase
        .from('profile_badges')
        .select(`
          *,
          badges(*)
        `)
        .eq('profile_id', user.id)
        .order('awarded_at', { ascending: false }),

      // Get recent workload history
      supabase
        .from('reviewer_workload_history')
        .select('*')
        .eq('reviewer_id', user.id)
        .order('date', { ascending: false })
        .limit(30)
    ])

    // Handle potential errors
    const reviewAssignments = reviewAssignmentsResult.data || []
    const analytics = reviewerAnalyticsResult.data
    const profileBadges = profileBadgesResult.data || []
    const workloadHistory = workloadHistoryResult.data || []

    // Process review assignments into queue categories
    const queue = {
      pending: reviewAssignments.filter((assignment: any) => assignment.status === 'invited'),
      inProgress: reviewAssignments.filter((assignment: any) => assignment.status === 'accepted'),
      completed: reviewAssignments.filter((assignment: any) => assignment.status === 'completed'),
      declined: reviewAssignments.filter((assignment: any) => assignment.status === 'declined')
    }

    // Extract badges from profile_badges
    const recognition = profileBadges
      .map((pb: any) => pb.badges)
      .filter(Boolean)
      .sort((a: any, b: any) => {
        const rarityOrder = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 }
        return (rarityOrder[b.rarity as keyof typeof rarityOrder] || 0) - 
               (rarityOrder[a.rarity as keyof typeof rarityOrder] || 0)
      })

    // Process reviewer settings
    const reviewerSettings = profile.reviewer_settings || {
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

    // Get current workload
    const currentWorkload = workloadHistory[0]
    const currentAssignments = currentWorkload?.active_reviews || 0

    // Process blackout dates
    const blackoutDates: DateRange[] = reviewerSettings.blackoutDates?.map((date: string) => ({
      startDate: date,
      endDate: date
    })) || []

    // Mock professional development data (would be from actual tables in production)
    const mockDevelopment = {
      reviewTraining: [
        {
          id: '1',
          title: 'Peer Review Excellence',
          description: 'Advanced techniques for thorough manuscript review',
          duration: '2 hours',
          status: 'completed' as const,
          completedAt: '2024-01-15'
        },
        {
          id: '2',
          title: 'Statistical Analysis in Reviews',
          description: 'How to evaluate statistical methods and results',
          duration: '1.5 hours',
          status: 'in_progress' as const
        }
      ],
      certifications: [
        {
          id: '1',
          name: 'Certified Peer Reviewer',
          issuedBy: 'The Commons',
          issuedAt: '2024-01-20',
          credentialUrl: 'https://credentials.thecommons.org/reviewer/cert-001'
        }
      ],
      mentorshipProgram: {
        role: 'mentor' as const,
        activeMentorships: 2,
        completedMentorships: 5,
        averageRating: 4.8
      },
      reviewFeedback: []
    }

    // Construct comprehensive dashboard response
    const dashboard: ReviewerDashboard = {
      queue,
      analytics: {
        totalReviews: analytics?.total_reviews_completed || 0,
        averageReviewTime: analytics?.average_review_time_days || 0,
        acceptanceRate: analytics?.acceptance_rate || 0,
        qualityScore: analytics?.average_quality_score || 0,
        timeliness: analytics?.on_time_completion_rate || 0,
        recognition
      },
      workload: {
        currentAssignments,
        monthlyCapacity: reviewerSettings.monthlyCapacity,
        blackoutDates,
        preferredDeadlines: reviewerSettings.preferredDeadlines,
        autoDeclineRules: reviewerSettings.autoDeclineRules || []
      },
      development: mockDevelopment
    }

    return NextResponse.json({
      success: true,
      data: dashboard
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}