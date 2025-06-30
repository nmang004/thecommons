import { NextRequest, NextResponse } from 'next/server'
import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/redis/cache'
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/security/rate-limiting'

export interface ApiCacheConfig {
  ttl?: number
  keyGenerator?: (req: NextRequest) => string
  shouldCache?: (req: NextRequest, res: NextResponse) => boolean
  varyBy?: string[] // Headers to vary cache by
  tags?: string[] // Cache tags for invalidation
}

// Default cache configurations for different API routes
export const API_CACHE_CONFIGS = {
  '/api/manuscripts': {
    ttl: CACHE_TTL.SHORT,
    keyGenerator: (req: NextRequest) => {
      const url = new URL(req.url)
      const searchParams = url.searchParams.toString()
      return `api:manuscripts:${searchParams}`
    },
    varyBy: ['authorization']
  },
  '/api/articles': {
    ttl: CACHE_TTL.MEDIUM,
    keyGenerator: (req: NextRequest) => {
      const url = new URL(req.url)
      const searchParams = url.searchParams.toString()
      return `api:articles:${searchParams}`
    }
  },
  '/api/search': {
    ttl: CACHE_TTL.SHORT,
    keyGenerator: (req: NextRequest) => {
      const url = new URL(req.url)
      const query = url.searchParams.get('q') || ''
      const filters = url.searchParams.toString()
      return CACHE_KEYS.SEARCH.RESULTS(query, filters)
    }
  },
  '/api/fields': {
    ttl: CACHE_TTL.VERY_LONG,
    keyGenerator: () => CACHE_KEYS.FIELDS.ALL
  },
  '/api/stats': {
    ttl: CACHE_TTL.LONG,
    keyGenerator: (req: NextRequest) => {
      const url = new URL(req.url)
      const type = url.searchParams.get('type') || 'general'
      return `stats:${type}`
    }
  }
} as const

class ApiCacheManager {
  private getCacheKey(req: NextRequest, config: ApiCacheConfig): string {
    if (config.keyGenerator) {
      return config.keyGenerator(req)
    }

    // Default key generation
    const url = new URL(req.url)
    const pathname = url.pathname
    const searchParams = url.searchParams.toString()
    
    let key = `api:${pathname.replace(/\//g, ':')}`
    if (searchParams) {
      key += `:${searchParams}`
    }

    // Add vary-by headers to key
    if (config.varyBy) {
      const varyValues = config.varyBy
        .map(header => req.headers.get(header) || '')
        .join(':')
      if (varyValues) {
        key += `:${varyValues}`
      }
    }

    return key
  }

  private shouldCacheRequest(req: NextRequest): boolean {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return false
    }

    // Don't cache requests with certain headers
    if (req.headers.get('cache-control')?.includes('no-cache')) {
      return false
    }

    // Don't cache authenticated requests by default (unless specifically configured)
    const hasAuth = req.headers.get('authorization') || req.headers.get('cookie')?.includes('supabase')
    
    return !hasAuth
  }

  private shouldCacheResponse(res: Response | NextResponse, config: ApiCacheConfig): boolean {
    // Don't cache error responses
    if (res.status >= 400) {
      return false
    }

    // Use custom shouldCache function if provided
    if (config.shouldCache) {
      return config.shouldCache(undefined as any, res as NextResponse)
    }

    return true
  }

  async getCachedResponse(req: NextRequest, config: ApiCacheConfig): Promise<{
    response: NextResponse | null
    cacheKey: string
  }> {
    const cacheKey = this.getCacheKey(req, config)
    
    if (!this.shouldCacheRequest(req)) {
      return { response: null, cacheKey }
    }

    try {
      const cached = await cache.get<{
        body: string
        status: number
        headers: Record<string, string>
        timestamp: number
      }>(cacheKey)

      if (cached) {
        const response = new NextResponse(cached.body, {
          status: cached.status,
          headers: {
            ...cached.headers,
            'X-Cache': 'HIT',
            'X-Cache-Date': new Date(cached.timestamp).toISOString()
          }
        })
        
        return { response, cacheKey }
      }
    } catch (error) {
      console.error('Cache retrieval error:', error)
    }

    return { response: null, cacheKey }
  }

  async setCachedResponse(
    cacheKey: string, 
    response: Response | NextResponse, 
    config: ApiCacheConfig
  ): Promise<void> {
    if (!this.shouldCacheResponse(response, config)) {
      return
    }

    try {
      const body = await response.text()
      const headers: Record<string, string> = {}
      
      response.headers.forEach((value, key) => {
        headers[key] = value
      })

      const cacheData = {
        body,
        status: response.status,
        headers,
        timestamp: Date.now()
      }

      await cache.set(cacheKey, cacheData, { 
        ttl: config.ttl || CACHE_TTL.MEDIUM 
      })

      // Store cache tags for invalidation
      if (config.tags) {
        for (const tag of config.tags) {
          await cache.setHash(`tag:${tag}`, cacheKey, true, { 
            ttl: config.ttl || CACHE_TTL.MEDIUM 
          })
        }
      }
    } catch (error) {
      console.error('Cache storage error:', error)
    }
  }
}

