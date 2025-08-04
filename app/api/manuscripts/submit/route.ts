import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity, ValidationSchemas, logSecurityEvent } from '@/lib/security/api-security'
import { RATE_LIMITS } from '@/lib/security/rate-limiting'
import { invalidateManuscriptCache } from '@/lib/redis/cache'
import type { Profile } from '@/types/database'

// Types for submission data
interface AuthorData {
  name: string
  email: string
  affiliation?: string
  orcid?: string
  isCorresponding: boolean
  contributionStatement?: string
}

interface SubmissionData {
  title: string
  abstract: string
  keywords: string[]
  fieldOfStudy: string
  subfield?: string
  coverLetter?: string
  suggestedReviewers?: any[] // This could be typed more specifically
  excludedReviewers?: any[] // This could be typed more specifically
  fundingStatement?: string
  conflictOfInterest?: string
  dataAvailability?: string
  authors: AuthorData[]
}

interface AuthenticatedUser {
  id: string
  profile: Profile
}


async function handler(request: NextRequest, data: SubmissionData, user: AuthenticatedUser): Promise<NextResponse> {
  
  try {
    const supabase = await createClient()
    const profile = user.profile

    // Find corresponding author  
    const correspondingAuthor = data.authors.find((author) => author.isCorresponding)
    if (!correspondingAuthor) {
      return NextResponse.json(
        { error: 'A corresponding author must be designated' },
        { status: 400 }
      )
    }

    // Generate submission number
    const submissionNumber = `TC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    // Create manuscript record
    const { data: manuscript, error: manuscriptError } = await supabase
      .from('manuscripts')
      .insert({
        title: data.title,
        abstract: data.abstract,
        keywords: data.keywords,
        field_of_study: data.fieldOfStudy,
        subfield: data.subfield,
        author_id: user.id,
        status: 'draft', // Will be updated to 'submitted' after payment
        submission_number: submissionNumber,
        cover_letter: data.coverLetter,
        suggested_reviewers: data.suggestedReviewers || [],
        excluded_reviewers: data.excludedReviewers || [],
        funding_statement: data.fundingStatement,
        conflict_of_interest: data.conflictOfInterest,
        data_availability: data.dataAvailability,
      })
      .select()
      .single()

    if (manuscriptError) {
      console.error('Manuscript creation error:', manuscriptError)
      return NextResponse.json(
        { error: 'Failed to create manuscript record' },
        { status: 500 }
      )
    }

    // Add co-authors
    if (data.authors.length > 0) {
      const coauthorsData = data.authors.map((author, index: number) => ({
        manuscript_id: manuscript.id,
        name: author.name,
        email: author.email,
        affiliation: author.affiliation,
        orcid: author.orcid,
        author_order: index + 1,
        is_corresponding: author.isCorresponding,
        contribution_statement: author.contributionStatement,
      }))

      const { error: coauthorsError } = await supabase
        .from('manuscript_coauthors')
        .insert(coauthorsData)

      if (coauthorsError) {
        console.error('Co-authors creation error:', coauthorsError)
        // Continue despite error, as this is not critical for the submission
      }
    }

    // Set corresponding author ID
    if (correspondingAuthor) {
      // Check if corresponding author is the submitter
      const isSubmitterCorresponding = correspondingAuthor.email === profile.email
      
      if (isSubmitterCorresponding) {
        // Update manuscript with submitter as corresponding author
        await supabase
          .from('manuscripts')
          .update({ corresponding_author_id: user.id })
          .eq('id', manuscript.id)
      } else {
        // If corresponding author is different, we'll need to handle this later
        // For now, keep it as null and handle in the editorial system
      }
    }

    // Log the submission activity
    await supabase
      .from('activity_logs')
      .insert({
        manuscript_id: manuscript.id,
        user_id: user.id,
        action: 'manuscript_draft_created',
        details: {
          submission_number: submissionNumber,
          title: data.title,
          field_of_study: data.fieldOfStudy,
        },
      })

    return NextResponse.json({
      success: true,
      manuscript: {
        id: manuscript.id,
        submission_number: submissionNumber,
        title: manuscript.title,
        status: manuscript.status,
      },
      message: 'Manuscript draft created successfully. Please upload files and proceed to payment.',
    })

  } catch (error) {
    console.error('Submission error:', error)
    
    // Log security event for failed submissions
    logSecurityEvent('validation_failure', request, {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: user.id
    })
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid submission data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    // Invalidate manuscript cache for the user
    await invalidateManuscriptCache(undefined, user.id)
  }
}

// Apply comprehensive security
export const POST = withSecurity({
  rateLimit: RATE_LIMITS.MANUSCRIPT_SUBMIT,
  auth: true,
  roles: ['author', 'admin'],
  validation: ValidationSchemas.manuscriptSubmission
})(handler)