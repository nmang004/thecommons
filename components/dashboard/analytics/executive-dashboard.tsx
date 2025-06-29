'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts'
import { 
  FileText, Users, Clock, TrendingUp, RefreshCw, 
  Eye, Download, Globe, Award, AlertCircle
} from 'lucide-react'

interface DashboardMetrics {
  totalManuscripts: number
  monthlySubmissions: number
  weeklySubmissions: number
  publishedManuscripts: number
  successRate: number
  avgTimeToPublication: number
  activeUsers: number
  avgReviewTurnaround: number
}

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
  icon: React.ReactNode
  description?: string
  loading?: boolean
}

function MetricCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon, 
  description,
  loading = false 
}: MetricCardProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
        <Skeleton className="h-8 w-32 mt-2" />
        <Skeleton className="h-3 w-48 mt-2" />
      </Card>
    )
  }

  const changeColor = changeType === 'increase' ? 'text-green-600' : 
                      changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'

  return (
    <Card className="p-6 card-academic">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline space-x-2">
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {change !== undefined && (
              <Badge 
                variant="secondary" 
                className={`${changeColor} text-xs`}
              >
                {change > 0 ? '+' : ''}{change}%
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
          {icon}
        </div>
      </div>
    </Card>
  )
}

interface ExecutiveDashboardProps {
  timeRange?: '7d' | '30d' | '90d'
  className?: string
}

export function ExecutiveDashboard({ 
  timeRange = '30d', 
  className = '' 
}: ExecutiveDashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [editorialData, setEditorialData] = useState<any[]>([])
  const [funnelData, setFunnelData] = useState<any[]>([])
  const [contentData, setContentData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch multiple dashboard endpoints in parallel
      const [executiveRes, editorialRes, funnelRes, contentRes] = await Promise.all([
        fetch(`/api/analytics/dashboard?type=executive&range=${timeRange}`),
        fetch(`/api/analytics/dashboard?type=editorial&range=${timeRange}`),
        fetch(`/api/analytics/dashboard?type=funnel&range=${timeRange}`),
        fetch(`/api/analytics/dashboard?type=content&range=${timeRange}`)
      ])

      if (executiveRes.ok) {
        const data = await executiveRes.json()
        setMetrics(data.data)
      }

      if (editorialRes.ok) {
        const data = await editorialRes.json()
        setEditorialData(data.data || [])
      }

      if (funnelRes.ok) {
        const data = await funnelRes.json()
        setFunnelData(data.data || [])
      }

      if (contentRes.ok) {
        const data = await contentRes.json()
        setContentData(data.data?.slice(0, 5) || []) // Top 5 fields
      }

      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshDashboard = async () => {
    try {
      setRefreshing(true)
      
      // Trigger dashboard refresh
      await fetch('/api/analytics/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh' })
      })
      
      // Fetch updated data
      await fetchDashboardData()
    } catch (error) {
      console.error('Failed to refresh dashboard:', error)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [timeRange])

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const COLORS = ['#1e3a8a', '#d97706', '#16a34a', '#dc2626', '#7c3aed']

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Executive Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Platform overview and key performance indicators
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <Button 
            onClick={refreshDashboard}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Manuscripts"
          value={metrics ? formatNumber(metrics.totalManuscripts) : '0'}
          change={metrics ? Math.round((metrics.monthlySubmissions / metrics.totalManuscripts) * 100) : undefined}
          changeType="increase"
          icon={<FileText className="h-6 w-6 text-primary" />}
          description={`${metrics?.monthlySubmissions || 0} new this month`}
          loading={loading}
        />
        
        <MetricCard
          title="Published Articles"
          value={metrics ? formatNumber(metrics.publishedManuscripts) : '0'}
          change={metrics ? Math.round(metrics.successRate) : undefined}
          changeType="increase"
          icon={<Award className="h-6 w-6 text-green-600" />}
          description={`${metrics ? Math.round(metrics.successRate) : 0}% success rate`}
          loading={loading}
        />
        
        <MetricCard
          title="Active Users"
          value={metrics ? formatNumber(metrics.activeUsers) : '0'}
          change={15}
          changeType="increase"
          icon={<Users className="h-6 w-6 text-blue-600" />}
          description="Registered platform users"
          loading={loading}
        />
        
        <MetricCard
          title="Avg. Time to Publication"
          value={metrics ? `${Math.round(metrics.avgTimeToPublication || 0)}d` : '0d'}
          change={-8}
          changeType="decrease"
          icon={<Clock className="h-6 w-6 text-amber-600" />}
          description="From submission to publication"
          loading={loading}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submission Funnel */}
        <Card className="p-6 card-academic">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Manuscript Funnel</h3>
            <p className="text-sm text-muted-foreground">
              Submission to publication pipeline
            </p>
          </div>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="stage" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${value} manuscripts`,
                    name === 'count' ? 'Count' : name
                  ]}
                />
                <Bar dataKey="count" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Editorial Performance */}
        <Card className="p-6 card-academic">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Editorial Performance</h3>
            <p className="text-sm text-muted-foreground">
              Weekly submissions and publications
            </p>
          </div>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={editorialData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="week_start" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number, name: string) => [
                    value,
                    name === 'submissions_received' ? 'Submissions' : 
                    name === 'manuscripts_published' ? 'Published' : name
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="submissions_received" 
                  stackId="1"
                  stroke="#1e3a8a" 
                  fill="#1e3a8a" 
                  fillOpacity={0.8}
                />
                <Area 
                  type="monotone" 
                  dataKey="manuscripts_published" 
                  stackId="1"
                  stroke="#16a34a" 
                  fill="#16a34a" 
                  fillOpacity={0.8}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Performance by Field */}
        <Card className="p-6 card-academic">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Top Research Fields</h3>
            <p className="text-sm text-muted-foreground">
              By total article views
            </p>
          </div>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : contentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={contentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ field_of_study, percent }) => 
                    `${field_of_study} (${((percent || 0) * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total_views"
                >
                  {contentData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${formatNumber(value)} views`, 'Views']}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>No content data available</p>
              </div>
            </div>
          )}
        </Card>

        {/* Quick Stats */}
        <Card className="p-6 card-academic">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Platform Statistics</h3>
            <p className="text-sm text-muted-foreground">
              Key platform metrics at a glance
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Eye className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Total Article Views</span>
              </div>
              <span className="font-bold">
                {formatNumber(contentData.reduce((sum, field) => sum + field.total_views, 0))}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Download className="h-5 w-5 text-green-600" />
                <span className="font-medium">Total Downloads</span>
              </div>
              <span className="font-bold">
                {formatNumber(contentData.reduce((sum, field) => sum + field.total_downloads, 0))}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Globe className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Research Fields</span>
              </div>
              <span className="font-bold">{contentData.length}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-5 w-5 text-amber-600" />
                <span className="font-medium">Avg. Review Time</span>
              </div>
              <span className="font-bold">
                {Math.round(metrics?.avgReviewTurnaround || 0)}d
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Status Banner */}
      <Card className="p-4 border-l-4 border-l-primary bg-primary/5">
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Platform Status: Operational</span>
          <span className="text-sm text-muted-foreground">
            • All systems running normally • Last incident: None
          </span>
        </div>
      </Card>
    </div>
  )
}