const apiCacheManager = new ApiCacheManager()

// Middleware function for API caching
export function withApiCache(config: ApiCacheConfig = {}) {
  return function(handler: (req: NextRequest) => Promise<NextResponse>) {
    return async function(req: NextRequest): Promise<NextResponse> {
      // Check rate limits first
      const rateLimitResponse = await rateLimitMiddleware(req, RATE_LIMITS.API_GENERAL)
      if (rateLimitResponse) {
        return rateLimitResponse
      }

      // Try to get cached response
      const { response: cachedResponse, cacheKey } = await apiCacheManager.getCachedResponse(req, config)
      
      if (cachedResponse) {
        return cachedResponse
      }

      // Execute the handler
      const response = await handler(req)
      
      // Cache the response
      await apiCacheManager.setCachedResponse(cacheKey, response.clone(), config)
      
      // Add cache headers
      response.headers.set('X-Cache', 'MISS')
      response.headers.set('Cache-Control', `public, max-age=${config.ttl || CACHE_TTL.MEDIUM}`)
      
      return response
    }
  }
}

// Cache invalidation by tags
export async function invalidateApiCacheByTag(tag: string): Promise<void> {
  const tagKey = `tag:${tag}`
  const redis = cache.getRedisClient()
  const keys = await redis.hkeys(tagKey)
  
  if (keys.length > 0) {
    // Delete all cached responses for this tag
    await redis.del(...keys)
    // Delete the tag itself
    await cache.del(tagKey)
  }
}

// Cache invalidation by pattern
export async function invalidateApiCacheByPattern(pattern: string): Promise<void> {
  await cache.flush(pattern)
}

// Helper to get cache statistics
export async function getCacheStats(): Promise<{
  hitRate: number
  missRate: number
  totalRequests: number
  cacheSize: number
}> {
  try {
    const redis = cache.getRedisClient()
    const info = await redis.info('stats')
    const lines = info.split('\r\n')
    
    let hits = 0
    let misses = 0
    
    for (const line of lines) {
      if (line.startsWith('keyspace_hits:')) {
        hits = parseInt(line.split(':')[1])
      } else if (line.startsWith('keyspace_misses:')) {
        misses = parseInt(line.split(':')[1])
      }
    }
    
    const totalRequests = hits + misses
    const hitRate = totalRequests > 0 ? hits / totalRequests : 0
    const missRate = totalRequests > 0 ? misses / totalRequests : 0
    
    // Get approximate cache size
    const dbSize = await redis.dbsize()
    
    return {
      hitRate,
      missRate,
      totalRequests,
      cacheSize: dbSize
    }
  } catch (error) {
    console.error('Error getting cache stats:', error)
    return {
      hitRate: 0,
      missRate: 0,
      totalRequests: 0,
      cacheSize: 0
    }
  }
}

// Preload critical data
export async function preloadCriticalCache(): Promise<void> {
  try {
    // Preload frequently accessed data
    const criticalOperations = [
      // Preload fields of study
      cache.set(CACHE_KEYS.FIELDS.ALL, [], { ttl: CACHE_TTL.VERY_LONG }),
      
      // Preload homepage stats
      cache.set(CACHE_KEYS.STATS.HOMEPAGE, {}, { ttl: CACHE_TTL.LONG }),
      
      // Preload recent articles
      cache.set(CACHE_KEYS.ARTICLES.RECENT, [], { ttl: CACHE_TTL.MEDIUM })
    ]
    
    await Promise.all(criticalOperations)
    console.log('Critical cache preloaded successfully')
  } catch (error) {
    console.error('Error preloading critical cache:', error)
  }
}

// Cache warming function
export async function warmCache(routes: string[]): Promise<void> {
  for (const route of routes) {
    try {
      // Make a request to warm the cache
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}${route}`)
      if (response.ok) {
        console.log(`Cache warmed for route: ${route}`)
      }
    } catch (error) {
      console.error(`Error warming cache for route ${route}:`, error)
    }
  }
}