'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { UsersManagement } from '@/components/admin/users-management'
import { Card } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface User {
  id: string
  full_name: string
  email: string
  role: 'author' | 'reviewer' | 'editor' | 'admin'
  affiliation?: string
  orcid?: string
  h_index?: number
  total_publications?: number
  created_at: string
  updated_at: string
}

interface UserStats {
  total: number
  authors: number
  reviewers: number
  editors: number
  admins: number
}

export default function AdminUsersPage() {
  const { user, isLoading, isAdmin } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    authors: 0,
    reviewers: 0,
    editors: 0,
    admins: 0
  })
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && user && isAdmin) {
      fetchUsersData()
    }
  }, [user, isLoading, isAdmin])

  const fetchUsersData = async () => {
    try {
      setDataLoading(true)
      setError(null)

      // Fetch users and stats in parallel
      const [usersResponse, statsResponse] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/users/stats')
      ])

      if (!usersResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to fetch user data')
      }

      const usersData = await usersResponse.json()
      const statsData = await statsResponse.json()

      setUsers(usersData.users || [])
      setStats(statsData.stats || {
        total: 0,
        authors: 0,
        reviewers: 0,
        editors: 0,
        admins: 0
      })
    } catch (err) {
      console.error('Error fetching users data:', err)
      setError('Failed to load user data')
    } finally {
      setDataLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card className="card-academic p-8 text-center">
          <h2 className="text-xl font-heading font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to access the admin panel.</p>
        </Card>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Card className="card-academic p-8 text-center">
          <h2 className="text-xl font-heading font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="card-academic p-8 text-center">
          <h2 className="text-xl font-heading font-semibold mb-2 text-red-600">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button 
            onClick={fetchUsersData}
            className="btn-academic"
          >
            Try Again
          </button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Page Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-4xl font-heading font-bold text-foreground mb-2">
          User Management
        </h1>
        <p className="text-lg text-muted-foreground">
          Manage platform users, roles, and permissions across The Commons community
        </p>
      </div>

      {dataLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* User Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="card-academic p-6 text-center">
              <div className="text-3xl font-heading font-bold text-primary mb-2">
                {stats.total.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
            <div className="card-academic p-6 text-center">
              <div className="text-3xl font-heading font-bold text-blue-600 mb-2">
                {stats.authors.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Authors</div>
            </div>
            <div className="card-academic p-6 text-center">
              <div className="text-3xl font-heading font-bold text-green-600 mb-2">
                {stats.reviewers.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Reviewers</div>
            </div>
            <div className="card-academic p-6 text-center">
              <div className="text-3xl font-heading font-bold text-purple-600 mb-2">
                {stats.editors.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Editors</div>
            </div>
            <div className="card-academic p-6 text-center">
              <div className="text-3xl font-heading font-bold text-red-600 mb-2">
                {stats.admins.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Admins</div>
            </div>
          </div>

          {/* Users Management Component */}
          <UsersManagement initialUsers={users} />
        </>
      )}
    </div>
  )
}