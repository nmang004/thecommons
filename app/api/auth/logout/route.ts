import { NextRequest, NextResponse } from 'next/server'

// Handle GET requests by clearing session and redirecting to Auth0 logout
export async function GET(_request: NextRequest) {
  try {
    // Create response to redirect to Auth0 logout with federated logout
    const returnTo = encodeURIComponent(process.env.AUTH0_BASE_URL!)
    const logoutUrl = `${process.env.AUTH0_ISSUER_BASE_URL}/v2/logout?client_id=${process.env.AUTH0_CLIENT_ID}&returnTo=${returnTo}&federated`
    const response = NextResponse.redirect(logoutUrl)
    
    // Clear the session cookie
    response.cookies.set('auth-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Immediately expire
      expires: new Date(0) // Set to epoch
    })
    
    return response
  } catch (error) {
    console.error('Logout error:', error)
    // Fallback: try Auth0 logout without federated, or redirect to home
    try {
      const returnTo = encodeURIComponent(process.env.AUTH0_BASE_URL || 'http://localhost:3000')
      const fallbackLogoutUrl = `${process.env.AUTH0_ISSUER_BASE_URL}/v2/logout?client_id=${process.env.AUTH0_CLIENT_ID}&returnTo=${returnTo}`
      const response = NextResponse.redirect(fallbackLogoutUrl)
      response.cookies.set('auth-session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        expires: new Date(0)
      })
      return response
    } catch (fallbackError) {
      console.error('Fallback logout error:', fallbackError)
      // Last resort: just redirect to home with cleared cookie
      const response = NextResponse.redirect(process.env.AUTH0_BASE_URL || 'http://localhost:3000')
      response.cookies.set('auth-session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        expires: new Date(0)
      })
      return response
    }
  }
}

// Handle POST requests the same way
export async function POST(request: NextRequest) {
  return GET(request)
}