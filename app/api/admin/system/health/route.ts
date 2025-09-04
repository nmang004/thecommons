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

    // Mock system health data - in production this would perform actual health checks
    const health = {
      database: {
        status: 'operational' as const,
        responseTime: Math.floor(Math.random() * 100) + 20,
        lastChecked: new Date().toISOString(),
        uptime: 99.9
      },
      api: {
        status: 'operational' as const,
        responseTime: Math.floor(Math.random() * 200) + 50,
        lastChecked: new Date().toISOString(),
        uptime: 99.8
      },
      storage: {
        status: 'operational' as const,
        responseTime: Math.floor(Math.random() * 150) + 30,
        lastChecked: new Date().toISOString(),
        uptime: 99.95,
        usage: Math.floor(Math.random() * 30) + 60
      },
      email: {
        status: Math.random() > 0.7 ? 'degraded' : 'operational' as const,
        responseTime: Math.floor(Math.random() * 1000) + 200,
        lastChecked: new Date().toISOString(),
        uptime: 98.5,
        queueSize: Math.floor(Math.random() * 200) + 50
      },
      search: {
        status: 'operational' as const,
        responseTime: Math.floor(Math.random() * 300) + 100,
        lastChecked: new Date().toISOString(),
        uptime: 99.7
      },
      cdn: {
        status: 'operational' as const,
        responseTime: Math.floor(Math.random() * 50) + 10,
        lastChecked: new Date().toISOString(),
        uptime: 99.99
      }
    }

    return NextResponse.json({ health })

  } catch (error) {
    console.error('Admin system health API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}