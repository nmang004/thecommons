'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts'
import { 
  Activity, Users, Eye, FileText, Clock, 
  TrendingUp, AlertCircle, CheckCircle, Zap,
  Server, Database, Wifi, Globe
} from 'lucide-react'

interface RealTimeMetrics {
  activeUsers: number
  pageViews: number
  submissions: number
  publications: number
  errorRate: number
  responseTime: number
  uptime: number
  throughput: number
}

interface LiveActivity {
  timestamp: string
  users: number
  views: number
  submissions: number
  errors: number
}

interface SystemAlert {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  timestamp: string
  resolved: boolean
}

interface ActiveSession {
  id: string
  userId?: string
  userType: 'author' | 'editor' | 'reviewer' | 'admin' | 'anonymous'
  page: string
  duration: number
  activity: string
  location: string
}

function RealtimeMetricCard({ 
  title, 
  value, 
  trend, 
  trendDirection = 'neutral',
  icon, 
  color = 'blue',
  loading = false 
}: {
  title: string
  value: string | number
  trend?: string
  trendDirection?: 'up' | 'down' | 'neutral'
  icon: React.ReactNode
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
  loading?: boolean
}) {
  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
        <Skeleton className="h-8 w-24 mt-2" />
        <Skeleton className="h-3 w-16 mt-1" />
      </Card>
    )
  }

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600', 
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600'
  }

  const trendColor = trendDirection === 'up' ? 'text-green-600' : 
                     trendDirection === 'down' ? 'text-red-600' : 'text-gray-600'

  return (
    <Card className="p-4 card-academic relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className={`p-2 rounded-full ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div className={`text-xs ${trendColor} flex items-center space-x-1`}>
            <TrendingUp className="h-3 w-3" />
            <span>{trend}</span>
          </div>
        )}
      </div>
      {/* Live indicator */}
      <div className="absolute top-2 right-2">
        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
      </div>
    </Card>
  )
}

interface RealTimeMetricsProps {
  className?: string
}

