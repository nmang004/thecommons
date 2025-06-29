import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  Settings,
  Shield,
  Database
} from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()
  
  // Get the authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/register?step=profile')
  }

  // Verify user has admin role
  if (profile.role !== 'admin') {
    redirect(`/${profile.role}`)
  }

  // Get platform statistics
  const [
    { count: totalUsers },
    { count: totalManuscripts },
    { count: publishedManuscripts },
    { count: activeReviews }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('manuscripts').select('*', { count: 'exact', head: true }),
    supabase.from('manuscripts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('review_assignments').select('*', { count: 'exact', head: true }).in('status', ['invited', 'accepted'])
  ])

  // Get recent activity data
  const { data: recentManuscripts } = await supabase
    .from('manuscripts')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentUsers } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  // Get role distribution
  const { data: roleStats } = await supabase
    .from('profiles')
    .select('role')

  const roleCounts = roleStats?.reduce((acc: any, profile) => {
    acc[profile.role] = (acc[profile.role] || 0) + 1
    return acc
  }, {}) || {}

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'submitted':
      case 'with_editor':
        return 'bg-blue-100 text-blue-800'
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800'
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-heading font-bold text-gray-900">
                Platform Administration
              </h1>
              <p className="text-gray-600 mt-1">
                Monitor and manage the academic publishing platform
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline">
                <Database className="w-4 h-4 mr-2" />
                Reports
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{totalUsers || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900">{totalManuscripts || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Published Articles</p>
                <p className="text-2xl font-bold text-gray-900">{publishedManuscripts || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{activeReviews || 0}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Submissions */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-heading font-semibold text-gray-900">
                  Recent Submissions
                </h2>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>

              {recentManuscripts && recentManuscripts.length > 0 ? (
                <div className="space-y-4">
                  {recentManuscripts.map((manuscript: any) => (
                    <div
                      key={manuscript.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900 line-clamp-2">
                          {manuscript.title}
                        </h3>
                        <Badge className={getStatusColor(manuscript.status)}>
                          {formatStatus(manuscript.status)}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>
                          By: {manuscript.profiles?.full_name || 'Unknown'}
                        </span>
                        <span>
                          {new Date(manuscript.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">No recent submissions</p>
              )}
            </Card>

            {/* Recent Users */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-heading font-semibold text-gray-900">
                  New Users
                </h2>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>

              {recentUsers && recentUsers.length > 0 ? (
                <div className="space-y-4">
                  {recentUsers.map((user: any) => (
                    <div
                      key={user.id}
                      className="flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{user.full_name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <Badge
                          className={
                            user.role === 'admin'
                              ? 'bg-red-100 text-red-800'
                              : user.role === 'editor'
                              ? 'bg-purple-100 text-purple-800'
                              : user.role === 'reviewer'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }
                        >
                          {user.role}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">No recent users</p>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* System Status */}
            <Card className="p-6">
              <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
                System Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Platform Health</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                    <span className="text-sm font-medium text-green-700">Healthy</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                    <span className="text-sm font-medium text-green-700">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Storage</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2" />
                    <span className="text-sm font-medium text-yellow-700">75% Used</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* User Distribution */}
            <Card className="p-6">
              <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
                User Distribution
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Authors</span>
                  <span className="text-sm font-medium text-gray-900">
                    {roleCounts.author || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Reviewers</span>
                  <span className="text-sm font-medium text-gray-900">
                    {roleCounts.reviewer || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Editors</span>
                  <span className="text-sm font-medium text-gray-900">
                    {roleCounts.editor || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Administrators</span>
                  <span className="text-sm font-medium text-gray-900">
                    {roleCounts.admin || 0}
                  </span>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="w-4 h-4 mr-2" />
                  Security Settings
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Activity className="w-4 h-4 mr-2" />
                  System Logs
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
              </div>
            </Card>

            {/* Alerts */}
            <Card className="p-6">
              <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
                System Alerts
              </h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Storage Warning
                    </p>
                    <p className="text-xs text-gray-600">
                      Storage is 75% full. Consider upgrading.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}