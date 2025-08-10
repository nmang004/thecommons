import { NextRequest, NextResponse } from 'next/server'

// Handle GET requests by redirecting directly to Auth0 logout
export async function GET(_request: NextRequest) {
  const logoutUrl = `${process.env.AUTH0_ISSUER_BASE_URL}/v2/logout?client_id=${process.env.AUTH0_CLIENT_ID}&returnTo=${encodeURIComponent(process.env.AUTH0_BASE_URL!)}`
  return NextResponse.redirect(logoutUrl)
}

// Handle POST requests the same way
export async function POST(request: NextRequest) {
  return GET(request)
}