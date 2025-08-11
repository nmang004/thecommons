import { NextRequest, NextResponse } from 'next/server'

// Redirect to the actual Auth0 callback handler
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  
  // Forward all query parameters to the Auth0 callback handler
  const forwardUrl = `${origin}/api/auth/auth0/callback?${searchParams.toString()}`
  
  return NextResponse.redirect(forwardUrl)
}

export async function POST(request: NextRequest) {
  return GET(request)
}