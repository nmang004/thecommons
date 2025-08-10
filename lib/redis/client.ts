import type { Redis } from 'ioredis'
import IORedis from 'ioredis'

let redis: Redis | null = null

export function getRedisClient(): Redis {
  if (!redis) {
    // Only check for Redis URL if we're actually running in a server environment
    if (typeof window !== 'undefined') {
      throw new Error('Redis client should not be used in the browser')
    }
    
    // Use REDIS_PUBLIC_URL for external connections, REDIS_URL for internal Railway
    const redisUrl = process.env.REDIS_PUBLIC_URL || process.env.REDIS_URL
    
    if (!redisUrl || redisUrl === 'your_redis_url_here' || redisUrl === 'your_redis_host_here') {
      // During build time, return a mock Redis client
      if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV && !process.env.RAILWAY_ENVIRONMENT) {
        console.warn('REDIS_URL environment variable is not properly set')
      }
      
      // Return a mock client for build time
      console.warn('Redis URL not set, using mock client')
      return {} as Redis
    }
    
    // Check if this is a Railway internal URL
    if (redisUrl.includes('redis.railway.internal') && !process.env.RAILWAY_ENVIRONMENT) {
      console.warn('Railway internal Redis URL detected but not running in Railway, using mock client')
      return {} as Redis
    }

    // Use the imported IORedis class
    const redisInstance = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    })

    redisInstance.on('error', (error: any) => {
      console.error('Redis connection error:', error)
    })

    redisInstance.on('connect', () => {
      console.log('Connected to Redis')
    })
    
    redis = redisInstance
  }

  return redis!
}

export default getRedisClient