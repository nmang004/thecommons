'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts'
import { 
  FileText, Clock, Users, CheckCircle,
  TrendingUp, TrendingDown, Filter
} from 'lucide-react'

interface EditorialMetrics {
  totalSubmissions: number
  inReview: number
  pendingDecision: number
  published: number
  avgDecisionTime: number
  avgReviewTime: number
  activeEditors: number
  activeReviewers: number
}

interface WorkflowStage {
  stage: string
  count: number
  avgDuration: number
  efficiency: number
}

interface EditorPerformance {
  editorId: string
  editorName: string
  manuscriptsHandled: number
  avgDecisionTime: number
  acceptanceRate: number
  currentWorkload: number
}

interface ReviewerPerformance {
  reviewerId: string
  reviewerName: string
  totalReviews: number
  avgTurnaround: number
  qualityScore: number
  acceptanceRate: number
}

function MetricCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon, 
  description,
  loading = false 
}: {
  title: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
  icon: React.ReactNode
  description?: string
  loading?: boolean
}) {
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
  const ChangeIcon = changeType === 'increase' ? TrendingUp : 
                     changeType === 'decrease' ? TrendingDown : null

  return (
    <Card className="p-6 card-academic">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline space-x-2">
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {change !== undefined && (
              <div className={`flex items-center space-x-1 ${changeColor} text-xs`}>
                {ChangeIcon && <ChangeIcon className="h-3 w-3" />}
                <span>{Math.abs(change)}%</span>
              </div>
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

interface EditorialDashboardProps {
  timeRange?: '7d' | '30d' | '90d'
  className?: string
}

export function EditorialDashboard({ 
  timeRange = '30d', 
  className = '' 
}: EditorialDashboardProps) {
  const [metrics, setMetrics] = useState<EditorialMetrics | null>(null)
  const [workflowData, setWorkflowData] = useState<WorkflowStage[]>([])
  const [editorsData, setEditorsData] = useState<EditorPerformance[]>([])
  const [reviewersData, setReviewersData] = useState<ReviewerPerformance[]>([])
  const [trendData, setTrendData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchEditorialData = async () => {
    try {
      setLoading(true)
      
      // Fetch editorial analytics data
      const response = await fetch(`/api/analytics/dashboard?type=editorial&range=${timeRange}`)
      
      if (response.ok) {
        const data = await response.json()
        
        // Process the data for editorial dashboard
        const editorialPerformance = data.data || []
        
        // Calculate metrics from the performance data
        const totalSubs = editorialPerformance.reduce((sum: number, week: any) => 
          sum + (week.submissions_received || 0), 0)
        const totalPub = editorialPerformance.reduce((sum: number, week: any) => 
          sum + (week.manuscripts_published || 0), 0)
        const avgDecisionTime = editorialPerformance.reduce((sum: number, week: any) => 
          sum + (week.avg_time_to_publication || 0), 0) / editorialPerformance.length
        const avgReviewTime = editorialPerformance.reduce((sum: number, week: any) => 
          sum + (week.avg_review_turnaround || 0), 0) / editorialPerformance.length
        
        setMetrics({
          totalSubmissions: totalSubs,
          inReview: Math.round(totalSubs * 0.3), // Estimated
          pendingDecision: Math.round(totalSubs * 0.15), // Estimated
          published: totalPub,
          avgDecisionTime: Math.round(avgDecisionTime || 0),
          avgReviewTime: Math.round(avgReviewTime || 0),
          activeEditors: editorialPerformance.reduce((sum: number, week: any) => 
            Math.max(sum, week.active_editors || 0), 0),
          activeReviewers: Math.round(totalSubs * 2.5) // Estimated ratio
        })
        
        setTrendData(editorialPerformance.reverse()) // Most recent first for chart
      }

      // Fetch workflow funnel data
      const funnelResponse = await fetch(`/api/analytics/dashboard?type=funnel&range=${timeRange}`)
      if (funnelResponse.ok) {
        const funnelData = await funnelResponse.json()
        
        // Transform funnel data to workflow stages
        const workflowStages = (funnelData.data || []).map((stage: any) => ({
          stage: stage.stage.replace(/_/g, ' ').toUpperCase(),
          count: stage.count,
          avgDuration: Math.round(Math.random() * 15 + 5), // Mock duration
          efficiency: Math.round(stage.conversionRate || 0)
        }))
        
        setWorkflowData(workflowStages)
      }

      // Mock editor and reviewer performance data
      setEditorsData([
        {
          editorId: '1',
          editorName: 'Dr. Sarah Johnson',
          manuscriptsHandled: 45,
          avgDecisionTime: 12,
          acceptanceRate: 68,
          currentWorkload: 8
        },
        {
          editorId: '2',
          editorName: 'Prof. Michael Chen',
          manuscriptsHandled: 38,
          avgDecisionTime: 15,
          acceptanceRate: 72,
          currentWorkload: 6
        },
        {
          editorId: '3',
          editorName: 'Dr. Emily Rodriguez',
          manuscriptsHandled: 52,
          avgDecisionTime: 10,
          acceptanceRate: 65,
          currentWorkload: 12
        },
        {
          editorId: '4',
          editorName: 'Prof. David Kim',
          manuscriptsHandled: 29,
          avgDecisionTime: 18,
          acceptanceRate: 75,
          currentWorkload: 4
        }
      ])

      setReviewersData([
        {
          reviewerId: '1',
          reviewerName: 'Dr. Alice Thompson',
          totalReviews: 23,
          avgTurnaround: 8,
          qualityScore: 4.7,
          acceptanceRate: 45
        },
        {
          reviewerId: '2',
          reviewerName: 'Prof. Robert Wilson',
          totalReviews: 31,
          avgTurnaround: 12,
          qualityScore: 4.5,
          acceptanceRate: 52
        },
        {
          reviewerId: '3',
          reviewerName: 'Dr. Maria Garcia',
          totalReviews: 18,
          avgTurnaround: 6,
          qualityScore: 4.8,
          acceptanceRate: 38
        }
      ])

      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch editorial data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEditorialData()
    
    // Auto-refresh every 10 minutes
    const interval = setInterval(fetchEditorialData, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [timeRange])

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getStatusColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'submissions': return '#3b82f6'
      case 'with_editor': return '#f59e0b'
      case 'under_review': return '#8b5cf6'
      case 'decision_made': return '#10b981'
      case 'published': return '#16a34a'
      default: return '#6b7280'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Editorial Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Manuscript workflow and editorial performance analytics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Submissions"
          value={metrics ? formatNumber(metrics.totalSubmissions) : '0'}
          change={12}
          changeType="increase"
          icon={<FileText className="h-6 w-6 text-blue-600" />}
          description={`${metrics?.inReview || 0} currently in review`}
          loading={loading}
        />
        
        <MetricCard
          title="Avg. Decision Time"
          value={metrics ? `${metrics.avgDecisionTime}d` : '0d'}
          change={-5}
          changeType="decrease"
          icon={<Clock className="h-6 w-6 text-amber-600" />}
          description="From submission to decision"
          loading={loading}
        />
        
        <MetricCard
          title="Active Editors"
          value={metrics ? metrics.activeEditors : '0'}
          change={8}
          changeType="increase"
          icon={<Users className="h-6 w-6 text-green-600" />}
          description={`${metrics?.pendingDecision || 0} manuscripts pending`}
          loading={loading}
        />
        
        <MetricCard
          title="Published This Period"
          value={metrics ? formatNumber(metrics.published) : '0'}
          change={15}
          changeType="increase"
          icon={<CheckCircle className="h-6 w-6 text-emerald-600" />}
          description={`${metrics ? Math.round((metrics.published / metrics.totalSubmissions) * 100) : 0}% of submissions`}
          loading={loading}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workflow Pipeline */}
        <Card className="p-6 card-academic">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Workflow Pipeline</h3>
            <p className="text-sm text-muted-foreground">
              Manuscripts by editorial stage
            </p>
          </div>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workflowData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis 
                  dataKey="stage" 
                  type="category"
                  tick={{ fontSize: 12 }}
                  width={100}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${value} manuscripts`,
                    name === 'count' ? 'Count' : name
                  ]}
                />
                <Bar 
                  dataKey="count" 
                  fill="#1e3a8a" 
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Submission Trends */}
        <Card className="p-6 card-academic">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Submission Trends</h3>
            <p className="text-sm text-muted-foreground">
              Weekly submissions vs publications
            </p>
          </div>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="week_start" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
                <Line 
                  type="monotone" 
                  dataKey="submissions_received" 
                  stroke="#1e3a8a" 
                  strokeWidth={2}
                  name="Submissions"
                />
                <Line 
                  type="monotone" 
                  dataKey="manuscripts_published" 
                  stroke="#16a34a" 
                  strokeWidth={2}
                  name="Published"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Editor Performance Table */}
      <Card className="p-6 card-academic">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Editor Performance</h3>
          <p className="text-sm text-muted-foreground">
            Editorial efficiency and workload distribution
          </p>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Editor</th>
                  <th className="text-left p-3 font-semibold">Manuscripts</th>
                  <th className="text-left p-3 font-semibold">Avg. Decision Time</th>
                  <th className="text-left p-3 font-semibold">Acceptance Rate</th>
                  <th className="text-left p-3 font-semibold">Current Workload</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {editorsData.map((editor) => (
                  <tr key={editor.editorId} className="border-b hover:bg-muted/30">
                    <td className="p-3">
                      <div className="font-medium">{editor.editorName}</div>
                    </td>
                    <td className="p-3">{editor.manuscriptsHandled}</td>
                    <td className="p-3">{editor.avgDecisionTime} days</td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <span>{editor.acceptanceRate}%</span>
                        <div className="w-16 h-2 bg-muted rounded-full">
                          <div 
                            className="h-2 bg-green-500 rounded-full"
                            style={{ width: `${editor.acceptanceRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3">{editor.currentWorkload}</td>
                    <td className="p-3">
                      <Badge 
                        variant={editor.currentWorkload > 10 ? 'destructive' : 
                                editor.currentWorkload > 5 ? 'secondary' : 'default'}
                      >
                        {editor.currentWorkload > 10 ? 'High Load' : 
                         editor.currentWorkload > 5 ? 'Moderate' : 'Available'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Reviewer Performance */}
      <Card className="p-6 card-academic">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Top Reviewer Performance</h3>
          <p className="text-sm text-muted-foreground">
            Review quality and turnaround metrics
          </p>
        </div>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={reviewersData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="avgTurnaround" 
                tick={{ fontSize: 12 }}
                label={{ value: 'Avg. Turnaround (days)', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                dataKey="qualityScore" 
                tick={{ fontSize: 12 }}
                label={{ value: 'Quality Score', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'avgTurnaround' ? `${value} days` : value,
                  name === 'avgTurnaround' ? 'Turnaround' : 'Quality Score'
                ]}
                labelFormatter={(label, payload) => 
                  payload?.[0]?.payload?.reviewerName || ''
                }
              />
              <Scatter 
                dataKey="qualityScore" 
                fill="#1e3a8a"
              />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  )
}