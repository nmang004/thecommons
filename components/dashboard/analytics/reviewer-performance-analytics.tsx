'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { 
  Users, Clock, Star, TrendingUp, TrendingDown,
  Eye, Search, Filter, Download, CheckCircle, AlertTriangle,
  Target, Mail, BarChart3
} from 'lucide-react'

interface ReviewerData {
  id: string
  name: string
  email: string
  expertise: string[]
  totalReviews: number
  completedReviews: number
  avgTurnaround: number
  qualityScore: number
  onTimeRate: number
  currentWorkload: number
  maxWorkload: number
  joinedDate: string
  lastActive: string
  responseRate: number
  status: 'active' | 'inactive' | 'unavailable'
}

interface ReviewerMetrics {
  totalReviewers: number
  activeReviewers: number
  avgTurnaround: number
  avgQualityScore: number
  onTimePercentage: number
  avgWorkload: number
}

interface WorkloadDistribution {
  reviewer: string
  current: number
  max: number
  percentage: number
}

interface TurnaroundTrend {
  month: string
  avgTurnaround: number
  onTimeRate: number
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

export function ReviewerPerformanceAnalytics() {
  const [reviewers, setReviewers] = useState<ReviewerData[]>([])
  const [metrics, setMetrics] = useState<ReviewerMetrics | null>(null)
  const [workloadData, setWorkloadData] = useState<WorkloadDistribution[]>([])
  const [trendData, setTrendData] = useState<TurnaroundTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedExpertise, setSelectedExpertise] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('qualityScore')

  useEffect(() => {
    loadReviewerData()
  }, [])

