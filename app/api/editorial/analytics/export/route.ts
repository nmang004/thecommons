import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AnalyticsExportResponse } from '@/types/editorial'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
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

    const exportRequest = await request.json()
    const {
      reportType = 'editorial',
      dateRangeStart,
      dateRangeEnd,
      filters = {},
      format = 'csv',
      includeCharts = false
    } = exportRequest

    // Validate required parameters
    if (!dateRangeStart || !dateRangeEnd) {
      return NextResponse.json(
        { error: 'Date range (dateRangeStart and dateRangeEnd) is required' },
        { status: 400 }
      )
    }

    const validFormats = ['csv', 'json', 'pdf']
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: `Invalid format. Must be one of: ${validFormats.join(', ')}` },
        { status: 400 }
      )
    }

    const startDate = new Date(dateRangeStart)
    const endDate = new Date(dateRangeEnd)

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      )
    }

    // Generate unique report ID
    const reportId = uuidv4()
    const fileName = `editorial_${reportType}_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.${format}`

    // Fetch report data based on type
    let reportData: any = {}

    try {
      switch (reportType) {
        case 'editorial':
          reportData = await generateEditorialExport(supabase, startDate, endDate, filters)
          break
        case 'reviewer':
          reportData = await generateReviewerExport(supabase, startDate, endDate, filters)
          break
        case 'manuscript':
          reportData = await generateManuscriptExport(supabase, startDate, endDate, filters)
          break
        case 'custom':
          reportData = await generateComprehensiveExport(supabase, startDate, endDate, filters)
          break
        default:
          return NextResponse.json(
            { error: 'Invalid report type' },
            { status: 400 }
          )
      }
    } catch (error) {
      console.error('Error generating report data:', error)
      return NextResponse.json(
        { error: 'Failed to generate report data' },
        { status: 500 }
      )
    }

    // Convert data to requested format
    let exportContent: string
    let contentType: string
    let sizeBytes: number

    try {
      switch (format) {
        case 'csv':
          exportContent = convertToCSV(reportData, reportType)
          contentType = 'text/csv'
          break
        case 'json':
          exportContent = JSON.stringify(reportData, null, 2)
          contentType = 'application/json'
          break
        case 'pdf':
          // For PDF generation, you would typically use a library like puppeteer or PDFKit
          // This is a simplified implementation
          exportContent = await generatePDF(reportData, reportType, {
            dateRange: { start: startDate, end: endDate },
            generatedBy: profile.full_name,
            includeCharts
          })
          contentType = 'application/pdf'
          break
        default:
          throw new Error('Unsupported format')
      }
      
      sizeBytes = Buffer.byteLength(exportContent, 'utf8')
    } catch (error) {
      console.error('Error converting data to format:', error)
      return NextResponse.json(
        { error: 'Failed to convert data to requested format' },
        { status: 500 }
      )
    }

    // Store the export file (in a real implementation, you'd use cloud storage)
    // For now, we'll create a record and return a mock URL
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // Expire after 24 hours

    const exportRecord = {
      id: reportId,
      user_id: user.id,
      report_type: reportType,
      format,
      file_name: fileName,
      file_size: sizeBytes,
      date_range_start: startDate.toISOString(),
      date_range_end: endDate.toISOString(),
      filters: JSON.stringify(filters),
      expires_at: expiresAt.toISOString(),
      status: 'completed',
      download_count: 0
    }

    // Insert export record
    const { error: insertError } = await supabase
      .from('analytics_exports')
      .insert(exportRecord)

    if (insertError) {
      console.error('Error saving export record:', insertError)
      return NextResponse.json(
        { error: 'Failed to save export record' },
        { status: 500 }
      )
    }

    // In a real implementation, you would upload the file to cloud storage
    // and return the actual download URL. For demo purposes, we'll simulate this.
    const downloadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/editorial/analytics/export/${reportId}/download`

    // Log the export activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'analytics_export',
        details: {
          report_id: reportId,
          report_type: reportType,
          format,
          date_range: { start: startDate, end: endDate },
          filters
        }
      })

    const exportResponse: AnalyticsExportResponse = {
      reportId,
      downloadUrl,
      expiresAt,
      format,
      sizeBytes
    }

    return NextResponse.json({
      success: true,
      message: 'Report generated successfully',
      export: exportResponse,
      metadata: {
        fileName,
        reportType,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        recordCount: getRecordCount(reportData, reportType),
        generatedAt: new Date().toISOString()
      }
    })

    // For immediate download, you could return the file directly:
    // return new Response(exportContent, {
    //   headers: {
    //     'Content-Type': contentType,
    //     'Content-Disposition': `attachment; filename="${fileName}"`,
    //     'Content-Length': sizeBytes.toString()
    //   }
    // })

  } catch (error) {
    console.error('Editorial analytics export API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve available exports for the user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get user's export history
    const { data: exports, error, count } = await supabase
      .from('analytics_exports')
      .select(`
        id,
        report_type,
        format,
        file_name,
        file_size,
        date_range_start,
        date_range_end,
        created_at,
        expires_at,
        status,
        download_count
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching exports:', error)
      return NextResponse.json(
        { error: 'Failed to fetch exports' },
        { status: 500 }
      )
    }

    // Check which exports are still valid (not expired)
    const now = new Date()
    const exportsWithStatus = exports?.map(exp => ({
      ...exp,
      is_expired: new Date(exp.expires_at) < now,
      download_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/editorial/analytics/export/${exp.id}/download`
    })) || []

    return NextResponse.json({
      exports: exportsWithStatus,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('Get analytics exports API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export data generation functions
async function generateEditorialExport(supabase: any, startDate: Date, endDate: Date, filters: any) {
  const { data: manuscripts } = await supabase
    .from('manuscripts')
    .select(`
      id,
      title,
      status,
      submitted_at,
      field_of_study,
      priority,
      profiles!author_id(full_name, email, affiliation),
      editor:profiles!editor_id(full_name, email),
      editorial_assignments(
        assigned_at,
        status,
        priority,
        workload_score,
        completed_at
      ),
      editorial_decisions(
        decision,
        created_at,
        submitted_at
      )
    `)
    .gte('submitted_at', startDate.toISOString())
    .lte('submitted_at', endDate.toISOString())

  return {
    summary: {
      reportType: 'Editorial Performance Report',
      dateRange: { start: startDate, end: endDate },
      totalRecords: manuscripts?.length || 0
    },
    data: manuscripts || []
  }
}

async function generateReviewerExport(supabase: any, startDate: Date, endDate: Date, filters: any) {
  const { data: reviews } = await supabase
    .from('review_assignments')
    .select(`
      id,
      status,
      invited_at,
      due_date,
      completed_at,
      profiles!reviewer_id(full_name, email, affiliation),
      manuscripts(title, field_of_study, status),
      review_reports(rating, recommendation, quality_score, comments)
    `)
    .gte('invited_at', startDate.toISOString())
    .lte('invited_at', endDate.toISOString())

  return {
    summary: {
      reportType: 'Reviewer Performance Report',
      dateRange: { start: startDate, end: endDate },
      totalRecords: reviews?.length || 0
    },
    data: reviews || []
  }
}

async function generateManuscriptExport(supabase: any, startDate: Date, endDate: Date, filters: any) {
  const { data: manuscripts } = await supabase
    .from('manuscripts')
    .select(`
      id,
      title,
      abstract,
      status,
      submitted_at,
      accepted_at,
      field_of_study,
      subfield,
      keywords,
      priority,
      profiles!author_id(full_name, email, affiliation),
      manuscript_coauthors(name, email, affiliation),
      review_assignments(status, invited_at, completed_at),
      editorial_decisions(decision, created_at)
    `)
    .gte('submitted_at', startDate.toISOString())
    .lte('submitted_at', endDate.toISOString())

  return {
    summary: {
      reportType: 'Manuscript Flow Report',
      dateRange: { start: startDate, end: endDate },
      totalRecords: manuscripts?.length || 0
    },
    data: manuscripts || []
  }
}

async function generateComprehensiveExport(supabase: any, startDate: Date, endDate: Date, filters: any) {
  const [editorial, reviewer, manuscript] = await Promise.all([
    generateEditorialExport(supabase, startDate, endDate, filters),
    generateReviewerExport(supabase, startDate, endDate, filters),
    generateManuscriptExport(supabase, startDate, endDate, filters)
  ])

  return {
    summary: {
      reportType: 'Comprehensive Analytics Report',
      dateRange: { start: startDate, end: endDate },
      sections: ['editorial', 'reviewer', 'manuscript']
    },
    editorial,
    reviewer,
    manuscript
  }
}

// Format conversion functions
function convertToCSV(data: any, reportType: string): string {
  if (!data.data || !Array.isArray(data.data)) {
    return 'No data available'
  }

  const records = data.data
  if (records.length === 0) {
    return 'No records found'
  }

  // Flatten nested objects for CSV
  const flattenedRecords = records.map(record => flattenObject(record))
  
  // Get all unique headers
  const headers = [...new Set(flattenedRecords.flatMap(Object.keys))]
  
  // Create CSV content
  const csvRows = [
    headers.join(','), // Header row
    ...flattenedRecords.map(record => 
      headers.map(header => {
        const value = record[header] || ''
        // Escape quotes and wrap in quotes if contains comma or quote
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ]

  return csvRows.join('\n')
}

function flattenObject(obj: any, prefix = ''): any {
  const flattened: any = {}
  
  for (const key in obj) {
    if (obj[key] === null || obj[key] === undefined) {
      flattened[prefix + key] = ''
    } else if (Array.isArray(obj[key])) {
      // Convert arrays to comma-separated strings
      flattened[prefix + key] = obj[key].map((item: any) => 
        typeof item === 'object' ? JSON.stringify(item) : item
      ).join('; ')
    } else if (typeof obj[key] === 'object') {
      // Recursively flatten nested objects
      Object.assign(flattened, flattenObject(obj[key], prefix + key + '_'))
    } else {
      flattened[prefix + key] = obj[key]
    }
  }
  
  return flattened
}

async function generatePDF(data: any, reportType: string, metadata: any): Promise<string> {
  // This would typically use a PDF generation library like PDFKit or Puppeteer
  // For demo purposes, return a simple text representation
  const content = {
    title: `${reportType.toUpperCase()} ANALYTICS REPORT`,
    generatedAt: new Date().toISOString(),
    generatedBy: metadata.generatedBy,
    dateRange: `${metadata.dateRange.start.toDateString()} - ${metadata.dateRange.end.toDateString()}`,
    summary: data.summary || {},
    recordCount: data.data?.length || 0,
    note: 'This is a simplified PDF representation. In production, use a proper PDF generation library.'
  }

  return JSON.stringify(content, null, 2)
}

function getRecordCount(data: any, reportType: string): number {
  if (reportType === 'custom' || reportType === 'comprehensive') {
    return (data.editorial?.data?.length || 0) + 
           (data.reviewer?.data?.length || 0) + 
           (data.manuscript?.data?.length || 0)
  }
  
  return data.data?.length || 0
}