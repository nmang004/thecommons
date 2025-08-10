import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ auth0: string }> }
) {
  try {
    const params = await context.params
    const action = params.auth0
    
    // Handle different Auth0 actions
    switch (action) {
      case 'login':
        const { searchParams } = new URL(request.url)
        const returnTo = searchParams.get('returnTo') || '/'
        const screenHint = searchParams.get('screen_hint')
        
        // Build Auth0 login URL
        const baseUrl = process.env.AUTH0_ISSUER_BASE_URL
        const clientId = process.env.AUTH0_CLIENT_ID
        const redirectUri = `${process.env.AUTH0_BASE_URL}/api/auth/callback`
        
        let authUrl = `${baseUrl}/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid profile email`
        
        if (screenHint === 'signup') {
          authUrl += '&screen_hint=signup'
        }
        
        authUrl += `&state=${encodeURIComponent(returnTo)}`
        
        return NextResponse.redirect(authUrl)
        
      case 'logout':
        const logoutUrl = `${process.env.AUTH0_ISSUER_BASE_URL}/v2/logout?client_id=${process.env.AUTH0_CLIENT_ID}&returnTo=${encodeURIComponent(process.env.AUTH0_BASE_URL!)}`
        return NextResponse.redirect(logoutUrl)
        
      case 'callback':
        // Handle callback - this would need proper implementation
        // For now, redirect to home
        return NextResponse.redirect(new URL('/', process.env.AUTH0_BASE_URL!))
        
      default:
        return NextResponse.json({ 
          error: 'Invalid auth action',
          action 
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Auth0 handler error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}