import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const reportType = searchParams.get('reportType') || 'editorial'
    const dateRangeStart = searchParams.get('dateRangeStart')
    const dateRangeEnd = searchParams.get('dateRangeEnd')
    const editors = searchParams.getAll('editors')
    const fields = searchParams.getAll('fields')
    const status = searchParams.getAll('status')

    // Validate date range
    if (!dateRangeStart || !dateRangeEnd) {
      return NextResponse.json(
        { error: 'Date range (dateRangeStart and dateRangeEnd) is required' },
        { status: 400 }
      )
    }

    const startDate = new Date(dateRangeStart)
    const endDate = new Date(dateRangeEnd)

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      )
    }

    let reportData: any = {}

    switch (reportType) {
      case 'editorial':
        reportData = await generateEditorialReport(supabase, startDate, endDate, {
          editors,
          fields,
          status
        })
        break
      
      case 'reviewer':
        reportData = await generateReviewerReport(supabase, startDate, endDate, {
          fields,
          status
        })
        break
      
      case 'manuscript':
        reportData = await generateManuscriptReport(supabase, startDate, endDate, {
          editors,
          fields,
          status
        })
        break
      
      case 'custom':
        reportData = await generateCustomReport(supabase, startDate, endDate, {
          editors,
          fields,
          status
        })
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid report type. Must be: editorial, reviewer, manuscript, or custom' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      report: {
        type: reportType,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        filters: {
          editors,
          fields,
          status
        },
        data: reportData,
        generatedAt: new Date().toISOString(),
        generatedBy: user.id
      }
    })

  } catch (error) {
    console.error('Editorial analytics reports API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Editorial Performance Report
async function generateEditorialReport(
  supabase: any,
  startDate: Date,
  endDate: Date,
  filters: any
) {
  // Base query for manuscripts in date range
  let query = supabase
    .from('manuscripts')
    .select(`
      id,
      title,
      status,
      submitted_at,
      accepted_at,
      field_of_study,
      editor_id,
      profiles!editor_id(full_name, email),
      editorial_assignments(
        assigned_at,
        status,
        priority,
        workload_score,
        completed_at
      ),
      editorial_decisions(
        decision,
        created_at,
        submitted_at
      )
    `)
    .gte('submitted_at', startDate.toISOString())
    .lte('submitted_at', endDate.toISOString())

  // Apply filters
  if (filters.editors?.length > 0) {
    query = query.in('editor_id', filters.editors)
  }
  
  if (filters.fields?.length > 0) {
    query = query.in('field_of_study', filters.fields)
  }
  
  if (filters.status?.length > 0) {
    query = query.in('status', filters.status)
  }

  const { data: manuscripts, error } = await query

  if (error) throw error

  // Calculate editorial metrics
  const totalManuscripts = manuscripts?.length || 0
  const assignedManuscripts = manuscripts?.filter((m: any) => m.editor_id).length || 0
  const decisionsCount = manuscripts?.filter((m: any) => 
    m.editorial_decisions?.length > 0
  ).length || 0

  // Editor performance breakdown
  const editorStats = new Map()
  
  manuscripts?.forEach((manuscript: any) => {
    if (!manuscript.editor_id) return
    
    const editorId = manuscript.editor_id
    const editor = manuscript.profiles
    
    if (!editorStats.has(editorId)) {
      editorStats.set(editorId, {
        id: editorId,
        name: editor?.full_name || 'Unknown',
        email: editor?.email,
        manuscripts: 0,
        decisions: 0,
        avgDecisionTime: 0,
        workloadScore: 0
      })
    }
    
    const stats = editorStats.get(editorId)
    stats.manuscripts++
    
    if (manuscript.editorial_decisions?.length > 0) {
      stats.decisions++
    }
    
    // Calculate average decision time
    const assignment = manuscript.editorial_assignments?.[0]
    const decision = manuscript.editorial_decisions?.[0]
    
    if (assignment && decision) {
      const decisionTime = new Date(decision.created_at).getTime() - 
                          new Date(assignment.assigned_at).getTime()
      stats.avgDecisionTime += Math.floor(decisionTime / (1000 * 60 * 60 * 24))
    }
    
    stats.workloadScore += assignment?.workload_score || 1
  })

  // Finalize editor stats
  editorStats.forEach(stats => {
    if (stats.decisions > 0) {
      stats.avgDecisionTime = Math.round(stats.avgDecisionTime / stats.decisions)
    }
  })

  return {
    summary: {
      totalManuscripts,
      assignedManuscripts,
      unassignedManuscripts: totalManuscripts - assignedManuscripts,
      decisionsCount,
      assignmentRate: totalManuscripts > 0 ? 
        Math.round((assignedManuscripts / totalManuscripts) * 100) : 0,
      decisionRate: assignedManuscripts > 0 ? 
        Math.round((decisionsCount / assignedManuscripts) * 100) : 0
    },
    editorPerformance: Array.from(editorStats.values()),
    statusBreakdown: getStatusBreakdown(manuscripts),
    fieldBreakdown: getFieldBreakdown(manuscripts),
    timelineMetrics: calculateTimelineMetrics(manuscripts)
  }
}

// Reviewer Performance Report
async function generateReviewerReport(
  supabase: any,
  startDate: Date,
  endDate: Date,
  filters: any
) {
  let query = supabase
    .from('review_assignments')
    .select(`
      id,
      status,
      invited_at,
      due_date,
      completed_at,
      reviewer_id,
      manuscript_id,
      profiles!reviewer_id(full_name, email),
      manuscripts(field_of_study, title, status),
      review_reports(rating, recommendation, quality_score)
    `)
    .gte('invited_at', startDate.toISOString())
    .lte('invited_at', endDate.toISOString())

  if (filters.fields?.length > 0) {
    // This would need a join or subquery - simplified for now
    const { data: filteredManuscripts } = await supabase
      .from('manuscripts')
      .select('id')
      .in('field_of_study', filters.fields)
    
    const manuscriptIds = filteredManuscripts?.map((m: any) => m.id) || []
    query = query.in('manuscript_id', manuscriptIds)
  }

  const { data: reviews, error } = await query

  if (error) throw error

  const totalReviews = reviews?.length || 0
  const completedReviews = reviews?.filter((r: any) => r.status === 'completed').length || 0
  const onTimeReviews = reviews?.filter((r: any) => 
    r.status === 'completed' && 
    r.completed_at && 
    r.due_date &&
    new Date(r.completed_at) <= new Date(r.due_date)
  ).length || 0

  // Reviewer performance breakdown
  const reviewerStats = new Map()
  
  reviews?.forEach((review: any) => {
    const reviewerId = review.reviewer_id
    const reviewer = review.profiles
    
    if (!reviewerStats.has(reviewerId)) {
      reviewerStats.set(reviewerId, {
        id: reviewerId,
        name: reviewer?.full_name || 'Unknown',
        email: reviewer?.email,
        totalReviews: 0,
        completedReviews: 0,
        onTimeReviews: 0,
        avgTurnaroundDays: 0,
        avgQualityScore: 0
      })
    }
    
    const stats = reviewerStats.get(reviewerId)
    stats.totalReviews++
    
    if (review.status === 'completed') {
      stats.completedReviews++
      
      if (review.completed_at && review.invited_at) {
        const turnaroundTime = Math.floor(
          (new Date(review.completed_at).getTime() - 
           new Date(review.invited_at).getTime()) / (1000 * 60 * 60 * 24)
        )
        stats.avgTurnaroundDays += turnaroundTime
      }
      
      if (review.due_date && new Date(review.completed_at!) <= new Date(review.due_date)) {
        stats.onTimeReviews++
      }
      
      const qualityScore = review.review_reports?.[0]?.quality_score
      if (qualityScore) {
        stats.avgQualityScore += qualityScore
      }
    }
  })

  // Finalize reviewer stats
  reviewerStats.forEach(stats => {
    if (stats.completedReviews > 0) {
      stats.avgTurnaroundDays = Math.round(stats.avgTurnaroundDays / stats.completedReviews)
      stats.avgQualityScore = Math.round((stats.avgQualityScore / stats.completedReviews) * 10) / 10
    }
    stats.completionRate = stats.totalReviews > 0 ? 
      Math.round((stats.completedReviews / stats.totalReviews) * 100) : 0
    stats.onTimeRate = stats.completedReviews > 0 ? 
      Math.round((stats.onTimeReviews / stats.completedReviews) * 100) : 0
  })

  return {
    summary: {
      totalReviews,
      completedReviews,
      pendingReviews: totalReviews - completedReviews,
      onTimeReviews,
      completionRate: totalReviews > 0 ? 
        Math.round((completedReviews / totalReviews) * 100) : 0,
      onTimeRate: completedReviews > 0 ? 
        Math.round((onTimeReviews / completedReviews) * 100) : 0
    },
    reviewerPerformance: Array.from(reviewerStats.values()),
    statusBreakdown: getReviewStatusBreakdown(reviews)
  }
}

// Manuscript Flow Report
async function generateManuscriptReport(
  supabase: any,
  startDate: Date,
  endDate: Date,
  filters: any
) {
  let query = supabase
    .from('manuscripts')
    .select(`
      id,
      title,
      status,
      submitted_at,
      accepted_at,
      field_of_study,
      priority,
      editor_id,
      profiles!author_id(full_name, email, affiliation),
      editorial_assignments(assigned_at, completed_at, workload_score),
      review_assignments(invited_at, completed_at, status),
      editorial_decisions(decision, created_at)
    `)
    .gte('submitted_at', startDate.toISOString())
    .lte('submitted_at', endDate.toISOString())

  // Apply filters
  if (filters.editors?.length > 0) {
    query = query.in('editor_id', filters.editors)
  }
  
  if (filters.fields?.length > 0) {
    query = query.in('field_of_study', filters.fields)
  }
  
  if (filters.status?.length > 0) {
    query = query.in('status', filters.status)
  }

  const { data: manuscripts, error } = await query

  if (error) throw error

  // Calculate flow metrics
  const flowMetrics = manuscripts?.map((manuscript: any) => {
    const submissionDate = new Date(manuscript.submitted_at)
    const assignment = manuscript.editorial_assignments?.[0]
    const decision = manuscript.editorial_decisions?.[0]
    
    let timeToAssignment = null
    let timeToDecision = null
    
    if (assignment) {
      timeToAssignment = Math.floor(
        (new Date(assignment.assigned_at).getTime() - submissionDate.getTime()) / 
        (1000 * 60 * 60 * 24)
      )
    }
    
    if (decision) {
      timeToDecision = Math.floor(
        (new Date(decision.created_at).getTime() - submissionDate.getTime()) / 
        (1000 * 60 * 60 * 24)
      )
    }
    
    return {
      id: manuscript.id,
      title: manuscript.title,
      status: manuscript.status,
      fieldOfStudy: manuscript.field_of_study,
      timeToAssignment,
      timeToDecision,
      reviewCount: manuscript.review_assignments?.length || 0,
      completedReviews: manuscript.review_assignments?.filter((r: any) => 
        r.status === 'completed'
      ).length || 0
    }
  }) || []

  return {
    summary: {
      totalManuscripts: manuscripts?.length || 0,
      avgTimeToAssignment: calculateAverage(flowMetrics, 'timeToAssignment'),
      avgTimeToDecision: calculateAverage(flowMetrics, 'timeToDecision'),
      avgReviewsPerManuscript: calculateAverage(flowMetrics, 'reviewCount')
    },
    manuscripts: flowMetrics,
    statusBreakdown: getStatusBreakdown(manuscripts),
    fieldBreakdown: getFieldBreakdown(manuscripts)
  }
}

// Custom comprehensive report
async function generateCustomReport(
  supabase: any,
  startDate: Date,
  endDate: Date,
  filters: any
) {
  const [editorialData, reviewerData, manuscriptData] = await Promise.all([
    generateEditorialReport(supabase, startDate, endDate, filters),
    generateReviewerReport(supabase, startDate, endDate, filters),
    generateManuscriptReport(supabase, startDate, endDate, filters)
  ])

  return {
    editorial: editorialData,
    reviewer: reviewerData,
    manuscript: manuscriptData,
    crossReferences: {
      editorToReviewerRatio: editorialData.editorPerformance.length > 0 ? 
        Math.round(reviewerData.reviewerPerformance.length / editorialData.editorPerformance.length * 100) / 100 : 0,
      avgReviewsPerEditor: editorialData.editorPerformance.length > 0 ? 
        Math.round(reviewerData.summary.totalReviews / editorialData.editorPerformance.length * 100) / 100 : 0
    }
  }
}

// Helper functions
function getStatusBreakdown(manuscripts: any[]) {
  const breakdown = new Map()
  manuscripts?.forEach((manuscript: any) => {
    const status = manuscript.status
    breakdown.set(status, (breakdown.get(status) || 0) + 1)
  })
  return Array.from(breakdown.entries()).map(([status, count]) => ({ status, count }))
}

function getFieldBreakdown(manuscripts: any[]) {
  const breakdown = new Map()
  manuscripts?.forEach((manuscript: any) => {
    const field = manuscript.field_of_study
    breakdown.set(field, (breakdown.get(field) || 0) + 1)
  })
  return Array.from(breakdown.entries()).map(([field, count]) => ({ field, count }))
}

function getReviewStatusBreakdown(reviews: any[]) {
  const breakdown = new Map()
  reviews?.forEach((review: any) => {
    const status = review.status
    breakdown.set(status, (breakdown.get(status) || 0) + 1)
  })
  return Array.from(breakdown.entries()).map(([status, count]) => ({ status, count }))
}

function calculateTimelineMetrics(manuscripts: any[]) {
  const metrics = {
    avgTimeToAssignment: 0,
    avgTimeToDecision: 0,
    manuscriptsWithDecisions: 0
  }

  let totalTimeToAssignment = 0
  let totalTimeToDecision = 0
  let assignmentCount = 0
  let decisionCount = 0

  manuscripts?.forEach((manuscript: any) => {
    const submissionDate = new Date(manuscript.submitted_at)
    const assignment = manuscript.editorial_assignments?.[0]
    const decision = manuscript.editorial_decisions?.[0]

    if (assignment) {
      const timeToAssignment = Math.floor(
        (new Date(assignment.assigned_at).getTime() - submissionDate.getTime()) / 
        (1000 * 60 * 60 * 24)
      )
      totalTimeToAssignment += timeToAssignment
      assignmentCount++
    }

    if (decision) {
      const timeToDecision = Math.floor(
        (new Date(decision.created_at).getTime() - submissionDate.getTime()) / 
        (1000 * 60 * 60 * 24)
      )
      totalTimeToDecision += timeToDecision
      decisionCount++
    }
  })

  metrics.avgTimeToAssignment = assignmentCount > 0 ? 
    Math.round(totalTimeToAssignment / assignmentCount) : 0
  metrics.avgTimeToDecision = decisionCount > 0 ? 
    Math.round(totalTimeToDecision / decisionCount) : 0
  metrics.manuscriptsWithDecisions = decisionCount

  return metrics
}

function calculateAverage(items: any[], field: string) {
  const validItems = items.filter(item => item[field] !== null && item[field] !== undefined)
  if (validItems.length === 0) return 0
  
  const sum = validItems.reduce((total, item) => total + item[field], 0)
  return Math.round(sum / validItems.length)
}