  const loadReviewerData = async () => {
    try {
      setLoading(true)
      
      // Generate sample reviewer data
      const sampleReviewers: ReviewerData[] = [
        {
          id: 'rev-001',
          name: 'Dr. Alice Thompson',
          email: 'alice.thompson@university.edu',
          expertise: ['Computer Science', 'Machine Learning'],
          totalReviews: 45,
          completedReviews: 42,
          avgTurnaround: 8,
          qualityScore: 4.7,
          onTimeRate: 93,
          currentWorkload: 3,
          maxWorkload: 5,
          joinedDate: '2023-01-15',
          lastActive: '2024-01-28',
          responseRate: 95,
          status: 'active'
        },
        {
          id: 'rev-002',
          name: 'Prof. Robert Wilson',
          email: 'robert.wilson@institute.org',
          expertise: ['Biomedical Engineering', 'Drug Discovery'],
          totalReviews: 67,
          completedReviews: 65,
          avgTurnaround: 12,
          qualityScore: 4.5,
          onTimeRate: 97,
          currentWorkload: 4,
          maxWorkload: 6,
          joinedDate: '2022-08-20',
          lastActive: '2024-01-30',
          responseRate: 87,
          status: 'active'
        },
        {
          id: 'rev-003',
          name: 'Dr. Maria Garcia',
          email: 'maria.garcia@research.com',
          expertise: ['Environmental Science', 'Sustainability'],
          totalReviews: 28,
          completedReviews: 26,
          avgTurnaround: 6,
          qualityScore: 4.8,
          onTimeRate: 89,
          currentWorkload: 2,
          maxWorkload: 4,
          joinedDate: '2023-05-10',
          lastActive: '2024-01-29',
          responseRate: 92,
          status: 'active'
        },
        {
          id: 'rev-004',
          name: 'Dr. James Kim',
          email: 'james.kim@techlab.edu',
          expertise: ['Business Technology', 'Blockchain'],
          totalReviews: 34,
          completedReviews: 30,
          avgTurnaround: 15,
          qualityScore: 4.3,
          onTimeRate: 76,
          currentWorkload: 5,
          maxWorkload: 5,
          joinedDate: '2023-03-08',
          lastActive: '2024-01-25',
          responseRate: 82,
          status: 'active'
        },
        {
          id: 'rev-005',
          name: 'Prof. Sarah Davis',
          email: 'sarah.davis@medical.org',
          expertise: ['Medical Ethics', 'Healthcare'],
          totalReviews: 52,
          completedReviews: 48,
          avgTurnaround: 10,
          qualityScore: 4.6,
          onTimeRate: 85,
          currentWorkload: 1,
          maxWorkload: 4,
          joinedDate: '2022-11-12',
          lastActive: '2024-01-27',
          responseRate: 90,
          status: 'active'
        },
        {
          id: 'rev-006',
          name: 'Dr. Michael Brown',
          email: 'michael.brown@biotech.com',
          expertise: ['Computational Biology', 'Protein Folding'],
          totalReviews: 23,
          completedReviews: 20,
          avgTurnaround: 18,
          qualityScore: 4.2,
          onTimeRate: 65,
          currentWorkload: 0,
          maxWorkload: 3,
          joinedDate: '2023-07-22',
          lastActive: '2024-01-20',
          responseRate: 75,
          status: 'inactive'
        },
        {
          id: 'rev-007',
          name: 'Dr. Lisa Chen',
          email: 'lisa.chen@engineering.edu',
          expertise: ['Electrical Engineering', 'Renewable Energy'],
          totalReviews: 41,
          completedReviews: 39,
          avgTurnaround: 9,
          qualityScore: 4.9,
          onTimeRate: 95,
          currentWorkload: 3,
          maxWorkload: 5,
          joinedDate: '2022-12-05',
          lastActive: '2024-01-30',
          responseRate: 98,
          status: 'active'
        },
        {
          id: 'rev-008',
          name: 'Prof. David Martinez',
          email: 'david.martinez@materials.org',
          expertise: ['Materials Science', 'Space Applications'],
          totalReviews: 38,
          completedReviews: 35,
          avgTurnaround: 14,
          qualityScore: 4.4,
          onTimeRate: 81,
          currentWorkload: 2,
          maxWorkload: 4,
          joinedDate: '2023-02-18',
          lastActive: '2024-01-28',
          responseRate: 88,
          status: 'active'
        }
      ]
      
      setReviewers(sampleReviewers)
      
      // Calculate metrics
      const activeReviewers = sampleReviewers.filter(r => r.status === 'active')
      const avgTurnaround = Math.round(
        sampleReviewers.reduce((sum, r) => sum + r.avgTurnaround, 0) / sampleReviewers.length
      )
      const avgQualityScore = Math.round(
        (sampleReviewers.reduce((sum, r) => sum + r.qualityScore, 0) / sampleReviewers.length) * 10
      ) / 10
      const avgOnTime = Math.round(
        sampleReviewers.reduce((sum, r) => sum + r.onTimeRate, 0) / sampleReviewers.length
      )
      const avgWorkload = Math.round(
        sampleReviewers.reduce((sum, r) => sum + r.currentWorkload, 0) / sampleReviewers.length
      )
      
      setMetrics({
        totalReviewers: sampleReviewers.length,
        activeReviewers: activeReviewers.length,
        avgTurnaround,
        avgQualityScore,
        onTimePercentage: avgOnTime,
        avgWorkload
      })
      
      // Calculate workload distribution
      const workloadData = sampleReviewers.map(reviewer => ({
        reviewer: reviewer.name.split(' ').pop() || reviewer.name,
        current: reviewer.currentWorkload,
        max: reviewer.maxWorkload,
        percentage: Math.round((reviewer.currentWorkload / reviewer.maxWorkload) * 100)
      }))
      
      setWorkloadData(workloadData)
      
      // Generate trend data (last 12 months)
      const trendData = []
      for (let i = 11; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        trendData.push({
          month: date.toLocaleString('default', { month: 'short' }),
          avgTurnaround: Math.floor(Math.random() * 8) + 8,
          onTimeRate: Math.floor(Math.random() * 20) + 75
        })
      }
      
      setTrendData(trendData)
      
    } catch (error) {
      console.error('Error loading reviewer data:', error)
    } finally {
      setLoading(false)
    }
  }

