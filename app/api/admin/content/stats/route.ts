import { NextRequest, NextResponse } from 'next/server'
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

    // For now, return mock stats until we have real manuscripts table
    // In production, this would query the manuscripts table by status
    const mockStats = {
      total: 3,
      published: 1,
      underReview: 1,
      pending: 1,
      drafts: 0,
      rejected: 0
    }

    return NextResponse.json({ stats: mockStats })

  } catch (error) {
    console.error('Admin content stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}