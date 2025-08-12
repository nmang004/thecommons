import { NextRequest, NextResponse } from 'next/server'

// Handle GET requests by clearing session and redirecting to Auth0 logout
export async function GET(request: NextRequest) {
  try {
    // Create response to redirect to Auth0 logout with federated logout
    // Add logout completion parameter so frontend knows to refresh state
    const baseUrl = process.env.AUTH0_BASE_URL!
    const returnToUrl = `${baseUrl}?logout=success&t=${Date.now()}`
    const returnTo = encodeURIComponent(returnToUrl)
    const logoutUrl = `${process.env.AUTH0_ISSUER_BASE_URL}/v2/logout?client_id=${process.env.AUTH0_CLIENT_ID}&returnTo=${returnTo}&federated`
    const response = NextResponse.redirect(logoutUrl)
    
    // Clear the session cookie with proper domain handling
    const cookieOptions: any = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Immediately expire
      expires: new Date(0), // Set to epoch
      path: '/'
    }
    
    // Set domain based on request origin
    const origin = request.headers.get('origin') || request.url
    const hostname = new URL(origin).hostname
    if (hostname === 'thecommons.institute' || hostname === 'www.thecommons.institute') {
      cookieOptions.domain = '.thecommons.institute'
      cookieOptions.secure = true // Force secure for production domain
    }
    
    response.cookies.set('auth-session', '', cookieOptions)
    
    return response
  } catch (error) {
    console.error('Logout error:', error)
    // Fallback: try Auth0 logout without federated, or redirect to home
    try {
      const baseUrl = process.env.AUTH0_BASE_URL || 'http://localhost:3000'
      const returnToUrl = `${baseUrl}?logout=success&t=${Date.now()}`
      const returnTo = encodeURIComponent(returnToUrl)
      const fallbackLogoutUrl = `${process.env.AUTH0_ISSUER_BASE_URL}/v2/logout?client_id=${process.env.AUTH0_CLIENT_ID}&returnTo=${returnTo}`
      const response = NextResponse.redirect(fallbackLogoutUrl)
      
      const cookieOptions: any = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        expires: new Date(0),
        path: '/'
      }
      
      const origin = request.headers.get('origin') || request.url
      const hostname = new URL(origin).hostname
      if (hostname === 'thecommons.institute' || hostname === 'www.thecommons.institute') {
        cookieOptions.domain = '.thecommons.institute'
        cookieOptions.secure = true
      }
      
      response.cookies.set('auth-session', '', cookieOptions)
      return response
    } catch (fallbackError) {
      console.error('Fallback logout error:', fallbackError)
      // Last resort: just redirect to home with cleared cookie
      const baseUrl = process.env.AUTH0_BASE_URL || 'http://localhost:3000'
      const returnToUrl = `${baseUrl}?logout=success&t=${Date.now()}`
      const response = NextResponse.redirect(returnToUrl)
      
      const cookieOptions: any = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        expires: new Date(0),
        path: '/'
      }
      
      const origin = request.headers.get('origin') || request.url
      const hostname = new URL(origin).hostname
      if (hostname === 'thecommons.institute' || hostname === 'www.thecommons.institute') {
        cookieOptions.domain = '.thecommons.institute'
        cookieOptions.secure = true
      }
      
      response.cookies.set('auth-session', '', cookieOptions)
      return response
    }
  }
}

// Handle POST requests the same way
export async function POST(request: NextRequest) {
  return GET(request)
}