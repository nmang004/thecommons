import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // Add security headers to all responses
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
    img-src 'self' data: blob: *.supabase.co *.auth0.com images.unsplash.com;
    connect-src 'self' *.supabase.co *.auth0.com *.vercel-analytics.com *.google-analytics.com;
    frame-src 'self' *.stripe.com *.auth0.com;
  `.replace(/\s+/g, ' ').trim()

  response.headers.set('Content-Security-Policy', csp)

  // For now, we'll handle Auth0 authentication at the component level
  // rather than in middleware to avoid edge runtime issues
  return response
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