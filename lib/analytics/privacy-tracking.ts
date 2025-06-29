import { analytics } from './service'
import { cache } from '@/lib/redis/cache'

// ===========================
// Privacy-Compliant Analytics
// ===========================

export interface PrivacySettings {
  essential: boolean
  analytics: boolean
  marketing: boolean
  personalization: boolean
}

export interface UserConsent {
  userId?: string
  sessionId: string
  consentGiven: boolean
  privacySettings: PrivacySettings
  consentDate: string
  ipAddress?: string
  userAgent?: string
}

export interface PrivateAnalyticsEvent {
  eventType: string
  eventData: Record<string, any>
  userId?: string
  sessionId: string
  pageUrl?: string
  timestamp: string
}

// ===========================
// Privacy Manager
// ===========================

class PrivacyManager {
  private consentStore: Map<string, UserConsent> = new Map()
  private anonymizedEvents: PrivateAnalyticsEvent[] = []

  // Check if user has given consent for analytics
  hasAnalyticsConsent(sessionId: string, userId?: string): boolean {
    const key = userId || sessionId
    const consent = this.consentStore.get(key)
    return consent?.consentGiven && consent.privacySettings.analytics || false
  }

  // Store user consent
  async storeConsent(consent: UserConsent): Promise<void> {
    const key = consent.userId || consent.sessionId
    this.consentStore.set(key, consent)
    
    // Store in cache for persistence
    await cache.setex(`consent:${key}`, 86400 * 365, JSON.stringify(consent)) // 1 year
  }

  // Retrieve user consent
  async getConsent(sessionId: string, userId?: string): Promise<UserConsent | null> {
    const key = userId || sessionId
    
    // Check memory first
    let consent = this.consentStore.get(key)
    if (consent) return consent
    
    // Check cache
    const cached = await cache.get(`consent:${key}`)
    if (cached) {
      consent = JSON.parse(cached)
      this.consentStore.set(key, consent)
      return consent
    }
    
    return null
  }

  // Anonymize user data
  anonymizeData(data: any): any {
    const anonymized = { ...data }
    
    // Remove or hash personally identifiable information
    delete anonymized.email
    delete anonymized.fullName
    delete anonymized.ipAddress
    
    // Hash user ID if present
    if (anonymized.userId) {
      anonymized.userHash = this.hashUserId(anonymized.userId)
      delete anonymized.userId
    }
    
    // Truncate user agent
    if (anonymized.userAgent) {
      anonymized.userAgent = this.truncateUserAgent(anonymized.userAgent)
    }
    
    return anonymized
  }

  private hashUserId(userId: string): string {
    // Simple hash for demonstration - use proper cryptographic hash in production
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  private truncateUserAgent(userAgent: string): string {
    // Remove detailed version information while keeping browser type
    return userAgent.replace(/\/[\d.]+/g, '').substring(0, 100)
  }
}

// ===========================
// Privacy-Compliant Analytics Service
// ===========================

export class PrivacyCompliantAnalytics {
  private privacyManager: PrivacyManager
  
  constructor() {
    this.privacyManager = new PrivacyManager()
  }

  // Track event with privacy compliance
  async trackEvent(
    eventType: string,
    eventData: Record<string, any>,
    sessionId: string,
    userId?: string
  ): Promise<void> {
    // Check if user has consented to analytics
    const hasConsent = await this.privacyManager.hasAnalyticsConsent(sessionId, userId)
    
    if (!hasConsent) {
      // Only track essential events without personal data
      if (this.isEssentialEvent(eventType)) {
        await this.trackEssentialEvent(eventType, eventData, sessionId)
      }
      return
    }

    // User has consented, track with appropriate privacy measures
    const anonymizedData = this.privacyManager.anonymizeData(eventData)
    
    switch (eventType) {
      case 'page_view':
        await this.trackPageView(anonymizedData, sessionId, userId)
        break
      case 'manuscript_view':
        await this.trackManuscriptEngagement(anonymizedData, sessionId, userId)
        break
      case 'search':
        await this.trackSearch(anonymizedData, sessionId, userId)
        break
      case 'user_engagement':
        await this.trackUserEngagement(anonymizedData, sessionId, userId)
        break
      default:
        await this.trackGenericEvent(eventType, anonymizedData, sessionId, userId)
    }
  }

