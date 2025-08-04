'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  XAxis,
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Users,
  FileText,
  Download
} from 'lucide-react'

interface DecisionAnalyticsProps {
  editorId?: string
  timeRange?: '7d' | '30d' | '90d' | '1y'
  className?: string
}

interface AnalyticsData {
  decisionMetrics: {
    total: number
    accepted: number
    rejected: number
    revisions: number
    avgProcessingTime: number
  }
  monthlyTrends: Array<{
    month: string
    accepted: number
    rejected: number
    revisions: number
  }>
  decisionsByType: Array<{
    type: string
    count: number
    percentage: number
    color: string
  }>
  templateUsage: Array<{
    templateName: string
    usageCount: number
    lastUsed: string
  }>
  performanceMetrics: {
    avgDecisionTime: number
    onTimeDecisions: number
    totalDecisions: number
    efficiency: number
  }
}

const COLORS = {
  accepted: '#10b981',
  rejected: '#ef4444', 
  revisions: '#f59e0b',
  pending: '#6b7280'
}

export function DecisionAnalytics({ 
  editorId, 
  timeRange = '30d',
  className 
}: DecisionAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [editorId, selectedTimeRange])

  const loadAnalytics = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        timeRange: selectedTimeRange,
        ...(editorId && { editorId })
      })

      const response = await fetch(`/api/analytics/editorial-decisions?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to load analytics')
      }

      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (err) {
      console.error('Error loading analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }

  const exportData = async () => {
    try {
      const params = new URLSearchParams({
        timeRange: selectedTimeRange,
        format: 'csv',
        ...(editorId && { editorId })
      })

      const response = await fetch(`/api/analytics/editorial-decisions/export?${params}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `editorial-decisions-${selectedTimeRange}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (err) {
      console.error('Error exporting data:', err)
    }
  }

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Analytics</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadAnalytics}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Editorial Decision Analytics</h3>
          <p className="text-sm text-gray-600">
            Performance metrics and trends for editorial decisions
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Decisions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.decisionMetrics.total}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.decisionMetrics.total > 0 
                ? Math.round((data.decisionMetrics.accepted / data.decisionMetrics.total) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {data.decisionMetrics.accepted} accepted manuscripts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.decisionMetrics.avgProcessingTime}d</div>
            <p className="text-xs text-muted-foreground">
              -2 days from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreforward" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.performanceMetrics.efficiency}%</div>
            <p className="text-xs text-muted-foreground">
              On-time decisions: {data.performanceMetrics.onTimeDecisions}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Decision Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Decision Distribution</CardTitle>
            <CardDescription>Breakdown of editorial decisions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.decisionsByType}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ type, percentage }) => `${type}: ${percentage}%`}
                >
                  {data.decisionsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-4">
              {data.decisionsByType.map((item) => (
                <div key={item.type} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600">
                    {item.type}: {item.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Trends</CardTitle>
            <CardDescription>Decision trends over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="accepted" 
                  stroke={COLORS.accepted} 
                  strokeWidth={2}
                  name="Accepted"
                />
                <Line 
                  type="monotone" 
                  dataKey="rejected" 
                  stroke={COLORS.rejected} 
                  strokeWidth={2}
                  name="Rejected"
                />
                <Line 
                  type="monotone" 
                  dataKey="revisions" 
                  stroke={COLORS.revisions} 
                  strokeWidth={2}
                  name="Revisions"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Template Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Template Usage</CardTitle>
          <CardDescription>Most frequently used decision templates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.templateUsage.slice(0, 5).map((template, index) => (
              <div key={template.templateName} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                    <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{template.templateName}</h4>
                    <p className="text-sm text-gray-600">
                      Last used: {new Date(template.lastUsed).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary">{template.usageCount} uses</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}