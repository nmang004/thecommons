'use client'

import { useState } from 'react'
import { EditorialDashboard } from '@/components/dashboard/analytics/editorial-dashboard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
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
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Manuscript Analytics</h3>
            <p className="text-muted-foreground">
              Detailed manuscript tracking and status analytics coming soon...
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="reviewers" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Reviewer Performance</h3>
            <p className="text-muted-foreground">
              Individual reviewer metrics and performance tracking coming soon...
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Editorial Schedule</h3>
            <p className="text-muted-foreground">
              Publication schedule and deadline tracking coming soon...
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}