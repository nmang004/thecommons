'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
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
  Shield
} from 'lucide-react'
import Link from 'next/link'

function AdminDashboardContent() {
  const { user } = useAuth()
  const [stats] = useState({
    total_users: 1247,
    total_manuscripts: 89,
    pending_reviews: 23,
    system_health: 98,
    active_sessions: 156,
    revenue_this_month: 12450
  })

  // In a real app, you would fetch admin data using the user ID from Auth0
  useEffect(() => {
    if (user) {
      // TODO: Replace with actual API calls
      // fetchAdminStats()
      // setStats(newStats)
    }
  }, [user])

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            System overview and platform management
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="card-academic p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_users.toLocaleString()}</p>
                <p className="text-sm text-green-600">+12% this month</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </Card>

          <Card className="card-academic p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Manuscripts</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total_manuscripts}</p>
                <p className="text-sm text-green-600">+8% this month</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </Card>

          <Card className="card-academic p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Reviews</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending_reviews}</p>
                <p className="text-sm text-red-600">+3 since yesterday</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </Card>

          <Card className="card-academic p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">System Health</p>
                <p className="text-2xl font-bold text-green-600">{stats.system_health}%</p>
                <p className="text-sm text-green-600">All systems operational</p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </Card>

          <Card className="card-academic p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Sessions</p>
                <p className="text-2xl font-bold text-purple-600">{stats.active_sessions}</p>
                <p className="text-sm text-gray-500">Current online users</p>
              </div>
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
          </Card>

          <Card className="card-academic p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Revenue (Month)</p>
                <p className="text-2xl font-bold text-green-600">${stats.revenue_this_month.toLocaleString()}</p>
                <p className="text-sm text-green-600">+15% vs last month</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button asChild className="btn-academic">
            <Link href="/admin/users">
              <Users className="w-4 h-4 mr-2" />
              Manage Users
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/analytics">
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/settings">
              <Settings className="w-4 h-4 mr-2" />
              System Settings
            </Link>
          </Button>
        </div>

        {/* System Status & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="card-academic">
            <div className="p-6 border-b">
              <h2 className="text-xl font-heading font-semibold text-gray-900">
                System Status
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-gray-700">Database</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800" variant="secondary">
                    Operational
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-gray-700">API Services</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800" variant="secondary">
                    Operational
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                    <span className="text-gray-700">Email Service</span>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800" variant="secondary">
                    Degraded
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-gray-700">Storage</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800" variant="secondary">
                    Operational
                  </Badge>
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
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">New User Registered</p>
                    <p className="text-sm text-gray-600">
                      Dr. Jane Smith joined as a reviewer
                    </p>
                    <p className="text-xs text-gray-500 mt-1">5 minutes ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Manuscript Published</p>
                    <p className="text-sm text-gray-600">
                      "AI Ethics in Healthcare" went live
                    </p>
                    <p className="text-xs text-gray-500 mt-1">1 hour ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">System Alert</p>
                    <p className="text-sm text-gray-600">
                      Email service experiencing delays
                    </p>
                    <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* User Management Quick View */}
        <Card className="card-academic">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-heading font-semibold text-gray-900">
                User Overview
              </h2>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/users">
                  View All Users
                </Link>
              </Button>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">567</div>
                <div className="text-sm text-gray-600">Authors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">234</div>
                <div className="text-sm text-gray-600">Reviewers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">45</div>
                <div className="text-sm text-gray-600">Editors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">8</div>
                <div className="text-sm text-gray-600">Admins</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminDashboardContent />
    </ProtectedRoute>
  )
}