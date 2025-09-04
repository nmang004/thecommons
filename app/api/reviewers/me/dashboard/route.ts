import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ReviewerDashboard, DateRange, AssignmentStatus } from '@/types/database'

export async function GET(_request: NextRequest) {
  try {
    // Use the same authentication method as the profile API
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

    // TODO: Remove hardcoded sample data and uncomment database queries below when ready for production
    
    // Fetch data in parallel for optimal performance (COMMENTED OUT FOR DEMO)
    /*
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
        .eq('reviewer_id', profile.id)
        .order('invited_at', { ascending: false })
        .limit(50),

      // Get reviewer analytics
      supabase
        .from('reviewer_analytics')
        .select('*')
        .eq('reviewer_id', profile.id)
        .single(),

      // Get profile badges with badge details
      supabase
        .from('profile_badges')
        .select(`
          *,
          badges(*)
        `)
        .eq('profile_id', profile.id)
        .order('awarded_at', { ascending: false }),

      // Get recent workload history
      supabase
        .from('reviewer_workload_history')
        .select('*')
        .eq('reviewer_id', profile.id)
        .order('date', { ascending: false })
        .limit(30)
    ])

    // Handle potential errors
    const reviewAssignments = reviewAssignmentsResult.data || []
    const analytics = reviewerAnalyticsResult.data
    const profileBadges = profileBadgesResult.data || []
    const workloadHistory = workloadHistoryResult.data || []
    */

    // HARDCODED SAMPLE DATA FOR DEMO PURPOSES
    const reviewAssignments = [
      // Pending Reviews (3)
      {
        id: 'ra_001',
        manuscript_id: 'ms_001',
        reviewer_id: profile.id,
        assigned_by: 'editor_001',
        status: 'invited' as AssignmentStatus,
        invited_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
        reminder_count: 0,
        manuscripts: {
          id: 'ms_001',
          title: 'Machine Learning Approaches to Climate Change Prediction: A Comprehensive Analysis',
          abstract: 'This paper presents novel machine learning algorithms for predicting climate patterns with unprecedented accuracy. Our research demonstrates significant improvements over traditional meteorological models through deep learning techniques applied to satellite data and atmospheric measurements.',
          field_of_study: 'Environmental Science',
          submitted_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        profiles: {
          full_name: 'Dr. Sarah Mitchell'
        }
      },
      {
        id: 'ra_002',
        manuscript_id: 'ms_002',
        reviewer_id: profile.id,
        assigned_by: 'editor_002',
        status: 'invited' as AssignmentStatus,
        invited_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days from now
        reminder_count: 0,
        manuscripts: {
          id: 'ms_002',
          title: 'Quantum Computing Applications in Cryptography: Post-Quantum Security Protocols',
          abstract: 'With the advent of quantum computing, traditional cryptographic methods face unprecedented challenges. This study explores quantum-resistant cryptographic protocols and their implementation in modern security systems.',
          field_of_study: 'Computer Science',
          submitted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        profiles: {
          full_name: 'Prof. James Chen'
        }
      },
      {
        id: 'ra_003',
        manuscript_id: 'ms_003',
        reviewer_id: profile.id,
        assigned_by: 'editor_003',
        status: 'invited' as AssignmentStatus,
        invited_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now (urgent)
        reminder_count: 1,
        manuscripts: {
          id: 'ms_003',
          title: 'Neural Network Architectures for Medical Image Analysis in Oncology',
          abstract: 'Recent advances in convolutional neural networks have shown promising results in medical imaging. This research focuses on developing specialized architectures for cancer detection and tumor classification using radiological imaging data.',
          field_of_study: 'Medical AI',
          submitted_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        profiles: {
          full_name: 'Dr. Maria Rodriguez'
        }
      },
      
      // In-Progress Reviews (2)
      {
        id: 'ra_004',
        manuscript_id: 'ms_004',
        reviewer_id: profile.id,
        assigned_by: 'editor_001',
        status: 'accepted' as AssignmentStatus,
        invited_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        responded_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        due_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days from now
        reminder_count: 0,
        manuscripts: {
          id: 'ms_004',
          title: 'Sustainable Energy Storage Solutions: Advanced Battery Technologies',
          abstract: 'This comprehensive review examines cutting-edge battery technologies for renewable energy storage, including lithium-ion improvements, solid-state batteries, and emerging alternatives like sodium-ion and flow batteries.',
          field_of_study: 'Materials Science',
          submitted_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
        },
        profiles: {
          full_name: 'Dr. Sarah Mitchell'
        }
      },
      {
        id: 'ra_005',
        manuscript_id: 'ms_005',
        reviewer_id: profile.id,
        assigned_by: 'editor_004',
        status: 'accepted' as AssignmentStatus,
        invited_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        responded_at: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        reminder_count: 0,
        manuscripts: {
          id: 'ms_005',
          title: 'Biodiversity Conservation in Urban Ecosystems: Policy and Practice',
          abstract: 'Urban development poses significant challenges to biodiversity conservation. This study analyzes successful urban conservation strategies and proposes evidence-based policy recommendations for sustainable city planning.',
          field_of_study: 'Ecology',
          submitted_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
        },
        profiles: {
          full_name: 'Prof. David Kim'
        }
      },
      
      // Completed Reviews (5)
      {
        id: 'ra_006',
        manuscript_id: 'ms_006',
        reviewer_id: profile.id,
        assigned_by: 'editor_002',
        status: 'completed' as AssignmentStatus,
        invited_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        responded_at: new Date(Date.now() - 43 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        due_date: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString(),
        reminder_count: 0,
        manuscripts: {
          id: 'ms_006',
          title: 'Advanced Robotics in Manufacturing: Industry 4.0 Implementation',
          abstract: 'The integration of advanced robotics in manufacturing processes represents a paradigm shift in industrial automation. This research examines the implementation challenges and benefits of Industry 4.0 technologies.',
          field_of_study: 'Engineering',
          submitted_at: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString()
        },
        profiles: {
          full_name: 'Prof. James Chen'
        }
      },
      {
        id: 'ra_007',
        manuscript_id: 'ms_007',
        reviewer_id: profile.id,
        assigned_by: 'editor_005',
        status: 'completed' as AssignmentStatus,
        invited_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        responded_at: new Date(Date.now() - 58 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
        due_date: new Date(Date.now() - 34 * 24 * 60 * 60 * 1000).toISOString(),
        reminder_count: 1,
        manuscripts: {
          id: 'ms_007',
          title: 'Social Media Impact on Mental Health: A Longitudinal Study',
          abstract: 'This longitudinal study examines the correlation between social media usage patterns and mental health outcomes across diverse demographic groups over a three-year period.',
          field_of_study: 'Psychology',
          submitted_at: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString()
        },
        profiles: {
          full_name: 'Dr. Lisa Thompson'
        }
      },
      {
        id: 'ra_008',
        manuscript_id: 'ms_008',
        reviewer_id: profile.id,
        assigned_by: 'editor_001',
        status: 'completed' as AssignmentStatus,
        invited_at: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString(),
        responded_at: new Date(Date.now() - 78 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        due_date: new Date(Date.now() - 59 * 24 * 60 * 60 * 1000).toISOString(),
        reminder_count: 0,
        manuscripts: {
          id: 'ms_008',
          title: 'Gene Therapy Advances in Treating Rare Genetic Disorders',
          abstract: 'Recent breakthroughs in gene therapy offer new hope for treating rare genetic disorders. This review analyzes current clinical trials and their implications for future therapeutic approaches.',
          field_of_study: 'Genetics',
          submitted_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
        },
        profiles: {
          full_name: 'Dr. Sarah Mitchell'
        }
      },
      {
        id: 'ra_009',
        manuscript_id: 'ms_009',
        reviewer_id: profile.id,
        assigned_by: 'editor_003',
        status: 'completed' as AssignmentStatus,
        invited_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
        responded_at: new Date(Date.now() - 98 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000).toISOString(),
        due_date: new Date(Date.now() - 84 * 24 * 60 * 60 * 1000).toISOString(),
        reminder_count: 0,
        manuscripts: {
          id: 'ms_009',
          title: 'Blockchain Technology in Supply Chain Management: Security and Efficiency',
          abstract: 'Blockchain technology promises to revolutionize supply chain management through enhanced security and transparency. This study evaluates real-world implementations and their business impacts.',
          field_of_study: 'Information Systems',
          submitted_at: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000).toISOString()
        },
        profiles: {
          full_name: 'Prof. David Kim'
        }
      },
      {
        id: 'ra_010',
        manuscript_id: 'ms_010',
        reviewer_id: profile.id,
        assigned_by: 'editor_006',
        status: 'completed' as AssignmentStatus,
        invited_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        responded_at: new Date(Date.now() - 118 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
        due_date: new Date(Date.now() - 99 * 24 * 60 * 60 * 1000).toISOString(),
        reminder_count: 0,
        manuscripts: {
          id: 'ms_010',
          title: 'Climate Change Adaptation Strategies for Coastal Communities',
          abstract: 'Rising sea levels and increased storm intensity pose significant threats to coastal communities worldwide. This research examines effective adaptation strategies and their socioeconomic implications.',
          field_of_study: 'Environmental Policy',
          submitted_at: new Date(Date.now() - 130 * 24 * 60 * 60 * 1000).toISOString()
        },
        profiles: {
          full_name: 'Dr. Maria Rodriguez'
        }
      },
      
      // Declined Review (1)
      {
        id: 'ra_011',
        manuscript_id: 'ms_011',
        reviewer_id: profile.id,
        assigned_by: 'editor_007',
        status: 'declined' as AssignmentStatus,
        invited_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        responded_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        decline_reason: 'Conflict of interest - have collaborated with authors recently',
        reminder_count: 0,
        manuscripts: {
          id: 'ms_011',
          title: 'Artificial Intelligence Ethics in Healthcare Decision Making',
          abstract: 'As AI systems become more prevalent in healthcare, ethical considerations become paramount. This paper examines the moral implications of AI-assisted medical decision making.',
          field_of_study: 'Medical Ethics',
          submitted_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
        },
        profiles: {
          full_name: 'Prof. Emily Watson'
        }
      }
    ]

    const analytics = {
      total_reviews_completed: 42,
      average_review_time_days: 18.5,
      acceptance_rate: 0.91,
      average_quality_score: 4.7,
      on_time_completion_rate: 0.88
    }

    const profileBadges = [
      {
        id: 'pb_001',
        profile_id: profile.id,
        badge_id: 'badge_001',
        awarded_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        badges: {
          id: 'badge_001',
          name: 'Expert Reviewer',
          description: 'Completed 25+ high-quality reviews',
          category: 'volume',
          color: '#2563eb',
          rarity: 'rare',
          criteria: { min_reviews: 25, min_quality: 4.0 },
          is_active: true,
          is_public: true,
          sort_order: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      },
      {
        id: 'pb_002',
        profile_id: profile.id,
        badge_id: 'badge_002',
        awarded_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        badges: {
          id: 'badge_002',
          name: 'Quality Guardian',
          description: 'Maintained 4.5+ average quality score',
          category: 'quality',
          color: '#dc2626',
          rarity: 'epic',
          criteria: { min_quality: 4.5, min_reviews: 10 },
          is_active: true,
          is_public: true,
          sort_order: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      },
      {
        id: 'pb_003',
        profile_id: profile.id,
        badge_id: 'badge_003',
        awarded_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        badges: {
          id: 'badge_003',
          name: 'Timely Reviewer',
          description: 'Submitted 90%+ of reviews on time',
          category: 'timeliness',
          color: '#059669',
          rarity: 'uncommon',
          criteria: { min_timeliness: 0.9, min_reviews: 15 },
          is_active: true,
          is_public: true,
          sort_order: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      },
      {
        id: 'pb_004',
        profile_id: profile.id,
        badge_id: 'badge_004',
        awarded_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        badges: {
          id: 'badge_004',
          name: 'Multi-Disciplinary',
          description: 'Reviewed papers in 5+ different fields',
          category: 'expertise',
          color: '#7c2d12',
          rarity: 'rare',
          criteria: { min_fields: 5, min_reviews: 20 },
          is_active: true,
          is_public: true,
          sort_order: 4,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      },
      {
        id: 'pb_005',
        profile_id: profile.id,
        badge_id: 'badge_005',
        awarded_at: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
        badges: {
          id: 'badge_005',
          name: 'Community Contributor',
          description: 'Active member for 12+ months',
          category: 'service',
          color: '#7c3aed',
          rarity: 'common',
          criteria: { min_months: 12 },
          is_active: true,
          is_public: true,
          sort_order: 5,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    ]

    const workloadHistory = [
      {
        id: 'wh_001',
        reviewer_id: profile.id,
        date: new Date().toISOString().split('T')[0],
        active_reviews: 2,
        pending_invitations: 3,
        monthly_capacity: 5,
        workload_percentage: 40,
        availability_status: 'available',
        created_at: new Date().toISOString()
      },
      {
        id: 'wh_002',
        reviewer_id: profile.id,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        active_reviews: 3,
        pending_invitations: 2,
        monthly_capacity: 5,
        workload_percentage: 60,
        availability_status: 'available',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    ]

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

    // Process reviewer settings - profile is from user_profiles table
    const reviewerSettings = (profile as any).reviewer_settings || {
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

    // Enhanced professional development data for demo
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
        },
        {
          id: '3',
          title: 'Research Ethics & Integrity',
          description: 'Understanding ethical considerations in peer review',
          duration: '3 hours',
          status: 'completed' as const,
          completedAt: '2023-11-20'
        },
        {
          id: '4',
          title: 'AI Tools in Academic Writing',
          description: 'Evaluating manuscripts that use AI assistance',
          duration: '1 hour',
          status: 'not_started' as const
        }
      ],
      certifications: [
        {
          id: '1',
          name: 'Certified Peer Reviewer',
          issuedBy: 'The Commons',
          issuedAt: '2024-01-20',
          credentialUrl: 'https://credentials.thecommons.org/reviewer/cert-001'
        },
        {
          id: '2',
          name: 'Advanced Research Methods',
          issuedBy: 'Academic Standards Institute',
          issuedAt: '2023-09-15',
          credentialUrl: 'https://asi.org/cert/research-methods-advanced'
        },
        {
          id: '3',
          name: 'Statistical Analysis Certificate',
          issuedBy: 'Data Science Academy',
          issuedAt: '2023-06-10',
          expiresAt: '2026-06-10',
          credentialUrl: 'https://datasci-academy.com/cert/stats-analysis'
        }
      ],
      mentorshipProgram: {
        role: 'mentor' as const,
        activeMentorships: 2,
        completedMentorships: 5,
        averageRating: 4.8
      },
      reviewFeedback: [
        {
          id: 'fb_001',
          type: 'editor' as const,
          rating: 5,
          comments: 'Exceptional review quality with detailed constructive feedback. Your statistical analysis evaluation was particularly thorough.',
          receivedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          manuscriptTitle: 'Climate Change Adaptation Strategies for Coastal Communities'
        },
        {
          id: 'fb_002',
          type: 'author' as const,
          rating: 4,
          comments: 'The reviewer provided valuable insights that significantly improved our manuscript. The suggestions for methodology refinement were spot-on.',
          receivedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          manuscriptTitle: 'Advanced Robotics in Manufacturing: Industry 4.0 Implementation'
        },
        {
          id: 'fb_003',
          type: 'editor' as const,
          rating: 5,
          comments: 'Timely submission with comprehensive review. Your attention to detail and constructive suggestions align perfectly with our journal standards.',
          receivedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          manuscriptTitle: 'Gene Therapy Advances in Treating Rare Genetic Disorders'
        }
      ]
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