import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExecutiveDashboard } from '@/components/dashboard/analytics/executive-dashboard'
import { EditorialDashboard } from '@/components/dashboard/analytics/editorial-dashboard'
import { MonitoringDashboard } from '@/components/dashboard/analytics/monitoring-dashboard'
import { AuthorAnalytics } from '@/components/dashboard/analytics/author-analytics'
import { ContentAnalytics } from '@/components/dashboard/analytics/content-analytics'
import { RealTimeMetrics } from '@/components/dashboard/analytics/realtime-metrics'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, Users, FileText, TrendingUp, 
  Settings, Download, Calendar, Clock
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Analytics Dashboard - The Commons',
  description: 'Comprehensive analytics and insights for The Commons academic publishing platform.',
}

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()
  
  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }
  
  return { user, profile }
}

export default async function AnalyticsPage() {
  await getAuthenticatedUser()

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Page Header */}
      <div className="border-b border-border pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              Analytics & Insights
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Comprehensive platform analytics and performance monitoring
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="text-sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Admin Dashboard
            </Badge>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs defaultValue="executive" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="executive" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Executive</span>
          </TabsTrigger>
          <TabsTrigger value="editorial" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Editorial</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Authors</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Content</span>
          </TabsTrigger>
          <TabsTrigger value="realtime" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Real-time</span>
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Financial</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Monitoring</span>
          </TabsTrigger>
        </TabsList>

        {/* Executive Dashboard */}
        <TabsContent value="executive" className="space-y-6">
          <ExecutiveDashboard />
        </TabsContent>

        {/* Editorial Dashboard */}
        <TabsContent value="editorial" className="space-y-6">
          <EditorialDashboard />
        </TabsContent>

        {/* User Analytics */}
        <TabsContent value="users" className="space-y-6">
          <AuthorAnalytics />
        </TabsContent>

        {/* Content Analytics */}
        <TabsContent value="content" className="space-y-6">
          <ContentAnalytics />
        </TabsContent>

        {/* Real-time Metrics */}
        <TabsContent value="realtime" className="space-y-6">
          <RealTimeMetrics />
        </TabsContent>

        {/* Financial Analytics */}
        <TabsContent value="financial" className="space-y-6">
          <Card className="p-8 text-center">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Financial Analytics</h3>
            <p className="text-muted-foreground mb-4">
              Revenue tracking, payment processing, and financial performance insights.
            </p>
            <Badge variant="outline">Coming Soon</Badge>
          </Card>
        </TabsContent>

        {/* Performance Monitoring */}
        <TabsContent value="performance" className="space-y-6">
          <MonitoringDashboard />
        </TabsContent>
      </Tabs>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 card-academic hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">Real-time Metrics</h3>
              <p className="text-sm text-muted-foreground">
                Live platform performance data
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 card-academic hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold">Growth Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Platform adoption and scaling trends
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 card-academic hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold">User Insights</h3>
              <p className="text-sm text-muted-foreground">
                Academic community engagement
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Analytics Footer */}
      <Card className="p-6 bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Analytics Infrastructure</h3>
            <p className="text-sm text-muted-foreground">
              Powered by real-time data processing and advanced academic publishing metrics
            </p>
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>Data refresh: Every 5 minutes</span>
            <span>•</span>
            <span>Retention: 90 days</span>
            <span>•</span>
            <span>Privacy compliant</span>
          </div>
        </div>
      </Card>
    </div>
  )
}