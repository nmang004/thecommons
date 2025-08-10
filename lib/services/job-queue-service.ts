import { Redis } from 'ioredis'

export interface JobData {
  id: string
  type: string
  payload: Record<string, unknown>
  priority: number
  attempts: number
  maxAttempts: number
  createdAt: Date
  scheduledFor?: Date
  backoff?: {
    type: 'exponential' | 'fixed'
    settings: {
      initial: number
      max?: number
      multiplier?: number
    }
  }
  metadata?: Record<string, unknown>
}

export interface JobOptions {
  priority?: number
  attempts?: number
  delay?: number
  backoff?: {
    type: 'exponential' | 'fixed'
    settings: {
      initial: number
      max?: number
      multiplier?: number
    }
  }
  metadata?: Record<string, unknown>
}

export interface JobResult {
  success: boolean
  result?: unknown
  error?: string
  retryAfter?: number
}

export type JobProcessor = (data: JobData) => Promise<JobResult>

export class JobQueueService {
  private redis: Redis
  private processors: Map<string, JobProcessor> = new Map()
  private isRunning = false
  private workerInterval: NodeJS.Timeout | null = null

  constructor() {
    // Use REDIS_PUBLIC_URL for external connections, REDIS_URL for internal Railway
    const redisUrl = process.env.REDIS_PUBLIC_URL || process.env.REDIS_URL || process.env.KV_URL
    if (!redisUrl || redisUrl === 'your_redis_url_here') {
      console.warn('Redis URL not properly configured, job queue service disabled')
      // Create a mock Redis instance for build time
      this.redis = {
        lpush: async () => 1,
        rpop: async () => null,
        del: async () => 1,
        on: () => {},
        disconnect: async () => {},
        quit: async () => {},
      } as any
      return
    }

    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    })

    // Register default job processors
    this.registerProcessor('send_notification', this.processNotificationJob.bind(this))
    this.registerProcessor('send_reminder', this.processReminderJob.bind(this))
  }

  /**
   * Add a job to the queue
   */
  async addJob(
    type: string,
    payload: Record<string, unknown>,
    options: JobOptions = {}
  ): Promise<string> {
    const jobId = `job:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()
    const scheduledFor = options.delay 
      ? new Date(now.getTime() + options.delay)
      : now

    const job: JobData = {
      id: jobId,
      type,
      payload,
      priority: options.priority || 0,
      attempts: 0,
      maxAttempts: options.attempts || 3,
      createdAt: now,
      scheduledFor,
      backoff: options.backoff,
      metadata: options.metadata
    }

    // Store job data
    await this.redis.setex(
      jobId, 
      60 * 60 * 24 * 7, // 7 days TTL
      JSON.stringify(job)
    )

    // Add to appropriate queue based on scheduling
    if (scheduledFor <= now) {
      // Immediate processing - add to priority queue
      await this.redis.zadd(
        'jobs:ready',
        options.priority || 0,
        jobId
      )
    } else {
      // Scheduled - add to delayed queue
      await this.redis.zadd(
        'jobs:scheduled',
        scheduledFor.getTime(),
        jobId
      )
    }

    return jobId
  }

  /**
   * Schedule a job for future execution
   */
  async scheduleJob(
    type: string,
    payload: Record<string, unknown>,
    scheduleFor: Date,
    options: Omit<JobOptions, 'delay'> = {}
  ): Promise<string> {
    return await this.addJob(type, payload, {
      ...options,
      delay: scheduleFor.getTime() - Date.now()
    })
  }

  /**
   * Register a job processor
   */
  registerProcessor(type: string, processor: JobProcessor): void {
    this.processors.set(type, processor)
  }

  /**
   * Start the job queue worker
   */
  async startWorker(): Promise<void> {
    if (this.isRunning) return

    this.isRunning = true
    console.log('Job queue worker started')

    // Process jobs every 5 seconds
    this.workerInterval = setInterval(async () => {
      try {
        await this.processJobs()
      } catch (error) {
        console.error('Job processing error:', error)
      }
    }, 5000)

    // Move scheduled jobs to ready queue every 30 seconds
    setInterval(async () => {
      try {
        await this.moveScheduledJobs()
      } catch (error) {
        console.error('Scheduled job processing error:', error)
      }
    }, 30000)
  }

  /**
   * Stop the job queue worker
   */
  async stopWorker(): Promise<void> {
    if (!this.isRunning) return

    this.isRunning = false
    if (this.workerInterval) {
      clearInterval(this.workerInterval)
      this.workerInterval = null
    }

    console.log('Job queue worker stopped')
  }

  /**
   * Move scheduled jobs that are ready to be processed
   */
  private async moveScheduledJobs(): Promise<void> {
    const now = Date.now()
    
    // Get jobs that are ready to be processed
    const readyJobs = await this.redis.zrangebyscore(
      'jobs:scheduled',
      0,
      now,
      'LIMIT',
      0,
      100
    )

    if (readyJobs.length === 0) return

    // Move to ready queue with atomic operations
    const pipeline = this.redis.pipeline()
    
    for (const jobId of readyJobs) {
      const jobData = await this.redis.get(jobId)
      if (jobData) {
        const job: JobData = JSON.parse(jobData)
        pipeline.zadd('jobs:ready', job.priority, jobId)
        pipeline.zrem('jobs:scheduled', jobId)
      }
    }

    await pipeline.exec()
    console.log(`Moved ${readyJobs.length} scheduled jobs to ready queue`)
  }

  /**
   * Process ready jobs
   */
  private async processJobs(): Promise<void> {
    // Get highest priority job
    const jobs = await this.redis.zrevrange('jobs:ready', 0, 4) // Process up to 5 jobs at once

    for (const jobId of jobs) {
      try {
        await this.processJob(jobId)
      } catch (error) {
        console.error(`Error processing job ${jobId}:`, error)
      }
    }
  }

  /**
   * Process a single job
   */
  private async processJob(jobId: string): Promise<void> {
    // Remove from ready queue atomically
    const removed = await this.redis.zrem('jobs:ready', jobId)
    if (removed === 0) {
      // Job was already processed by another worker
      return
    }

    // Get job data
    const jobData = await this.redis.get(jobId)
    if (!jobData) {
      console.error(`Job ${jobId} data not found`)
      return
    }

    const job: JobData = JSON.parse(jobData)
    job.attempts++

    // Check if job has exceeded max attempts
    if (job.attempts > job.maxAttempts) {
      console.error(`Job ${jobId} exceeded max attempts (${job.maxAttempts})`)
      await this.redis.zadd('jobs:failed', Date.now(), jobId)
      return
    }

    // Update job data with new attempt count
    await this.redis.setex(jobId, 60 * 60 * 24 * 7, JSON.stringify(job))

    // Get processor for job type
    const processor = this.processors.get(job.type)
    if (!processor) {
      console.error(`No processor found for job type: ${job.type}`)
      await this.redis.zadd('jobs:failed', Date.now(), jobId)
      return
    }

    try {
      console.log(`Processing job ${jobId} (attempt ${job.attempts}/${job.maxAttempts})`)
      const result = await processor(job)

      if (result.success) {
        // Job succeeded - add to completed queue
        await this.redis.zadd('jobs:completed', Date.now(), jobId)
        console.log(`Job ${jobId} completed successfully`)
      } else {
        // Job failed - retry or fail
        if (job.attempts < job.maxAttempts) {
          const retryDelay = this.calculateRetryDelay(job, result.retryAfter)
          const retryAt = new Date(Date.now() + retryDelay)
          
          await this.redis.zadd('jobs:scheduled', retryAt.getTime(), jobId)
          console.log(`Job ${jobId} failed, retrying in ${retryDelay}ms`)
        } else {
          await this.redis.zadd('jobs:failed', Date.now(), jobId)
          console.error(`Job ${jobId} failed permanently: ${result.error}`)
        }
      }
    } catch (error) {
      console.error(`Job processor error for ${jobId}:`, error)
      
      // Retry logic for processor errors
      if (job.attempts < job.maxAttempts) {
        const retryDelay = this.calculateRetryDelay(job)
        const retryAt = new Date(Date.now() + retryDelay)
        
        await this.redis.zadd('jobs:scheduled', retryAt.getTime(), jobId)
      } else {
        await this.redis.zadd('jobs:failed', Date.now(), jobId)
      }
    }
  }

  /**
   * Calculate retry delay based on backoff strategy
   */
  private calculateRetryDelay(job: JobData, suggestedDelay?: number): number {
    if (suggestedDelay) return suggestedDelay

    if (!job.backoff) {
      // Default exponential backoff: 10s, 60s, 300s
      const delays = [10000, 60000, 300000]
      return delays[Math.min(job.attempts - 1, delays.length - 1)] || 300000
    }

    const { type, settings } = job.backoff

    if (type === 'fixed') {
      return settings.initial
    }

    if (type === 'exponential') {
      const multiplier = settings.multiplier || 2
      const delay = settings.initial * Math.pow(multiplier, job.attempts - 1)
      return Math.min(delay, settings.max || 300000)
    }

    return 10000 // Fallback
  }

  /**
   * Process notification job
   */
  private async processNotificationJob(job: JobData): Promise<JobResult> {
    try {
      const { NotificationService } = await import('./notification-service')
      const notificationService = new NotificationService()
      
      const { request } = job.payload as { request: any }
      const result = await notificationService.processNotificationSync(request)

      return {
        success: result.success,
        result: result.results
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown notification error'
      }
    }
  }

  /**
   * Process reminder job
   */
  private async processReminderJob(job: JobData): Promise<JobResult> {
    try {
      const { NotificationService } = await import('./notification-service')
      const notificationService = new NotificationService()
      
      const { reviewerId, invitationToken, reminderType, daysRemaining } = job.payload as {
        reviewerId: string
        invitationToken: string
        reminderType: 'first' | 'second' | 'final'
        daysRemaining: number
      }

      const result = await notificationService.sendReviewerReminder(
        reviewerId,
        invitationToken,
        reminderType,
        daysRemaining
      )

      return {
        success: result.success,
        result: result.results
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown reminder error'
      }
    }
  }

  /**
   * Get job status and metrics
   */
  async getQueueStats(): Promise<{
    ready: number
    scheduled: number
    completed: number
    failed: number
  }> {
    const [ready, scheduled, completed, failed] = await Promise.all([
      this.redis.zcard('jobs:ready'),
      this.redis.zcard('jobs:scheduled'),
      this.redis.zcard('jobs:completed'),
      this.redis.zcard('jobs:failed')
    ])

    return { ready, scheduled, completed, failed }
  }

  /**
   * Get failed jobs for debugging
   */
  async getFailedJobs(limit = 10): Promise<JobData[]> {
    const failedJobIds = await this.redis.zrevrange('jobs:failed', 0, limit - 1)
    const jobs: JobData[] = []

    for (const jobId of failedJobIds) {
      const jobData = await this.redis.get(jobId)
      if (jobData) {
        jobs.push(JSON.parse(jobData))
      }
    }

    return jobs
  }

  /**
   * Clean up old completed/failed jobs
   */
  async cleanup(olderThanDays = 7): Promise<void> {
    const cutoff = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000)
    
    const [completedRemoved, failedRemoved] = await Promise.all([
      this.redis.zremrangebyscore('jobs:completed', 0, cutoff),
      this.redis.zremrangebyscore('jobs:failed', 0, cutoff)
    ])

    console.log(`Cleaned up ${completedRemoved} completed and ${failedRemoved} failed jobs`)
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.stopWorker()
    await this.redis.quit()
  }
}