export function RealTimeMetrics({ className = '' }: RealTimeMetricsProps) {
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null)
  const [liveActivity, setLiveActivity] = useState<LiveActivity[]>([])
  const [alerts, setAlerts] = useState<SystemAlert[]>([])
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(true)

  // Simulate real-time data updates
  const generateRealtimeData = () => {
    const now = new Date()
    const baseUsers = 150 + Math.floor(Math.random() * 50)
    const baseViews = 1200 + Math.floor(Math.random() * 300)
    
    setMetrics({
      activeUsers: baseUsers,
      pageViews: baseViews,
      submissions: 12 + Math.floor(Math.random() * 5),
      publications: 3 + Math.floor(Math.random() * 3),
      errorRate: Math.random() * 2,
      responseTime: 200 + Math.random() * 100,
      uptime: 99.8 + Math.random() * 0.2,
      throughput: 450 + Math.floor(Math.random() * 100)
    })

    // Update live activity data (last 10 data points)
    setLiveActivity(prev => {
      const newPoint: LiveActivity = {
        timestamp: now.toISOString(),
        users: baseUsers,
        views: Math.floor(baseViews / 60), // Per minute
        submissions: Math.floor(Math.random() * 3),
        errors: Math.floor(Math.random() * 2)
      }
      
      const updated = [...prev, newPoint].slice(-10)
      return updated
    })

    // Update active sessions
    setActiveSessions([
      {
        id: '1',
        userId: 'user_123',
        userType: 'author',
        page: '/author/submit',
        duration: 1420,
        activity: 'Uploading manuscript files',
        location: 'United States'
      },
      {
        id: '2',
        userType: 'anonymous',
        page: '/articles/12345',
        duration: 340,
        activity: 'Reading article',
        location: 'United Kingdom'
      },
      {
        id: '3',
        userId: 'editor_456',
        userType: 'editor',
        page: '/editor/manuscripts/67890',
        duration: 890,
        activity: 'Reviewing submission',
        location: 'Canada'
      },
      {
        id: '4',
        userType: 'anonymous',
        page: '/search',
        duration: 125,
        activity: 'Searching articles',
        location: 'Germany'
      },
      {
        id: '5',
        userId: 'reviewer_789',
        userType: 'reviewer',
        page: '/reviewer/review/11111',
        duration: 2340,
        activity: 'Writing review',
        location: 'Australia'
      }
    ])
  }

  // Simulate system alerts
  const updateAlerts = () => {
    const alertTypes: SystemAlert['type'][] = ['info', 'warning', 'error', 'success']
    const randomType = alertTypes[Math.floor(Math.random() * alertTypes.length)]
    
    const alertMessages = {
      info: { title: 'System Update', message: 'Scheduled maintenance completed successfully' },
      warning: { title: 'High Load', message: 'Server experiencing increased traffic' },
      error: { title: 'API Error', message: 'Payment processing service temporarily unavailable' },
      success: { title: 'Backup Complete', message: 'Daily backup completed successfully' }
    }

    // Only add alerts occasionally
    if (Math.random() < 0.3) {
      const newAlert: SystemAlert = {
        id: Date.now().toString(),
        type: randomType,
        ...alertMessages[randomType],
        timestamp: new Date().toISOString(),
        resolved: false
      }

      setAlerts(prev => [newAlert, ...prev.slice(0, 4)])
    }
  }

  useEffect(() => {
    // Initial data load
    generateRealtimeData()
    setLoading(false)

    // Update metrics every 5 seconds
    const metricsInterval = setInterval(generateRealtimeData, 5000)
    
    // Update alerts every 30 seconds
    const alertsInterval = setInterval(updateAlerts, 30000)

    // Simulate connection status
    const connectionInterval = setInterval(() => {
      setIsConnected(Math.random() > 0.05) // 95% uptime
    }, 10000)

    return () => {
      clearInterval(metricsInterval)
      clearInterval(alertsInterval)
      clearInterval(connectionInterval)
    }
  }, [])

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return Math.round(num).toString()
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Real-time Metrics</h2>
          <p className="text-muted-foreground mt-1">
            Live platform activity and system performance monitoring
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <Badge variant="secondary" className="text-xs">
            <Activity className="h-3 w-3 mr-1" />
            Live
          </Badge>
        </div>
      </div>

      {/* Real-time Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <RealtimeMetricCard
          title="Active Users"
          value={metrics ? metrics.activeUsers : 0}
          trend="+5% from last hour"
          trendDirection="up"
          icon={<Users className="h-5 w-5" />}
          color="blue"
          loading={loading}
        />
        
        <RealtimeMetricCard
          title="Page Views/min"
          value={metrics ? Math.round(metrics.pageViews / 60) : 0}
          trend="+12% from avg"
          trendDirection="up"
          icon={<Eye className="h-5 w-5" />}
          color="green"
          loading={loading}
        />
        
        <RealtimeMetricCard
          title="Response Time"
          value={metrics ? `${Math.round(metrics.responseTime)}ms` : '0ms'}
          trend="Normal"
          trendDirection="neutral"
          icon={<Zap className="h-5 w-5" />}
          color="yellow"
          loading={loading}
        />
        
        <RealtimeMetricCard
          title="Error Rate"
          value={metrics ? `${metrics.errorRate.toFixed(2)}%` : '0%'}
          trend="Stable"
          trendDirection="neutral"
          icon={<AlertCircle className="h-5 w-5" />}
          color={metrics && metrics.errorRate > 1 ? 'red' : 'green'}
          loading={loading}
        />
      </div>

      {/* Live Activity Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 card-academic">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Live Activity</h3>
            <p className="text-sm text-muted-foreground">
              Real-time user activity and page views
            </p>
          </div>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={liveActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                  formatter={(value: number, name: string) => [
                    value,
                    name === 'users' ? 'Active Users' :
                    name === 'views' ? 'Views/min' :
                    name === 'submissions' ? 'Submissions' : 'Errors'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stackId="1"
                  stroke="#1e3a8a" 
                  fill="#1e3a8a" 
                  fillOpacity={0.8}
                />
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stackId="2"
                  stroke="#16a34a" 
                  fill="#16a34a" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* System Alerts */}
        <Card className="p-6 card-academic">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">System Alerts</h3>
            <p className="text-sm text-muted-foreground">
              Recent system events and notifications
            </p>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p>All systems operational</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className={`mt-1 ${
                    alert.type === 'error' ? 'text-red-500' :
                    alert.type === 'warning' ? 'text-yellow-500' :
                    alert.type === 'success' ? 'text-green-500' : 'text-blue-500'
                  }`}>
                    {alert.type === 'error' ? <AlertCircle className="h-4 w-4" /> :
                     alert.type === 'warning' ? <AlertCircle className="h-4 w-4" /> :
                     alert.type === 'success' ? <CheckCircle className="h-4 w-4" /> :
                     <Activity className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{alert.title}</h4>
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Active Sessions */}
      <Card className="p-6 card-academic">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Active Sessions</h3>
          <p className="text-sm text-muted-foreground">
            Current user activities and session information
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-semibold">User</th>
                <th className="text-left p-3 font-semibold">Page</th>
                <th className="text-left p-3 font-semibold">Activity</th>
                <th className="text-left p-3 font-semibold">Duration</th>
                <th className="text-left p-3 font-semibold">Location</th>
              </tr>
            </thead>
            <tbody>
              {activeSessions.map((session) => (
                <tr key={session.id} className="border-b hover:bg-muted/30">
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      <div className={`h-2 w-2 rounded-full ${
                        session.userType === 'admin' ? 'bg-red-500' :
                        session.userType === 'editor' ? 'bg-blue-500' :
                        session.userType === 'author' ? 'bg-green-500' :
                        session.userType === 'reviewer' ? 'bg-purple-500' : 'bg-gray-500'
                      }`}></div>
                      <Badge variant="outline" className="text-xs">
                        {session.userType}
                      </Badge>
                    </div>
                  </td>
                  <td className="p-3">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {session.page}
                    </code>
                  </td>
                  <td className="p-3 text-sm">{session.activity}</td>
                  <td className="p-3">
                    <span className="text-sm font-mono">
                      {formatDuration(session.duration)}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{session.location}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 card-academic">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Server className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold">Server Status</h3>
              <p className="text-sm text-muted-foreground">All servers operational</p>
              <div className="flex items-center space-x-2 mt-1">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600">Healthy</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 card-academic">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Database className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">Database</h3>
              <p className="text-sm text-muted-foreground">Response time: 12ms</p>
              <div className="flex items-center space-x-2 mt-1">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600">Optimal</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 card-academic">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Wifi className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold">CDN</h3>
              <p className="text-sm text-muted-foreground">Global edge performance</p>
              <div className="flex items-center space-x-2 mt-1">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600">Fast</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}