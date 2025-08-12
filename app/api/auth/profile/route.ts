import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(_request: NextRequest) {
  try {
    // Get session from cookie
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('auth-session')
    
    // Debug logging
    console.log('Profile route - Looking for auth-session cookie')
    console.log('All cookies:', cookieStore.getAll())
    console.log('Session cookie found:', !!sessionCookie)
    
    if (!sessionCookie) {
      console.log('No auth-session cookie found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let sessionData
    try {
      sessionData = JSON.parse(sessionCookie.value)
    } catch (err) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    // Check if session is expired
    if (new Date(sessionData.expires) < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    const supabase = await createClient()

    // Get user profile from Supabase
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('auth0_id', sessionData.user.id)
      .single()

    if (error) {
      console.error('Profile fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    return NextResponse.json({
      user: {
        id: sessionData.user.id,
        email: sessionData.user.email,
        name: sessionData.user.name,
        role: sessionData.user.role,
        ...profile
      }
    })

  } catch (error) {
    console.error('Profile endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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