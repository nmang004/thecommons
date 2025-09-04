import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Validate admin role from Auth0 session
async function validateAdminAuth() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('auth-session')
  
  if (!sessionCookie || !sessionCookie.value) {
    return { error: 'Unauthorized', status: 401 }
  }

  let sessionData
  try {
    sessionData = JSON.parse(sessionCookie.value)
  } catch (err) {
    return { error: 'Invalid session', status: 401 }
  }

  // Check if session is expired
  const now = new Date()
  const expiresAt = new Date(sessionData.expires)
  if (expiresAt < now) {
    return { error: 'Session expired', status: 401 }
  }

  // Verify user role is admin
  if (sessionData.user.role !== 'admin') {
    return { error: 'Access denied - admin role required', status: 403 }
  }

  return { user: sessionData.user }
}

export async function GET(_request: NextRequest) {
  try {
    // Validate admin authentication
    const auth = await validateAdminAuth()
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    // For now, return mock data until we have real manuscripts table
    // In production, this would fetch from the manuscripts table
    const mockManuscripts = [
      {
        id: '1',
        title: 'Advances in Quantum Computing Applications for Academic Research',
        abstract: 'This paper explores the latest developments in quantum computing and their potential applications in academic research.',
        keywords: ['quantum computing', 'research', 'academia'],
        field_of_study: 'Computer Science',
        subfield: 'Quantum Computing',
        author_id: 'auth0|user1',
        corresponding_author_id: 'auth0|user1',
        editor_id: 'auth0|editor1',
        status: 'under_review' as const,
        submission_number: 'QC-2024-001',
        submitted_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        accepted_at: null,
        published_at: null,
        doi: null,
        view_count: 45,
        download_count: 12,
        citation_count: 0,
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        author: {
          full_name: 'Dr. Alice Johnson',
          email: 'alice.johnson@university.edu',
          affiliation: 'MIT Computer Science'
        },
        editor: {
          full_name: 'Prof. Bob Smith',
          email: 'bob.smith@journal.edu',
          affiliation: 'Stanford University'
        },
        corresponding_author: {
          full_name: 'Dr. Alice Johnson',
          email: 'alice.johnson@university.edu',
          affiliation: 'MIT Computer Science'
        }
      },
      {
        id: '2',
        title: 'Machine Learning Approaches to Climate Change Modeling',
        abstract: 'An analysis of how machine learning techniques can improve climate change prediction models.',
        keywords: ['machine learning', 'climate change', 'modeling'],
        field_of_study: 'Environmental Science',
        subfield: 'Climate Modeling',
        author_id: 'auth0|user2',
        corresponding_author_id: 'auth0|user2',
        editor_id: null,
        status: 'submitted' as const,
        submission_number: 'ENV-2024-002',
        submitted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        accepted_at: null,
        published_at: null,
        doi: null,
        view_count: 23,
        download_count: 8,
        citation_count: 0,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        author: {
          full_name: 'Dr. Carol Davis',
          email: 'carol.davis@research.org',
          affiliation: 'Climate Research Institute'
        },
        editor: undefined,
        corresponding_author: {
          full_name: 'Dr. Carol Davis',
          email: 'carol.davis@research.org',
          affiliation: 'Climate Research Institute'
        }
      },
      {
        id: '3',
        title: 'Bioethics in Gene Editing: A Comprehensive Review',
        abstract: 'This review examines the ethical implications of modern gene editing technologies.',
        keywords: ['bioethics', 'gene editing', 'CRISPR'],
        field_of_study: 'Biology',
        subfield: 'Bioethics',
        author_id: 'auth0|user3',
        corresponding_author_id: 'auth0|user3',
        editor_id: 'auth0|editor2',
        status: 'published' as const,
        submission_number: 'BIO-2024-003',
        submitted_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        accepted_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        doi: '10.1234/commons.bio.2024.003',
        view_count: 156,
        download_count: 89,
        citation_count: 12,
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        author: {
          full_name: 'Dr. David Wilson',
          email: 'david.wilson@medschool.edu',
          affiliation: 'Harvard Medical School'
        },
        editor: {
          full_name: 'Prof. Emily Chen',
          email: 'emily.chen@biojournal.edu',
          affiliation: 'Johns Hopkins University'
        },
        corresponding_author: {
          full_name: 'Dr. David Wilson',
          email: 'david.wilson@medschool.edu',
          affiliation: 'Harvard Medical School'
        }
      }
    ]

    return NextResponse.json({ manuscripts: mockManuscripts })

  } catch (error) {
    console.error('Admin manuscripts API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}