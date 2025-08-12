import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] Profile route called`)
    
    // Get session from cookie
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('auth-session')
    
    // Debug logging
    console.log(`[${timestamp}] Looking for auth-session cookie`)
    console.log(`[${timestamp}] All cookies:`, cookieStore.getAll().map(c => `${c.name}=${c.value?.substring(0, 20)}...`))
    console.log(`[${timestamp}] Session cookie found:`, !!sessionCookie)
    console.log(`[${timestamp}] Request headers:`, Object.fromEntries(request.headers.entries()))
    
    if (!sessionCookie || !sessionCookie.value) {
      console.log(`[${timestamp}] No valid auth-session cookie found`)
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      )
    }

    let sessionData
    try {
      sessionData = JSON.parse(sessionCookie.value)
      console.log(`[${timestamp}] Session data parsed successfully`)
      console.log(`[${timestamp}] Session expires:`, sessionData.expires)
    } catch (err) {
      console.error(`[${timestamp}] Failed to parse session cookie:`, err)
      return NextResponse.json(
        { error: 'Invalid session' }, 
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      )
    }

    // Check if session is expired
    const now = new Date()
    const expiresAt = new Date(sessionData.expires)
    if (expiresAt < now) {
      console.log(`[${timestamp}] Session expired. Expires: ${expiresAt.toISOString()}, Now: ${now.toISOString()}`)
      return NextResponse.json(
        { error: 'Session expired' }, 
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      )
    }

    const supabase = await createClient()

    // Get user profile from Supabase
    console.log(`[${timestamp}] Fetching profile for Auth0 ID:`, sessionData.user.id)
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('auth0_id', sessionData.user.id)
      .single()

    if (error) {
      console.error(`[${timestamp}] Profile fetch error:`, error)
      return NextResponse.json(
        { error: 'Failed to fetch profile' }, 
        { 
          status: 500,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      )
    }

    console.log(`[${timestamp}] Successfully fetched profile for:`, sessionData.user.email)
    console.log(`[${timestamp}] Session role:`, sessionData.user.role)
    console.log(`[${timestamp}] Supabase role:`, profile.role)
    
    // Use Supabase as source of truth for role (not session data)
    const currentRole = profile.role || sessionData.user.role || 'author'
    
    // If role in Supabase differs from session, update the session cookie
    const needsSessionUpdate = currentRole !== sessionData.user.role
    
    if (needsSessionUpdate) {
      console.log(`[${timestamp}] Role mismatch detected. Updating session from ${sessionData.user.role} to ${currentRole}`)
      
      // Update session data with new role
      const updatedSessionData = {
        ...sessionData,
        user: {
          ...sessionData.user,
          role: currentRole
        }
      }
      
      // Create response with updated session cookie
      const response = NextResponse.json(
        {
          user: {
            id: sessionData.user.id,
            email: sessionData.user.email,
            name: sessionData.user.name,
            role: currentRole, // Use Supabase role
            ...profile
          }
        },
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      )
      
      // Update session cookie with new role
      const cookieOptions: any = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/'
      }
      
      // Set domain based on request origin
      const origin = request.headers.get('origin') || request.url
      const hostname = new URL(origin).hostname
      if (hostname === 'thecommons.institute' || hostname === 'www.thecommons.institute') {
        cookieOptions.domain = '.thecommons.institute'
        cookieOptions.secure = true
      }
      
      response.cookies.set('auth-session', JSON.stringify(updatedSessionData), cookieOptions)
      console.log(`[${timestamp}] Updated session cookie with new role: ${currentRole}`)
      
      return response
    }
    
    // No role update needed, return as normal
    return NextResponse.json(
      {
        user: {
          id: sessionData.user.id,
          email: sessionData.user.email,
          name: sessionData.user.name,
          role: currentRole, // Use Supabase role
          ...profile
        }
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )

  } catch (error) {
    const timestamp = new Date().toISOString()
    console.error(`[${timestamp}] Profile endpoint error:`, error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Update user profile
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update(body)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Profile update error:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ profile })

  } catch (error) {
    console.error('Profile update endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}