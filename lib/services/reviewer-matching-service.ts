import { createClient } from '@/lib/supabase/server'
import { ConflictDetectionService, ReviewerEligibility } from './conflict-detection-service'
import type { ReviewerSpecializations } from '@/types/database'

export interface ReviewerProfile {
  id: string
  full_name: string
  email: string
  affiliation?: string
  expertise: string[]
  h_index?: number
  total_publications: number
  current_review_load?: number
  avg_review_quality_score?: number
  response_rate?: number
  recent_reviews?: number
  avg_review_time?: number
  availability_score?: number
  last_active_date?: string
  specializations?: ReviewerSpecializations
  bio?: string
  orcid?: string
}

export interface MatchingCriteria {
  manuscript_id: string
  field_of_study: string
  subfield?: string
  keywords?: string[]
  author_ids: string[]
  references?: string[] // DOIs or citation strings
  exclude_reviewer_ids?: string[]
  min_h_index?: number
  min_publications?: number
  max_current_load?: number
  geographic_diversity?: boolean
  institution_diversity?: boolean
}

export interface ReviewerMatch {
  reviewer: ReviewerProfile
  relevance_score: number
  availability_score: number
  quality_score: number
  diversity_score: number
  overall_score: number
  match_reasons: string[]
  coi_eligibility?: ReviewerEligibility
}

export interface MatchingResult {
  matches: ReviewerMatch[]
  total_candidates: number
  metadata: {
    field: string
    subfield?: string
    exclusions: {
      coi_filtered: number
      availability_filtered: number
      quality_filtered: number
    }
    matching_strategy: string
  }
}

export class ReviewerMatchingService {
  private getSupabase: () => Promise<Awaited<ReturnType<typeof createClient>>>
  private conflictService: ConflictDetectionService

  constructor() {
    this.getSupabase = () => createClient()
    this.conflictService = new ConflictDetectionService()
  }

  /**
   * Find the best reviewer matches for a manuscript
   */
  async findReviewers(
    criteria: MatchingCriteria,
    limit: number = 50
  ): Promise<MatchingResult> {
    // Get base pool of potential reviewers
    const candidatePool = await this.getCandidatePool(criteria, limit * 3)

    // Filter by availability and basic criteria
    const availableCandidates = this.filterByAvailability(candidatePool, criteria)

    // Calculate relevance scores
    const scoredCandidates = await this.calculateRelevanceScores(
      availableCandidates,
      criteria
    )

    // Run COI checks
    const coiEligibility = await this.conflictService.checkMultipleReviewers(
      scoredCandidates.map(c => c.reviewer.id),
      criteria.manuscript_id
    )

    // Combine scores and create final matches
    const matches = this.createFinalMatches(scoredCandidates, coiEligibility, criteria)

    // Sort by overall score and apply limit
    const sortedMatches = matches
      .sort((a, b) => b.overall_score - a.overall_score)
      .slice(0, limit)

    return {
      matches: sortedMatches,
      total_candidates: candidatePool.length,
      metadata: {
        field: criteria.field_of_study,
        subfield: criteria.subfield,
        exclusions: {
          coi_filtered: coiEligibility.filter(e => !e.is_eligible).length,
          availability_filtered: candidatePool.length - availableCandidates.length,
          quality_filtered: 0 // Could add quality filtering
        },
        matching_strategy: 'hybrid_semantic_citation'
      }
    }
  }

