import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'

export type ConflictType = 
  | 'institutional_current'
  | 'institutional_recent' 
  | 'coauthorship_recent'
  | 'coauthorship_frequent'
  | 'advisor_advisee'
  | 'family_personal'
  | 'financial_competing'
  | 'financial_collaboration'
  | 'editorial_relationship'
  | 'custom'

export type ConflictSeverity = 'low' | 'medium' | 'high' | 'blocking'

export interface ConflictDetection {
  conflict_id: string
  author_id: string
  author_name: string
  conflict_type: ConflictType
  severity: ConflictSeverity
  description: string
  evidence: any
  is_blocking: boolean
}

export interface COICheckResult {
  reviewer_id: string
  manuscript_id: string
  conflicts: ConflictDetection[]
  is_eligible: boolean
  risk_score: number
  checked_at: string
}

export interface ReviewerEligibility {
  reviewer_id: string
  is_eligible: boolean
  conflicts: ConflictDetection[]
  risk_score: number
}

export class ConflictDetectionService {
  private supabase

  constructor() {
    this.supabase = createClient()
  }

  /**
   * Comprehensive COI check for a reviewer and manuscript
   */
  async checkReviewerConflicts(
    reviewerId: string,
    manuscriptId: string
  ): Promise<COICheckResult> {
    const { data: conflicts, error } = await this.supabase
      .rpc('check_reviewer_conflicts', {
        reviewer_id_param: reviewerId,
        manuscript_id_param: manuscriptId
      })

    if (error) {
      console.error('Error checking reviewer conflicts:', error)
      throw new Error(`COI check failed: ${error.message}`)
    }

    const conflictDetections: ConflictDetection[] = conflicts || []
    const blockingConflicts = conflictDetections.filter(c => c.is_blocking)
    const isEligible = blockingConflicts.length === 0

    // Calculate risk score (0-100, higher = more risky)
    const riskScore = this.calculateRiskScore(conflictDetections)

    return {
      reviewer_id: reviewerId,
      manuscript_id: manuscriptId,
      conflicts: conflictDetections,
      is_eligible: isEligible,
      risk_score: riskScore,
      checked_at: new Date().toISOString()
    }
  }

  /**
   * Batch COI check for multiple reviewers
   */
  async checkMultipleReviewers(
    reviewerIds: string[],
    manuscriptId: string
  ): Promise<ReviewerEligibility[]> {
    const results = await Promise.all(
      reviewerIds.map(async (reviewerId) => {
        try {
          const coiResult = await this.checkReviewerConflicts(reviewerId, manuscriptId)
          return {
            reviewer_id: reviewerId,
            is_eligible: coiResult.is_eligible,
            conflicts: coiResult.conflicts,
            risk_score: coiResult.risk_score
          }
        } catch (error) {
          console.error(`COI check failed for reviewer ${reviewerId}:`, error)
          return {
            reviewer_id: reviewerId,
            is_eligible: false,
            conflicts: [],
            risk_score: 100 // Maximum risk for failed checks
          }
        }
      })
    )

    return results
  }

  /**
   * Detect institutional conflicts between reviewer and authors
   */
  async detectInstitutionalConflicts(
    reviewerId: string,
    authorIds: string[]
  ): Promise<ConflictDetection[]> {
    const { data: conflicts, error } = await this.supabase
      .rpc('detect_institutional_conflicts', {
        reviewer_id_param: reviewerId,
        author_ids_param: authorIds
      })

    if (error) {
      console.error('Error detecting institutional conflicts:', error)
      return []
    }

    return conflicts || []
  }

  /**
   * Detect collaboration/co-authorship conflicts
   */
  async detectCollaborationConflicts(
    reviewerId: string,
    authorIds: string[]
  ): Promise<ConflictDetection[]> {
    const { data: conflicts, error } = await this.supabase
      .rpc('detect_collaboration_conflicts', {
        reviewer_id_param: reviewerId,
        author_ids_param: authorIds
      })

    if (error) {
      console.error('Error detecting collaboration conflicts:', error)
      return []
    }

    return conflicts || []
  }

  /**
   * Add a manual conflict declaration
   */
  async declareConflict(
    reviewerId: string,
    conflictedWithId: string,
    conflictType: ConflictType,
    severity: ConflictSeverity,
    description: string,
    evidence?: any,
    reportedBy?: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('reviewer_conflicts')
      .insert({
        reviewer_id: reviewerId,
        conflicted_with_id: conflictedWithId,
        conflict_type: conflictType,
        severity: severity,
        description: description,
        evidence: evidence,
        detected_automatically: false,
        reported_by: reportedBy,
        status: 'active'
      })

    if (error) {
      throw new Error(`Failed to declare conflict: ${error.message}`)
    }
  }

  /**
   * Update affiliation history for improved COI detection
   */
  async updateAffiliationHistory(
    profileId: string,
    affiliations: Array<{
      institution_name: string
      department?: string
      position_title?: string
      start_date?: string
      end_date?: string
      is_primary?: boolean
      source?: string
    }>
  ): Promise<void> {
    // Clear existing affiliations for this profile
    await this.supabase
      .from('institutional_affiliations_history')
      .delete()
      .eq('profile_id', profileId)

    // Insert new affiliations
    const { error } = await this.supabase
      .from('institutional_affiliations_history')
      .insert(
        affiliations.map(aff => ({
          profile_id: profileId,
          ...aff
        }))
      )

    if (error) {
      throw new Error(`Failed to update affiliation history: ${error.message}`)
    }
  }

