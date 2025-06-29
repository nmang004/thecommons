export interface PerformanceMetrics {
  lcp?: number;
  fid?: number;
  cls?: number;
  ttfb?: number;
  fcp?: number;
}

export interface PerformanceEntry {
  name: string;
  value: number;
  delta: number;
  entries: PerformanceEntry[];
  id: string;
  navigationType: string;
}

export function reportWebVitals(metric: PerformanceEntry) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Web Vital:', {
      name: metric.name,
      value: metric.value,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
    });
  }

  // Send to analytics service
  sendToAnalytics(metric);
}

function sendToAnalytics(metric: PerformanceEntry) {
  // Implementation for sending metrics to analytics service
  // This could be Google Analytics, Vercel Analytics, etc.
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
    });
  }
}

export function measurePerformance(name: string, fn: () => void) {
  const start = performance.now();
  fn();
  const end = performance.now();
  
  console.log(`⏱️ ${name} took ${end - start} milliseconds`);
  return end - start;
}

export function measureAsyncPerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  
  return fn().then((result) => {
    const end = performance.now();
    console.log(`⏱️ ${name} took ${end - start} milliseconds`);
    return result;
  });
}

// Cache performance metrics
export class CacheMetrics {
  private hits = 0;
  private misses = 0;
  private totalRequests = 0;

  hit() {
    this.hits++;
    this.totalRequests++;
  }

  miss() {
    this.misses++;
    this.totalRequests++;
  }

  getHitRate() {
    return this.totalRequests > 0 ? this.hits / this.totalRequests : 0;
  }

  getMissRate() {
    return this.totalRequests > 0 ? this.misses / this.totalRequests : 0;
  }

  getStats() {
    return {
      hits: this.hits,
      misses: this.misses,
      totalRequests: this.totalRequests,
      hitRate: this.getHitRate(),
      missRate: this.getMissRate(),
    };
  }

  reset() {
    this.hits = 0;
    this.misses = 0;
    this.totalRequests = 0;
  }
}

// Database query performance monitoring
export function monitorDatabaseQuery<T>(
  queryName: string,
  query: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  
  return query().then((result) => {
    const end = performance.now();
    const duration = end - start;
    
    console.log(`🗄️ Database Query: ${queryName} took ${duration}ms`);
    
    // Log slow queries
    if (duration > 1000) {
      console.warn(`⚠️ Slow query detected: ${queryName} took ${duration}ms`);
    }
    
    return result;
  });
}