  const sortedReviewers = [...reviewers].sort((a, b) => {
    switch (sortBy) {
      case 'qualityScore':
        return b.qualityScore - a.qualityScore
      case 'turnaround':
        return a.avgTurnaround - b.avgTurnaround
      case 'onTimeRate':
        return b.onTimeRate - a.onTimeRate
      case 'totalReviews':
        return b.totalReviews - a.totalReviews
      default:
        return 0
    }
  })

  const filteredReviewers = sortedReviewers.filter(reviewer => {
    if (selectedExpertise === 'all') return true
    return reviewer.expertise.includes(selectedExpertise)
  })

  const allExpertise = Array.from(new Set(reviewers.flatMap(r => r.expertise)))
  const overloadedReviewers = reviewers.filter(r => r.currentWorkload >= r.maxWorkload).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Reviewer Performance</h2>
          <p className="text-muted-foreground mt-1">
            Individual reviewer metrics and performance tracking
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Advanced Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Reviewers"
          value={metrics?.totalReviewers || 0}
          change={8}
          changeType="increase"
          icon={<Users className="h-6 w-6 text-blue-600" />}
          description={`${metrics?.activeReviewers || 0} currently active`}
          loading={loading}
        />
        
        <MetricCard
          title="Avg. Turnaround"
          value={`${metrics?.avgTurnaround || 0}d`}
          change={-12}
          changeType="decrease"
          icon={<Clock className="h-6 w-6 text-amber-600" />}
          description="Days to complete review"
          loading={loading}
        />
        
        <MetricCard
          title="Quality Score"
          value={`${metrics?.avgQualityScore || 0}/5`}
          change={5}
          changeType="increase"
          icon={<Star className="h-6 w-6 text-purple-600" />}
          description="Average review quality"
          loading={loading}
        />
        
        <MetricCard
          title="On-Time Rate"
          value={`${metrics?.onTimePercentage || 0}%`}
          change={3}
          changeType="increase"
          icon={<CheckCircle className="h-6 w-6 text-green-600" />}
          description="Reviews completed on time"
          loading={loading}
        />
      </div>

      {/* Filters */}
      <Card className="p-4 card-academic">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by:</span>
          </div>
          
