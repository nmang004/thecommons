import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
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

    const searchParams = request.nextUrl.searchParams
    const manuscriptId = searchParams.get('manuscriptId')
    const field = searchParams.get('field')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!manuscriptId && !field) {
      return NextResponse.json(
        { error: 'Manuscript ID or field is required' },
        { status: 400 }
      )
    }

    let manuscriptField = field
    let manuscriptSubfield = null
    let manuscriptKeywords: string[] = []
    let authorId = null
    let excludedReviewers: string[] = []

    // If manuscript ID is provided, get manuscript details
    if (manuscriptId) {
      const { data: manuscript } = await supabase
        .from('manuscripts')
        .select('field_of_study, subfield, keywords, author_id, excluded_reviewers')
        .eq('id', manuscriptId)
        .single()

      if (manuscript) {
        manuscriptField = manuscript.field_of_study
        manuscriptSubfield = manuscript.subfield
        manuscriptKeywords = manuscript.keywords || []
        authorId = manuscript.author_id
        excludedReviewers = manuscript.excluded_reviewers?.reviewer_ids || []
      }
    }

    if (!manuscriptField) {
      return NextResponse.json(
        { error: 'Could not determine manuscript field' },
        { status: 400 }
      )
    }

    // Build reviewer query
    let reviewerQuery = supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        affiliation,
        expertise,
        h_index,
        total_publications,
        bio,
        orcid
      `)
      .eq('role', 'reviewer')

    // Exclude the manuscript author
    if (authorId) {
      reviewerQuery = reviewerQuery.neq('id', authorId)
    }

    // Exclude explicitly excluded reviewers
    if (excludedReviewers.length > 0) {
      reviewerQuery = reviewerQuery.not('id', 'in', `(${excludedReviewers.join(',')})`)
    }

    reviewerQuery = reviewerQuery.limit(limit * 2) // Get more to allow for filtering

    const { data: potentialReviewers, error: reviewerError } = await reviewerQuery

    if (reviewerError) {
      console.error('Error fetching reviewers:', reviewerError)
      return NextResponse.json(
        { error: 'Failed to fetch reviewers' },
        { status: 500 }
      )
    }

    // Get reviewer activity data (recent reviews, avg review time)
    const reviewerIds = potentialReviewers?.map(r => r.id) || []
    
    const reviewerStats: { [key: string]: any } = {}
    if (reviewerIds.length > 0) {
      // Get review assignments in the last 12 months
      const { data: recentAssignments } = await supabase
        .from('review_assignments')
        .select('reviewer_id, status, invited_at, completed_at')
        .in('reviewer_id', reviewerIds)
        .gte('invited_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())

      // Calculate stats for each reviewer
      reviewerIds.forEach(reviewerId => {
        const assignments = recentAssignments?.filter(a => a.reviewer_id === reviewerId) || []
        const completedReviews = assignments.filter(a => a.status === 'completed')
        
        // Calculate average review time
        let avgReviewTime = null
        if (completedReviews.length > 0) {
          const totalTime = completedReviews.reduce((sum, review) => {
            if (review.completed_at && review.invited_at) {
              const days = Math.floor(
                (new Date(review.completed_at).getTime() - new Date(review.invited_at).getTime()) 
                / (1000 * 60 * 60 * 24)
              )
              return sum + days
            }
            return sum
          }, 0)
          avgReviewTime = Math.round(totalTime / completedReviews.length)
        }

        // Calculate availability score (simplified)
        const totalAssignments = assignments.length
        const completedCount = completedReviews.length
        const declinedCount = assignments.filter(a => a.status === 'declined').length
        const pendingCount = assignments.filter(a => a.status === 'invited').length

        let availabilityScore = 100
        if (totalAssignments > 0) {
          // Reduce score based on decline rate and pending reviews
          const declineRate = declinedCount / totalAssignments
          availabilityScore = Math.max(0, 
            100 - (declineRate * 50) - (pendingCount * 10) - (totalAssignments > 5 ? 20 : 0)
          )
        }

        reviewerStats[reviewerId] = {
          recent_reviews: completedCount,
          avg_review_time: avgReviewTime,
          availability_score: Math.round(availabilityScore)
        }
      })
    }

    // Enhanced reviewer matching and scoring
    const enrichedReviewers = potentialReviewers?.map(reviewer => {
      const stats = reviewerStats[reviewer.id] || {}
      
      // Calculate expertise match score
      let expertiseScore = 0
      if (reviewer.expertise) {
        const reviewerExpertise = reviewer.expertise.map((e: string) => e.toLowerCase())
        
        // Field match
        if (reviewerExpertise.some((exp: string) => exp.includes(manuscriptField.toLowerCase()))) {
          expertiseScore += 40
        }
        
        // Subfield match
        if (manuscriptSubfield && reviewerExpertise.some((exp: string) => 
          exp.includes(manuscriptSubfield.toLowerCase())
        )) {
          expertiseScore += 30
        }
        
        // Keyword matches
        manuscriptKeywords.forEach(keyword => {
          if (reviewerExpertise.some((exp: string) => exp.includes(keyword.toLowerCase()))) {
            expertiseScore += 5
          }
        })
      }

      // Add conflicts check (simplified - would need more complex logic in production)
      const conflicts = []
      if (authorId === reviewer.id) {
        conflicts.push(authorId)
      }

      return {
        ...reviewer,
        ...stats,
        expertise_score: expertiseScore,
        conflicts
      }
    }) || []

    // Filter reviewers with reasonable expertise match
    const qualifiedReviewers = enrichedReviewers
      .filter(reviewer => reviewer.expertise_score > 20) // Minimum expertise threshold
      .sort((a, b) => {
        // Sort by composite score (expertise + availability + h-index)
        const scoreA = (a.expertise_score || 0) + 
                      (a.availability_score || 50) * 0.3 + 
                      (a.h_index || 0) * 0.5
        const scoreB = (b.expertise_score || 0) + 
                      (b.availability_score || 50) * 0.3 + 
                      (b.h_index || 0) * 0.5
        return scoreB - scoreA
      })
      .slice(0, limit)

    // Get suggested reviewers from manuscript if available
    let suggestedReviewers: any[] = []
    if (manuscriptId) {
      const { data: manuscript } = await supabase
        .from('manuscripts')
        .select('suggested_reviewers')
        .eq('id', manuscriptId)
        .single()

      if (manuscript?.suggested_reviewers?.reviewers) {
        suggestedReviewers = manuscript.suggested_reviewers.reviewers
      }
    }

    return NextResponse.json({
      reviewers: qualifiedReviewers,
      suggested: suggestedReviewers,
      metadata: {
        total_potential: potentialReviewers?.length || 0,
        qualified_count: qualifiedReviewers.length,
        field: manuscriptField,
        subfield: manuscriptSubfield,
        exclusions: {
          author_excluded: !!authorId,
          explicit_exclusions: excludedReviewers.length
        }
      }
    })

  } catch (error) {
    console.error('Reviewer finder error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}