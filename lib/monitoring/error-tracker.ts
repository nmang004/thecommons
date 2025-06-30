import { createClient } from '@/lib/supabase/server'
import { createBrowserClient } from '@/lib/supabase/client'

// ===========================
// Error Tracking Types
// ===========================

export interface ErrorEvent {
  errorType: string
  errorMessage: string
  errorStack?: string
  pageUrl: string
  userAgent?: string
  userId?: string
  sessionId?: string
  additionalData?: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface PerformanceEvent {
  metricType: 'page_load' | 'api_response' | 'database_query' | 'file_upload' | 'search_query'
  metricName: string
  durationMs: number
  pageUrl?: string
  apiEndpoint?: string
  queryName?: string
  userId?: string
  additionalData?: Record<string, any>
}

export interface SystemHealthMetric {
  metricType: 'uptime' | 'response_time' | 'error_rate' | 'throughput' | 'memory_usage' | 'cpu_usage'
  metricValue: number
  endpoint?: string
  serviceName?: string
  statusCode?: number
  additionalData?: Record<string, any>
}

// ===========================
// Error Tracking Service
// ===========================

class ErrorTracker {
  private getSupabase: () => ReturnType<typeof createClient> | ReturnType<typeof createBrowserClient>

  constructor(isServer = true) {
    // Note: createClient() is async and returns a Promise, but for error tracking
    // we'll handle the Promise resolution in each method
    // @ts-ignore - TypeScript incorrectly thinks createClient needs arguments
    this.getSupabase = () => isServer ? createClient() : createBrowserClient()
  }

  // Track JavaScript errors
  async trackError(error: ErrorEvent): Promise<void> {
    try {
      const supabase = await this.getSupabase()
      await supabase
        .from('error_logs')
        .insert({
          error_type: error.errorType,
          error_message: error.errorMessage,
          error_stack: error.errorStack,
          page_url: error.pageUrl,
          user_agent: error.userAgent,
          user_id: error.userId,
          session_id: error.sessionId,
          additional_data: error.additionalData || {},
          severity: error.severity
        })

      // Log critical errors to console for immediate attention
      if (error.severity === 'critical') {
        console.error('🚨 CRITICAL ERROR:', {
          type: error.errorType,
          message: error.errorMessage,
          url: error.pageUrl,
          userId: error.userId
        })
      }
    } catch (trackingError) {
      console.error('Failed to track error:', trackingError)
    }
  }

  // Track performance metrics
  async trackPerformance(performance: PerformanceEvent): Promise<void> {
    try {
      const supabase = await this.getSupabase()
      await supabase
        .from('performance_metrics')
        .insert({
          metric_type: performance.metricType,
          metric_name: performance.metricName,
          duration_ms: performance.durationMs,
          page_url: performance.pageUrl,
          api_endpoint: performance.apiEndpoint,
          query_name: performance.queryName,
          user_id: performance.userId,
          additional_data: performance.additionalData || {}
        })

      // Log slow performance
      if (performance.durationMs > 5000) { // > 5 seconds
        console.warn('⚠️ Slow performance detected:', {
          type: performance.metricType,
          name: performance.metricName,
          duration: `${performance.durationMs}ms`,
          url: performance.pageUrl || performance.apiEndpoint
        })
      }
    } catch (trackingError) {
      console.error('Failed to track performance:', trackingError)
    }
  }

  // Track system health metrics
  async trackSystemHealth(metric: SystemHealthMetric): Promise<void> {
    try {
      const supabase = await this.getSupabase()
      await supabase.rpc('track_system_health', {
        metric_type_param: metric.metricType,
        metric_value_param: metric.metricValue,
        endpoint_param: metric.endpoint,
        service_name_param: metric.serviceName,
        status_code_param: metric.statusCode,
        additional_data_param: metric.additionalData || {}
      })
    } catch (trackingError) {
      console.error('Failed to track system health:', trackingError)
    }
  }

