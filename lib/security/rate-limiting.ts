import { NextRequest, NextResponse } from 'next/server'
import { cache } from '@/lib/redis/cache'

interface RateLimitConfig {
  windowMs: number  // Time window in milliseconds
  maxRequests: number  // Maximum requests per window
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (req: NextRequest) => string
  onLimitReached?: (req: NextRequest) => void
}

interface RateLimitInfo {
  limit: number
  current: number
  remaining: number
  resetTime: number
}

// Default rate limit configurations for different endpoints
export const RATE_LIMITS = {
  // API endpoints
  API_GENERAL: { windowMs: 15 * 60 * 1000, maxRequests: 1000 }, // 1000 req/15min
  API_AUTH: { windowMs: 15 * 60 * 1000, maxRequests: 10 }, // 10 req/15min for auth
  API_UPLOAD: { windowMs: 60 * 60 * 1000, maxRequests: 50 }, // 50 uploads/hour
  API_SEARCH: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 searches/minute
  
  // Public pages
  PUBLIC_PAGES: { windowMs: 60 * 1000, maxRequests: 200 }, // 200 req/minute
  
  // Dashboard pages
  DASHBOARD: { windowMs: 60 * 1000, maxRequests: 500 }, // 500 req/minute
  
  // Submission endpoints
  MANUSCRIPT_SUBMIT: { windowMs: 60 * 60 * 1000, maxRequests: 10 }, // 10 submissions/hour
  REVIEW_SUBMIT: { windowMs: 60 * 60 * 1000, maxRequests: 20 }, // 20 reviews/hour
} as const

class RateLimiter {
  private redis = cache.redis

  private getKey(identifier: string, windowStart: number): string {
    return `ratelimit:${identifier}:${windowStart}`
  }

  private getWindowStart(windowMs: number): number {
    return Math.floor(Date.now() / windowMs) * windowMs
  }

  async checkRateLimit(
    identifier: string,
    config: RateLimitConfig
  ): Promise<{ success: boolean; info: RateLimitInfo }> {
    const windowStart = this.getWindowStart(config.windowMs)
    const key = this.getKey(identifier, windowStart)
    
    try {
      // Get current count
      const current = await this.redis.get(key)
      const currentCount = current ? parseInt(current) : 0
      
      const info: RateLimitInfo = {
        limit: config.maxRequests,
        current: currentCount,
        remaining: Math.max(0, config.maxRequests - currentCount),
        resetTime: windowStart + config.windowMs
      }
      
      // Check if limit exceeded
      if (currentCount >= config.maxRequests) {
        return { success: false, info }
      }
      
      // Increment counter
      const pipeline = this.redis.pipeline()
      pipeline.incr(key)
      pipeline.expire(key, Math.ceil(config.windowMs / 1000))
      await pipeline.exec()
      
      return {
        success: true,
        info: {
          ...info,
          current: currentCount + 1,
          remaining: Math.max(0, config.maxRequests - currentCount - 1)
        }
      }
    } catch (error) {
      console.error('Rate limiting error:', error)
      // On Redis error, allow the request to proceed
      return {
        success: true,
        info: {
          limit: config.maxRequests,
          current: 0,
          remaining: config.maxRequests,
          resetTime: Date.now() + config.windowMs
        }
      }
    }
  }

  async getRemainingRequests(identifier: string, config: RateLimitConfig): Promise<number> {
    const windowStart = this.getWindowStart(config.windowMs)
    const key = this.getKey(identifier, windowStart)
    
    try {
      const current = await this.redis.get(key)
      const currentCount = current ? parseInt(current) : 0
      return Math.max(0, config.maxRequests - currentCount)
    } catch {
      return config.maxRequests
    }
  }

  async resetRateLimit(identifier: string, config: RateLimitConfig): Promise<void> {
    const windowStart = this.getWindowStart(config.windowMs)
    const key = this.getKey(identifier, windowStart)
    
    try {
      await this.redis.del(key)
    } catch (error) {
      console.error('Error resetting rate limit:', error)
    }
  }
}

