'use client'

import { useState } from 'react'
import { EditorialDashboard } from '@/components/dashboard/analytics/editorial-dashboard'
import { ManuscriptAnalytics } from '@/components/dashboard/analytics/manuscript-analytics'
import { ReviewerPerformanceAnalytics } from '@/components/dashboard/analytics/reviewer-performance-analytics'
import { ScheduleAnalytics } from '@/components/dashboard/analytics/schedule-analytics'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, FileText, Users, TrendingUp } from 'lucide-react'

export default function EditorAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-playfair mb-2">Editorial Analytics</h1>
        <p className="text-lg text-muted-foreground">
          Comprehensive insights into editorial workflow performance and manuscript processing
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="manuscripts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Manuscripts
          </TabsTrigger>
          <TabsTrigger value="reviewers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Reviewers
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <EditorialDashboard />
        </TabsContent>

        <TabsContent value="manuscripts" className="space-y-6">
          <ManuscriptAnalytics />
        </TabsContent>

        <TabsContent value="reviewers" className="space-y-6">
          <ReviewerPerformanceAnalytics />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <ScheduleAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  )
}