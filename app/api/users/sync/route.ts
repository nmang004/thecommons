import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface SyncUserRequest {
  auth0Id: string
  email: string
  name: string
  emailVerified: boolean
  picture?: string
  metadata?: any
  appMetadata?: any
}

export async function POST(request: NextRequest) {
  try {
    const body: SyncUserRequest = await request.json()
    const { auth0Id, email, name, emailVerified: _emailVerified, picture, metadata, appMetadata } = body

    if (!auth0Id || !email) {
      return NextResponse.json(
        { error: 'Auth0 ID and email are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if user already exists by auth0_id
    const { data: existingUserByAuth0Id } = await supabase
      .from('profiles')
      .select('id, email, role, auth0_id')
      .eq('auth0_id', auth0Id)
      .single()

    if (existingUserByAuth0Id) {
      // User already synced, just update metadata if needed
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: name,
          avatar_url: picture,
          updated_at: new Date().toISOString()
        })
        .eq('auth0_id', auth0Id)

      if (updateError) {
        console.error('Error updating existing user:', updateError)
        return NextResponse.json(
          { error: 'Failed to update user' },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        success: true, 
        action: 'updated',
        userId: existingUserByAuth0Id.id 
      })
    }

    // Check if user exists by email (migration scenario)
    const { data: existingUserByEmail } = await supabase
      .from('profiles')
      .select('id, email, role, auth0_id')
      .eq('email', email)
      .single()

    if (existingUserByEmail) {
      // This is a migration - update the existing user with auth0_id
      const { error: migrationError } = await supabase
        .from('profiles')
        .update({
          auth0_id: auth0Id,
          full_name: name,
          avatar_url: picture,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUserByEmail.id)

      if (migrationError) {
        console.error('Error migrating user:', migrationError)
        return NextResponse.json(
          { error: 'Failed to migrate user' },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        success: true, 
        action: 'migrated',
        userId: existingUserByEmail.id 
      })
    }

    // Create new user
    const { data: newUser, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: auth0Id, // Use auth0 ID as the primary key for new users
        auth0_id: auth0Id,
        email,
        full_name: name,
        avatar_url: picture,
        role: appMetadata?.role || metadata?.role || 'author', // Default to author
        // Map other metadata fields
        affiliation: metadata?.affiliation,
        orcid: metadata?.orcid,
        bio: metadata?.bio,
        expertise: metadata?.expertise ? (Array.isArray(metadata.expertise) ? metadata.expertise : [metadata.expertise]) : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating new user:', createError)
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      action: 'created',
      userId: newUser.id 
    })

  } catch (error) {
    console.error('User sync error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}