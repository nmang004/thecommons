'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts'
import { 
  FileText, Clock, Eye, Users, TrendingUp, 
  CheckCircle, Calendar, Award
} from 'lucide-react'

interface AuthorMetrics {
  totalSubmissions: number
  publishedManuscripts: number
  inReview: number
  underRevision: number
  avgTimeToPublication: number
  totalViews: number
  totalDownloads: number
  citationCount: number
}

interface SubmissionTrend {
  month: string
  submissions: number
  published: number
  rejected: number
}

interface ManuscriptStatus {
  status: string
  count: number
  percentage: number
}

interface AuthorPerformance {
  authorId: string
  authorName: string
  affiliation: string
  totalSubmissions: number
  publishedCount: number
  successRate: number
  avgTimeToPublication: number
  totalViews: number
  hIndex: number
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

interface AuthorAnalyticsProps {
  timeRange?: '7d' | '30d' | '90d' | '1y'
  className?: string
}

export function AuthorAnalytics({ 
  timeRange = '30d', 
  className = '' 
}: AuthorAnalyticsProps) {
  const [metrics, setMetrics] = useState<AuthorMetrics | null>(null)
  const [trendData, setTrendData] = useState<SubmissionTrend[]>([])
  const [statusData, setStatusData] = useState<ManuscriptStatus[]>([])
  const [topAuthors, setTopAuthors] = useState<AuthorPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchAuthorAnalytics = async () => {
    try {
      setLoading(true)
      
      // Mock data for author analytics
      // In a real implementation, this would fetch from the analytics API
      
      setMetrics({
        totalSubmissions: 1247,
        publishedManuscripts: 892,
        inReview: 203,
        underRevision: 152,
        avgTimeToPublication: 45,
        totalViews: 28560,
        totalDownloads: 15240,
        citationCount: 3420
      })

      // Mock submission trends
      setTrendData([
        { month: 'Jan', submissions: 98, published: 72, rejected: 15 },
        { month: 'Feb', submissions: 112, published: 78, rejected: 18 },
        { month: 'Mar', submissions: 105, published: 81, rejected: 12 },
        { month: 'Apr', submissions: 128, published: 89, rejected: 22 },
        { month: 'May', submissions: 134, published: 95, rejected: 19 },
        { month: 'Jun', submissions: 142, published: 102, rejected: 21 }
      ])

      // Mock manuscript status distribution
      setStatusData([
        { status: 'Published', count: 892, percentage: 71.5 },
        { status: 'In Review', count: 203, percentage: 16.3 },
        { status: 'Under Revision', count: 152, percentage: 12.2 }
      ])

      // Mock top authors
      setTopAuthors([
        {
          authorId: '1',
          authorName: 'Dr. Sarah Johnson',
          affiliation: 'Stanford University',
          totalSubmissions: 23,
          publishedCount: 18,
          successRate: 78.3,
          avgTimeToPublication: 42,
          totalViews: 3420,
          hIndex: 15
        },
        {
          authorId: '2',
          authorName: 'Prof. Michael Chen',
          affiliation: 'MIT',
          totalSubmissions: 19,
          publishedCount: 16,
          successRate: 84.2,
          avgTimeToPublication: 38,
          totalViews: 2890,
          hIndex: 12
        },
        {
          authorId: '3',
          authorName: 'Dr. Emily Rodriguez',
          affiliation: 'Harvard University',
          totalSubmissions: 21,
          publishedCount: 15,
          successRate: 71.4,
          avgTimeToPublication: 51,
          totalViews: 2340,
          hIndex: 11
        },
        {
          authorId: '4',
          authorName: 'Prof. David Kim',
          affiliation: 'UC Berkeley',
          totalSubmissions: 17,
          publishedCount: 14,
          successRate: 82.4,
          avgTimeToPublication: 44,
          totalViews: 2120,
          hIndex: 9
        }
      ])

      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch author analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuthorAnalytics()
    
    // Auto-refresh every 15 minutes
    const interval = setInterval(fetchAuthorAnalytics, 15 * 60 * 1000)
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
          <h2 className="text-3xl font-bold text-foreground">Author Analytics</h2>
          <p className="text-muted-foreground mt-1">
            Author performance and submission tracking insights
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            {timeRange}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Submissions"
          value={metrics ? formatNumber(metrics.totalSubmissions) : '0'}
          change={8}
          changeType="increase"
          icon={<FileText className="h-6 w-6 text-blue-600" />}
          description={`${metrics?.inReview || 0} currently in review`}
          loading={loading}
        />
        
        <MetricCard
          title="Published Articles"
          value={metrics ? formatNumber(metrics.publishedManuscripts) : '0'}
          change={12}
          changeType="increase"
          icon={<CheckCircle className="h-6 w-6 text-green-600" />}
          description={`${metrics ? Math.round((metrics.publishedManuscripts / metrics.totalSubmissions) * 100) : 0}% success rate`}
          loading={loading}
        />
        
        <MetricCard
          title="Total Views"
          value={metrics ? formatNumber(metrics.totalViews) : '0'}
          change={15}
          changeType="increase"
          icon={<Eye className="h-6 w-6 text-purple-600" />}
          description={`${metrics ? formatNumber(metrics.totalDownloads) : 0} downloads`}
          loading={loading}
        />
        
        <MetricCard
          title="Avg. Time to Publication"
          value={metrics ? `${metrics.avgTimeToPublication}d` : '0d'}
          change={-3}
          changeType="decrease"
          icon={<Clock className="h-6 w-6 text-amber-600" />}
          description="From submission to publication"
          loading={loading}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submission Trends */}
        <Card className="p-6 card-academic">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Submission Trends</h3>
            <p className="text-sm text-muted-foreground">
              Monthly submission and publication patterns
            </p>
          </div>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    value,
                    name === 'submissions' ? 'Submissions' : 
                    name === 'published' ? 'Published' : 'Rejected'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="submissions" 
                  stackId="1"
                  stroke="#1e3a8a" 
                  fill="#1e3a8a" 
                  fillOpacity={0.8}
                />
                <Area 
                  type="monotone" 
                  dataKey="published" 
                  stackId="1"
                  stroke="#16a34a" 
                  fill="#16a34a" 
                  fillOpacity={0.8}
                />
                <Area 
                  type="monotone" 
                  dataKey="rejected" 
                  stackId="1"
                  stroke="#dc2626" 
                  fill="#dc2626" 
                  fillOpacity={0.8}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Manuscript Status Distribution */}
        <Card className="p-6 card-academic">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Manuscript Status</h3>
            <p className="text-sm text-muted-foreground">
              Current distribution of manuscript statuses
            </p>
          </div>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percentage }) => 
                    `${status} (${percentage.toFixed(1)}%)`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statusData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value} manuscripts`, 'Count']}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Top Authors Table */}
      <Card className="p-6 card-academic">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Top Performing Authors</h3>
          <p className="text-sm text-muted-foreground">
            Authors ranked by publication success and impact
          </p>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Author</th>
                  <th className="text-left p-3 font-semibold">Affiliation</th>
                  <th className="text-left p-3 font-semibold">Submissions</th>
                  <th className="text-left p-3 font-semibold">Published</th>
                  <th className="text-left p-3 font-semibold">Success Rate</th>
                  <th className="text-left p-3 font-semibold">Avg. Time</th>
                  <th className="text-left p-3 font-semibold">Views</th>
                  <th className="text-left p-3 font-semibold">H-Index</th>
                </tr>
              </thead>
              <tbody>
                {topAuthors.map((author, index) => (
                  <tr key={author.authorId} className="border-b hover:bg-muted/30">
                    <td className="p-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold">
                              {index + 1}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">{author.authorName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {author.affiliation}
                    </td>
                    <td className="p-3">{author.totalSubmissions}</td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <span>{author.publishedCount}</span>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <span>{author.successRate.toFixed(1)}%</span>
                        <div className="w-16 h-2 bg-muted rounded-full">
                          <div 
                            className="h-2 bg-green-500 rounded-full"
                            style={{ width: `${author.successRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3">{author.avgTimeToPublication}d</td>
                    <td className="p-3">{formatNumber(author.totalViews)}</td>
                    <td className="p-3">
                      <Badge variant="secondary">{author.hIndex}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 card-academic">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">Active Authors</h3>
              <p className="text-2xl font-bold">{formatNumber(456)}</p>
              <p className="text-sm text-muted-foreground">
                Authors with submissions this period
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 card-academic">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Award className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold">Citations</h3>
              <p className="text-2xl font-bold">{formatNumber(metrics?.citationCount || 0)}</p>
              <p className="text-sm text-muted-foreground">
                Total citations received
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 card-academic">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold">Growth Rate</h3>
              <p className="text-2xl font-bold">+23%</p>
              <p className="text-sm text-muted-foreground">
                New author submissions
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}