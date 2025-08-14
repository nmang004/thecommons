'use client'

import { useAuth } from '@/hooks/useAuth'
import { TemplateManager } from '@/components/dashboard/template-manager'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Settings,
  FileText,
  Zap,
  Users,
  Clock
} from 'lucide-react'

export default function TemplatesPage() {
  const { user, isLoading: authLoading } = useAuth()

  if (authLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || (user.role !== 'editor' && user.role !== 'admin')) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You need editor privileges to access this page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
          Decision Templates
        </h1>
        <p className="text-muted-foreground">
          Create and manage reusable templates for editorial decisions
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-academic">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Template Benefits</p>
                <p className="text-lg font-semibold text-gray-900">Consistency</p>
              </div>
              <FileText className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-academic">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Time Saved</p>
                <p className="text-lg font-semibold text-green-600">60%</p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-academic">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Efficiency</p>
                <p className="text-lg font-semibold text-blue-600">Improved</p>
              </div>
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-academic">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Editor Experience</p>
                <p className="text-lg font-semibold text-purple-600">Enhanced</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Template Guidelines */}
      <Card className="card-academic">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Template Guidelines
          </CardTitle>
          <CardDescription>
            Best practices for creating effective decision templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Template Variables</h4>
              <div className="text-sm text-gray-600 space-y-2">
                <p><code className="bg-gray-100 px-1 rounded text-xs">{`{{author_name}}`}</code> - Author's full name</p>
                <p><code className="bg-gray-100 px-1 rounded text-xs">{`{{manuscript_title}}`}</code> - Manuscript title</p>
                <p><code className="bg-gray-100 px-1 rounded text-xs">{`{{editor_name}}`}</code> - Editor's name</p>
                <p><code className="bg-gray-100 px-1 rounded text-xs">{`{{journal_name}}`}</code> - Journal name</p>
                <p><code className="bg-gray-100 px-1 rounded text-xs">{`{{submission_date}}`}</code> - Submission date</p>
                <p><code className="bg-gray-100 px-1 rounded text-xs">{`{{current_date}}`}</code> - Current date</p>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Best Practices</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Use clear, professional language</li>
                <li>• Include specific feedback points</li>
                <li>• Maintain consistent tone across templates</li>
                <li>• Provide constructive guidance to authors</li>
                <li>• Include next steps and deadlines</li>
                <li>• Test templates before regular use</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Manager */}
      <TemplateManager 
        onTemplateSelect={(template) => {
          console.log('Template selected for editing:', template)
          // Template selection is handled within the component
        }}
        readOnly={false}
      />
    </div>
  )
}