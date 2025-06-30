import { getRedisClient } from './client'

interface CacheOptions {
  ttl?: number // Time to live in seconds
  prefix?: string
}

const DEFAULT_TTL = 3600 // 1 hour
const DEFAULT_PREFIX = 'thecommons:'

export class CacheService {
  private redis = getRedisClient()

  private getKey(key: string, prefix?: string): string {
    const keyPrefix = prefix || DEFAULT_PREFIX
    return `${keyPrefix}${key}`
  }

  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    try {
      const fullKey = this.getKey(key, options.prefix)
      const cached = await this.redis.get(fullKey)
      
      if (!cached) {
        return null
      }

      return JSON.parse(cached) as T
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  async set<T>(
    key: string, 
    value: T, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      const fullKey = this.getKey(key, options.prefix)
      const ttl = options.ttl || DEFAULT_TTL
      const serialized = JSON.stringify(value)
      
      await this.redis.setex(fullKey, ttl, serialized)
      return true
    } catch (error) {
      console.error('Cache set error:', error)
      return false
    }
  }

  async del(key: string, options: CacheOptions = {}): Promise<boolean> {
    try {
      const fullKey = this.getKey(key, options.prefix)
      await this.redis.del(fullKey)
      return true
    } catch (error) {
      console.error('Cache delete error:', error)
      return false
    }
  }

  async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    try {
      const fullKey = this.getKey(key, options.prefix)
      const result = await this.redis.exists(fullKey)
      return result === 1
    } catch (error) {
      console.error('Cache exists error:', error)
      return false
    }
  }

  async flush(pattern?: string): Promise<boolean> {
    try {
      const searchPattern = pattern || `${DEFAULT_PREFIX}*`
      const keys = await this.redis.keys(searchPattern)
      
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
      
      return true
    } catch (error) {
      console.error('Cache flush error:', error)
      return false
    }
  }

  async increment(key: string, options: CacheOptions = {}): Promise<number> {
    try {
      const fullKey = this.getKey(key, options.prefix)
      return await this.redis.incr(fullKey)
    } catch (error) {
      console.error('Cache increment error:', error)
      throw error
    }
  }

  // Public method to access Redis client for specialized operations
  public getRedisClient() {
    return this.redis
  }

  async setHash(
    key: string, 
    field: string, 
    value: any, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      const fullKey = this.getKey(key, options.prefix)
      await this.redis.hset(fullKey, field, JSON.stringify(value))
      
      if (options.ttl) {
        await this.redis.expire(fullKey, options.ttl)
      }
      
      return true
    } catch (error) {
      console.error('Cache setHash error:', error)
      return false
    }
  }

  async getHash<T>(
    key: string, 
    field: string, 
    options: CacheOptions = {}
  ): Promise<T | null> {
    try {
      const fullKey = this.getKey(key, options.prefix)
      const cached = await this.redis.hget(fullKey, field)
      
      if (!cached) {
        return null
      }

      return JSON.parse(cached) as T
    } catch (error) {
      console.error('Cache getHash error:', error)
      return null
    }
  }
}

// Create singleton instance
export const cache = new CacheService()