  /**
   * Record collaboration relationship
   */
  async recordCollaboration(
    personAId: string,
    personBId: string,
    relationshipType: string,
    publicationData?: {
      publication_id?: string
      publication_date?: string
      title?: string
      doi?: string
    }
  ): Promise<void> {
    // Ensure person_a_id < person_b_id for uniqueness constraint
    const [person_a_id, person_b_id] = [personAId, personBId].sort()

    // Check if collaboration already exists
    const { data: existing } = await this.supabase
      .from('collaboration_networks')
      .select('*')
      .eq('person_a_id', person_a_id)
      .eq('person_b_id', person_b_id)
      .eq('relationship_type', relationshipType)
      .single()

    if (existing) {
      // Update existing collaboration
      const publications = existing.publications || []
      if (publicationData) {
        publications.push(publicationData)
      }

      await this.supabase
        .from('collaboration_networks')
        .update({
          collaboration_count: existing.collaboration_count + 1,
          last_collaboration_date: publicationData?.publication_date || new Date().toISOString().split('T')[0],
          publications: publications
        })
        .eq('id', existing.id)
    } else {
      // Create new collaboration record
      await this.supabase
        .from('collaboration_networks')
        .insert({
          person_a_id,
          person_b_id,
          relationship_type: relationshipType,
          collaboration_count: 1,
          first_collaboration_date: publicationData?.publication_date || new Date().toISOString().split('T')[0],
          last_collaboration_date: publicationData?.publication_date || new Date().toISOString().split('T')[0],
          publications: publicationData ? [publicationData] : [],
          confidence_score: 0.9,
          source: 'manual'
        })
    }
  }

  /**
   * Get COI detection rules configuration
   */
  async getCOIRules(): Promise<any[]> {
    const { data: rules, error } = await this.supabase
      .from('coi_detection_rules')
      .select('*')
      .eq('enabled', true)
      .order('severity', { ascending: false })

    if (error) {
      console.error('Error fetching COI rules:', error)
      return []
    }

    return rules || []
  }

  /**
   * Update COI check status for review assignment
   */
  async updateAssignmentCOIStatus(
    assignmentId: string,
    conflicts: ConflictDetection[],
    overrideReason?: string,
    approvedBy?: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('review_assignments')
      .update({
        coi_checked_at: new Date().toISOString(),
        coi_flags: conflicts.length > 0 ? conflicts : null,
        coi_override_reason: overrideReason,
        coi_approved_by: approvedBy
      })
      .eq('id', assignmentId)

    if (error) {
      throw new Error(`Failed to update COI status: ${error.message}`)
    }
  }

  /**
   * Calculate risk score based on conflicts (0-100, higher = more risky)
   */
  private calculateRiskScore(conflicts: ConflictDetection[]): number {
    if (conflicts.length === 0) return 0

    let score = 0
    const severityWeights = {
      blocking: 100,
      high: 60,
      medium: 30,
      low: 10
    }

    const typeWeights = {
      advisor_advisee: 1.5,
      coauthorship_recent: 1.3,
      financial_competing: 1.2,
      institutional_current: 1.1,
      coauthorship_frequent: 1.0,
      institutional_recent: 0.8,
      editorial_relationship: 0.7,
      financial_collaboration: 0.6,
      family_personal: 1.4,
      custom: 1.0
    }

    for (const conflict of conflicts) {
      const severityScore = severityWeights[conflict.severity] || 0
      const typeMultiplier = typeWeights[conflict.conflict_type] || 1.0
      score += severityScore * typeMultiplier
    }

    // Normalize to 0-100 scale and account for multiple conflicts
    const normalizedScore = Math.min(100, score * (1 + (conflicts.length - 1) * 0.1))
    return Math.round(normalizedScore)
  }

  /**
   * Get conflict statistics for analytics
   */
  async getConflictStatistics(timeRange: 'week' | 'month' | 'year' = 'month'): Promise<{
    total_conflicts: number
    by_type: Record<ConflictType, number>
    by_severity: Record<ConflictSeverity, number>
    blocked_assignments: number
    override_rate: number
  }> {
    const dateFilter = {
      week: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      month: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      year: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    }[timeRange]

    const { data: conflicts } = await this.supabase
      .from('reviewer_conflicts')
      .select('conflict_type, severity, created_at')
      .gte('created_at', dateFilter.toISOString())

    const { data: assignments } = await this.supabase
      .from('review_assignments')
      .select('coi_flags, coi_override_reason')
      .gte('coi_checked_at', dateFilter.toISOString())

    const stats = {
      total_conflicts: conflicts?.length || 0,
      by_type: {} as Record<ConflictType, number>,
      by_severity: {} as Record<ConflictSeverity, number>,
      blocked_assignments: 0,
      override_rate: 0
    }

    // Count by type and severity
    conflicts?.forEach(conflict => {
      stats.by_type[conflict.conflict_type] = (stats.by_type[conflict.conflict_type] || 0) + 1
      stats.by_severity[conflict.severity] = (stats.by_severity[conflict.severity] || 0) + 1
    })

    // Calculate blocked assignments and override rate
    const flaggedAssignments = assignments?.filter(a => a.coi_flags) || []
    const overriddenAssignments = assignments?.filter(a => a.coi_override_reason) || []
    
    stats.blocked_assignments = flaggedAssignments.length
    stats.override_rate = flaggedAssignments.length > 0 
      ? Math.round((overriddenAssignments.length / flaggedAssignments.length) * 100) / 100
      : 0

    return stats
  }
}