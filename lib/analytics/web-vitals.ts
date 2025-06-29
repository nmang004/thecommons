'use client'

import { getCLS, getFCP, getFID, getLCP, getTTFB } from 'web-vitals'
import type { Metric } from 'web-vitals'

interface WebVitalsData {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  navigationType: string
  timestamp: number
  url: string
  userAgent: string
}

// Thresholds for Core Web Vitals (in milliseconds)
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
} as const

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS]
  if (!threshold) return 'good'
  
  if (name === 'CLS') {
    // CLS uses different units (not milliseconds)
    if (value <= threshold.good) return 'good'
    if (value <= threshold.poor) return 'needs-improvement'
    return 'poor'
  }
  
  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

function sendToAnalytics(metric: WebVitalsData) {
  // Send to your analytics provider
  if (typeof window !== 'undefined') {
    // Example: Google Analytics 4
    if ('gtag' in window) {
      (window as any).gtag('event', 'web_vitals', {
        event_category: 'Web Vitals',
        event_label: metric.name,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        custom_parameters: {
          rating: metric.rating,
          delta: metric.delta,
          id: metric.id,
          navigation_type: metric.navigationType,
        },
      })
    }

    // Example: Vercel Analytics
    if ('va' in window) {
      (window as any).va('track', 'Web Vitals', {
        metric: metric.name,
        value: metric.value,
        rating: metric.rating,
      })
    }

    // Send to your own analytics endpoint
    sendToCustomAnalytics(metric)
  }
}

async function sendToCustomAnalytics(metric: WebVitalsData) {
  try {
    await fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metric),
    })
  } catch (error) {
    console.error('Failed to send web vitals data:', error)
  }
}

function processMetric(metric: Metric): WebVitalsData {
  return {
    name: metric.name,
    value: metric.value,
    rating: getRating(metric.name, metric.value),
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType || 'unknown',
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  }
}

export function reportWebVitals() {
  try {
    // Core Web Vitals
    getCLS((metric) => {
      const data = processMetric(metric)
      sendToAnalytics(data)
      console.log('📊 CLS:', data)
    })

    getFID((metric) => {
      const data = processMetric(metric)
      sendToAnalytics(data)
      console.log('📊 FID:', data)
    })

    getLCP((metric) => {
      const data = processMetric(metric)
      sendToAnalytics(data)
      console.log('📊 LCP:', data)
    })

    // Additional metrics
    getFCP((metric) => {
      const data = processMetric(metric)
      sendToAnalytics(data)
      console.log('📊 FCP:', data)
    })

    getTTFB((metric) => {
      const data = processMetric(metric)
      sendToAnalytics(data)
      console.log('📊 TTFB:', data)
    })
  } catch (error) {
    console.error('Error setting up web vitals reporting:', error)
  }
}

// Performance observer for additional metrics
export function initPerformanceObserver() {
  if (typeof window === 'undefined') return

  try {
    // Observe long tasks (for performance insights)
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            console.warn('⚠️ Long task detected:', {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name,
            })
            
            // Send to analytics
            sendToCustomAnalytics({
              name: 'long-task',
              value: entry.duration,
              rating: entry.duration > 100 ? 'poor' : 'needs-improvement',
              delta: 0,
              id: `${entry.startTime}-${entry.duration}`,
              navigationType: 'unknown',
              timestamp: Date.now(),
              url: window.location.href,
              userAgent: navigator.userAgent,
            })
          }
        }
      })

      longTaskObserver.observe({ entryTypes: ['longtask'] })

      // Observe navigation timing
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            
            const metrics = {
              dns: navEntry.domainLookupEnd - navEntry.domainLookupStart,
              tcp: navEntry.connectEnd - navEntry.connectStart,
              request: navEntry.responseStart - navEntry.requestStart,
              response: navEntry.responseEnd - navEntry.responseStart,
              domParsing: navEntry.domContentLoadedEventStart - navEntry.responseEnd,
              domComplete: navEntry.domComplete - navEntry.domContentLoadedEventStart,
            }

            console.log('📊 Navigation timing:', metrics)
            
            // Send significant timing metrics
            Object.entries(metrics).forEach(([name, value]) => {
              if (value > 0) {
                sendToCustomAnalytics({
                  name: `navigation-${name}`,
                  value,
                  rating: value > 1000 ? 'poor' : value > 500 ? 'needs-improvement' : 'good',
                  delta: 0,
                  id: `nav-${name}-${Date.now()}`,
                  navigationType: navEntry.type as string,
                  timestamp: Date.now(),
                  url: window.location.href,
                  userAgent: navigator.userAgent,
                })
              }
            })
          }
        }
      })

      navigationObserver.observe({ entryTypes: ['navigation'] })

      // Observe resource timing for large resources
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming
          
          // Track large resources that might impact performance
          if (resourceEntry.transferSize > 100000) { // > 100KB
            console.warn('📦 Large resource loaded:', {
              name: resourceEntry.name,
              size: resourceEntry.transferSize,
              duration: resourceEntry.duration,
            })
            
            sendToCustomAnalytics({
              name: 'large-resource',
              value: resourceEntry.transferSize,
              rating: resourceEntry.transferSize > 1000000 ? 'poor' : 'needs-improvement',
              delta: 0,
              id: `resource-${resourceEntry.startTime}`,
              navigationType: 'unknown',
              timestamp: Date.now(),
              url: resourceEntry.name,
              userAgent: navigator.userAgent,
            })
          }
        }
      })

      resourceObserver.observe({ entryTypes: ['resource'] })
    }
  } catch (error) {
    console.error('Error setting up performance observer:', error)
  }
}

// Memory usage monitoring
export function monitorMemoryUsage() {
  if (typeof window === 'undefined') return

  try {
    // Check memory usage periodically
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        const usage = {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
        }

        const usagePercent = (usage.used / usage.total) * 100

        if (usagePercent > 80) {
          console.warn('⚠️ High memory usage:', usage)
          
          sendToCustomAnalytics({
            name: 'memory-usage',
            value: usagePercent,
            rating: usagePercent > 90 ? 'poor' : 'needs-improvement',
            delta: 0,
            id: `memory-${Date.now()}`,
            navigationType: 'unknown',
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
          })
        }
      }
    }

    // Check memory every 30 seconds
    setInterval(checkMemory, 30000)
  } catch (error) {
    console.error('Error setting up memory monitoring:', error)
  }
}

// Connection quality monitoring
export function monitorConnectionQuality() {
  if (typeof window === 'undefined') return

  try {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      
      const logConnection = () => {
        console.log('📡 Connection info:', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
        })

        sendToCustomAnalytics({
          name: 'connection-quality',
          value: connection.downlink || 0,
          rating: connection.effectiveType === '4g' ? 'good' : 
                 connection.effectiveType === '3g' ? 'needs-improvement' : 'poor',
          delta: 0,
          id: `connection-${Date.now()}`,
          navigationType: 'unknown',
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        })
      }

      // Log initial connection
      logConnection()

      // Listen for connection changes
      connection.addEventListener('change', logConnection)
    }
  } catch (error) {
    console.error('Error setting up connection monitoring:', error)
  }
}

// Initialize all monitoring
export function initWebVitalsMonitoring() {
  if (typeof window === 'undefined') return

  reportWebVitals()
  initPerformanceObserver()
  monitorMemoryUsage()
  monitorConnectionQuality()

  console.log('🚀 Web Vitals monitoring initialized')
}