// Utility functions for common caching patterns
export const cacheWithFallback = async <T>(
  key: string,
  fallbackFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> => {
  // Try to get from cache first
  const cached = await cache.get<T>(key, options)
  if (cached !== null) {
    return cached
  }

  // Execute fallback function
  const result = await fallbackFn()
  
  // Cache the result
  await cache.set(key, result, options)
  
  return result
}

export const invalidatePattern = async (pattern: string): Promise<void> => {
  await cache.flush(pattern)
}

// Specific cache keys for the application
export const CACHE_KEYS = {
  ARTICLES: {
    LIST: (filters: string) => `articles:list:${filters}`,
    DETAIL: (id: string) => `articles:detail:${id}`,
    RECENT: 'articles:recent',
    POPULAR: 'articles:popular',
    TRENDING: 'articles:trending',
    BY_FIELD: (field: string) => `articles:field:${field}`,
    CITATIONS: (id: string) => `articles:citations:${id}`,
  },
  SEARCH: {
    RESULTS: (query: string, filters: string) => `search:${query}:${filters}`,
    SUGGESTIONS: (query: string) => `search:suggestions:${query}`,
    FACETS: (field: string) => `search:facets:${field}`,
  },
  USERS: {
    PROFILE: (id: string) => `users:profile:${id}`,
    SESSIONS: (id: string) => `users:sessions:${id}`,
    DASHBOARDS: (id: string, role: string) => `users:dashboard:${id}:${role}`,
  },
  MANUSCRIPTS: {
    LIST: (userId: string, status?: string) => `manuscripts:list:${userId}:${status || 'all'}`,
    DETAIL: (id: string) => `manuscripts:detail:${id}`,
    REVIEWS: (id: string) => `manuscripts:reviews:${id}`,
    QUEUE: (editorId: string) => `manuscripts:queue:${editorId}`,
  },
  STATS: {
    HOMEPAGE: 'stats:homepage',
    GLOBAL: 'stats:global',
    DASHBOARD: (userId: string) => `stats:dashboard:${userId}`,
  },
  FIELDS: {
    ALL: 'fields:all',
    WITH_COUNTS: 'fields:with_counts',
    HIERARCHY: 'fields:hierarchy',
  },
  API: {
    RESPONSE: (endpoint: string, params: string) => `api:${endpoint}:${params}`,
  }
} as const

export const CACHE_TTL = {
  SHORT: 300,    // 5 minutes
  MEDIUM: 1800,  // 30 minutes
  LONG: 3600,    // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const

// Cache invalidation strategies
export const invalidateArticleCache = async (articleId?: string) => {
  if (articleId) {
    await cache.del(CACHE_KEYS.ARTICLES.DETAIL(articleId))
    await cache.del(CACHE_KEYS.ARTICLES.CITATIONS(articleId))
  }
  
  // Invalidate list caches
  await invalidatePattern(`${DEFAULT_PREFIX}articles:list:*`)
  await cache.del(CACHE_KEYS.ARTICLES.RECENT)
  await cache.del(CACHE_KEYS.ARTICLES.POPULAR)
  await cache.del(CACHE_KEYS.ARTICLES.TRENDING)
}

export const invalidateSearchCache = async (query?: string) => {
  if (query) {
    await invalidatePattern(`${DEFAULT_PREFIX}search:${query}:*`)
    await cache.del(CACHE_KEYS.SEARCH.SUGGESTIONS(query))
  } else {
    await invalidatePattern(`${DEFAULT_PREFIX}search:*`)
  }
}

export const invalidateUserCache = async (userId: string) => {
  await cache.del(CACHE_KEYS.USERS.PROFILE(userId))
  await cache.del(CACHE_KEYS.USERS.SESSIONS(userId))
  await invalidatePattern(`${DEFAULT_PREFIX}users:dashboard:${userId}:*`)
  await cache.del(CACHE_KEYS.STATS.DASHBOARD(userId))
}

export const invalidateManuscriptCache = async (manuscriptId?: string, userId?: string) => {
  if (manuscriptId) {
    await cache.del(CACHE_KEYS.MANUSCRIPTS.DETAIL(manuscriptId))
    await cache.del(CACHE_KEYS.MANUSCRIPTS.REVIEWS(manuscriptId))
  }
  
  if (userId) {
    await invalidatePattern(`${DEFAULT_PREFIX}manuscripts:list:${userId}:*`)
  }
  
  // Invalidate editor queues
  await invalidatePattern(`${DEFAULT_PREFIX}manuscripts:queue:*`)
}

// Enhanced caching with automatic invalidation
export const cacheWithTags = async <T>(
  key: string,
  tags: string[],
  fallbackFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> => {
  // Try to get from cache first
  const cached = await cache.get<T>(key, options)
  if (cached !== null) {
    return cached
  }

  // Execute fallback function
  const result = await fallbackFn()
  
  // Cache the result
  await cache.set(key, result, options)
  
  // Store tags for this cache entry
  for (const tag of tags) {
    const tagKey = `tag:${tag}`
    await cache.setHash(tagKey, key, true, { ttl: options.ttl || DEFAULT_TTL })
  }
  
  return result
}

export const invalidateByTag = async (tag: string): Promise<void> => {
  const tagKey = `tag:${tag}`
  const keys = await cache.getRedisClient().hkeys(tagKey)
  
  if (keys.length > 0) {
    // Delete all keys associated with this tag
    await cache.getRedisClient().del(...keys.map(key => `${DEFAULT_PREFIX}${key}`))
    // Delete the tag itself
    await cache.del(tagKey)
  }
}