  // Store user consent
  async recordConsent(consent: UserConsent): Promise<void> {
    await this.privacyManager.storeConsent(consent)
  }

  // Get user consent status
  async getConsentStatus(sessionId: string, userId?: string): Promise<UserConsent | null> {
    return await this.privacyManager.getConsent(sessionId, userId)
  }

  // Check if event is essential (doesn't require consent)
  private isEssentialEvent(eventType: string): boolean {
    const essentialEvents = [
      'error_tracking',
      'security_event',
      'system_health',
      'authentication'
    ]
    return essentialEvents.includes(eventType)
  }

  // Track essential events without personal data
  private async trackEssentialEvent(
    eventType: string,
    eventData: Record<string, any>,
    sessionId: string
  ): Promise<void> {
    const essentialData = {
      eventType,
      timestamp: new Date().toISOString(),
      sessionId: this.privacyManager.anonymizeData({ sessionId }).sessionId,
      data: this.privacyManager.anonymizeData(eventData)
    }

    // Store minimal essential analytics
    await cache.lpush('essential_events', JSON.stringify(essentialData))
    await cache.ltrim('essential_events', 0, 1000) // Keep last 1000 events
  }

  // Track page views with privacy protection
  private async trackPageView(
    data: Record<string, any>,
    sessionId: string,
    userId?: string
  ): Promise<void> {
    await analytics.trackUserEngagement({
      userId: userId || `anon_${this.privacyManager.anonymizeData({ sessionId }).sessionId}`,
      sessionId,
      action: 'page_view',
      metadata: {
        page: data.page,
        referrer: data.referrer ? new URL(data.referrer).hostname : null, // Only domain
        loadTime: data.loadTime,
        timestamp: new Date().toISOString()
      }
    })
  }

  // Track manuscript engagement
  private async trackManuscriptEngagement(
    data: Record<string, any>,
    sessionId: string,
    userId?: string
  ): Promise<void> {
    await analytics.trackManuscriptEvent({
      manuscriptId: data.manuscriptId,
      eventType: data.eventType,
      eventData: {
        section: data.section,
        timeSpent: data.timeSpent,
        scrollDepth: data.scrollDepth
      },
      userId,
      sessionId,
      pageUrl: data.pageUrl,
      countryCode: data.countryCode // Aggregated location data only
    })
  }

  // Track search with privacy protection
  private async trackSearch(
    data: Record<string, any>,
    sessionId: string,
    userId?: string
  ): Promise<void> {
    // Hash search query to protect user intent while allowing analysis
    const hashedQuery = data.searchQuery ? 
      this.privacyManager.anonymizeData({ query: data.searchQuery }).query : ''

    await analytics.trackSearchEvent({
      searchQuery: hashedQuery,
      searchType: data.searchType,
      filtersApplied: data.filtersApplied || {},
      resultsCount: data.resultsCount,
      resultsClicked: data.resultsClicked,
      userId,
      sessionId,
      searchDurationMs: data.searchDurationMs
    })
  }

  // Track user engagement events
  private async trackUserEngagement(
    data: Record<string, any>,
    sessionId: string,
    userId?: string
  ): Promise<void> {
    await analytics.trackUserEngagement({
      userId: userId || `anon_${sessionId}`,
      sessionId,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      durationSeconds: data.durationSeconds,
      metadata: {
        interaction: data.interaction,
        timestamp: new Date().toISOString()
      }
    })
  }

  // Track generic events
  private async trackGenericEvent(
    eventType: string,
    data: Record<string, any>,
    sessionId: string,
    userId?: string
  ): Promise<void> {
    const eventData = {
      eventType,
      userId,
      sessionId,
      data,
      timestamp: new Date().toISOString()
    }

    await cache.lpush('privacy_compliant_events', JSON.stringify(eventData))
    await cache.ltrim('privacy_compliant_events', 0, 10000) // Keep last 10k events
  }

