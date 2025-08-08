import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['editor', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { manuscriptIds, format } = await request.json()

    if (!manuscriptIds || !Array.isArray(manuscriptIds) || manuscriptIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid manuscript IDs' },
        { status: 400 }
      )
    }

    if (!format || !['csv', 'excel'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid export format' },
        { status: 400 }
      )
    }

    // Get manuscript data for export
    const { data: manuscripts, error: fetchError } = await supabase
      .from('manuscripts')
      .select(`
        id,
        title,
        abstract,
        field_of_study,
        subfield,
        status,
        submitted_at,
        created_at,
        updated_at,
        submission_number,
        profiles!author_id(full_name, email, affiliation),
        editor:profiles!editor_id(full_name, email),
        review_assignments(status, due_date)
      `)
      .in('id', manuscriptIds)

    if (fetchError) {
      console.error('Error fetching manuscripts:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch manuscript data' },
        { status: 500 }
      )
    }

    // Prepare data for export
    const exportData = manuscripts.map(manuscript => ({
      'Submission ID': manuscript.submission_number || manuscript.id.slice(-8),
      'Title': manuscript.title,
      'Author': Array.isArray(manuscript.profiles) ? manuscript.profiles[0]?.full_name : (manuscript.profiles as any)?.full_name || 'Unknown',
      'Author Email': Array.isArray(manuscript.profiles) ? manuscript.profiles[0]?.email : (manuscript.profiles as any)?.email || '',
      'Author Affiliation': Array.isArray(manuscript.profiles) ? manuscript.profiles[0]?.affiliation : (manuscript.profiles as any)?.affiliation || '',
      'Editor': Array.isArray(manuscript.editor) ? manuscript.editor[0]?.full_name : (manuscript.editor as any)?.full_name || 'Unassigned',
      'Editor Email': Array.isArray(manuscript.editor) ? manuscript.editor[0]?.email : (manuscript.editor as any)?.email || '',
      'Field of Study': manuscript.field_of_study,
      'Subfield': manuscript.subfield || '',
      'Status': manuscript.status.split('_').map((word: string) => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      'Submitted Date': manuscript.submitted_at ? 
        new Date(manuscript.submitted_at).toLocaleDateString() : 
        new Date(manuscript.created_at).toLocaleDateString(),
      'Last Updated': new Date(manuscript.updated_at).toLocaleDateString(),
      'Reviewers Assigned': manuscript.review_assignments?.length || 0,
      'Reviews Completed': manuscript.review_assignments?.filter(ra => ra.status === 'completed').length || 0,
      'Abstract': manuscript.abstract
    }))

    if (format === 'csv') {
      // Generate CSV
      const headers = Object.keys(exportData[0] || {})
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row]
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          }).join(',')
        )
      ].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="manuscripts-export.csv"'
        }
      })
    } else {
      // For Excel format, we'd need a library like xlsx
      // For now, return CSV with Excel MIME type
      const headers = Object.keys(exportData[0] || {})
      const csvContent = [
        headers.join('\t'), // Use tabs for better Excel compatibility
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row]
            // Escape tabs and quotes
            if (typeof value === 'string' && (value.includes('\t') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          }).join('\t')
        )
      ].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'application/vnd.ms-excel',
          'Content-Disposition': 'attachment; filename="manuscripts-export.xls"'
        }
      })
    }

  } catch (error) {
    console.error('Bulk export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}