          <select 
            value={selectedExpertise} 
            onChange={(e) => setSelectedExpertise(e.target.value)}
            className="px-3 py-1 text-sm border rounded-md"
          >
            <option value="all">All Expertise</option>
            {allExpertise.map(expertise => (
              <option key={expertise} value={expertise}>{expertise}</option>
            ))}
          </select>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Sort by:</span>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 text-sm border rounded-md"
            >
              <option value="qualityScore">Quality Score</option>
              <option value="turnaround">Turnaround Time</option>
              <option value="onTimeRate">On-Time Rate</option>
              <option value="totalReviews">Total Reviews</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workload Distribution */}
        <Card className="p-6 card-academic">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
              Workload Distribution
            </h3>
            <p className="text-sm text-muted-foreground">
              Current workload vs maximum capacity
            </p>
          </div>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workloadData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 6]} tick={{ fontSize: 12 }} />
                <YAxis 
                  dataKey="reviewer" 
                  type="category"
                  tick={{ fontSize: 12 }}
                  width={80}
                />
                <Tooltip />
                <Bar 
                  dataKey="current" 
                  fill="#1e3a8a"
                  name="Current Workload"
                  radius={[0, 4, 4, 0]}
                />
                <Bar 
                  dataKey="max" 
                  fill="#e5e7eb"
                  name="Maximum Capacity"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Performance Trends */}
        <Card className="p-6 card-academic">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Performance Trends
            </h3>
            <p className="text-sm text-muted-foreground">
              Turnaround time and on-time rate over time
            </p>
          </div>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="avgTurnaround" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name="Avg. Turnaround (days)"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="onTimeRate" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="On-Time Rate (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Quality vs Speed Scatter Plot */}
      <Card className="p-6 card-academic">
        <div className="mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Target className="h-5 w-5 mr-2 text-purple-600" />
            Quality vs Speed Analysis
          </h3>
          <p className="text-sm text-muted-foreground">
            Review quality score vs turnaround time for all reviewers
          </p>
        </div>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={reviewers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="avgTurnaround" 
                tick={{ fontSize: 12 }}
                label={{ value: 'Avg. Turnaround (days)', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                dataKey="qualityScore" 
                tick={{ fontSize: 12 }}
                domain={[3.5, 5]}
                label={{ value: 'Quality Score', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'avgTurnaround' ? `${value} days` : value,
                  name === 'avgTurnaround' ? 'Turnaround' : 'Quality Score'
                ]}
                labelFormatter={(_label, payload) => 
                  payload?.[0]?.payload?.name || ''
                }
              />
              <Scatter 
                dataKey="qualityScore" 
                fill="#8b5cf6"
              />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Alerts */}
      {overloadedReviewers > 0 && (
        <Card className="p-6 card-academic border-amber-200 bg-amber-50">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800">Workload Alert</h3>
              <p className="text-sm text-amber-700 mt-1">
                {overloadedReviewers} reviewer{overloadedReviewers > 1 ? 's are' : ' is'} at or above maximum capacity. 
                Consider redistributing workload or recruiting additional reviewers.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Reviewer List */}
      <Card className="p-6 card-academic">
        <div className="mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Users className="h-5 w-5 mr-2 text-gray-600" />
            Reviewer List ({filteredReviewers.length})
          </h3>
          <p className="text-sm text-muted-foreground">
            Detailed performance metrics for individual reviewers
          </p>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Reviewer</th>
                  <th className="text-left p-3 font-semibold">Expertise</th>
                  <th className="text-left p-3 font-semibold">Reviews</th>
                  <th className="text-left p-3 font-semibold">Quality</th>
                  <th className="text-left p-3 font-semibold">Turnaround</th>
                  <th className="text-left p-3 font-semibold">On-Time Rate</th>
                  <th className="text-left p-3 font-semibold">Workload</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviewers.map((reviewer) => (
                  <tr key={reviewer.id} className="border-b hover:bg-muted/30">
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{reviewer.name}</div>
                        <div className="text-xs text-gray-500">{reviewer.email}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {reviewer.expertise.slice(0, 2).map(exp => (
                          <Badge key={exp} variant="outline" className="text-xs">
                            {exp}
                          </Badge>
                        ))}
                        {reviewer.expertise.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{reviewer.expertise.length - 2}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        <div>{reviewer.completedReviews}/{reviewer.totalReviews}</div>
                        <div className="text-xs text-gray-500">
                          {Math.round((reviewer.completedReviews / reviewer.totalReviews) * 100)}% complete
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>{reviewer.qualityScore}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge 
                        variant={reviewer.avgTurnaround <= 10 ? 'default' : 
                                reviewer.avgTurnaround <= 15 ? 'secondary' : 'destructive'}
                      >
                        {reviewer.avgTurnaround}d
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{reviewer.onTimeRate}%</span>
                        <div className="w-12 h-2 bg-muted rounded-full">
                          <div 
                            className="h-2 bg-green-500 rounded-full"
                            style={{ width: `${reviewer.onTimeRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        <div>{reviewer.currentWorkload}/{reviewer.maxWorkload}</div>
                        <div className="w-16 h-2 bg-muted rounded-full mt-1">
                          <div 
                            className={`h-2 rounded-full ${
                              reviewer.currentWorkload >= reviewer.maxWorkload 
                                ? 'bg-red-500' 
                                : reviewer.currentWorkload > reviewer.maxWorkload * 0.7
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min((reviewer.currentWorkload / reviewer.maxWorkload) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge 
                        variant={reviewer.status === 'active' ? 'default' : 
                                reviewer.status === 'inactive' ? 'secondary' : 'destructive'}
                      >
                        {reviewer.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Mail className="w-3 h-3 mr-1" />
                          Contact
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}