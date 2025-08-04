import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is editor or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['editor', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // For now, return empty array since we don't have a templates table
    // In a full implementation, you would:
    // 1. Create an editorial_templates table
    // 2. Query for user-specific and organization templates
    
    /*
    const { data: templates, error } = await supabase
      .from('editorial_templates')
      .select('*')
      .or(`created_by.eq.${user.id},is_public.eq.true`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching templates:', error)
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      )
    }
    */

    return NextResponse.json({
      templates: [], // Would return actual templates from database
      message: 'Custom templates feature requires database schema extension'
    })

  } catch (error) {
    console.error('Templates API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is editor or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (!profile || !['editor', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { name, decision, template, category } = await request.json()

    if (!name || !decision || !template || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate decision type
    const validDecisions = ['accepted', 'revisions_requested', 'rejected']
    if (!validDecisions.includes(decision)) {
      return NextResponse.json(
        { error: 'Invalid decision type' },
        { status: 400 }
      )
    }

    // Validate category
    const validCategories = ['accept', 'revisions', 'reject']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      )
    }

    // For now, just return success since we don't have the table
    // In a full implementation:
    /*
    const { data: newTemplate, error } = await supabase
      .from('editorial_templates')
      .insert({
        name,
        decision,
        template,
        category,
        is_public: isPublic,
        created_by: user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating template:', error)
      return NextResponse.json(
        { error: 'Failed to create template' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      template: newTemplate,
      message: 'Template created successfully'
    })
    */

    return NextResponse.json({
      template: {
        id: `custom_${Date.now()}`,
        name,
        decision,
        template,
        category,
        created_by: user.id,
        created_at: new Date().toISOString()
      },
      message: 'Template creation simulated (requires database schema)'
    })

  } catch (error) {
    console.error('Create template error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}