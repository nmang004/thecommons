'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { SystemMonitoring } from '@/components/admin/system-monitoring'
import { Card } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface ServiceHealth {
  status: 'operational' | 'degraded' | 'outage'
  responseTime: number
  lastChecked: string
  uptime: number
  usage?: number
  queueSize?: number
}

interface SystemHealth {
  database: ServiceHealth
  api: ServiceHealth
  storage: ServiceHealth
  email: ServiceHealth
  search: ServiceHealth
  cdn: ServiceHealth
}

interface SystemMetrics {
  server: {
    cpu: number
    memory: number
    disk: number
    network: number
  }
  database: {
    connections: number
    maxConnections: number
    queriesPerSecond: number
    slowQueries: number
  }
  performance: {
    avgResponseTime: number
    requestsPerMinute: number
    errorRate: number
    availability: number
  }
}

interface SystemLog {
  id: string
  timestamp: string
  level: 'info' | 'warning' | 'error'
  service: string
  message: string
  details?: Record<string, any>
}

export default function AdminSystemPage() {
  const { user, isLoading, isAdmin } = useAuth()
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && user && isAdmin) {
      fetchSystemData()
    }
  }, [user, isLoading, isAdmin])

  const fetchSystemData = async () => {
    try {
      setDataLoading(true)
      setError(null)

      // Fetch system data in parallel
      const [healthResponse, metricsResponse, logsResponse] = await Promise.all([
        fetch('/api/admin/system/health'),
        fetch('/api/admin/system/metrics'),
        fetch('/api/admin/system/logs')
      ])

      if (!healthResponse.ok || !metricsResponse.ok || !logsResponse.ok) {
        throw new Error('Failed to fetch system data')
      }

      const healthData = await healthResponse.json()
      const metricsData = await metricsResponse.json()
      const logsData = await logsResponse.json()

      setSystemHealth(healthData.health || null)
      setSystemMetrics(metricsData.metrics || null)
      setSystemLogs(logsData.logs || [])
    } catch (err) {
      console.error('Error fetching system data:', err)
      setError('Failed to load system data')
    } finally {
      setDataLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card className="card-academic p-8 text-center">
          <h2 className="text-xl font-heading font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to access the admin panel.</p>
        </Card>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Card className="card-academic p-8 text-center">
          <h2 className="text-xl font-heading font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="card-academic p-8 text-center">
          <h2 className="text-xl font-heading font-semibold mb-2 text-red-600">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button 
            onClick={fetchSystemData}
            className="btn-academic"
          >
            Try Again
          </button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Page Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-4xl font-heading font-bold text-foreground mb-2">
          System Management
        </h1>
        <p className="text-lg text-muted-foreground">
          Monitor system health, performance metrics, and operational logs
        </p>
      </div>

      {dataLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : systemHealth && systemMetrics ? (
        <SystemMonitoring 
          systemHealth={systemHealth}
          systemMetrics={systemMetrics}
          systemLogs={systemLogs}
        />
      ) : (
        <Card className="card-academic p-8 text-center">
          <h2 className="text-xl font-heading font-semibold mb-2">No System Data</h2>
          <p className="text-muted-foreground">Unable to load system monitoring data.</p>
        </Card>
      )}
    </div>
  )
}