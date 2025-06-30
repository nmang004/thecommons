import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl

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

    // Update Supabase session
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

        // Allow authenticated users to access their dashboards
        return supabaseResponse
      }
    }

    return supabaseResponse
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, allow the request to proceed
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}