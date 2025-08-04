import { cache, CACHE_KEYS, CACHE_TTL, invalidateUserCache } from '@/lib/redis/cache'
import { createClient } from '@/lib/supabase/server'
import { User } from '@supabase/supabase-js'
import type { Manuscript, Notification } from '@/types/database'

// Dashboard data types
interface DashboardStats {
  manuscriptCount: number
  reviewCount: number
  pendingActions: number
  recentActivity: Array<{
    id: string
    action: string
    timestamp: string
    details: string
  }>
}

interface DashboardData {
  manuscripts: Manuscript[]
  notifications: Notification[]
  stats: DashboardStats
}

export interface UserSession {
  user: User
  profile: {
    id: string
    full_name: string
    email: string
    role: string
    affiliation?: string
    orcid?: string
    avatar_url?: string
    expertise?: string[]
  }
  preferences: {
    theme: 'light' | 'dark'
    notifications: boolean
    language: string
  }
  dashboardData?: DashboardData
}

export interface SessionActivity {
  userId: string
  action: string
  timestamp: string
  metadata?: Record<string, unknown>
}

export class SessionService {
  private async getSupabase() {
    return await createClient()
  }

  // Cache user session data
  async cacheUserSession(userId: string, sessionData: UserSession): Promise<void> {
    const cacheKey = CACHE_KEYS.USERS.SESSIONS(userId)
    await cache.set(cacheKey, sessionData, { ttl: CACHE_TTL.MEDIUM })
  }

  // Get cached user session
  async getCachedUserSession(userId: string): Promise<UserSession | null> {
    const cacheKey = CACHE_KEYS.USERS.SESSIONS(userId)
    return await cache.get<UserSession>(cacheKey)
  }

  // Get user profile with caching
  async getUserProfile(userId: string): Promise<UserSession['profile'] | null> {
    const cacheKey = CACHE_KEYS.USERS.PROFILE(userId)
    
    const cached = await cache.get<UserSession['profile']>(cacheKey)
    if (cached) {
      return cached
    }

    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return null
    }

    // Cache the profile
    await cache.set(cacheKey, data, { ttl: CACHE_TTL.LONG })
    
