import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { rateLimitMiddleware, RATE_LIMITS, checkSecurityBlock } from '@/lib/security/rate-limiting'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Apply security blocks first
  const securityBlock = await checkSecurityBlock(request)
  if (securityBlock) {
    return securityBlock
  }

  // Apply rate limiting based on route type
  let rateLimitConfig: typeof RATE_LIMITS[keyof typeof RATE_LIMITS] = RATE_LIMITS.PUBLIC_PAGES
  
  if (pathname.startsWith('/api/')) {
    if (pathname.includes('/auth/')) {
      rateLimitConfig = RATE_LIMITS.API_AUTH
    } else if (pathname.includes('/manuscripts/') && request.method === 'POST') {
      rateLimitConfig = RATE_LIMITS.MANUSCRIPT_SUBMIT
    } else if (pathname.includes('/reviews/') && request.method === 'POST') {
      rateLimitConfig = RATE_LIMITS.REVIEW_SUBMIT
    } else if (pathname.includes('/search')) {
      rateLimitConfig = RATE_LIMITS.API_SEARCH
    } else if (pathname.includes('/upload')) {
      rateLimitConfig = RATE_LIMITS.API_UPLOAD
    } else {
      rateLimitConfig = RATE_LIMITS.API_GENERAL
    }
  } else if (pathname.match(/^\/(author|editor|reviewer|admin)/)) {
    rateLimitConfig = RATE_LIMITS.DASHBOARD
  }

  // Apply rate limiting
  const rateLimitResponse = await rateLimitMiddleware(request, rateLimitConfig)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  // Add security headers to all responses
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // CSP for enhanced security
  const csp = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel-analytics.com *.google-analytics.com;
    style-src 'self' 'unsafe-inline' fonts.googleapis.com;
    font-src 'self' fonts.gstatic.com;
    img-src 'self' data: blob: *.supabase.co images.unsplash.com;
    connect-src 'self' *.supabase.co *.vercel-analytics.com *.google-analytics.com;
    frame-src 'self' *.stripe.com;
  `.replace(/\s+/g, ' ').trim()
  
  response.headers.set('Content-Security-Policy', csp)

  const { supabaseResponse, user } = await updateSession(request)

  // Define protected route patterns
  const protectedRoutes = {
    author: /^\/author(\/.*)?$/,
    editor: /^\/editor(\/.*)?$/,
    reviewer: /^\/reviewer(\/.*)?$/,
    admin: /^\/admin(\/.*)?$/,
  }

  // Define auth routes (redirect authenticated users)
  const authRoutes = ['/login', '/register', '/verify-email']

  // If user is authenticated and trying to access auth pages, redirect to appropriate dashboard
  if (user && authRoutes.some(route => pathname.startsWith(route))) {
    // Default redirect to author dashboard
    // Note: We can't fetch from API routes in edge middleware
    const redirectUrl = new URL('/author', request.url)
    return Response.redirect(redirectUrl)
  }

  // Check if accessing protected routes
  for (const [, pattern] of Object.entries(protectedRoutes)) {
    if (pattern.test(pathname)) {
      if (!user) {
        // Redirect to login with return URL
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('redirect', pathname)
        return Response.redirect(redirectUrl)
      }

      // For now, allow authenticated users to access their dashboards
      // Role-based access control will be handled within the dashboard pages
      // This is because we can't fetch from API routes in edge middleware
      return supabaseResponse
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}