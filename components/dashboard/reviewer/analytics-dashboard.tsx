'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Star,
  Target,
  Calendar,
  Award,
  Users,
  BarChart3,
  Download,
  RefreshCw
} from 'lucide-react'

interface AnalyticsDashboardProps {
  analytics: {
    totalReviews: number
    averageReviewTime: number
    acceptanceRate: number
    qualityScore: number
    timeliness: number
    recognition: any[]
  }
  profileId: string
}

export function AnalyticsDashboard({ analytics, profileId }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'3months' | '6months' | '1year' | '2years'>('6months')
  const [comparisonData, setComparisonData] = useState<any>(null)
  const [trendsData, setTrendsData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
      // Mock data - in production this would come from API
      const mockTrends = [
        { month: 'Jan', reviews: 2, avgTime: 18, quality: 4.2, onTime: 0.85 },
        { month: 'Feb', reviews: 3, avgTime: 16, quality: 4.4, onTime: 0.90 },
        { month: 'Mar', reviews: 4, avgTime: 15, quality: 4.6, onTime: 0.95 },
        { month: 'Apr', reviews: 3, avgTime: 14, quality: 4.5, onTime: 0.88 },
        { month: 'May', reviews: 5, avgTime: 13, quality: 4.7, onTime: 0.92 },
        { month: 'Jun', reviews: 4, avgTime: 15, quality: 4.8, onTime: 0.96 }
      ]
      
      setTrendsData(mockTrends)
      
      const mockComparison = {
        reviewTimePercentile: 75, // Better than 75% of reviewers
        acceptanceRatePercentile: 82,
        qualityScorePercentile: 89,
        timelinessPercentile: 91,
        totalReviewers: 1247
      }
      
      setComparisonData(mockComparison)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPercentage = (value: number) => `${Math.round(value * 100)}%`
  const formatScore = (value: number) => value.toFixed(1)

  // Performance indicators
  const getPerformanceColor = (percentile: number) => {
    if (percentile >= 90) return 'text-green-600'
    if (percentile >= 75) return 'text-blue-600'
    if (percentile >= 50) return 'text-yellow-600'
    return 'text-orange-600'
  }

  const getPerformanceLabel = (percentile: number) => {
    if (percentile >= 90) return 'Excellent'
    if (percentile >= 75) return 'Very Good'
    if (percentile >= 50) return 'Good'
    return 'Needs Improvement'
  }

  // Chart colors
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-gray-900">
            Performance Analytics
          </h2>
          <p className="text-gray-600">
            Detailed insights into your review performance and progress
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
            <option value="2years">Last 2 Years</option>
          </select>
          
          <Button variant="outline" onClick={loadAnalyticsData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Reviews</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.totalReviews}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+15% from last period</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Review Time</p>
              <p className="text-3xl font-bold text-gray-900">
                {Math.round(analytics.averageReviewTime)}d
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">2 days faster</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Quality Score</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatScore(analytics.qualityScore)}/5.0
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+0.3 improvement</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">On-Time Rate</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatPercentage(analytics.timeliness)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+5% improvement</span>
          </div>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="comparison">Peer Comparison</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="achievements">Recognition</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          {/* Review Activity Over Time */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Review Activity Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="reviews"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Quality and Timeliness Trends */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quality & Timeliness Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" domain={[0, 5]} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 1]} />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="quality"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="Quality Score"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="onTime"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  name="On-Time Rate"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          {comparisonData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Peer Performance Comparison</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Review Speed</span>
                    <div className="text-right">
                      <div className={`font-bold ${getPerformanceColor(comparisonData.reviewTimePercentile)}`}>
                        {getPerformanceLabel(comparisonData.reviewTimePercentile)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Better than {comparisonData.reviewTimePercentile}% of reviewers
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Acceptance Rate</span>
                    <div className="text-right">
                      <div className={`font-bold ${getPerformanceColor(comparisonData.acceptanceRatePercentile)}`}>
                        {getPerformanceLabel(comparisonData.acceptanceRatePercentile)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Better than {comparisonData.acceptanceRatePercentile}% of reviewers
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Quality Score</span>
                    <div className="text-right">
                      <div className={`font-bold ${getPerformanceColor(comparisonData.qualityScorePercentile)}`}>
                        {getPerformanceLabel(comparisonData.qualityScorePercentile)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Better than {comparisonData.qualityScorePercentile}% of reviewers
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Timeliness</span>
                    <div className="text-right">
                      <div className={`font-bold ${getPerformanceColor(comparisonData.timelinessPercentile)}`}>
                        {getPerformanceLabel(comparisonData.timelinessPercentile)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Better than {comparisonData.timelinessPercentile}% of reviewers
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <Users className="w-4 h-4 inline mr-1" />
                    Compared with {comparisonData.totalReviewers} active reviewers
                  </p>
                </div>
              </Card>

              {/* Performance Radar Chart would go here */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Performance Profile</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Speed', value: comparisonData.reviewTimePercentile },
                    { label: 'Acceptance', value: comparisonData.acceptanceRatePercentile },
                    { label: 'Quality', value: comparisonData.qualityScorePercentile },
                    { label: 'Timeliness', value: comparisonData.timelinessPercentile }
                  ].map((metric) => (
                    <div key={metric.label} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          {metric.label}
                        </span>
                        <span className="text-sm text-gray-900">
                          {metric.value}th percentile
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            metric.value >= 90 ? 'bg-green-500' :
                            metric.value >= 75 ? 'bg-blue-500' :
                            metric.value >= 50 ? 'bg-yellow-500' : 'bg-orange-500'
                          }`}
                          style={{ width: `${metric.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-6">
          {/* Review Time Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Review Time Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: '< 1 week', value: 15 },
                      { name: '1-2 weeks', value: 45 },
                      { name: '2-3 weeks', value: 30 },
                      { name: '> 3 weeks', value: 10 }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Field Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={[
                    { field: 'Computer Science', count: 12 },
                    { field: 'Biology', count: 8 },
                    { field: 'Physics', count: 6 },
                    { field: 'Chemistry', count: 4 },
                    { field: 'Mathematics', count: 3 }
                  ]}
                  layout="horizontal"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="field" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recognition Timeline</h3>
            {analytics.recognition.length > 0 ? (
              <div className="space-y-4">
                {analytics.recognition.map((badge: any, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-yellow-100 rounded-full mr-3">
                      <Award className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{badge.name}</h4>
                      <p className="text-sm text-gray-600">{badge.description}</p>
                    </div>
                    <Badge variant="secondary">{badge.category}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No achievements yet. Keep reviewing to earn badges!</p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}