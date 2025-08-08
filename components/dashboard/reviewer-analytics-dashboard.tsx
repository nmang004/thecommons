'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  Line
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Mail,
  Eye,
  MousePointer,
  RefreshCw,
  Download,
  Target
} from 'lucide-react'

interface ReviewerAnalyticsProps {
  timeRange: 'week' | 'month' | 'quarter' | 'year'
  onTimeRangeChange: (range: 'week' | 'month' | 'quarter' | 'year') => void
}

interface AnalyticsData {
  invitation_stats: {
    total_sent: number
    total_delivered: number
    total_opened: number
    total_responded: number
    total_accepted: number
    total_declined: number
    acceptance_rate: number
    response_rate: number
    avg_response_time_hours: number
  }
  template_performance: Array<{
    template_name: string
    template_id: string
    total_sent: number
    acceptance_rate: number
    avg_response_time_hours: number
    open_rate: number
  }>
  field_performance: Array<{
    field_of_study: string
    total_reviewers: number
    avg_acceptance_rate: number
    avg_response_time: number
    difficulty_score: number
  }>
  reviewer_performance: Array<{
    reviewer_id: string
    reviewer_name: string
    invitations_received: number
    invitations_accepted: number
    reviews_completed: number
    avg_review_time: number
    reliability_score: number
    avg_quality_score: number
  }>
  trends: Array<{
    date: string
    invitations_sent: number
    acceptance_rate: number
    response_time: number
  }>
  conflict_stats: {
    total_conflicts: number
    by_type: Record<string, number>
    by_severity: Record<string, number>
    blocked_assignments: number
    override_rate: number
  }
}

