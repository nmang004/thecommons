'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Download,
  Hash,
  RefreshCw
} from 'lucide-react'
import {
  OrcidConnectionCard,
  OrcidProfileBadge
} from '@/components/orcid/orcid-profile-badge'
import Link from 'next/link'

// Mock data - replace with actual API calls
const mockManuscripts = [
  {
    id: '1',
    title: 'Quantum Computing Applications in Climate Modeling',
    status: 'under_review',
    created_at: '2024-01-15',
    views: 45,
    downloads: 12
  },
  {
    id: '2',
    title: 'Machine Learning Approaches to Drug Discovery',
    status: 'published',
    created_at: '2024-01-10',
    views: 234,
    downloads: 67
  },
  {
    id: '3',
    title: 'Sustainable Energy Solutions for Urban Areas',
    status: 'draft',
    created_at: '2024-01-20',
    views: 0,
    downloads: 0
  }
]

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  under_review: 'bg-yellow-100 text-yellow-800',
  published: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

const statusIcons = {
  draft: FileText,
  under_review: Clock,
  published: CheckCircle,
  rejected: AlertCircle,
}

function AuthorDashboardContent() {
  const { user } = useAuth()
  const [manuscripts] = useState(mockManuscripts)
  const [stats] = useState({
    total_manuscripts: 3,
    published: 1,
    under_review: 1,
    total_views: 279,
    total_downloads: 79
  })

  // Mock ORCID status for dashboard
  const mockOrcidStatus = {
    isConnected: true,
    orcidId: '0000-0002-1825-0097',
    lastSyncAt: new Date('2024-09-12'),
    needsReauth: false,
    hasValidToken: true
  }

  // Mock handlers
  const handleOrcidSync = async () => {
    console.log('Mock ORCID sync from dashboard')
    alert('ORCID data synced successfully! (Mock)')
  }

  const handleOrcidConnect = () => {
    console.log('Mock ORCID connect from dashboard')
    alert('ORCID connection successful! (Mock)')
  }

  // In a real app, you would fetch manuscripts using the user ID from Auth0
  useEffect(() => {
    if (user) {
      // TODO: Replace with actual API call
      // fetchManuscripts(user.id)
      // setManuscripts(newManuscripts)
      // setStats(newStats)
    }
  }, [user])

  if (!user) return null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
          Welcome back, {user.name.split(' ')[0]}!
        </h1>
        <p className="text-muted-foreground">
          Manage your manuscripts and track your publishing journey
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="card-academic p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Manuscripts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_manuscripts}</p>
              </div>
              <FileText className="w-8 h-8 text-primary" />
            </div>
          </Card>

          <Card className="card-academic p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Published</p>
                <p className="text-2xl font-bold text-green-600">{stats.published}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </Card>

          <Card className="card-academic p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Views</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total_views}</p>
              </div>
              <Eye className="w-8 h-8 text-blue-600" />
            </div>
          </Card>

          <Card className="card-academic p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Downloads</p>
                <p className="text-2xl font-bold text-purple-600">{stats.total_downloads}</p>
              </div>
              <Download className="w-8 h-8 text-purple-600" />
            </div>
          </Card>
        </div>

      {/* ORCID Status Widget */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">ORCID Integration</h3>
          <Hash className="w-5 h-5 text-gray-500" />
        </div>

        {mockOrcidStatus.isConnected ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <OrcidProfileBadge
                orcidId={mockOrcidStatus.orcidId}
                isVerified={mockOrcidStatus.isConnected}
                variant="detailed"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleOrcidSync}
                className="flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync
              </Button>
            </div>

            <div className="text-sm text-gray-600">
              Last synced: {mockOrcidStatus.lastSyncAt.toLocaleDateString()}
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <p className="text-lg font-semibold text-green-600">5</p>
                <p className="text-xs text-gray-600">Publications Synced</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-blue-600">3</p>
                <p className="text-xs text-gray-600">Profile Fields Updated</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-purple-600">12</p>
                <p className="text-xs text-gray-600">Citations Linked</p>
              </div>
            </div>
          </div>
        ) : (
          <OrcidConnectionCard
            onConnect={handleOrcidConnect}
          />
        )}
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Button asChild className="btn-academic">
          <Link href="/author/submit">
            <Plus className="w-4 h-4 mr-2" />
            New Submission
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/articles">
            Browse Articles
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/profile">
            Update Profile
          </Link>
        </Button>
      </div>

      {/* Manuscripts Table */}
      <Card className="card-academic">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-heading font-semibold text-gray-900">
                Your Manuscripts
              </h2>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Title</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Submitted</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Views</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {manuscripts.map((manuscript) => {
                  const StatusIcon = statusIcons[manuscript.status as keyof typeof statusIcons]
                  return (
                    <tr key={manuscript.id} className="border-t hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="max-w-xs">
                          <h3 className="font-medium text-gray-900 mb-1">
                            {manuscript.title}
                          </h3>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge 
                          className={`inline-flex items-center ${statusColors[manuscript.status as keyof typeof statusColors]}`}
                          variant="secondary"
                        >
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {manuscript.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {new Date(manuscript.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {manuscript.views}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/author/submissions/${manuscript.id}`}>
                            View
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
      </Card>

      {/* Recent Activity */}
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
                  <p className="font-medium text-gray-900">Manuscript Published</p>
                  <p className="text-sm text-gray-600">
                    "Machine Learning Approaches to Drug Discovery" was published
                  </p>
                  <p className="text-xs text-gray-500 mt-1">2 days ago</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Review in Progress</p>
                  <p className="text-sm text-gray-600">
                    "Quantum Computing Applications in Climate Modeling" is under review
                  </p>
                  <p className="text-xs text-gray-500 mt-1">1 week ago</p>
                </div>
              </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default function AuthorDashboard() {
  return <AuthorDashboardContent />
}