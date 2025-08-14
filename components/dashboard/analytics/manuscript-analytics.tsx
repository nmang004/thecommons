'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { 
  FileText, Clock, Users, CheckCircle,
  TrendingUp, TrendingDown, Eye, Search, Filter,
  Download, Calendar, BarChart3, PieChart as PieIcon,
  Target, AlertTriangle
} from 'lucide-react'

interface ManuscriptData {
  id: string
  title: string
  author: string
  submittedAt: string
  status: string
  fieldOfStudy: string
  reviewerCount: number
  timeInCurrentStage: number
  totalTimeInSystem: number
  priority: 'high' | 'medium' | 'low'
}

interface StatusDistribution {
  status: string
  count: number
  percentage: number
  color: string
}

interface FieldAnalytics {
  field: string
  submissions: number
  published: number
  acceptanceRate: number
  avgProcessingTime: number
}

interface TimelineData {
  date: string
  submissions: number
  decisions: number
  published: number
}

const STATUS_COLORS = {
  submitted: '#6b7280',
  under_review: '#8b5cf6',
  revision_requested: '#f59e0b',
  accepted: '#10b981',
  rejected: '#ef4444',
  published: '#16a34a'
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

export function ManuscriptAnalytics() {
  const [manuscripts, setManuscripts] = useState<ManuscriptData[]>([])
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution[]>([])
  const [fieldAnalytics, setFieldAnalytics] = useState<FieldAnalytics[]>([])
  const [timelineData, setTimelineData] = useState<TimelineData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedField, setSelectedField] = useState<string>('all')

  useEffect(() => {
    loadManuscriptData()
  }, [])

  const loadManuscriptData = async () => {
    try {
      setLoading(true)
      
      // Generate sample manuscript data
      const sampleManuscripts: ManuscriptData[] = [
        {
          id: 'ms-001',
          title: 'Quantum Computing Applications in Climate Modeling',
          author: 'Dr. Sarah Johnson',
          submittedAt: '2024-01-15',
          status: 'under_review',
          fieldOfStudy: 'Computer Science',
          reviewerCount: 3,
          timeInCurrentStage: 12,
          totalTimeInSystem: 28,
          priority: 'high'
        },
        {
          id: 'ms-002',
          title: 'Machine Learning Approaches to Drug Discovery',
          author: 'Prof. Michael Chen',
          submittedAt: '2024-01-10',
          status: 'revision_requested',
          fieldOfStudy: 'Biomedical Engineering',
          reviewerCount: 2,
          timeInCurrentStage: 8,
          totalTimeInSystem: 35,
          priority: 'medium'
        },
        {
          id: 'ms-003',
          title: 'Sustainable Energy Solutions for Urban Areas',
          author: 'Dr. Emily Rodriguez',
          submittedAt: '2024-01-20',
          status: 'accepted',
          fieldOfStudy: 'Environmental Science',
          reviewerCount: 3,
          timeInCurrentStage: 2,
          totalTimeInSystem: 42,
          priority: 'high'
        },
        {
          id: 'ms-004',
          title: 'Blockchain Applications in Supply Chain Management',
          author: 'Dr. James Williams',
          submittedAt: '2023-12-05',
          status: 'published',
          fieldOfStudy: 'Business Technology',
          reviewerCount: 2,
          timeInCurrentStage: 7,
          totalTimeInSystem: 65,
          priority: 'low'
        },
        {
          id: 'ms-005',
          title: 'AI Ethics in Healthcare Decision Making',
          author: 'Dr. Lisa Anderson',
          submittedAt: '2024-01-25',
          status: 'submitted',
          fieldOfStudy: 'Medical Ethics',
          reviewerCount: 0,
          timeInCurrentStage: 3,
          totalTimeInSystem: 3,
          priority: 'medium'
        },
        {
          id: 'ms-006',
          title: 'Neural Networks for Protein Folding Prediction',
          author: 'Prof. David Kim',
          submittedAt: '2024-01-08',
          status: 'rejected',
          fieldOfStudy: 'Computational Biology',
          reviewerCount: 3,
          timeInCurrentStage: 1,
          totalTimeInSystem: 30,
          priority: 'medium'
        },
        {
          id: 'ms-007',
          title: 'Renewable Energy Grid Integration Strategies',
          author: 'Dr. Maria Santos',
          submittedAt: '2024-01-18',
          status: 'under_review',
          fieldOfStudy: 'Electrical Engineering',
          reviewerCount: 2,
          timeInCurrentStage: 15,
          totalTimeInSystem: 25,
          priority: 'high'
        },
        {
          id: 'ms-008',
          title: 'Advanced Materials for Space Applications',
          author: 'Dr. Robert Chang',
          submittedAt: '2023-12-20',
          status: 'published',
          fieldOfStudy: 'Materials Science',
          reviewerCount: 3,
          timeInCurrentStage: 5,
          totalTimeInSystem: 58,
          priority: 'low'
        }
      ]
      
      setManuscripts(sampleManuscripts)
      
      // Calculate status distribution
      const statusCounts = sampleManuscripts.reduce((acc, ms) => {
        acc[ms.status] = (acc[ms.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const total = sampleManuscripts.length
      const distribution = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        percentage: Math.round((count / total) * 100),
        color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#6b7280'
      }))
      
      setStatusDistribution(distribution)
      
      // Calculate field analytics
      const fieldData = sampleManuscripts.reduce((acc, ms) => {
        if (!acc[ms.fieldOfStudy]) {
          acc[ms.fieldOfStudy] = {
            field: ms.fieldOfStudy,
            submissions: 0,
            published: 0,
            acceptanceRate: 0,
            avgProcessingTime: 0,
            totalTime: 0
          }
        }
        acc[ms.fieldOfStudy].submissions += 1
        if (ms.status === 'published' || ms.status === 'accepted') {
          acc[ms.fieldOfStudy].published += 1
        }
        acc[ms.fieldOfStudy].totalTime += ms.totalTimeInSystem
        return acc
      }, {} as Record<string, any>)
      
      const fieldAnalytics = Object.values(fieldData).map((field: any) => ({
        field: field.field,
        submissions: field.submissions,
        published: field.published,
        acceptanceRate: Math.round((field.published / field.submissions) * 100),
        avgProcessingTime: Math.round(field.totalTime / field.submissions)
      }))
      
      setFieldAnalytics(fieldAnalytics)
      
      // Generate timeline data (last 12 weeks)
      const timelineData = []
      for (let i = 11; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - (i * 7))
        timelineData.push({
          date: date.toISOString().split('T')[0],
          submissions: Math.floor(Math.random() * 8) + 2,
          decisions: Math.floor(Math.random() * 6) + 1,
          published: Math.floor(Math.random() * 4) + 1
        })
      }
      
      setTimelineData(timelineData)
      
    } catch (error) {
      console.error('Error loading manuscript data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredManuscripts = manuscripts.filter(ms => {
    if (selectedStatus !== 'all' && ms.status !== selectedStatus) return false
    if (selectedField !== 'all' && ms.fieldOfStudy !== selectedField) return false
    return true
  })

  const averageProcessingTime = manuscripts.length > 0 
    ? Math.round(manuscripts.reduce((sum, ms) => sum + ms.totalTimeInSystem, 0) / manuscripts.length)
    : 0

  const publishedCount = manuscripts.filter(ms => ms.status === 'published' || ms.status === 'accepted').length
  const acceptanceRate = manuscripts.length > 0 ? Math.round((publishedCount / manuscripts.length) * 100) : 0

  const overdueManuscripts = manuscripts.filter(ms => 
    ms.timeInCurrentStage > 21 && ms.status === 'under_review'
  ).length

  const uniqueFields = Array.from(new Set(manuscripts.map(ms => ms.fieldOfStudy)))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Manuscript Analytics</h2>
          <p className="text-muted-foreground mt-1">
            Detailed manuscript tracking and status analytics
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
            Export Data
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Manuscripts"
          value={manuscripts.length}
          change={15}
          changeType="increase"
          icon={<FileText className="h-6 w-6 text-blue-600" />}
          description={`${filteredManuscripts.length} matching filters`}
          loading={loading}
        />
        
        <MetricCard
          title="Avg. Processing Time"
          value={`${averageProcessingTime}d`}
          change={-8}
          changeType="decrease"
          icon={<Clock className="h-6 w-6 text-amber-600" />}
          description="From submission to decision"
          loading={loading}
        />
        
        <MetricCard
          title="Acceptance Rate"
          value={`${acceptanceRate}%`}
          change={5}
          changeType="increase"
          icon={<CheckCircle className="h-6 w-6 text-green-600" />}
          description={`${publishedCount} accepted/published`}
          loading={loading}
        />
        
        <MetricCard
          title="Overdue Reviews"
          value={overdueManuscripts}
          change={overdueManuscripts > 0 ? 25 : -30}
          changeType={overdueManuscripts > 0 ? "increase" : "decrease"}
          icon={<AlertTriangle className="h-6 w-6 text-red-600" />}
          description="Reviews >21 days"
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
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1 text-sm border rounded-md"
          >
            <option value="all">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="revision_requested">Revision Requested</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="published">Published</option>
          </select>
          
          <select 
            value={selectedField} 
            onChange={(e) => setSelectedField(e.target.value)}
            className="px-3 py-1 text-sm border rounded-md"
          >
            <option value="all">All Fields</option>
            {uniqueFields.map(field => (
              <option key={field} value={field}>{field}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card className="p-6 card-academic">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <PieIcon className="h-5 w-5 mr-2 text-blue-600" />
              Status Distribution
            </h3>
            <p className="text-sm text-muted-foreground">
              Current status of all manuscripts
            </p>
          </div>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ status, percentage }) => `${status}: ${percentage}%`}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Submission Timeline */}
        <Card className="p-6 card-academic">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
              Submission Timeline
            </h3>
            <p className="text-sm text-muted-foreground">
              Weekly submission and publication trends
            </p>
          </div>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="submissions" 
                  stroke="#1e3a8a" 
                  strokeWidth={2}
                  name="Submissions"
                />
                <Line 
                  type="monotone" 
                  dataKey="decisions" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name="Decisions"
                />
                <Line 
                  type="monotone" 
                  dataKey="published" 
                  stroke="#16a34a" 
                  strokeWidth={2}
                  name="Published"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Field Analytics */}
      <Card className="p-6 card-academic">
        <div className="mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Target className="h-5 w-5 mr-2 text-purple-600" />
            Field Analytics
          </h3>
          <p className="text-sm text-muted-foreground">
            Performance metrics by field of study
          </p>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Field of Study</th>
                  <th className="text-left p-3 font-semibold">Submissions</th>
                  <th className="text-left p-3 font-semibold">Published</th>
                  <th className="text-left p-3 font-semibold">Acceptance Rate</th>
                  <th className="text-left p-3 font-semibold">Avg. Processing Time</th>
                </tr>
              </thead>
              <tbody>
                {fieldAnalytics.map((field) => (
                  <tr key={field.field} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{field.field}</td>
                    <td className="p-3">{field.submissions}</td>
                    <td className="p-3">{field.published}</td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <span>{field.acceptanceRate}%</span>
                        <div className="w-16 h-2 bg-muted rounded-full">
                          <div 
                            className="h-2 bg-green-500 rounded-full"
                            style={{ width: `${field.acceptanceRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge 
                        variant={field.avgProcessingTime > 40 ? 'destructive' : 
                                field.avgProcessingTime > 25 ? 'secondary' : 'default'}
                      >
                        {field.avgProcessingTime} days
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Manuscript List */}
      <Card className="p-6 card-academic">
        <div className="mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <FileText className="h-5 w-5 mr-2 text-gray-600" />
            Manuscript List ({filteredManuscripts.length})
          </h3>
          <p className="text-sm text-muted-foreground">
            Detailed view of individual manuscripts
          </p>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredManuscripts.map((manuscript) => (
              <div key={manuscript.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">{manuscript.title}</h4>
                      <Badge 
                        variant="outline"
                        className={manuscript.priority === 'high' ? 'border-red-200 text-red-600' :
                                  manuscript.priority === 'medium' ? 'border-yellow-200 text-yellow-600' :
                                  'border-green-200 text-green-600'}
                      >
                        {manuscript.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <span>by {manuscript.author}</span>
                      <span>•</span>
                      <span>{manuscript.fieldOfStudy}</span>
                      <span>•</span>
                      <span>Submitted {new Date(manuscript.submittedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{manuscript.reviewerCount} reviewers</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{manuscript.timeInCurrentStage}d in current stage</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{manuscript.totalTimeInSystem}d total</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Badge 
                      variant="outline"
                      style={{ 
                        color: STATUS_COLORS[manuscript.status as keyof typeof STATUS_COLORS],
                        borderColor: STATUS_COLORS[manuscript.status as keyof typeof STATUS_COLORS]
                      }}
                    >
                      {manuscript.status.replace('_', ' ')}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}