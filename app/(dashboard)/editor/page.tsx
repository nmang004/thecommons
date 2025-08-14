'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Users,
  TrendingUp,
  Filter,
  Eye,
  UserPlus,
  Mail,
  Gavel,
  Settings
} from 'lucide-react'
import Link from 'next/link'

// Mock data - replace with actual API calls
const mockSubmissions = [
  {
    id: '1',
    title: 'Quantum Computing Applications in Climate Modeling',
    author: 'Dr. Sarah Johnson',
    submitted_at: '2024-01-15',
    status: 'under_review',
    reviewers: 2,
    priority: 'high'
  },
  {
    id: '2',
    title: 'Machine Learning Approaches to Drug Discovery',
    author: 'Prof. Michael Chen',
    submitted_at: '2024-01-10',
    status: 'revision_requested',
    reviewers: 3,
    priority: 'medium'
  },
  {
    id: '3',
    title: 'Sustainable Energy Solutions for Urban Areas',
    author: 'Dr. Emily Rodriguez',
    submitted_at: '2024-01-20',
    status: 'awaiting_reviewers',
    reviewers: 0,
    priority: 'high'
  }
]

const statusColors = {
  under_review: 'bg-yellow-100 text-yellow-800',
  revision_requested: 'bg-blue-100 text-blue-800',
  awaiting_reviewers: 'bg-red-100 text-red-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-gray-100 text-gray-800',
}

const priorityColors = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
}

function EditorDashboardContent() {
  const { user } = useAuth()
  const [submissions] = useState(mockSubmissions)
  const [stats] = useState({
    total_submissions: 12,
    under_review: 5,
    awaiting_reviewers: 3,
    completed_this_month: 8,
    active_reviewers: 24
  })

  // In a real app, you would fetch data using the user ID from Auth0
  useEffect(() => {
    if (user) {
      // TODO: Replace with actual API calls
      // fetchSubmissions()
      // fetchStats()
      // setSubmissions(newSubmissions)
      // setStats(newStats)
    }
  }, [user])

  if (!user) return null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
          Editorial Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage manuscripts and oversee the peer review process
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="card-academic p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_submissions}</p>
              </div>
              <FileText className="w-8 h-8 text-primary" />
            </div>
          </Card>

          <Card className="card-academic p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Under Review</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.under_review}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </Card>

          <Card className="card-academic p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Awaiting Reviewers</p>
                <p className="text-2xl font-bold text-red-600">{stats.awaiting_reviewers}</p>
              </div>
              <UserPlus className="w-8 h-8 text-red-600" />
            </div>
          </Card>

          <Card className="card-academic p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed This Month</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed_this_month}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </Card>

          <Card className="card-academic p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Reviewers</p>
                <p className="text-2xl font-bold text-blue-600">{stats.active_reviewers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </Card>
        </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Button asChild className="btn-academic">
          <Link href="/editor/manuscripts">
            <FileText className="w-4 h-4 mr-2" />
            View All Manuscripts
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/editor/decisions">
            <Gavel className="w-4 h-4 mr-2" />
            Editorial Decisions
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/editor/reviewers">
            <Users className="w-4 h-4 mr-2" />
            Manage Reviewers
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/editor/analytics">
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/editor/templates">
            <Settings className="w-4 h-4 mr-2" />
            Templates
          </Link>
        </Button>
      </div>

      {/* Recent Submissions */}
      <Card className="card-academic">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-heading font-semibold text-gray-900">
                Recent Submissions
              </h2>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/editor/manuscripts">
                    View All
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Manuscript</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Author</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Reviewers</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Priority</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id} className="border-t hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="max-w-xs">
                        <h3 className="font-medium text-gray-900 mb-1">
                          {submission.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Submitted {new Date(submission.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {submission.author}
                    </td>
                    <td className="py-4 px-6">
                      <Badge 
                        className={statusColors[submission.status as keyof typeof statusColors]}
                        variant="secondary"
                      >
                        {submission.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1 text-gray-400" />
                        {submission.reviewers} assigned
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge 
                        className={priorityColors[submission.priority as keyof typeof priorityColors]}
                        variant="secondary"
                      >
                        {submission.priority}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/editor/manuscripts/${submission.id}`}>
                            <Eye className="w-4 h-4 mr-1" />
                            Review
                          </Link>
                        </Button>
                        {(submission.status === 'under_review' || submission.status === 'revision_requested') && (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/editor/manuscripts/${submission.id}/decision`}>
                              <Gavel className="w-4 h-4 mr-1" />
                              Decide
                            </Link>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

      {/* Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="card-academic">
            <div className="p-6 border-b">
              <h2 className="text-xl font-heading font-semibold text-gray-900">
                Action Items
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">3 manuscripts awaiting reviewers</p>
                    <p className="text-sm text-gray-600">Assign reviewers to continue the review process</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      <UserPlus className="w-4 h-4 mr-1" />
                      Assign Reviewers
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">2 reviews overdue</p>
                    <p className="text-sm text-gray-600">Follow up with reviewers about pending reviews</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Mail className="w-4 h-4 mr-1" />
                      Send Reminders
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="card-academic">
            <div className="p-6 border-b">
              <h2 className="text-xl font-heading font-semibold text-gray-900">
                Recent Activity
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Review Completed</p>
                    <p className="text-sm text-gray-600">
                      Dr. Smith completed review for "AI in Healthcare"
                    </p>
                    <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">New Submission</p>
                    <p className="text-sm text-gray-600">
                      "Blockchain Applications in Supply Chain" submitted
                    </p>
                    <p className="text-xs text-gray-500 mt-1">1 day ago</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
      </div>
    </div>
  )
}

export default function EditorDashboard() {
  return <EditorDashboardContent />
}