import { createClient } from '@/lib/supabase/server'

export class ReviewerAnalyticsService {
  private async getSupabase() {
    return await createClient()
  }

  /**
   * Update analytics for a specific reviewer
   */
  async updateReviewerAnalytics(reviewerId: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()

      // Call the database function to update analytics
      const { error } = await supabase.rpc('update_reviewer_analytics', {
        reviewer_id_param: reviewerId
      })

      if (error) {
        console.error(`Failed to update analytics for reviewer ${reviewerId}:`, error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateReviewerAnalytics:', error)
      return false
    }
  }

  /**
   * Update analytics for all reviewers (batch operation)
   */
  async updateAllReviewerAnalytics(): Promise<{ success: number; failed: number }> {
    try {
      const supabase = await this.getSupabase()
      let success = 0
      let failed = 0

      // Get all reviewers
      const { data: reviewers, error: reviewersError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'reviewer')

      if (reviewersError) {
        console.error('Failed to fetch reviewers:', reviewersError)
        return { success: 0, failed: 1 }
      }

      // Process reviewers in batches to avoid overwhelming the database
      const batchSize = 10
      for (let i = 0; i < reviewers.length; i += batchSize) {
        const batch = reviewers.slice(i, i + batchSize)
        const promises = batch.map(reviewer => this.updateReviewerAnalytics(reviewer.id))
        
        const results = await Promise.allSettled(promises)
        
        results.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            success++
          } else {
            failed++
          }
        })

        // Small delay between batches to prevent database overload
        if (i + batchSize < reviewers.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      console.log(`Analytics update completed: ${success} success, ${failed} failed`)
      return { success, failed }
    } catch (error) {
      console.error('Error in updateAllReviewerAnalytics:', error)
      return { success: 0, failed: 1 }
    }
  }

  /**
   * Check and award badges for a specific reviewer
   */
  async checkAndAwardBadges(reviewerId: string): Promise<number> {
    try {
      const supabase = await this.getSupabase()

      // Call the database function to check and award badges
      const { data, error } = await supabase.rpc('check_and_award_badges', {
        reviewer_id_param: reviewerId
      })

      if (error) {
        console.error(`Failed to check badges for reviewer ${reviewerId}:`, error)
        return 0
      }

      return data || 0
    } catch (error) {
      console.error('Error in checkAndAwardBadges:', error)
      return 0
    }
  }

  /**
   * Get comprehensive analytics for a reviewer
   */
  async getReviewerAnalytics(reviewerId: string) {
    try {
      const supabase = await this.getSupabase()

      // Fetch from pre-computed analytics table
      const { data: analytics, error } = await supabase
        .from('reviewer_analytics')
        .select('*')
        .eq('reviewer_id', reviewerId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error fetching reviewer analytics:', error)
        return null
      }

      // If no analytics exist, calculate them
      if (!analytics) {
        await this.updateReviewerAnalytics(reviewerId)
        
        // Try again after calculation
        const { data: newAnalytics, error: newError } = await supabase
          .from('reviewer_analytics')
          .select('*')
          .eq('reviewer_id', reviewerId)
          .single()

        if (newError) {
          console.error('Error fetching newly calculated analytics:', newError)
          return null
        }

        return newAnalytics
      }

      // Check if analytics are stale (older than 24 hours)
      const lastCalculated = new Date(analytics.last_calculated_at)
      const now = new Date()
      const hoursDiff = (now.getTime() - lastCalculated.getTime()) / (1000 * 60 * 60)

      if (hoursDiff > 24) {
        // Update stale analytics in background
        this.updateReviewerAnalytics(reviewerId).catch(console.error)
      }

      return analytics
    } catch (error) {
      console.error('Error in getReviewerAnalytics:', error)
      return null
    }
  }

  /**
   * Get workload trends for a reviewer
   */
  async getWorkloadTrends(reviewerId: string, days: number = 30) {
    try {
      const supabase = await this.getSupabase()

      const { data: workloadHistory, error } = await supabase
        .from('reviewer_workload_history')
        .select('*')
        .eq('reviewer_id', reviewerId)
        .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (error) {
        console.error('Error fetching workload trends:', error)
        return []
      }

      return workloadHistory || []
    } catch (error) {
      console.error('Error in getWorkloadTrends:', error)
      return []
    }
  }

