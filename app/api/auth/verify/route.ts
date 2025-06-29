import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { token, type, email } = await request.json()

    const supabase = await createClient()

    if (type === 'verify') {
      // Verify email token
      if (!token) {
        return NextResponse.json(
          { error: 'Verification token is required' },
          { status: 400 }
        )
      }

      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup',
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      // Get user profile for redirect
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        return NextResponse.json({
          message: 'Email verified successfully',
          user: data.user,
          session: data.session,
          redirectTo: `/${profile?.role || 'author'}`
        })
      }

      return NextResponse.json({
        message: 'Email verified successfully'
      })
    } else if (type === 'resend') {
      // Resend verification email
      if (!email) {
        return NextResponse.json(
          { error: 'Email is required' },
          { status: 400 }
        )
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({
        message: 'Verification email sent successfully'
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid request type' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Verify API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}