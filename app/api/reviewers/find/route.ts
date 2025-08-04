import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ReviewerMatchingService } from '@/lib/services/reviewer-matching-service'
import type { SuggestedReviewers } from '@/types/database'

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
    const minHIndex = searchParams.get('minHIndex') ? parseInt(searchParams.get('minHIndex')!) : undefined
    const minPublications = searchParams.get('minPublications') ? parseInt(searchParams.get('minPublications')!) : undefined
    const maxCurrentLoad = searchParams.get('maxCurrentLoad') ? parseInt(searchParams.get('maxCurrentLoad')!) : undefined

    if (!manuscriptId && !field) {
      return NextResponse.json(
        { error: 'Manuscript ID or field is required' },
        { status: 400 }
      )
    }

    let manuscriptField = field
    let manuscriptSubfield = null
    let manuscriptKeywords: string[] = []
    let authorIds: string[] = []
    let excludedReviewers: string[] = []
    let references: string[] = []

    // If manuscript ID is provided, get comprehensive manuscript details
    if (manuscriptId) {
      const { data: manuscript } = await supabase
        .from('manuscripts')
        .select(`
          field_of_study, 
          subfield, 
          keywords, 
          author_id, 
          corresponding_author_id,
          excluded_reviewers,
          abstract,
          title
        `)
        .eq('id', manuscriptId)
        .single()

      if (manuscript) {
        manuscriptField = manuscript.field_of_study
        manuscriptSubfield = manuscript.subfield
        manuscriptKeywords = manuscript.keywords || []
        authorIds = [manuscript.author_id, manuscript.corresponding_author_id].filter(Boolean)
        excludedReviewers = manuscript.excluded_reviewers?.reviewer_ids || []

        // Get co-authors
        const { data: coauthors } = await supabase
          .from('manuscript_coauthors')
          .select('email')
          .eq('manuscript_id', manuscriptId)

        if (coauthors) {
          // Find profiles for co-authors by email
          const coauthorEmails = coauthors.map(ca => ca.email)
          if (coauthorEmails.length > 0) {
            const { data: coauthorProfiles } = await supabase
              .from('profiles')
              .select('id')
              .in('email', coauthorEmails)

            if (coauthorProfiles) {
              authorIds.push(...coauthorProfiles.map(p => p.id))
            }
          }
        }

        // Extract references from abstract for citation matching  
        // This is a simplified implementation - in production you'd want more sophisticated reference extraction
        references = extractReferences(manuscript.abstract + ' ' + manuscript.title)
      }
    }

    if (!manuscriptField) {
      return NextResponse.json(
        { error: 'Could not determine manuscript field' },
        { status: 400 }
      )
    }

    // Use the enhanced reviewer matching service
    const matchingService = new ReviewerMatchingService()
    
    const matchingCriteria = {
      manuscript_id: manuscriptId || 'unknown',
      field_of_study: manuscriptField,
      subfield: manuscriptSubfield,
      keywords: manuscriptKeywords,
      author_ids: [...new Set(authorIds)], // Remove duplicates
      references: references,
      exclude_reviewer_ids: excludedReviewers,
      min_h_index: minHIndex,
      min_publications: minPublications,
      max_current_load: maxCurrentLoad,
      geographic_diversity: true,
      institution_diversity: true
    }

    const matchingResult = await matchingService.findReviewers(matchingCriteria, limit)

    // Transform the results to match the expected frontend format
    const transformedReviewers = matchingResult.matches.map(match => ({
      id: match.reviewer.id,
      full_name: match.reviewer.full_name,
      email: match.reviewer.email,
      affiliation: match.reviewer.affiliation,
      expertise: match.reviewer.expertise,
      h_index: match.reviewer.h_index,
      total_publications: match.reviewer.total_publications,
      recent_reviews: match.reviewer.recent_reviews,
      avg_review_time: match.reviewer.avg_review_time,
      availability_score: match.reviewer.availability_score,
      bio: match.reviewer.bio,
      orcid: match.reviewer.orcid,
      // Enhanced matching scores
      relevance_score: match.relevance_score,
      quality_score: match.quality_score,
      overall_score: match.overall_score,
      match_reasons: match.match_reasons,
      // COI information
      coi_eligible: match.coi_eligibility?.is_eligible ?? true,
      coi_conflicts: match.coi_eligibility?.conflicts || [],
      coi_risk_score: match.coi_eligibility?.risk_score || 0,
      // Legacy compatibility
      expertise_score: match.relevance_score,
      conflicts: match.coi_eligibility?.conflicts.map(c => c.author_id) || []
    }))

    // Get suggested reviewers from manuscript if available
    let suggestedReviewers: SuggestedReviewers['reviewers'] = []
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
      reviewers: transformedReviewers,
      suggested: suggestedReviewers,
      metadata: {
        total_potential: matchingResult.total_candidates,
        qualified_count: transformedReviewers.length,
        field: manuscriptField,
        subfield: manuscriptSubfield,
        matching_strategy: matchingResult.metadata.matching_strategy,
        exclusions: {
          author_excluded: authorIds.length > 0,
          explicit_exclusions: excludedReviewers.length,
          coi_filtered: matchingResult.metadata.exclusions.coi_filtered,
          availability_filtered: matchingResult.metadata.exclusions.availability_filtered
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

// Helper function to extract potential references/citations from text
function extractReferences(text: string): string[] {
  const references: string[] = []
  
  // Look for author names followed by years (simplified)
  const authorYearPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]*)*)\s*(?:et\s+al\.?)?\s*\((\d{4})\)/g
  let match
  
  while ((match = authorYearPattern.exec(text)) !== null) {
    references.push(`${match[1]} (${match[2]})`)
  }
  
  // Look for DOI patterns
  const doiPattern = /10\.\d{4,}\/[^\s]+/g
  const doiMatches = text.match(doiPattern)
  if (doiMatches) {
    references.push(...doiMatches)
  }
  
  return references.slice(0, 50) // Limit to 50 references
}