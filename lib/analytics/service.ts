import { createClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { cache } from '@/lib/redis/cache'

// ===========================
// Type Definitions
// ===========================

export interface ManuscriptAnalyticsEvent {
  manuscriptId: string
  eventType: 'view' | 'download' | 'citation' | 'share' | 'submission' | 'decision' | 'revision'
  eventData?: Record<string, any>
  userId?: string
  sessionId?: string
  pageUrl?: string
  referrer?: string
  userAgent?: string
  ipAddress?: string
  countryCode?: string
}

export interface UserEngagementEvent {
  userId: string
  sessionId: string
  action: 'login' | 'logout' | 'page_view' | 'form_submit' | 'search' | 'file_upload' | 'manuscript_view'
  resourceType?: 'manuscript' | 'article' | 'profile' | 'review'
  resourceId?: string
  durationSeconds?: number
  metadata?: Record<string, any>
}

export interface EditorialAnalyticsEvent {
  manuscriptId: string
  editorId?: string
  workflowStage: string
  statusFrom?: string
  statusTo: string
  durationDays?: number
  decisionData?: Record<string, any>
}

export interface ReviewAnalyticsEvent {
  reviewAssignmentId: string
  manuscriptId: string
  reviewerId: string
  eventType: 'invited' | 'accepted' | 'declined' | 'started' | 'submitted' | 'late'
  turnaroundDays?: number
  qualityScore?: number
  metadata?: Record<string, any>
}

export interface SearchAnalyticsEvent {
  searchQuery: string
  searchType: 'basic' | 'advanced' | 'field_specific'
  filtersApplied?: Record<string, any>
  resultsCount: number
  resultsClicked?: number
  userId?: string
  sessionId?: string
  searchDurationMs?: number
}

export interface DashboardMetrics {
  totalManuscripts: number
  monthlySubmissions: number
  weeklySubmissions: number
  publishedManuscripts: number
  successRate: number
  avgTimeToPublication: number
  activeUsers: number
  avgReviewTurnaround: number
}

export interface ContentPerformance {
  fieldOfStudy: string
  totalArticles: number
  publishedArticles: number
  totalViews: number
  totalDownloads: number
  totalCitations: number
  avgViewsPerArticle: number
  avgDownloadsPerArticle: number
  avgCitationsPerArticle: number
}

export interface ReviewerPerformance {
  reviewerId: string
  reviewerName: string
  totalReviews: number
  avgQualityScore: number
  avgConfidence: number
  avgTimeSpent: number
  avgTurnaroundDays: number
  acceptanceRate: number
}

export interface ManuscriptFunnelStage {
  stage: string
  count: number
  conversionRate: number
}

// ===========================
// Analytics Service Class
// ===========================

export class AnalyticsService {
  private isServer: boolean
  
  constructor(isServer = true) {
    this.isServer = isServer
  }

  private async getSupabase() {
    return this.isServer ? createClient() : createBrowserClient()
  }

  // ===========================
  // Event Tracking Methods
  // ===========================

  async trackManuscriptEvent(event: ManuscriptAnalyticsEvent): Promise<void> {
    try {
      // Use the database function for atomic operations
      const supabase = await this.getSupabase()
      await supabase.rpc('analytics.track_manuscript_event', {
        p_manuscript_id: event.manuscriptId,
        p_event_type: event.eventType,
        p_event_data: event.eventData || {},
        p_user_id: event.userId || null,
        p_session_id: event.sessionId || null,
        p_page_url: event.pageUrl || null,
        p_referrer: event.referrer || null,
        p_user_agent: event.userAgent || null,
        p_ip_address: event.ipAddress || null,
        p_country_code: event.countryCode || null
      })

      // Also update manuscript view/download counts directly
      if (event.eventType === 'view' || event.eventType === 'download') {
        await this.updateManuscriptCounts(event.manuscriptId, event.eventType)
      }

      // Cache invalidation for real-time dashboards
      await this.invalidateAnalyticsCache(['manuscript-analytics', `manuscript-${event.manuscriptId}`])
    } catch (error) {
      console.error('Failed to track manuscript event:', error)
      // Don't throw - analytics should be non-blocking
    }
  }

  async trackUserEngagement(event: UserEngagementEvent): Promise<void> {
    try {
      const supabase = await this.getSupabase()
      await supabase
        .from('analytics.user_engagement')
        .insert({
          user_id: event.userId,
          session_id: event.sessionId,
          action: event.action,
          resource_type: event.resourceType,
          resource_id: event.resourceId,
          duration_seconds: event.durationSeconds,
          metadata: event.metadata || {}
        })

      await this.invalidateAnalyticsCache(['user-engagement', `user-${event.userId}`])
    } catch (error) {
      console.error('Failed to track user engagement:', error)
    }
  }

  async trackEditorialEvent(event: EditorialAnalyticsEvent): Promise<void> {
    try {
      const supabase = await this.getSupabase()
      await supabase
        .from('analytics.editorial_analytics')
        .insert({
          manuscript_id: event.manuscriptId,
          editor_id: event.editorId,
          workflow_stage: event.workflowStage,
          status_from: event.statusFrom,
          status_to: event.statusTo,
          duration_days: event.durationDays,
          decision_data: event.decisionData || {}
        })

      await this.invalidateAnalyticsCache(['editorial-analytics'])
    } catch (error) {
      console.error('Failed to track editorial event:', error)
    }
  }

  async trackReviewEvent(event: ReviewAnalyticsEvent): Promise<void> {
    try {
      const supabase = await this.getSupabase()
      await supabase
        .from('analytics.review_analytics')
        .insert({
          review_assignment_id: event.reviewAssignmentId,
          manuscript_id: event.manuscriptId,
          reviewer_id: event.reviewerId,
          event_type: event.eventType,
          turnaround_days: event.turnaroundDays,
          quality_score: event.qualityScore,
          metadata: event.metadata || {}
        })

      await this.invalidateAnalyticsCache(['review-analytics', `reviewer-${event.reviewerId}`])
    } catch (error) {
      console.error('Failed to track review event:', error)
    }
  }

  async trackSearchEvent(event: SearchAnalyticsEvent): Promise<void> {
    try {
      const supabase = await this.getSupabase()
      await supabase
        .from('analytics.search_analytics')
        .insert({
          search_query: event.searchQuery,
          search_type: event.searchType,
          filters_applied: event.filtersApplied || {},
          results_count: event.resultsCount,
          results_clicked: event.resultsClicked || 0,
          user_id: event.userId,
          session_id: event.sessionId,
          search_duration_ms: event.searchDurationMs
        })

      await this.invalidateAnalyticsCache(['search-analytics'])
    } catch (error) {
      console.error('Failed to track search event:', error)
    }
  }

  // ===========================
  // Dashboard Data Methods
  // ===========================

  async getExecutiveDashboard(): Promise<DashboardMetrics> {
    const cacheKey = 'executive-dashboard'
    const cached = await cache.get<DashboardMetrics>(cacheKey)
    
    if (cached) {
      return cached
    }

    try {
      const supabase = await this.getSupabase()
      const { data, error } = await supabase
        .from('analytics.executive_dashboard')
        .select('*')

      if (error) throw error

      const metrics: DashboardMetrics = {
        totalManuscripts: 0,
        monthlySubmissions: 0,
        weeklySubmissions: 0,
        publishedManuscripts: 0,
        successRate: 0,
        avgTimeToPublication: 0,
        activeUsers: 0,
        avgReviewTurnaround: 0
      }

      data?.forEach(row => {
        switch (row.metric_category) {
          case 'manuscripts':
            metrics.totalManuscripts = row.total_count
            metrics.monthlySubmissions = row.monthly_count
            metrics.weeklySubmissions = row.weekly_count
            metrics.publishedManuscripts = row.published_count
            metrics.successRate = row.success_rate
            break
          case 'users':
            metrics.activeUsers = row.total_count
            break
          case 'reviews':
            metrics.avgReviewTurnaround = row.success_rate // Using success_rate field for avg days
            break
        }
      })

      // Cache for 15 minutes
      await cache.set(cacheKey, metrics, { ttl: 900 })
      return metrics
    } catch (error) {
      console.error('Failed to get executive dashboard:', error)
      return {
        totalManuscripts: 0,
        monthlySubmissions: 0,
        weeklySubmissions: 0,
        publishedManuscripts: 0,
        successRate: 0,
        avgTimeToPublication: 0,
        activeUsers: 0,
        avgReviewTurnaround: 0
      }
    }
  }

  async getEditorialPerformance(weeks = 12): Promise<any[]> {
    const cacheKey = `editorial-performance-${weeks}`
    const cached = await cache.get<any[]>(cacheKey)
    
    if (cached) {
      return cached
    }

    try {
      const supabase = await this.getSupabase()
      const { data, error } = await supabase
        .from('analytics.editorial_performance')
        .select('*')
        .order('week_start', { ascending: false })
        .limit(weeks)

      if (error) throw error

      // Cache for 1 hour
      await cache.set(cacheKey, data || [], { ttl: 3600 })
      return data || []
    } catch (error) {
      console.error('Failed to get editorial performance:', error)
      return []
    }
  }

  async getContentPerformance(): Promise<ContentPerformance[]> {
    const cacheKey = 'content-performance'
    const cached = await cache.get<ContentPerformance[]>(cacheKey)
    
    if (cached) {
      return cached
    }

    try {
      const supabase = await this.getSupabase()
      const { data, error } = await supabase
        .from('analytics.content_performance')
        .select('*')
        .order('total_views', { ascending: false })

      if (error) throw error

      // Cache for 30 minutes
      await cache.set(cacheKey, data || [], { ttl: 1800 })
      return data || []
    } catch (error) {
      console.error('Failed to get content performance:', error)
      return []
    }
  }

  async getReviewerPerformance(): Promise<ReviewerPerformance[]> {
    const cacheKey = 'reviewer-performance'
    const cached = await cache.get<ReviewerPerformance[]>(cacheKey)
    
    if (cached) {
      return cached
    }

    try {
      const supabase = await this.getSupabase()
      const { data, error } = await supabase
        .from('analytics.review_quality')
        .select('*')
        .order('avg_quality_score', { ascending: false })

      if (error) throw error

      // Cache for 1 hour
      await cache.set(cacheKey, data || [], { ttl: 3600 })
      return data || []
    } catch (error) {
      console.error('Failed to get reviewer performance:', error)
      return []
    }
  }

  async getManuscriptFunnel(daysBack = 30): Promise<ManuscriptFunnelStage[]> {
    const cacheKey = `manuscript-funnel-${daysBack}`
    const cached = await cache.get<ManuscriptFunnelStage[]>(cacheKey)
    
    if (cached) {
      return cached
    }

    try {
      const supabase = await this.getSupabase()
      const { data, error } = await supabase
        .rpc('analytics.get_manuscript_funnel', { days_back: daysBack })

      if (error) throw error

      // Cache for 1 hour
      await cache.set(cacheKey, data || [], { ttl: 3600 })
      return data || []
    } catch (error) {
      console.error('Failed to get manuscript funnel:', error)
      return []
    }
  }

  async getFieldOfStudyTrends(): Promise<Record<string, any>> {
    const cacheKey = 'field-study-trends'
    const cached = await cache.get<Record<string, any>>(cacheKey)
    
    if (cached) {
      return cached
    }

    try {
      const supabase = await this.getSupabase()
      const { data, error } = await supabase
        .from('manuscripts')
        .select('field_of_study, created_at, status')
        .gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      // Group by field and month
      const trends = (data || []).reduce((acc: any, manuscript) => {
        const month = manuscript.created_at.substring(0, 7) // YYYY-MM
        const field = manuscript.field_of_study || 'Unknown'
        
        if (!acc[field]) {
          acc[field] = {}
        }
        if (!acc[field][month]) {
          acc[field][month] = { submissions: 0, published: 0 }
        }
        
        acc[field][month].submissions++
        if (manuscript.status === 'published') {
          acc[field][month].published++
        }
        
        return acc
      }, {})

      // Cache for 2 hours
      await cache.set(cacheKey, trends, { ttl: 7200 })
      return trends
    } catch (error) {
      console.error('Failed to get field of study trends:', error)
      return {}
    }
  }

  async getGeographicDistribution(): Promise<any[]> {
    const cacheKey = 'geographic-distribution'
    const cached = await cache.get<any[]>(cacheKey)
    
    if (cached) {
      return cached
    }

    try {
      const supabase = await this.getSupabase()
      const { data, error } = await supabase
        .from('analytics.manuscript_analytics')
        .select('country_code, event_type')
        .not('country_code', 'is', null)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      if (error) throw error

      const distribution = (data || []).reduce((acc: any, event) => {
        const country = event.country_code
        if (!acc[country]) {
          acc[country] = { views: 0, downloads: 0, total: 0 }
        }
        
        acc[country].total++
        if (event.event_type === 'view') {
          acc[country].views++
        } else if (event.event_type === 'download') {
          acc[country].downloads++
        }
        
        return acc
      }, {})

      // Convert to array format
      const result = Object.entries(distribution).map(([country, stats]) => ({
        country,
        ...(stats as { views: number; downloads: number; total: number })
      }))

      // Cache for 4 hours
      await cache.set(cacheKey, result, { ttl: 14400 })
      return result
    } catch (error) {
      console.error('Failed to get geographic distribution:', error)
      return []
    }
  }

  // ===========================
  // Utility Methods
  // ===========================

  private async updateManuscriptCounts(manuscriptId: string, eventType: 'view' | 'download'): Promise<void> {
    try {
      const field = eventType === 'view' ? 'view_count' : 'download_count'
      
      const supabase = await this.getSupabase()
      await supabase
        .rpc('increment_manuscript_count', {
          manuscript_id: manuscriptId,
          count_field: field
        })
    } catch (error) {
      console.error(`Failed to update manuscript ${eventType} count:`, error)
    }
  }

  private async invalidateAnalyticsCache(keys: string[]): Promise<void> {
    try {
      await Promise.all(keys.map(key => cache.del(key)))
    } catch (error) {
      console.error('Failed to invalidate cache:', error)
    }
  }

  async refreshDashboards(): Promise<void> {
    try {
      const supabase = await this.getSupabase()
      await supabase.rpc('analytics.refresh_dashboards')
      
      // Clear all dashboard caches
      await this.invalidateAnalyticsCache([
        'executive-dashboard',
        'editorial-performance',
        'content-performance',
        'reviewer-performance',
        'manuscript-funnel',
        'field-study-trends',
        'geographic-distribution'
      ])
    } catch (error) {
      console.error('Failed to refresh dashboards:', error)
    }
  }
}

// ===========================
// Utility Functions
// ===========================

export const analytics = new AnalyticsService()

// Helper function to get user's country from IP
export async function getCountryFromIP(ipAddress: string): Promise<string | null> {
  try {
    // Use a geolocation service - this is a placeholder
    // In production, you might use MaxMind, IP2Location, or similar
    const response = await fetch(`https://ipapi.co/${ipAddress}/country/`)
    if (response.ok) {
      return await response.text()
    }
  } catch (error) {
    console.error('Failed to get country from IP:', error)
  }
  return null
}

// Helper function to generate session ID
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Helper function to track page views
export async function trackPageView(
  page: string,
  userId?: string,
  sessionId?: string,
  additionalData?: Record<string, any>
): Promise<void> {
  if (typeof window === 'undefined') return

  const event: UserEngagementEvent = {
    userId: userId || 'anonymous',
    sessionId: sessionId || generateSessionId(),
    action: 'page_view',
    metadata: {
      page,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      ...additionalData
    }
  }

  await analytics.trackUserEngagement(event)
}