import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] User role update request received`)

    // Get session from cookie to verify admin access
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('auth-session')
    
    if (!sessionCookie || !sessionCookie.value) {
      console.log(`[${timestamp}] No valid auth-session cookie found`)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let sessionData
    try {
      sessionData = JSON.parse(sessionCookie.value)
    } catch (err) {
      console.error(`[${timestamp}] Failed to parse session cookie:`, err)
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    // Check if user is admin
    const supabase = await createClient()
    const { data: adminProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('auth0_id', sessionData.user.id)
      .single()

    if (!adminProfile || adminProfile.role !== 'admin') {
      console.log(`[${timestamp}] Non-admin user attempting role update:`, sessionData.user.email)
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { userId, newRole } = await request.json()
    
    if (!userId || !newRole) {
      return NextResponse.json({ error: 'Missing userId or newRole' }, { status: 400 })
    }

    const validRoles = ['author', 'editor', 'reviewer', 'admin']
    if (!validRoles.includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    console.log(`[${timestamp}] Admin ${sessionData.user.email} updating user ${userId} role to ${newRole}`)

    // Update user role in Supabase
    const { data: updatedProfile, error } = await supabase
      .from('user_profiles')
      .update({ 
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('auth0_id', userId)
      .select()
      .single()

    if (error) {
      console.error(`[${timestamp}] Failed to update user role:`, error)
      return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 })
    }

    console.log(`[${timestamp}] Successfully updated user role:`, updatedProfile)

    return NextResponse.json({ 
      success: true, 
      profile: updatedProfile,
      message: `User role updated to ${newRole}`
    })

  } catch (error) {
    const timestamp = new Date().toISOString()
    console.error(`[${timestamp}] User role update error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}