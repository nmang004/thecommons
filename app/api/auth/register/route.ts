import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      password,
      fullName,
      affiliation,
      orcid,
      bio,
      expertise,
      role = 'author',
      linkedinUrl,
      websiteUrl,
    } = body

    // Validate required fields
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Create user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        data: {
          full_name: fullName,
        },
      },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        affiliation: affiliation || null,
        orcid: orcid || null,
        bio: bio || null,
        expertise: expertise && expertise.length > 0 ? expertise : null,
        role,
        linkedin_url: linkedinUrl || null,
        website_url: websiteUrl || null,
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      
      // If profile creation fails, we should clean up the auth user
      // However, this is complex with Supabase, so we'll log the error
      // and let the user try again or contact support
      
      return NextResponse.json(
        { 
          error: 'Failed to create user profile. Please try again or contact support.',
          details: profileError.message 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Account created successfully. Please check your email to verify your account.',
      user: authData.user,
      session: authData.session,
      needsVerification: !authData.session // If no session, email verification is required
    })
  } catch (error) {
    console.error('Registration API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}