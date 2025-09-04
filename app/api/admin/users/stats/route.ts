import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Validate admin role from Auth0 session
async function validateAdminAuth() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('auth-session')
  
  if (!sessionCookie || !sessionCookie.value) {
    return { error: 'Unauthorized', status: 401 }
  }

  let sessionData
  try {
    sessionData = JSON.parse(sessionCookie.value)
  } catch (err) {
    return { error: 'Invalid session', status: 401 }
  }

  // Check if session is expired
  const now = new Date()
  const expiresAt = new Date(sessionData.expires)
  if (expiresAt < now) {
    return { error: 'Session expired', status: 401 }
  }

  // Verify user role is admin
  if (sessionData.user.role !== 'admin') {
    return { error: 'Access denied - admin role required', status: 403 }
  }

  return { user: sessionData.user }
}

export async function GET(_request: NextRequest) {
  try {
    // Validate admin authentication
    const auth = await validateAdminAuth()
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const supabase = await createClient()
    
    // Get user stats by role
    const [
      { count: totalUsers },
      { count: authors },
      { count: reviewers },
      { count: editors },
      { count: admins }
    ] = await Promise.all([
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('role', 'author'),
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('role', 'reviewer'),
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('role', 'editor'),
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin')
    ])
    
    return NextResponse.json({
      stats: {
        total: totalUsers || 0,
        authors: authors || 0,
        reviewers: reviewers || 0,
        editors: editors || 0,
        admins: admins || 0
      }
    })

  } catch (error) {
    console.error('Admin user stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}