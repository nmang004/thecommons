// This file is no longer needed as Auth0 handles login automatically
// Keeping it for backward compatibility with any direct POST requests

import { NextRequest, NextResponse } from 'next/server'

// Redirect GET requests to Auth0 login
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const returnTo = searchParams.get('returnTo') || '/'
  const screenHint = searchParams.get('screen_hint')
  
  // Build Auth0 login URL with proper parameters
  const params = new URLSearchParams()
  if (returnTo) {
    params.append('returnTo', returnTo)
  }
  if (screenHint) {
    params.append('screen_hint', screenHint)
  }
  
  const auth0LoginUrl = `/api/auth/auth0/login${params.toString() ? '?' + params.toString() : ''}`
  return NextResponse.redirect(new URL(auth0LoginUrl, request.url))
}

// POST handler is deprecated - Auth0 handles authentication
export async function POST(_request: NextRequest) {
  return NextResponse.redirect(new URL('/api/auth/auth0/login', process.env.AUTH0_BASE_URL!))
}