  // Get error analytics
  async getErrorAnalytics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h') {
    try {
      const hours = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720
      const startTime = new Date(Date.now() - hours * 60 * 60 * 1000)

      const supabase = await this.getSupabase()
      const { data, error } = await supabase
        .from('error_logs')
        .select(`
          error_type,
          severity,
          created_at,
          page_url,
          resolved,
          user_id
        `)
        .gte('created_at', startTime.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      // Aggregate error data
      const errorStats = {
        totalErrors: data?.length || 0,
        criticalErrors: data?.filter((e: any) => e.severity === 'critical').length || 0,
        unresolvedErrors: data?.filter((e: any) => !e.resolved).length || 0,
        errorsByType: {} as Record<string, number>,
        errorsBySeverity: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0
        },
        hourlyTrend: {} as Record<string, number>
      }

      data?.forEach((error: any) => {
        // Count by type
        errorStats.errorsByType[error.error_type] = 
          (errorStats.errorsByType[error.error_type] || 0) + 1

        // Count by severity
        if (error.severity in errorStats.errorsBySeverity) {
          errorStats.errorsBySeverity[error.severity as keyof typeof errorStats.errorsBySeverity]++
        }

        // Hourly trend
        const hour = error.created_at.substring(0, 13) // YYYY-MM-DDTHH
        errorStats.hourlyTrend[hour] = (errorStats.hourlyTrend[hour] || 0) + 1
      })

      return errorStats
    } catch (error) {
      console.error('Failed to get error analytics:', error)
      return null
    }
  }

  // Get performance analytics
  async getPerformanceAnalytics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h') {
    try {
      const supabase = await this.getSupabase()
      const { data, error } = await supabase
        .rpc('get_performance_summary', { 
          hours_back: timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720 
        })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Failed to get performance analytics:', error)
      return []
    }
  }

  // Get system health status
  async getSystemHealth() {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

      const supabase = await this.getSupabase()
      const { data, error } = await supabase
        .from('analytics.system_health')
        .select('*')
        .gte('recorded_at', oneHourAgo.toISOString())
        .order('recorded_at', { ascending: false })

      if (error) throw error

      // Calculate health metrics
      const healthMetrics = {
        uptime: 99.9, // Mock uptime calculation
        avgResponseTime: 0,
        errorRate: 0,
        throughput: 0,
        lastCheck: new Date().toISOString(),
        status: 'healthy' as 'healthy' | 'warning' | 'critical'
      }

      if (data && data.length > 0) {
        const responseTimeMetrics = data.filter((m: any) => m.metric_type === 'response_time')
        const errorMetrics = data.filter((m: any) => m.metric_type === 'error_rate')
        const throughputMetrics = data.filter((m: any) => m.metric_type === 'throughput')

        if (responseTimeMetrics.length > 0) {
          healthMetrics.avgResponseTime = responseTimeMetrics.reduce(
            (sum: any, m: any) => sum + m.metric_value, 0
          ) / responseTimeMetrics.length
        }

        if (errorMetrics.length > 0) {
          healthMetrics.errorRate = errorMetrics.reduce(
            (sum: any, m: any) => sum + m.metric_value, 0
          ) / errorMetrics.length
        }

        if (throughputMetrics.length > 0) {
          healthMetrics.throughput = throughputMetrics.reduce(
            (sum: any, m: any) => sum + m.metric_value, 0
          ) / throughputMetrics.length
        }

        // Determine status
        if (healthMetrics.errorRate > 5 || healthMetrics.avgResponseTime > 2000) {
          healthMetrics.status = 'critical'
        } else if (healthMetrics.errorRate > 2 || healthMetrics.avgResponseTime > 1000) {
          healthMetrics.status = 'warning'
        }
      }

      return healthMetrics
    } catch (error) {
      console.error('Failed to get system health:', error)
      return {
        uptime: 0,
        avgResponseTime: 0,
        errorRate: 100,
        throughput: 0,
        lastCheck: new Date().toISOString(),
        status: 'critical' as const
      }
    }
  }

  // Mark error as resolved
  async resolveError(errorId: string): Promise<void> {
    try {
      const supabase = await this.getSupabase()
      await supabase
        .from('error_logs')
        .update({ resolved: true })
        .eq('id', errorId)
    } catch (error) {
      console.error('Failed to resolve error:', error)
    }
  }
}

// ===========================
// Client-side Error Monitoring
// ===========================

class ClientErrorMonitor {
  private errorTracker: ErrorTracker
  private sessionId: string
  private userId?: string

  constructor() {
    this.errorTracker = new ErrorTracker(false)
    this.sessionId = this.generateSessionId()
    this.setupErrorHandlers()
  }

  private generateSessionId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  setUserId(userId: string) {
    this.userId = userId
  }