  /**
   * Get initial candidate pool from database
   */
  private async getCandidatePool(
    criteria: MatchingCriteria,
    limit: number
  ): Promise<ReviewerProfile[]> {
    const supabase = await this.getSupabase()
    let query = supabase
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
        orcid,
        created_at,
        updated_at
      `)
      .eq('role', 'reviewer')

    // Exclude specific reviewers
    if (criteria.exclude_reviewer_ids?.length) {
      query = query.not('id', 'in', `(${criteria.exclude_reviewer_ids.join(',')})`)
    }

    // Exclude manuscript authors
    if (criteria.author_ids.length > 0) {
      query = query.not('id', 'in', `(${criteria.author_ids.join(',')})`)
    }

    // Basic quality filters
    if (criteria.min_h_index) {
      query = query.gte('h_index', criteria.min_h_index)
    }
    if (criteria.min_publications) {
      query = query.gte('total_publications', criteria.min_publications)
    }

    query = query.limit(limit)

    const { data: profiles, error } = await query

    if (error) {
      console.error('Error fetching reviewer candidates:', error)
      return []
    }

    // Get additional reviewer stats
    const enrichedProfiles = await this.enrichReviewerProfiles(profiles || [])

    return enrichedProfiles
  }

  /**
   * Enrich reviewer profiles with performance statistics
   */
  private async enrichReviewerProfiles(profiles: Array<{
    id: string
    full_name: string
    email: string
    affiliation?: string
    expertise?: string[]
    h_index?: number
    total_publications: number
    current_review_load?: number
    avg_review_quality_score?: number
    response_rate?: number
    specializations?: ReviewerSpecializations
    bio?: string
    orcid?: string
  }>): Promise<ReviewerProfile[]> {
    if (profiles.length === 0) return []

    const reviewerIds = profiles.map(p => p.id)

    // Get review assignment statistics
    const supabase = await this.getSupabase()
    const { data: assignments } = await supabase
      .from('review_assignments')
      .select('reviewer_id, status, invited_at, completed_at, due_date')
      .in('reviewer_id', reviewerIds)
      .gte('invited_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())

    // Calculate stats for each reviewer
    const reviewerStats: { [key: string]: {
      recent_reviews: number
      avg_review_time: number
      availability_score: number
      last_active_date?: string
    } } = {}
    
    reviewerIds.forEach(reviewerId => {
      const reviewerAssignments = assignments?.filter(a => a.reviewer_id === reviewerId) || []
      
      const completed = reviewerAssignments.filter(a => a.status === 'completed')
      const accepted = reviewerAssignments.filter(a => a.status === 'accepted')
      const declined = reviewerAssignments.filter(a => a.status === 'declined')
      const pending = reviewerAssignments.filter(a => a.status === 'invited')

      // Calculate response rate
      const totalInvites = reviewerAssignments.length
      const responses = accepted.length + declined.length + completed.length
      const responseRate = totalInvites > 0 ? responses / totalInvites : 1.0

      // Calculate average review time
      let avgReviewTime = null
      if (completed.length > 0) {
        const totalTime = completed.reduce((sum, review) => {
          if (review.completed_at && review.invited_at) {
            const days = Math.floor(
              (new Date(review.completed_at).getTime() - new Date(review.invited_at).getTime()) 
              / (1000 * 60 * 60 * 24)
            )
            return sum + days
          }
          return sum
        }, 0)
        avgReviewTime = Math.round(totalTime / completed.length)
      }

      // Calculate current load and availability
      const currentLoad = pending.length + accepted.length
      const availabilityScore = Math.max(0, 100 - (currentLoad * 25) - (declined.length * 10))

      reviewerStats[reviewerId] = {
        recent_reviews: completed.length,
        avg_review_time: avgReviewTime,
        current_review_load: currentLoad,
        response_rate: Math.round(responseRate * 100) / 100,
        availability_score: Math.round(availabilityScore),
        last_active_date: reviewerAssignments.length > 0 
          ? reviewerAssignments
              .sort((a, b) => new Date(b.invited_at).getTime() - new Date(a.invited_at).getTime())[0]
              .invited_at
          : null
      }
    })

    // Combine profile data with stats
    return profiles.map(profile => ({
      ...profile,
      ...reviewerStats[profile.id]
    }))
  }

  /**
   * Filter candidates by availability criteria
   */
  private filterByAvailability(
    candidates: ReviewerProfile[],
    criteria: MatchingCriteria
  ): ReviewerProfile[] {
    return candidates.filter(candidate => {
      // Filter by maximum current load
      if (criteria.max_current_load && candidate.current_review_load) {
        if (candidate.current_review_load > criteria.max_current_load) {
          return false
        }
      }

      // Filter by availability score (minimum 30%)
      if (candidate.availability_score && candidate.availability_score < 30) {
        return false
      }

      // Filter inactive reviewers (no activity in last 2 years)
      if (candidate.last_active_date) {
        const twoYearsAgo = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000)
        if (new Date(candidate.last_active_date) < twoYearsAgo) {
          return false
        }
      }

      return true
    })
  }

  /**
   * Calculate relevance scores using multiple algorithms
   */
  private async calculateRelevanceScores(
    candidates: ReviewerProfile[],
    criteria: MatchingCriteria
  ): Promise<ReviewerMatch[]> {
    const citationMatches = await this.findCitationMatches(candidates, criteria.references || [])
    
    return candidates.map(candidate => {
      const expertiseScore = this.calculateExpertiseMatch(candidate, criteria)
      const citationScore = citationMatches[candidate.id] || 0
      const qualityScore = this.calculateQualityScore(candidate)
      const availabilityScore = candidate.availability_score || 50
      const diversityScore = this.calculateDiversityScore(candidate, criteria)

      // Weighted combination of scores
      const relevanceScore = (
        expertiseScore * 0.4 +
        citationScore * 0.3 +
        qualityScore * 0.3
      )

      const overallScore = (
        relevanceScore * 0.5 +
        availabilityScore * 0.2 +
        qualityScore * 0.2 +
        diversityScore * 0.1
      )

      const matchReasons = this.generateMatchReasons(
        candidate,
        criteria,
        { expertiseScore, citationScore, qualityScore, availabilityScore }
      )

      return {
        reviewer: candidate,
        relevance_score: Math.round(relevanceScore),
        availability_score: Math.round(availabilityScore),
        quality_score: Math.round(qualityScore),
        diversity_score: Math.round(diversityScore),
        overall_score: Math.round(overallScore),
        match_reasons: matchReasons
      }
    })
  }

  /**
   * Find reviewers who are cited in the manuscript references
   */
  private async findCitationMatches(
    candidates: ReviewerProfile[],
    references: string[]
  ): Promise<{ [reviewerId: string]: number }> {
    if (references.length === 0) return {}

    const matches: { [reviewerId: string]: number } = {}

    // This is a simplified implementation
    // In production, you'd want to use a more sophisticated citation matching service
    // that can parse DOIs, author names, and publication titles

    for (const candidate of candidates) {
      let score = 0

      // Check if candidate name appears in references
      const nameVariations = this.generateNameVariations(candidate.full_name)
      
      for (const reference of references) {
        const refLower = reference.toLowerCase()
        
        for (const nameVar of nameVariations) {
          if (refLower.includes(nameVar.toLowerCase())) {
            score += 30 // High score for citation match
            break
          }
        }
      }

      if (score > 0) {
        matches[candidate.id] = Math.min(score, 100)
      }
    }

    return matches
  }

  /**
   * Generate name variations for citation matching
   */
  private generateNameVariations(fullName: string): string[] {
    const parts = fullName.trim().split(/\s+/)
    if (parts.length < 2) return [fullName]

    const firstName = parts[0]
    const lastName = parts[parts.length - 1]
    const middleNames = parts.slice(1, -1)

    const variations = [
      fullName,
      `${lastName}, ${firstName}`,
      `${firstName} ${lastName}`,
      `${firstName.charAt(0)}. ${lastName}`,
      `${lastName}, ${firstName.charAt(0)}.`
    ]

    // Add middle initial variations
    if (middleNames.length > 0) {
      const middleInitials = middleNames.map(n => n.charAt(0) + '.').join(' ')
      variations.push(
        `${firstName} ${middleInitials} ${lastName}`,
        `${lastName}, ${firstName} ${middleInitials}`,
        `${firstName.charAt(0)}. ${middleInitials} ${lastName}`
      )
    }

    return [...new Set(variations)] // Remove duplicates
  }

  /**
   * Calculate expertise matching score
   */
  private calculateExpertiseMatch(
    candidate: ReviewerProfile,
    criteria: MatchingCriteria
  ): number {
    let score = 0
    const candidateExpertise = candidate.expertise.map(e => e.toLowerCase())

    // Field match (highest weight)
    if (candidateExpertise.some(exp => 
      exp.includes(criteria.field_of_study.toLowerCase()) ||
      criteria.field_of_study.toLowerCase().includes(exp)
    )) {
      score += 40
    }

    // Subfield match
    if (criteria.subfield) {
      if (candidateExpertise.some(exp => 
        exp.includes(criteria.subfield.toLowerCase()) ||
        criteria.subfield.toLowerCase().includes(exp)
      )) {
        score += 30
      }
    }

    // Keyword matches
    if (criteria.keywords) {
      for (const keyword of criteria.keywords) {
        if (candidateExpertise.some(exp => 
          exp.includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(exp)
        )) {
          score += 10
        }
      }
    }

    // Fuzzy matching for partial keyword overlap
    score += this.calculateSemanticSimilarity(candidateExpertise, criteria)

    return Math.min(score, 100)
  }

  /**
   * Calculate semantic similarity using simple token overlap
   */
  private calculateSemanticSimilarity(
    candidateExpertise: string[],
    criteria: MatchingCriteria
  ): number {
    const allCriteriaTerms = [
      criteria.field_of_study,
      criteria.subfield,
      ...(criteria.keywords || [])
    ].filter(Boolean).map(term => term.toLowerCase())

    const candidateTerms = candidateExpertise.flatMap(exp => 
      exp.split(/[\s,\-_]+/).filter(term => term.length > 2)
    )

    let matches = 0
    for (const criteriaTermSet of allCriteriaTerms) {
      const criteriaTokens = criteriaTermSet.split(/[\s,\-_]+/)
      
      for (const criteriaToken of criteriaTokens) {
        if (criteriaToken.length > 2) {
          for (const candidateToken of candidateTerms) {
            if (this.calculateJaccardSimilarity(criteriaToken, candidateToken) > 0.7) {
              matches += 3
              break
            }
          }
        }
      }
    }

    return Math.min(matches, 20) // Cap semantic bonus at 20 points
  }

  /**
   * Calculate Jaccard similarity between two strings
   */
  private calculateJaccardSimilarity(str1: string, str2: string): number {
    const set1 = new Set(str1.toLowerCase().split(''))
    const set2 = new Set(str2.toLowerCase().split(''))
    
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])
    
    return intersection.size / union.size
  }

  /**
   * Calculate reviewer quality score
   */
  private calculateQualityScore(candidate: ReviewerProfile): number {
    let score = 50 // Base score

    // H-index contribution
    if (candidate.h_index) {
      score += Math.min(candidate.h_index * 2, 30)
    }

    // Publication count contribution
    if (candidate.total_publications) {
      score += Math.min(candidate.total_publications / 5, 15)
    }

    // Response rate contribution
    if (candidate.response_rate) {
      score += candidate.response_rate * 0.2
    }

    // Review completion track record
    if (candidate.recent_reviews) {
      score += Math.min(candidate.recent_reviews * 3, 15)
    }

    // Penalty for slow reviews
    if (candidate.avg_review_time && candidate.avg_review_time > 45) {
      score -= Math.min((candidate.avg_review_time - 45) / 5, 10)
    }

    return Math.max(0, Math.min(score, 100))
  }

  /**
   * Calculate diversity score for geographic/institutional diversity
   */
  private calculateDiversityScore(
    candidate: ReviewerProfile,
    _criteria: MatchingCriteria
  ): number {
    // This is a simplified implementation
    // In production, you'd check against already selected reviewers
    let score = 50 // Base diversity score

    // For now, give a small bonus for having an affiliation (institutional diversity)
    if (candidate.affiliation) {
      score += 10
    }

    // Could add geographic diversity based on affiliation location
    // Could add institutional diversity checks against other selected reviewers

    return Math.min(score, 100)
  }

  /**
   * Create final matches with COI eligibility
   */
  private createFinalMatches(
    scoredCandidates: ReviewerMatch[],
    coiEligibility: ReviewerEligibility[],
    _criteria: MatchingCriteria
  ): ReviewerMatch[] {
    const eligibilityMap = new Map(
      coiEligibility.map(e => [e.reviewer_id, e])
    )

    return scoredCandidates.map(match => ({
      ...match,
      coi_eligibility: eligibilityMap.get(match.reviewer.id),
      // Reduce overall score for reviewers with COI issues
      overall_score: eligibilityMap.get(match.reviewer.id)?.is_eligible === false
        ? Math.round(match.overall_score * 0.3) // Severely penalize blocked reviewers
        : eligibilityMap.get(match.reviewer.id)?.conflicts.length > 0
        ? Math.round(match.overall_score * 0.8) // Moderately penalize reviewers with warnings
        : match.overall_score
    }))
  }

  /**
   * Generate human-readable match reasons
   */
  private generateMatchReasons(
    candidate: ReviewerProfile,
    criteria: MatchingCriteria,
    scores: { expertiseScore: number; citationScore: number; qualityScore: number; availabilityScore: number }
  ): string[] {
    const reasons = []

    if (scores.expertiseScore >= 60) {
      reasons.push(`Strong expertise match in ${criteria.field_of_study}`)
    }

    if (scores.citationScore > 0) {
      reasons.push('Cited in manuscript references')
    }

    if (candidate.h_index && candidate.h_index >= 20) {
      reasons.push(`High h-index (${candidate.h_index})`)
    }

    if (scores.availabilityScore >= 80) {
      reasons.push('High availability')
    }

    if (candidate.recent_reviews && candidate.recent_reviews >= 3) {
      reasons.push('Active reviewer')
    }

    if (candidate.avg_review_time && candidate.avg_review_time <= 30) {
      reasons.push('Fast review turnaround')
    }

    if (candidate.response_rate && candidate.response_rate >= 0.8) {
      reasons.push('Reliable response rate')
    }

    return reasons
  }
}