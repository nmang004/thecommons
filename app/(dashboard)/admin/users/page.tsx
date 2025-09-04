import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UsersManagement } from '@/components/admin/users-management'

export const metadata: Metadata = {
  title: 'User Management - Admin Dashboard',
  description: 'Manage platform users, roles, and permissions.',
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

async function getAllUsers() {
  const supabase = await createClient()
  
  const { data: users, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      role,
      affiliation,
      orcid,
      h_index,
      total_publications,
      created_at,
      updated_at
    `)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching users:', error)
    return []
  }
  
  return users || []
}

async function getUserStats() {
  const supabase = await createClient()
  
  const [
    { count: totalUsers },
    { count: authors },
    { count: reviewers },
    { count: editors },
    { count: admins }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'author'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'reviewer'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'editor'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin')
  ])
  
  return {
    total: totalUsers || 0,
    authors: authors || 0,
    reviewers: reviewers || 0,
    editors: editors || 0,
    admins: admins || 0
  }
}

export default async function AdminUsersPage() {
  await getAuthenticatedUser()
  
  const [users, stats] = await Promise.all([
    getAllUsers(),
    getUserStats()
  ])

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
    </div>
  )
}