  private setupErrorHandlers() {
    if (typeof window === 'undefined') return

    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError({
        errorType: 'javascript_error',
        errorMessage: event.message,
        errorStack: event.error?.stack,
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        userId: this.userId,
        sessionId: this.sessionId,
        severity: 'medium',
        additionalData: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      })
    })

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        errorType: 'unhandled_promise_rejection',
        errorMessage: event.reason?.message || String(event.reason),
        errorStack: event.reason?.stack,
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        userId: this.userId,
        sessionId: this.sessionId,
        severity: 'high',
        additionalData: {
          reason: event.reason
        }
      })
    })

    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        const target = event.target as HTMLElement
        this.trackError({
          errorType: 'resource_load_error',
          errorMessage: `Failed to load resource: ${target.tagName}`,
          pageUrl: window.location.href,
          userAgent: navigator.userAgent,
          userId: this.userId,
          sessionId: this.sessionId,
          severity: 'low',
          additionalData: {
            resourceType: target.tagName,
            resourceSrc: (target as any).src || (target as any).href
          }
        })
      }
    }, true)
  }

  async trackError(error: ErrorEvent) {
    await this.errorTracker.trackError(error)
  }

  async trackPerformance(performance: PerformanceEvent) {
    await this.errorTracker.trackPerformance(performance)
  }

  // Track React component errors
  trackReactError(error: Error, errorInfo: { componentStack: string }) {
    this.trackError({
      errorType: 'react_error',
      errorMessage: error.message,
      errorStack: error.stack,
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.userId,
      sessionId: this.sessionId,
      severity: 'high',
      additionalData: {
        componentStack: errorInfo.componentStack
      }
    })
  }

  // Track API errors
  trackApiError(endpoint: string, method: string, status: number, message: string) {
    this.trackError({
      errorType: 'api_error',
      errorMessage: `${method} ${endpoint}: ${message}`,
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.userId,
      sessionId: this.sessionId,
      severity: status >= 500 ? 'high' : 'medium',
      additionalData: {
        endpoint,
        method,
        statusCode: status
      }
    })
  }
}

// ===========================
// Server-side Performance Monitoring
// ===========================

export class ServerMonitor {
  private errorTracker: ErrorTracker

  constructor() {
    this.errorTracker = new ErrorTracker(true)
  }

  // Monitor API endpoint performance
  async monitorApiEndpoint<T>(
    endpoint: string,
    method: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now()
    let error: Error | null = null
    let result: T

    try {
      result = await operation()
      return result
    } catch (e) {
      error = e as Error
      throw e
    } finally {
      const duration = Date.now() - startTime

      // Track performance
      await this.errorTracker.trackPerformance({
        metricType: 'api_response',
        metricName: `${method} ${endpoint}`,
        durationMs: duration,
        apiEndpoint: endpoint,
        additionalData: {
          method,
          success: !error
        }
      })

      // Track error if occurred
      if (error) {
        await this.errorTracker.trackError({
          errorType: 'api_error',
          errorMessage: error.message,
          errorStack: error.stack,
          pageUrl: endpoint,
          severity: 'high',
          additionalData: {
            endpoint,
            method,
            duration
          }
        })
      }

      // Track system health
      await this.errorTracker.trackSystemHealth({
        metricType: 'response_time',
        metricValue: duration,
        endpoint,
        serviceName: 'api',
        statusCode: error ? 500 : 200
      })
    }
  }

  // Monitor database query performance
  async monitorDatabaseQuery<T>(
    queryName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now()
    let error: Error | null = null
    let result: T

    try {
      result = await operation()
      return result
    } catch (e) {
      error = e as Error
      throw e
    } finally {
      const duration = Date.now() - startTime

      await this.errorTracker.trackPerformance({
        metricType: 'database_query',
        metricName: queryName,
        durationMs: duration,
        queryName,
        additionalData: {
          success: !error
        }
      })

      if (error) {
        await this.errorTracker.trackError({
          errorType: 'database_error',
          errorMessage: error.message,
          errorStack: error.stack,
          pageUrl: queryName,
          severity: 'high',
          additionalData: {
            queryName,
            duration
          }
        })
      }
    }
  }
}

// ===========================
// Exports
// ===========================

export const errorTracker = new ErrorTracker()
export const clientErrorMonitor = typeof window !== 'undefined' ? new ClientErrorMonitor() : null
export const serverMonitor = new ServerMonitor()

// React Error Boundary Hook
export function useErrorTracking() {
  const trackError = (error: Error, errorInfo?: { componentStack: string }) => {
    if (clientErrorMonitor) {
      clientErrorMonitor.trackReactError(error, errorInfo || { componentStack: '' })
    }
  }

  const trackApiError = (endpoint: string, method: string, status: number, message: string) => {
    if (clientErrorMonitor) {
      clientErrorMonitor.trackApiError(endpoint, method, status, message)
    }
  }

  const trackPerformance = (performance: PerformanceEvent) => {
    if (clientErrorMonitor) {
      clientErrorMonitor.trackPerformance(performance)
    }
  }

  return { trackError, trackApiError, trackPerformance }
}