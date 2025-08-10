import { NextRequest, NextResponse } from 'next/server'

// Redirect to Auth0 logout
export async function GET(_request: NextRequest) {
  // Redirect to Auth0 logout endpoint
  return NextResponse.redirect(new URL('/api/auth/auth0/logout', process.env.AUTH0_BASE_URL!))
}

// Keep POST for backward compatibility
export async function POST(_request: NextRequest) {
  return NextResponse.redirect(new URL('/api/auth/auth0/logout', process.env.AUTH0_BASE_URL!))
}