    return data
  }

  // Cache dashboard data for faster loading
  async cacheDashboardData(userId: string, role: string, dashboardData: DashboardData): Promise<void> {
    const cacheKey = CACHE_KEYS.USERS.DASHBOARDS(userId, role)
    await cache.set(cacheKey, dashboardData, { ttl: CACHE_TTL.SHORT })
  }

  // Get cached dashboard data
  async getCachedDashboardData(userId: string, role: string): Promise<any | null> {
    const cacheKey = CACHE_KEYS.USERS.DASHBOARDS(userId, role)
    return await cache.get(cacheKey)
  }

  // Track user activity
  async trackActivity(activity: SessionActivity): Promise<void> {
    const activityKey = `activity:${activity.userId}:${Date.now()}`
    await cache.set(activityKey, activity, { ttl: CACHE_TTL.VERY_LONG })

    // Also store in a list for recent activities
    const recentKey = `activity:recent:${activity.userId}`
    const recentActivities = await cache.get<SessionActivity[]>(recentKey) || []
    
    recentActivities.unshift(activity)
    // Keep only last 50 activities
    if (recentActivities.length > 50) {
      recentActivities.splice(50)
    }
    
    await cache.set(recentKey, recentActivities, { ttl: CACHE_TTL.VERY_LONG })
  }

  // Get recent user activities
  async getRecentActivities(userId: string, limit: number = 10): Promise<SessionActivity[]> {
    const recentKey = `activity:recent:${userId}`
    const activities = await cache.get<SessionActivity[]>(recentKey) || []
    return activities.slice(0, limit)
  }

  // Invalidate user session cache
  async invalidateUserSession(userId: string): Promise<void> {
    await invalidateUserCache(userId)
  }

  // Store user preferences
  async updateUserPreferences(userId: string, preferences: Partial<UserSession['preferences']>): Promise<void> {
    const prefsKey = `prefs:${userId}`
    const existingPrefs = await cache.get<UserSession['preferences']>(prefsKey) || {
      theme: 'light',
      notifications: true,
      language: 'en'
    }

    const updatedPrefs = { ...existingPrefs, ...preferences }
    await cache.set(prefsKey, updatedPrefs, { ttl: CACHE_TTL.VERY_LONG })
    
    // Also update in database
    const supabase = await this.getSupabase()
    await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        preferences: updatedPrefs,
        updated_at: new Date().toISOString()
      })
  }

  // Get user preferences
  async getUserPreferences(userId: string): Promise<UserSession['preferences']> {
    const prefsKey = `prefs:${userId}`
    const cached = await cache.get<UserSession['preferences']>(prefsKey)
    
    if (cached) {
      return cached
    }

    // Fallback to database
    const supabase = await this.getSupabase()
    const { data } = await supabase
      .from('user_preferences')
      .select('preferences')
      .eq('user_id', userId)
      .single()

    const preferences = data?.preferences || {
      theme: 'light',
      notifications: true,
      language: 'en'
    }

    // Cache for next time
    await cache.set(prefsKey, preferences, { ttl: CACHE_TTL.VERY_LONG })
    
    return preferences
  }

  // Session-based manuscript recommendations
  async getCachedRecommendations(userId: string): Promise<any[] | null> {
    const recsKey = `recommendations:${userId}`
    return await cache.get<any[]>(recsKey)
  }

  async cacheRecommendations(userId: string, recommendations: Array<{
    id: string
    type: string
    title: string
    description: string
    priority: number
    metadata?: Record<string, unknown>
  }>): Promise<void> {
    const recsKey = `recommendations:${userId}`
    await cache.set(recsKey, recommendations, { ttl: CACHE_TTL.LONG })
  }

  // Notification caching
  async getCachedNotifications(userId: string): Promise<any[] | null> {
    const notifKey = `notifications:${userId}`
    return await cache.get<any[]>(notifKey)
  }

  async cacheNotifications(userId: string, notifications: Notification[]): Promise<void> {
    const notifKey = `notifications:${userId}`
    await cache.set(notifKey, notifications, { ttl: CACHE_TTL.SHORT })
  }

  // Search history caching
  async addToSearchHistory(userId: string, query: string): Promise<void> {
    const historyKey = `search_history:${userId}`
    const history = await cache.get<string[]>(historyKey) || []
    
    // Remove if already exists
    const filteredHistory = history.filter(q => q !== query)
    
    // Add to beginning
    filteredHistory.unshift(query)
    
    // Keep only last 20 searches
    if (filteredHistory.length > 20) {
      filteredHistory.splice(20)
    }
    
    await cache.set(historyKey, filteredHistory, { ttl: CACHE_TTL.VERY_LONG })
  }

  async getSearchHistory(userId: string): Promise<string[]> {
    const historyKey = `search_history:${userId}`
    return await cache.get<string[]>(historyKey) || []
  }

  // Online status tracking
  async updateOnlineStatus(userId: string): Promise<void> {
    const onlineKey = `online:${userId}`
    await cache.set(onlineKey, Date.now(), { ttl: 300 }) // 5 minutes
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const onlineKey = `online:${userId}`
    const lastSeen = await cache.get<number>(onlineKey)
    
    if (!lastSeen) return false
    
    // Consider online if seen within last 5 minutes
    return (Date.now() - lastSeen) < 300000
  }

  async getOnlineUsers(): Promise<string[]> {
    // This would need a more sophisticated implementation
    // For now, return empty array
    return []
  }

  // Batch operations for efficiency
  async batchCacheUserData(userId: string, data: {
    profile?: UserSession['profile']
    preferences?: UserSession['preferences']
    dashboardData?: DashboardData
    notifications?: Notification[]
  }): Promise<void> {
    const operations = []

    if (data.profile) {
      operations.push(
        cache.set(CACHE_KEYS.USERS.PROFILE(userId), data.profile, { ttl: CACHE_TTL.LONG })
      )
    }

    if (data.preferences) {
      operations.push(
        cache.set(`prefs:${userId}`, data.preferences, { ttl: CACHE_TTL.VERY_LONG })
      )
    }

    if (data.dashboardData) {
      const role = data.profile?.role || 'author'
      operations.push(
        cache.set(CACHE_KEYS.USERS.DASHBOARDS(userId, role), data.dashboardData, { ttl: CACHE_TTL.SHORT })
      )
    }

    if (data.notifications) {
      operations.push(
        cache.set(`notifications:${userId}`, data.notifications, { ttl: CACHE_TTL.SHORT })
      )
    }

    await Promise.all(operations)
  }
}

// Create singleton instance
export const sessionService = new SessionService()