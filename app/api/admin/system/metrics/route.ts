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

    // Mock system metrics - in production this would collect actual system metrics
    const metrics = {
      server: {
        cpu: Math.floor(Math.random() * 60) + 20,
        memory: Math.floor(Math.random() * 50) + 40,
        disk: Math.floor(Math.random() * 40) + 20,
        network: Math.floor(Math.random() * 30) + 10
      },
      database: {
        connections: Math.floor(Math.random() * 30) + 20,
        maxConnections: 100,
        queriesPerSecond: Math.floor(Math.random() * 200) + 100,
        slowQueries: Math.floor(Math.random() * 5)
      },
      performance: {
        avgResponseTime: Math.floor(Math.random() * 300) + 150,
        requestsPerMinute: Math.floor(Math.random() * 2000) + 1000,
        errorRate: Math.random() * 0.05,
        availability: 99.8 + Math.random() * 0.19
      }
    }

    return NextResponse.json({ metrics })

  } catch (error) {
    console.error('Admin system metrics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}