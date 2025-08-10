import { NextRequest, NextResponse } from 'next/server'

// Handle GET requests by redirecting directly to Auth0 login
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const returnTo = searchParams.get('returnTo') || '/'
  const screenHint = searchParams.get('screen_hint')
  
  // Build Auth0 login URL directly
  const baseUrl = process.env.AUTH0_ISSUER_BASE_URL
  const clientId = process.env.AUTH0_CLIENT_ID
  const redirectUri = `${process.env.AUTH0_BASE_URL}/api/auth/callback`
  
  let authUrl = `${baseUrl}/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid profile email`
  
  if (screenHint === 'signup') {
    authUrl += '&screen_hint=signup'
  }
  
  authUrl += `&state=${encodeURIComponent(returnTo)}`
  
  return NextResponse.redirect(authUrl)
}

// Handle POST requests the same way
export async function POST(request: NextRequest) {
  return GET(request)
}