  /**
   * Get performance comparison data (anonymized peer comparison)
   */
  async getPerformanceComparison(reviewerId: string) {
    try {
      const supabase = await this.getSupabase()

      // Get reviewer's analytics
      const reviewerAnalytics = await this.getReviewerAnalytics(reviewerId)
      if (!reviewerAnalytics) return null

      // Get aggregate stats for comparison (anonymized)
      const { data: aggregateStats, error } = await supabase
        .from('reviewer_analytics')
        .select(`
          average_review_time_days,
          acceptance_rate,
          average_quality_score,
          on_time_completion_rate,
          total_reviews_completed
        `)
        .gte('total_reviews_completed', 5) // Only include reviewers with meaningful activity

      if (error) {
        console.error('Error fetching aggregate stats:', error)
        return null
      }

      // Calculate percentiles
      const calculatePercentile = (value: number, dataset: number[]) => {
        const sorted = dataset.sort((a, b) => a - b)
        const index = sorted.findIndex(v => v >= value)
        return index === -1 ? 100 : Math.round((index / sorted.length) * 100)
      }

      const avgTimes = aggregateStats.map(s => s.average_review_time_days).filter(Boolean)
      const acceptanceRates = aggregateStats.map(s => s.acceptance_rate).filter(Boolean)
      const qualityScores = aggregateStats.map(s => s.average_quality_score).filter(Boolean)
      const timelinessRates = aggregateStats.map(s => s.on_time_completion_rate).filter(Boolean)

      return {
        reviewTimePercentile: reviewerAnalytics.average_review_time_days ? 
          100 - calculatePercentile(reviewerAnalytics.average_review_time_days, avgTimes) : null, // Lower time is better
        acceptanceRatePercentile: reviewerAnalytics.acceptance_rate ?
          calculatePercentile(reviewerAnalytics.acceptance_rate, acceptanceRates) : null,
        qualityScorePercentile: reviewerAnalytics.average_quality_score ?
          calculatePercentile(reviewerAnalytics.average_quality_score, qualityScores) : null,
        timelinessPercentile: reviewerAnalytics.on_time_completion_rate ?
          calculatePercentile(reviewerAnalytics.on_time_completion_rate, timelinessRates) : null,
        totalReviewers: aggregateStats.length
      }
    } catch (error) {
      console.error('Error in getPerformanceComparison:', error)
      return null
    }
  }

  /**
   * Get recent achievements for a reviewer
   */
  async getRecentAchievements(reviewerId: string, limit: number = 5) {
    try {
      const supabase = await this.getSupabase()

      const { data: recentBadges, error } = await supabase
        .from('profile_badges')
        .select(`
          *,
          badges(*)
        `)
        .eq('profile_id', reviewerId)
        .order('awarded_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching recent achievements:', error)
        return []
      }

      return recentBadges || []
    } catch (error) {
      console.error('Error in getRecentAchievements:', error)
      return []
    }
  }

  /**
   * Calculate review streak (consecutive on-time reviews)
   */
  async getReviewStreak(reviewerId: string): Promise<number> {
    try {
      const supabase = await this.getSupabase()

      const { data: recentReviews, error } = await supabase
        .from('reviews')
        .select(`
          submitted_at,
          review_assignments!inner(due_date)
        `)
        .eq('reviewer_id', reviewerId)
        .order('submitted_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching reviews for streak calculation:', error)
        return 0
      }

      let streak = 0
      for (const review of recentReviews || []) {
        const submittedAt = new Date(review.submitted_at)
        const dueDate = new Date((review.review_assignments as any).due_date)
        
        if (submittedAt <= dueDate) {
          streak++
        } else {
          break // Streak is broken
        }
      }

      return streak
    } catch (error) {
      console.error('Error in getReviewStreak:', error)
      return 0
    }
  }
}

// Export singleton instance
export const reviewerAnalyticsService = new ReviewerAnalyticsService()