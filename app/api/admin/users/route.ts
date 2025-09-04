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
    
    // Fetch all user profiles from the table that Auth0 creates
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        auth0_id,
        name,
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
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    // Transform data to match the expected format
    const transformedUsers = users?.map(user => ({
      id: user.auth0_id,
      full_name: user.name || user.email,
      email: user.email,
      role: user.role,
      affiliation: user.affiliation,
      orcid: user.orcid,
      h_index: user.h_index,
      total_publications: user.total_publications,
      created_at: user.created_at,
      updated_at: user.updated_at
    })) || []

    return NextResponse.json({ users: transformedUsers })

  } catch (error) {
    console.error('Admin users API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}