import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { z } from 'zod'

// Validation schema for reviewer application
const reviewerApplicationSchema = z.object({
  user_id: z.string(),
  expertise_areas: z.array(z.string()).min(3, 'At least 3 expertise areas required'),
  motivation: z.string().min(100, 'Motivation must be at least 100 characters'),
  references: z.array(z.object({
    name: z.string().min(1, 'Reference name is required'),
    email: z.string().email('Valid email required'),
    affiliation: z.string().min(1, 'Affiliation is required'),
    relationship: z.enum(['colleague', 'supervisor', 'mentor', 'collaborator', 'other'])
  })).min(1, 'At least one reference is required'),
  additional_info: z.string().optional(),
  preferred_review_frequency: z.enum(['light', 'moderate', 'heavy']),
  areas_of_interest: z.array(z.string()).optional(),
  language_preferences: z.array(z.string()).optional()
})

/**
 * POST /api/reviewers/apply
 * Submit a reviewer application
 */
export async function POST(request: NextRequest) {
  try {
    // Use the same authentication method as existing API routes
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('auth-session')
    
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    let sessionData
    try {
      sessionData = JSON.parse(sessionCookie.value)
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Check if session is expired
    const now = new Date()
    const expiresAt = new Date(sessionData.expires)
    
    if (now >= expiresAt) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      )
    }

    const userId = sessionData.user.id
    const supabase = await createClient()

    // Check if user already has a pending or active application
    const { data: existingApplication } = await supabase
      .from('reviewer_applications')
      .select('id, status')
      .eq('user_id', userId)
      .in('status', ['pending', 'approved'])
      .single()

    if (existingApplication) {
      const message = existingApplication.status === 'approved' 
        ? 'You are already an approved reviewer'
        : 'You already have a pending reviewer application'
      
      return NextResponse.json(
        { error: message },
        { status: 400 }
      )
    }

    // Parse multipart form data
    const formData = await request.formData()
    const applicationDataString = formData.get('application') as string
    const cvFile = formData.get('cv') as File | null

    if (!applicationDataString) {
      return NextResponse.json(
        { error: 'Application data is required' },
        { status: 400 }
      )
    }

    const applicationData = JSON.parse(applicationDataString)
    
    // Validate application data
    const validation = reviewerApplicationSchema.safeParse(applicationData)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid application data', 
          details: validation.error.issues 
        },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // Validate user ID matches session
    if (validatedData.user_id !== userId) {
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 403 }
      )
    }

    // Get user profile to ensure it exists
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', userId)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    let cvUrl: string | null = null

    // Handle CV file upload if provided
    if (cvFile && cvFile.size > 0) {
      // Validate file type and size
      if (cvFile.type !== 'application/pdf') {
        return NextResponse.json(
          { error: 'CV must be a PDF file' },
          { status: 400 }
        )
      }

      if (cvFile.size > 10 * 1024 * 1024) { // 10MB limit
        return NextResponse.json(
          { error: 'CV file size must be under 10MB' },
          { status: 400 }
        )
      }

      // Upload CV to Supabase storage
      const fileName = `cv_${userId}_${Date.now()}.pdf`
      const { error: uploadError } = await supabase.storage
        .from('reviewer-documents')
        .upload(fileName, cvFile, {
          contentType: 'application/pdf',
          upsert: false
        })

      if (uploadError) {
        console.error('CV upload error:', uploadError)
        return NextResponse.json(
          { error: 'Failed to upload CV' },
          { status: 500 }
        )
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('reviewer-documents')
        .getPublicUrl(fileName)
      
      cvUrl = publicUrl
    }

    // Create application record in database
    const { data: application, error: applicationError } = await supabase
      .from('reviewer_applications')
      .insert({
        user_id: userProfile.id,
        status: 'pending',
        expertise_areas: validatedData.expertise_areas,
        motivation: validatedData.motivation,
        references: validatedData.references,
        additional_info: validatedData.additional_info || '',
        preferred_review_frequency: validatedData.preferred_review_frequency,
        areas_of_interest: validatedData.areas_of_interest || [],
        language_preferences: validatedData.language_preferences || ['English'],
        cv_url: cvUrl,
        applied_at: new Date().toISOString()
      })
      .select()
      .single()

    if (applicationError) {
      console.error('Application creation error:', applicationError)
      return NextResponse.json(
        { error: 'Failed to submit application' },
        { status: 500 }
      )
    }

    // Note: Role management is handled entirely in Supabase
    // Auth0 is only used for authentication, not role/metadata storage

    // Send notification to editors about new application
    try {
      await fetch(`${process.env.NEXTAUTH_URL}/api/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'new_reviewer_application',
          recipient_roles: ['editor', 'admin'],
          data: {
            applicant_name: userProfile.full_name || userProfile.email,
            applicant_email: userProfile.email,
            expertise_areas: validatedData.expertise_areas,
            application_id: application.id
          }
        })
      })
    } catch (notificationError) {
      console.error('Notification error:', notificationError)
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      application_id: application.id,
      status: 'pending'
    })

  } catch (error) {
    console.error('Reviewer application API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/reviewers/apply
 * Check application status for current user
 */
export async function GET(_request: NextRequest) {
  try {
    // Use the same authentication method as existing API routes
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('auth-session')
    
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    let sessionData
    try {
      sessionData = JSON.parse(sessionCookie.value)
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Check if session is expired
    const now = new Date()
    const expiresAt = new Date(sessionData.expires)
    
    if (now >= expiresAt) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      )
    }

    const userId = sessionData.user.id
    const supabase = await createClient()

    // Get user's application status
    const { data: application, error } = await supabase
      .from('reviewer_applications')
      .select(`
        id,
        status,
        applied_at,
        reviewed_at,
        reviewed_by,
        rejection_reason,
        expertise_areas,
        profiles!reviewer_applications_reviewed_by_fkey(full_name)
      `)
      .eq('user_id', userId)
      .order('applied_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Application status check error:', error)
      return NextResponse.json(
        { error: 'Failed to check application status' },
        { status: 500 }
      )
    }

    if (!application) {
      return NextResponse.json({
        status: 'no_application',
        message: 'No application found'
      })
    }

    return NextResponse.json({
      status: application.status,
      application_id: application.id,
      applied_at: application.applied_at,
      reviewed_at: application.reviewed_at,
      reviewed_by: (application.profiles as any)?.full_name,
      rejection_reason: application.rejection_reason,
      expertise_areas: application.expertise_areas
    })

  } catch (error) {
    console.error('Application status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}