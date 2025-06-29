'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts'
import { 
  Activity, AlertTriangle, CheckCircle, Clock, 
  Server, RefreshCw, AlertCircle
} from 'lucide-react'

interface SystemHealth {
  uptime: number
  avgResponseTime: number
  errorRate: number
  throughput: number
  lastCheck: string
  status: 'healthy' | 'warning' | 'critical'
}

interface ErrorAnalytics {
  totalErrors: number
  criticalErrors: number
  unresolvedErrors: number
  errorsByType: Record<string, number>
  errorsBySeverity: {
    low: number
    medium: number
    high: number
    critical: number
  }
  hourlyTrend: Record<string, number>
}

interface PerformanceMetric {
  metric_type: string
  avg_duration: number
  p95_duration: number
  sample_count: number
}

function HealthStatusCard({ 
  title, 
  status, 
  value, 
  unit, 
  icon: _icon, 
  loading = false 
}: {
  title: string
  status: 'healthy' | 'warning' | 'critical'
  value: string | number
  unit?: string
  icon: React.ReactNode
  loading?: boolean
}) {
  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
        <Skeleton className="h-6 w-16 mt-2" />
        <Skeleton className="h-3 w-12 mt-1" />
      </Card>
    )
  }

  const statusColors = {
    healthy: 'text-green-600 bg-green-100',
    warning: 'text-yellow-600 bg-yellow-100',
    critical: 'text-red-600 bg-red-100'
  }

  const StatusIcon = status === 'healthy' ? CheckCircle : 
                    status === 'warning' ? AlertTriangle : AlertCircle

  return (
    <Card className="p-4 card-academic">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className={`p-1 rounded-full ${statusColors[status]}`}>
          <StatusIcon className="h-4 w-4" />
        </div>
      </div>
      <div className="flex items-baseline space-x-1">
        <span className="text-2xl font-bold">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      <div className="mt-2">
        <Badge 
          variant={status === 'healthy' ? 'default' : 
                  status === 'warning' ? 'secondary' : 'destructive'}
          className="text-xs"
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </div>
    </Card>
  )
}

interface MonitoringDashboardProps {
  timeRange?: '1h' | '24h' | '7d' | '30d'
  className?: string
}

