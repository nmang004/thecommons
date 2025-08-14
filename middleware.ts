import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Auth0-integrated middleware for The Commons platform
 * Handles route protection, role-based access, and security headers
 */

// Route patterns that require authentication
const PROTECTED_ROUTES = [
  '/author',
  '/reviewer', 
  '/editor',
  '/admin',
  '/submit',
  '/dashboard'
]

// Route patterns that require specific roles
const ROLE_PROTECTED_ROUTES = {
  '/reviewer': ['reviewer', 'admin'],
  '/editor': ['editor', 'admin'],
  '/admin': ['admin'],
  '/author/submit': ['author', 'reviewer', 'editor', 'admin'],
  '/register-reviewer': [] // Special case - requires auth but no specific role
}


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // Add security headers to all responses
  addSecurityHeaders(response)

  try {
    // Check if this is a protected route
    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
    const isRoleProtectedRoute = Object.keys(ROLE_PROTECTED_ROUTES).some(route => pathname.startsWith(route))
    
    if (isProtectedRoute || isRoleProtectedRoute) {
      // Check for authentication cookie
      const authCookie = request.cookies.get('auth-session')
      
      if (!authCookie || !authCookie.value) {
        // Redirect to login with return URL
        const loginUrl = new URL('/api/auth/login', request.url)
        loginUrl.searchParams.set('returnTo', pathname)
        return NextResponse.redirect(loginUrl)
      }

      try {
        const sessionData = JSON.parse(authCookie.value)
        const now = new Date()
        const expiresAt = new Date(sessionData.expires)
        
        if (now >= expiresAt) {
          // Session expired, redirect to login
          const loginUrl = new URL('/api/auth/login', request.url)
          loginUrl.searchParams.set('returnTo', pathname)
          return NextResponse.redirect(loginUrl)
        }

        // Add user context to headers for downstream use
        response.headers.set('X-User-ID', sessionData.user?.id || '')
        response.headers.set('X-User-Email', sessionData.user?.email || '')
      } catch (error) {
        // Invalid session, redirect to login
        const loginUrl = new URL('/api/auth/login', request.url)
        loginUrl.searchParams.set('returnTo', pathname)
        return NextResponse.redirect(loginUrl)
      }
    }

    return response

  } catch (error) {
    console.error('Middleware error:', error)
    
    // If there's an error with Auth0 session, redirect to login for protected routes
    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
    if (isProtectedRoute) {
      const loginUrl = new URL('/api/auth/login', request.url)
      loginUrl.searchParams.set('returnTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    return response
  }
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // Enhanced CSP for Auth0 integration
  const csp = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' *.auth0.com *.vercel-analytics.com *.google-analytics.com;
    style-src 'self' 'unsafe-inline' fonts.googleapis.com *.auth0.com;
    font-src 'self' fonts.gstatic.com;
    img-src 'self' data: blob: *.supabase.co *.auth0.com images.unsplash.com *.gravatar.com;
    connect-src 'self' *.supabase.co *.auth0.com *.vercel-analytics.com *.google-analytics.com;
    frame-src 'self' *.stripe.com *.auth0.com;
    worker-src 'self' blob:;
    object-src 'none';
    base-uri 'self';
    form-action 'self' *.auth0.com;
  `.replace(/\s+/g, ' ').trim()

  response.headers.set('Content-Security-Policy', csp)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (Auth0 routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt, sitemap.xml, etc.
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|feed.xml|manifest.json).*)',
  ],
}