export const rateLimiter = new RateLimiter()

// Helper function to get client identifier
export function getClientIdentifier(req: NextRequest): string {
  // Try to get user ID from auth if available
  const userId = req.headers.get('x-user-id')
  if (userId) {
    return `user:${userId}`
  }
  
  // Fallback to IP address
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0] || req.ip || 'unknown'
  return `ip:${ip}`
}

// Middleware function for rate limiting
export async function rateLimitMiddleware(
  req: NextRequest,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  const identifier = config.keyGenerator ? config.keyGenerator(req) : getClientIdentifier(req)
  
  const { success, info } = await rateLimiter.checkRateLimit(identifier, config)
  
  if (!success) {
    if (config.onLimitReached) {
      config.onLimitReached(req)
    }
    
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: `Too many requests. Limit: ${info.limit} requests per ${config.windowMs / 1000}s`,
        retryAfter: Math.ceil((info.resetTime - Date.now()) / 1000)
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': info.limit.toString(),
          'X-RateLimit-Remaining': info.remaining.toString(),
          'X-RateLimit-Reset': info.resetTime.toString(),
          'Retry-After': Math.ceil((info.resetTime - Date.now()) / 1000).toString(),
        }
      }
    )
  }
  
  return null // Continue to next middleware/handler
}

// Rate limiting for API routes
export function withRateLimit(config: RateLimitConfig) {
  return function(handler: (req: NextRequest) => Promise<NextResponse>) {
    return async function(req: NextRequest): Promise<NextResponse> {
      const rateLimitResponse = await rateLimitMiddleware(req, config)
      if (rateLimitResponse) {
        return rateLimitResponse
      }
      
      const response = await handler(req)
      
      // Add rate limit headers to successful responses
      const identifier = config.keyGenerator ? config.keyGenerator(req) : getClientIdentifier(req)
      const { info } = await rateLimiter.checkRateLimit(identifier, config)
      
      response.headers.set('X-RateLimit-Limit', info.limit.toString())
      response.headers.set('X-RateLimit-Remaining', info.remaining.toString())
      response.headers.set('X-RateLimit-Reset', info.resetTime.toString())
      
      return response
    }
  }
}

// Suspicious activity detection
export class SecurityMonitor {
  private redis = cache.redis

  async recordFailedAttempt(identifier: string, type: 'auth' | 'upload' | 'api'): Promise<void> {
    const key = `security:failed:${type}:${identifier}`
    const count = await this.redis.incr(key)
    await this.redis.expire(key, 3600) // 1 hour
    
    // Alert on suspicious activity
    if (count >= 10) {
      console.warn(`Suspicious activity detected: ${type} - ${identifier} - ${count} failed attempts`)
      // You could integrate with alerting service here
    }
  }

  async isBlocked(identifier: string): Promise<boolean> {
    const key = `security:blocked:${identifier}`
    const blocked = await this.redis.get(key)
    return blocked === '1'
  }

  async blockIdentifier(identifier: string, durationSeconds: number = 3600): Promise<void> {
    const key = `security:blocked:${identifier}`
    await this.redis.setex(key, durationSeconds, '1')
    console.warn(`Blocked identifier: ${identifier} for ${durationSeconds} seconds`)
  }

  async unblockIdentifier(identifier: string): Promise<void> {
    const key = `security:blocked:${identifier}`
    await this.redis.del(key)
  }
}

export const securityMonitor = new SecurityMonitor()

// Helper for blocking suspicious IPs
export async function checkSecurityBlock(req: NextRequest): Promise<NextResponse | null> {
  const identifier = getClientIdentifier(req)
  
  if (await securityMonitor.isBlocked(identifier)) {
    return NextResponse.json(
      { error: 'Access blocked due to suspicious activity' },
      { status: 403 }
    )
  }
  
  return null
}