export function MonitoringDashboard({ 
  timeRange = '24h', 
  className = '' 
}: MonitoringDashboardProps) {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [errorAnalytics, setErrorAnalytics] = useState<ErrorAnalytics | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([])
  const [recentErrors, setRecentErrors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchMonitoringData = async () => {
    try {
      setLoading(true)
      
      // Fetch system health
      const healthResponse = await fetch('/api/monitoring/health?detailed=true')
      if (healthResponse.ok) {
        const healthData = await healthResponse.json()
        if (healthData.systemHealth) {
          setSystemHealth(healthData.systemHealth)
        }
      }

      // Fetch error analytics
      const errorResponse = await fetch(`/api/monitoring/errors?action=analytics&range=${timeRange}`)
      if (errorResponse.ok) {
        const errorData = await errorResponse.json()
        setErrorAnalytics(errorData.data)
      }

      // Fetch performance metrics
      const perfResponse = await fetch(`/api/monitoring/performance?range=${timeRange}`)
      if (perfResponse.ok) {
        const perfData = await perfResponse.json()
        setPerformanceMetrics(perfData.data || [])
      }

      // Fetch recent errors
      const recentErrorsResponse = await fetch(`/api/monitoring/errors?range=24h`)
      if (recentErrorsResponse.ok) {
        const recentErrorsData = await recentErrorsResponse.json()
        setRecentErrors(recentErrorsData.data?.slice(0, 10) || [])
      }

      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMonitoringData()
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchMonitoringData, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [timeRange])

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const formatUptime = (percentage: number) => {
    return `${percentage.toFixed(2)}%`
  }

  // Transform hourly trend data for charts
  const errorTrendData = errorAnalytics?.hourlyTrend ? 
    Object.entries(errorAnalytics.hourlyTrend).map(([hour, count]) => ({
      hour: new Date(hour + ':00:00Z').toLocaleTimeString('en-US', { hour: '2-digit' }),
      errors: count
    })).slice(-24) : []

  const errorTypeData = errorAnalytics?.errorsByType ? 
    Object.entries(errorAnalytics.errorsByType).map(([type, count]) => ({
      type: type.replace(/_/g, ' ').toUpperCase(),
      count
    })) : []

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">System Monitoring</h2>
          <p className="text-muted-foreground mt-1">
            Real-time system health and performance monitoring
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <Button 
            onClick={fetchMonitoringData}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <HealthStatusCard
          title="System Uptime"
          status={systemHealth?.status === 'healthy' ? 'healthy' : 
                 systemHealth?.status === 'warning' ? 'warning' : 'critical'}
          value={systemHealth ? formatUptime(systemHealth.uptime) : '0%'}
          icon={<Server className="h-4 w-4" />}
          loading={loading}
        />
        
        <HealthStatusCard
          title="Response Time"
          status={!systemHealth ? 'critical' :
                 systemHealth.avgResponseTime < 500 ? 'healthy' : 
                 systemHealth.avgResponseTime < 1000 ? 'warning' : 'critical'}
          value={systemHealth ? formatResponseTime(systemHealth.avgResponseTime) : '0ms'}
          icon={<Clock className="h-4 w-4" />}
          loading={loading}
        />
        
        <HealthStatusCard
          title="Error Rate"
          status={!systemHealth ? 'critical' :
                 systemHealth.errorRate < 1 ? 'healthy' : 
                 systemHealth.errorRate < 5 ? 'warning' : 'critical'}
          value={systemHealth ? systemHealth.errorRate.toFixed(1) : '0'}
          unit="%"
          icon={<AlertTriangle className="h-4 w-4" />}
          loading={loading}
        />
        
        <HealthStatusCard
          title="Throughput"
          status="healthy"
          value={systemHealth ? Math.round(systemHealth.throughput) : '0'}
          unit="req/min"
          icon={<Activity className="h-4 w-4" />}
          loading={loading}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error Trends */}
        <Card className="p-6 card-academic">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Error Trends</h3>
            <p className="text-sm text-muted-foreground">
              Errors over time (last 24 hours)
            </p>
          </div>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={errorTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number) => [`${value} errors`, 'Errors']}
                  labelFormatter={(label) => `${label}:00`}
                />
                <Area 
                  type="monotone" 
                  dataKey="errors" 
                  stroke="#ef4444" 
                  fill="#ef4444" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Performance Metrics */}
        <Card className="p-6 card-academic">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Performance Metrics</h3>
            <p className="text-sm text-muted-foreground">
              Average response times by service
            </p>
          </div>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="metric_type" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number) => [`${value}ms`, 'Avg Duration']}
                />
                <Bar 
                  dataKey="avg_duration" 
                  fill="#1e3a8a" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Error Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Error Summary */}
        <Card className="p-6 card-academic">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Error Summary</h3>
            <p className="text-sm text-muted-foreground">
              Error statistics for the selected period
            </p>
          </div>
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="font-medium">Total Errors</span>
                <Badge variant="secondary">
                  {errorAnalytics?.totalErrors || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="font-medium">Critical</span>
                <Badge variant="destructive">
                  {errorAnalytics?.criticalErrors || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="font-medium">Unresolved</span>
                <Badge variant="secondary">
                  {errorAnalytics?.unresolvedErrors || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="font-medium">Resolution Rate</span>
                <Badge variant="default">
                  {errorAnalytics?.totalErrors ? 
                    Math.round(((errorAnalytics.totalErrors - errorAnalytics.unresolvedErrors) / errorAnalytics.totalErrors) * 100) : 100}%
                </Badge>
              </div>
            </div>
          )}
        </Card>

        {/* Error Types */}
        <Card className="p-6 card-academic">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Error Types</h3>
            <p className="text-sm text-muted-foreground">
              Breakdown by error category
            </p>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {errorTypeData.slice(0, 5).map((error, _index) => (
                <div key={error.type} className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{error.type}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-2 bg-muted rounded-full">
                      <div 
                        className="h-2 bg-red-500 rounded-full"
                        style={{ 
                          width: `${Math.min((error.count / (errorAnalytics?.totalErrors || 1)) * 100, 100)}%` 
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8">
                      {error.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Errors */}
        <Card className="p-6 card-academic">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Recent Errors</h3>
            <p className="text-sm text-muted-foreground">
              Latest error occurrences
            </p>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentErrors.map((error, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <Badge 
                      variant={error.severity === 'critical' ? 'destructive' : 
                              error.severity === 'high' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {error.severity}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(error.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium truncate">{error.error_type}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {error.error_message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* System Status */}
      <Card className="p-4 border-l-4 border-l-primary bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`h-3 w-3 rounded-full ${
              systemHealth?.status === 'healthy' ? 'bg-green-500 animate-pulse' :
              systemHealth?.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="font-medium">
              System Status: {systemHealth?.status ? systemHealth.status.charAt(0).toUpperCase() + systemHealth.status.slice(1) : 'Unknown'}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            Monitoring active • Data retention: 90 days
          </div>
        </div>
      </Card>
    </div>
  )
}