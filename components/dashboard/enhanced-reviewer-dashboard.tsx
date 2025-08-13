'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  AlertCircle,
  Calendar,
  Star,
  Timer,
  Settings,
  RefreshCw,
  Eye,
  MessageSquare
} from 'lucide-react'
import { Profile, ReviewerDashboard } from '@/types/database'
import { ReviewQueue } from './reviewer/review-queue'
import { AnalyticsDashboard } from './reviewer/analytics-dashboard' 
import { WorkloadManagement } from './reviewer/workload-management'
import { AchievementShowcase } from './reviewer/achievement-showcase'
import { ProfessionalDevelopment } from './reviewer/professional-development'

interface EnhancedReviewerDashboardProps {
  profile: Profile
}

export function EnhancedReviewerDashboard({ profile }: EnhancedReviewerDashboardProps) {
  const [dashboardData, setDashboardData] = useState<ReviewerDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reviewers/me/dashboard', {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      const result = await response.json()

      if (!response.ok) {
        // Handle specific status codes
        if (response.status === 401) {
          throw new Error('Unauthorized')
        } else if (response.status === 403) {
          throw new Error('Access denied. Reviewer role required.')
        } else if (response.status === 404) {
          throw new Error('Reviewer profile not found')
        }
        throw new Error(result.error || 'Failed to load dashboard')
      }

      setDashboardData(result.data)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Dashboard loading error:', err)
      
      // If unauthorized, redirect to login
      if (errorMessage === 'Unauthorized') {
        window.location.href = '/api/auth/login?returnTo=' + encodeURIComponent(window.location.pathname)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshData = () => {
    loadDashboardData()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to Load Dashboard
          </h2>
          <p className="text-gray-600 mb-4">
            {error || 'There was a problem loading your reviewer dashboard.'}
          </p>
          <Button onClick={handleRefreshData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </Card>
      </div>
    )
  }

  const { queue, analytics, workload } = dashboardData

  // Calculate key metrics for quick stats
  const totalAssignments = queue.pending.length + queue.inProgress.length

  // Determine reviewer level based on completed reviews
  const getReviewerLevel = (reviewCount: number) => {
    if (reviewCount >= 100) return { level: 'Master Reviewer', color: 'text-purple-600', bgColor: 'bg-purple-100' }
    if (reviewCount >= 50) return { level: 'Expert Reviewer', color: 'text-blue-600', bgColor: 'bg-blue-100' }
    if (reviewCount >= 25) return { level: 'Experienced Reviewer', color: 'text-green-600', bgColor: 'bg-green-100' }
    if (reviewCount >= 10) return { level: 'Active Reviewer', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
    if (reviewCount >= 1) return { level: 'New Reviewer', color: 'text-gray-600', bgColor: 'bg-gray-100' }
    return { level: 'Getting Started', color: 'text-gray-500', bgColor: 'bg-gray-50' }
  }

  const reviewerLevel = getReviewerLevel(analytics.totalReviews)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-heading font-bold text-gray-900">
                  Reviewer Dashboard
                </h1>
                <Badge className={`${reviewerLevel.bgColor} ${reviewerLevel.color} border-0`}>
                  {reviewerLevel.level}
                </Badge>
              </div>
              <p className="text-gray-600 mt-1">
                Welcome back, {profile.full_name}. Here's your review activity overview.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-gray-600">Overall Rating</p>
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="ml-1 font-medium">
                    {analytics.qualityScore.toFixed(1)}/5.0
                  </span>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={handleRefreshData}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{totalAssignments}</div>
              <div className="text-sm text-gray-600">Active Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(analytics.acceptanceRate * 100)}%
              </div>
              <div className="text-sm text-gray-600">Acceptance Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(analytics.averageReviewTime)}d
              </div>
              <div className="text-sm text-gray-600">Avg Review Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {analytics.recognition.length}
              </div>
              <div className="text-sm text-gray-600">Badges Earned</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="workload">Workload</TabsTrigger>
            <TabsTrigger value="development">Development</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Recent Activity */}
                <Card className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-heading font-semibold text-gray-900">
                      Recent Activity
                    </h2>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View All
                    </Button>
                  </div>
                  
                  <ReviewQueue 
                    queue={queue} 
                    compact={true}
                    limit={5}
                  />
                </Card>

                {/* Quick Analytics */}
                <Card className="p-6">
                  <h2 className="text-xl font-heading font-semibold text-gray-900 mb-6">
                    Performance Summary
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Quality Score</span>
                        <span className="font-medium">{analytics.qualityScore.toFixed(1)}/5.0</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                          style={{width: `${(analytics.qualityScore / 5) * 100}%`}}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">On-time Rate</span>
                        <span className="font-medium">{Math.round(analytics.timeliness * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{width: `${analytics.timeliness * 100}%`}}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Achievement Showcase */}
                <AchievementShowcase 
                  badges={analytics.recognition}
                  totalReviews={analytics.totalReviews}
                  compact={true}
                />

                {/* Quick Actions */}
                <Card className="p-6">
                  <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="w-4 h-4 mr-2" />
                      Review Calendar
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="w-4 h-4 mr-2" />
                      Manage Settings
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Timer className="w-4 h-4 mr-2" />
                      Time Tracking
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Review Guidelines
                    </Button>
                  </div>
                </Card>

                {/* Workload Status */}
                <Card className="p-6">
                  <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
                    Workload Status
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Current Load</span>
                      <span className="font-medium">
                        {workload.currentAssignments}/{workload.monthlyCapacity}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${
                          workload.currentAssignments >= workload.monthlyCapacity 
                            ? 'bg-red-500' 
                            : workload.currentAssignments >= workload.monthlyCapacity * 0.8
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.min((workload.currentAssignments / workload.monthlyCapacity) * 100, 100)}%`
                        }}
                      />
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {workload.currentAssignments >= workload.monthlyCapacity 
                        ? 'At capacity' 
                        : `${workload.monthlyCapacity - workload.currentAssignments} slots available`
                      }
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <ReviewQueue queue={queue} />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <AnalyticsDashboard 
              analytics={analytics}
              profileId={profile.id}
            />
          </TabsContent>

          <TabsContent value="workload" className="mt-6">
            <WorkloadManagement 
              workload={workload}
              reviewerSettings={profile.reviewer_settings}
              onSettingsUpdate={loadDashboardData}
            />
          </TabsContent>

          <TabsContent value="development" className="mt-6">
            <ProfessionalDevelopment 
              development={dashboardData.development}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}