export function ReviewerAnalyticsDashboard({ timeRange, onTimeRangeChange }: ReviewerAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
      // This would be replaced with actual API calls
      const mockData: AnalyticsData = {
        invitation_stats: {
          total_sent: 1247,
          total_delivered: 1198,
          total_opened: 892,
          total_responded: 734,
          total_accepted: 456,
          total_declined: 278,
          acceptance_rate: 0.62,
          response_rate: 0.81,
          avg_response_time_hours: 36.5
        },
        template_performance: [
          {
            template_name: 'Standard Review Request',
            template_id: 'standard-001',
            total_sent: 892,
            acceptance_rate: 0.68,
            avg_response_time_hours: 32.1,
            open_rate: 0.74
          },
          {
            template_name: 'Urgent Review Request',
            template_id: 'urgent-001',
            total_sent: 234,
            acceptance_rate: 0.52,
            avg_response_time_hours: 18.7,
            open_rate: 0.89
          },
          {
            template_name: 'Resubmission Review',
            template_id: 'resubmission-001',
            total_sent: 121,
            acceptance_rate: 0.76,
            avg_response_time_hours: 28.4,
            open_rate: 0.82
          }
        ],
        field_performance: [
          {
            field_of_study: 'Computer Science',
            total_reviewers: 89,
            avg_acceptance_rate: 0.72,
            avg_response_time: 28.3,
            difficulty_score: 0.4
          },
          {
            field_of_study: 'Biology',
            total_reviewers: 76,
            avg_acceptance_rate: 0.58,
            avg_response_time: 42.1,
            difficulty_score: 0.7
          },
          {
            field_of_study: 'Physics',
            total_reviewers: 45,
            avg_acceptance_rate: 0.65,
            avg_response_time: 35.6,
            difficulty_score: 0.5
          }
        ],
        reviewer_performance: [
          {
            reviewer_id: '1',
            reviewer_name: 'Dr. Sarah Chen',
            invitations_received: 12,
            invitations_accepted: 10,
            reviews_completed: 9,
            avg_review_time: 18.5,
            reliability_score: 0.92,
            avg_quality_score: 4.6
          },
          {
            reviewer_id: '2',
            reviewer_name: 'Prof. Michael Rodriguez',
            invitations_received: 8,
            invitations_accepted: 7,
            reviews_completed: 7,
            avg_review_time: 22.1,
            reliability_score: 0.88,
            avg_quality_score: 4.4
          }
        ],
        trends: [
          { date: '2024-01', invitations_sent: 234, acceptance_rate: 0.64, response_time: 38.2 },
          { date: '2024-02', invitations_sent: 289, acceptance_rate: 0.58, response_time: 41.1 },
          { date: '2024-03', invitations_sent: 312, acceptance_rate: 0.62, response_time: 36.5 },
          { date: '2024-04', invitations_sent: 267, acceptance_rate: 0.68, response_time: 33.2 },
          { date: '2024-05', invitations_sent: 298, acceptance_rate: 0.71, response_time: 29.8 }
        ],
        conflict_stats: {
          total_conflicts: 45,
          by_type: {
            'institutional_current': 18,
            'coauthorship_recent': 12,
            'institutional_recent': 8,
            'advisor_advisee': 4,
            'financial_competing': 3
          },
          by_severity: {
            'blocking': 16,
            'high': 14,
            'medium': 10,
            'low': 5
          },
          blocked_assignments: 16,
          override_rate: 0.25
        }
      }
      setData(mockData)
    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`
  const formatHours = (hours: number) => `${hours.toFixed(1)}h`

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  if (loading) {
    return <div>Loading analytics...</div>
  }

  if (!data) {
    return <div>Failed to load analytics data</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading font-bold text-gray-900">
            Reviewer Analytics
          </h2>
          <p className="text-gray-600">
            Comprehensive insights into reviewer assignment and performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => onTimeRangeChange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          <Button variant="outline" onClick={loadAnalyticsData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Acceptance Rate</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatPercentage(data.invitation_stats.acceptance_rate)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+12% from last period</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatHours(data.invitation_stats.avg_response_time_hours)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">-8% faster</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Reviewers</p>
              <p className="text-3xl font-bold text-gray-900">
                {data.reviewer_performance.length}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+5 new reviewers</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">COI Conflicts</p>
              <p className="text-3xl font-bold text-gray-900">
                {data.conflict_stats.total_conflicts}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">
              {data.conflict_stats.blocked_assignments} blocked assignments
            </span>
          </div>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="reviewers">Reviewers</TabsTrigger>
          <TabsTrigger value="fields">Fields</TabsTrigger>
          <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Trends Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Invitation Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="invitations_sent"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                  name="Invitations Sent"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="acceptance_rate"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="Acceptance Rate"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Invitation Funnel */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Invitation Funnel</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Sent</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{data.invitation_stats.total_sent}</div>
                  <div className="text-sm text-gray-500">100%</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Delivered</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{data.invitation_stats.total_delivered}</div>
                  <div className="text-sm text-gray-500">
                    {formatPercentage(data.invitation_stats.total_delivered / data.invitation_stats.total_sent)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Eye className="w-5 h-5 text-purple-600" />
                  <span className="font-medium">Opened</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{data.invitation_stats.total_opened}</div>
                  <div className="text-sm text-gray-500">
                    {formatPercentage(data.invitation_stats.total_opened / data.invitation_stats.total_sent)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <MousePointer className="w-5 h-5 text-orange-600" />
                  <span className="font-medium">Responded</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{data.invitation_stats.total_responded}</div>
                  <div className="text-sm text-gray-500">
                    {formatPercentage(data.invitation_stats.total_responded / data.invitation_stats.total_sent)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                <div className="flex items-center space-x-3">
                  <Target className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Accepted</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-700">{data.invitation_stats.total_accepted}</div>
                  <div className="text-sm text-green-600">
                    {formatPercentage(data.invitation_stats.total_accepted / data.invitation_stats.total_sent)}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Template Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.template_performance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="template_name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="acceptance_rate" fill="#10b981" name="Acceptance Rate" />
                <Bar dataKey="open_rate" fill="#3b82f6" name="Open Rate" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Template Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Template
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acceptance Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Response Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Open Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.template_performance.map((template) => (
                    <tr key={template.template_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {template.template_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {template.total_sent}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={template.acceptance_rate > 0.6 ? "default" : "secondary"}>
                          {formatPercentage(template.acceptance_rate)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatHours(template.avg_response_time_hours)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPercentage(template.open_rate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="reviewers" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Top Reviewer Performance</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reviewer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invites
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Accepted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reliability
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quality
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.reviewer_performance.map((reviewer) => (
                    <tr key={reviewer.reviewer_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {reviewer.reviewer_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {reviewer.invitations_received}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {reviewer.invitations_accepted}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {reviewer.reviews_completed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatHours(reviewer.avg_review_time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={reviewer.reliability_score > 0.8 ? "default" : "secondary"}>
                          {formatPercentage(reviewer.reliability_score)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900">
                            {reviewer.avg_quality_score.toFixed(1)}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">/5.0</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="fields" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Field Performance Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.field_performance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="field_of_study" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avg_acceptance_rate" fill="#10b981" name="Acceptance Rate" />
                <Bar dataKey="difficulty_score" fill="#ef4444" name="Difficulty Score" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="conflicts" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Conflicts by Type</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={Object.entries(data.conflict_stats.by_type).map(([type, count]) => ({
                      name: type.replace(/_/g, ' '),
                      value: count
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(data.conflict_stats.by_type).map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Conflicts by Severity</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={Object.entries(data.conflict_stats.by_severity).map(([severity, count]) => ({
                      name: severity,
                      value: count
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(data.conflict_stats.by_severity).map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Conflict Management Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{data.conflict_stats.blocked_assignments}</div>
                <div className="text-sm text-gray-600">Blocked Assignments</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">
                  {formatPercentage(data.conflict_stats.override_rate)}
                </div>
                <div className="text-sm text-gray-600">Override Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {formatPercentage(1 - (data.conflict_stats.blocked_assignments / data.invitation_stats.total_sent))}
                </div>
                <div className="text-sm text-gray-600">Clean Assignment Rate</div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}