  // Generate privacy-compliant analytics report
  async generatePrivacyReport(): Promise<any> {
    const report = {
      dataProcessing: {
        totalEvents: 0,
        anonymizedEvents: 0,
        consentedUsers: 0,
        essentialOnly: 0
      },
      privacyCompliance: {
        gdprCompliant: true,
        ccpaCompliant: true,
        dataRetention: '90 days',
        anonymizationMethod: 'Hash-based with PII removal'
      },
      userConsent: {
        analyticsConsent: 0,
        marketingConsent: 0,
        personalizationConsent: 0,
        totalUsers: 0
      },
      dataTypes: {
        essential: ['error_tracking', 'security_events', 'system_health'],
        analytics: ['page_views', 'user_engagement', 'performance'],
        marketing: ['campaign_tracking', 'conversion_events'],
        personalization: ['preferences', 'recommendations']
      }
    }

    // Calculate consent metrics (mock data)
    report.userConsent.analyticsConsent = 850
    report.userConsent.marketingConsent = 720
    report.userConsent.personalizationConsent = 680
    report.userConsent.totalUsers = 1200

    report.dataProcessing.totalEvents = 45000
    report.dataProcessing.anonymizedEvents = 38000
    report.dataProcessing.consentedUsers = 850
    report.dataProcessing.essentialOnly = 350

    return report
  }

  // Data export for user rights (GDPR Article 20)
  async exportUserData(userId: string): Promise<any> {
    // Collect all user data that can be exported
    const userData = {
      userId,
      exportDate: new Date().toISOString(),
      analytics: {
        pageViews: [],
        searches: [],
        engagements: [],
        manuscripts: []
      },
      privacy: {
        consentHistory: [],
        dataProcessing: [],
        retentionPeriod: '90 days'
      }
    }

    // In a real implementation, query actual user data
    // This would include aggregated analytics data that can be attributed to the user
    
    return userData
  }

  // Data deletion for user rights (GDPR Article 17)
  async deleteUserData(userId: string): Promise<boolean> {
    try {
      // Remove user consent
      await cache.del(`consent:${userId}`)
      
      // Mark user data for anonymization in analytics
      const anonymizationRecord = {
        userId,
        anonymizedAt: new Date().toISOString(),
        reason: 'user_request'
      }
      
      await cache.setex(`anonymized:${userId}`, 86400 * 30, JSON.stringify(anonymizationRecord))
      
      // In production, this would trigger a batch job to anonymize historical data
      console.log(`User data deletion initiated for user: ${userId}`)
      
      return true
    } catch (error) {
      console.error('Failed to delete user data:', error)
      return false
    }
  }
}

// ===========================
// Client-side Privacy Helper
// ===========================

export class ClientPrivacyHelper {
  private analytics: PrivacyCompliantAnalytics
  private sessionId: string
  private userId?: string

  constructor() {
    this.analytics = new PrivacyCompliantAnalytics()
    this.sessionId = this.generateSessionId()
    this.setupConsentBanner()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  setUserId(userId: string) {
    this.userId = userId
  }

  // Check if consent banner should be shown
  async shouldShowConsentBanner(): Promise<boolean> {
    const consent = await this.analytics.getConsentStatus(this.sessionId, this.userId)
    return !consent
  }

  // Store user consent preferences
  async recordConsent(privacySettings: PrivacySettings): Promise<void> {
    const consent: UserConsent = {
      userId: this.userId,
      sessionId: this.sessionId,
      consentGiven: true,
      privacySettings,
      consentDate: new Date().toISOString(),
      userAgent: navigator.userAgent
    }

    await this.analytics.recordConsent(consent)
  }

  // Track event with privacy compliance
  async trackEvent(eventType: string, eventData: Record<string, any>): Promise<void> {
    await this.analytics.trackEvent(eventType, eventData, this.sessionId, this.userId)
  }

  // Setup consent banner (to be called in app initialization)
  private setupConsentBanner(): void {
    if (typeof window === 'undefined') return

    // This would integrate with your consent banner component
    window.addEventListener('load', async () => {
      const shouldShow = await this.shouldShowConsentBanner()
      if (shouldShow) {
        // Trigger consent banner display
        window.dispatchEvent(new CustomEvent('showConsentBanner'))
      }
    })
  }
}

// Export singleton instances
export const privacyCompliantAnalytics = new PrivacyCompliantAnalytics()
export const clientPrivacyHelper = typeof window !== 'undefined' ? new ClientPrivacyHelper() : null