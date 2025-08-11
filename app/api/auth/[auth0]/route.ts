import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
        // Handle Auth0 callback with role-based redirect
        const { searchParams: callbackParams, origin } = new URL(request.url)
        const code = callbackParams.get('code')
        const state = callbackParams.get('state')
        const error = callbackParams.get('error')
        
        if (error) {
          console.error('Auth0 callback error:', error)
          return NextResponse.redirect(`${origin}/?error=auth_error`)
        }
        
        if (!code) {
          console.error('No authorization code provided')
          return NextResponse.redirect(`${origin}/?error=no_code`)
        }
        
        try {
          // Exchange code for tokens
          const tokenResponse = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/oauth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              client_id: process.env.AUTH0_CLIENT_ID!,
              client_secret: process.env.AUTH0_CLIENT_SECRET!,
              code,
              redirect_uri: `${process.env.AUTH0_BASE_URL}/api/auth/callback`,
            }),
          })
          
          if (!tokenResponse.ok) {
            throw new Error('Failed to exchange code for tokens')
          }
          
          const tokens = await tokenResponse.json()
          
          // Get user info
          const userResponse = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/userinfo`, {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
          })
          
          if (!userResponse.ok) {
            throw new Error('Failed to fetch user info')
          }
          
          const user = await userResponse.json()
          
          // Sync user with Supabase and get role
          const supabase = await createClient()
          
          // Check if user exists in profiles
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('auth0_id', user.sub)
            .single()
          
          let role = 'author'
          
          if (profile) {
            role = profile.role
          } else {
            // Create user profile if doesn't exist
            const { error: insertError } = await supabase
              .from('user_profiles')
              .insert({
                auth0_id: user.sub,
                email: user.email,
                name: user.name,
                role: 'author',
                created_at: new Date().toISOString()
              })
            
            if (insertError) {
              console.error('Failed to create user profile:', insertError)
            }
          }
          
          // Create session cookie (simplified approach)
          const sessionData = {
            user: {
              id: user.sub,
              email: user.email,
              name: user.name,
              role,
              accessToken: tokens.access_token
            },
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          }
          
          // Redirect to role-based dashboard
          const redirectUrl = state && state !== 'undefined' ? decodeURIComponent(state) : `/${role}`
          const response = NextResponse.redirect(`${origin}${redirectUrl}`)
          
          // Set session cookie
          response.cookies.set('auth-session', JSON.stringify(sessionData), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 // 24 hours
          })
          
          return response
          
        } catch (tokenError) {
          console.error('Token exchange error:', tokenError)
          return NextResponse.redirect(`${origin}/?error=token_exchange_failed`)
        }
        
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