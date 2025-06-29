import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: manuscriptId } = await params
    const supabase = await createClient()
    
    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify user owns the manuscript
    const { data: manuscript, error: manuscriptError } = await supabase
      .from('manuscripts')
      .select('*')
      .eq('id', manuscriptId)
      .eq('author_id', user.id)
      .single()

    if (manuscriptError || !manuscript) {
      return NextResponse.json(
        { error: 'Manuscript not found or access denied' },
        { status: 404 }
      )
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileType = formData.get('type') as string

    if (!file || !fileType) {
      return NextResponse.json(
        { error: 'File and type are required' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'manuscript_main',
      'manuscript_anonymized',
      'figure',
      'supplementary',
      'cover_letter'
    ]

    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      )
    }

    // Create file path
    const fileName = `${manuscriptId}/${fileType}/${Date.now()}-${file.name}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('manuscripts')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('File upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Save file record to database
    const { data: fileRecord, error: fileError } = await supabase
      .from('manuscript_files')
      .insert({
        manuscript_id: manuscriptId,
        file_path: uploadData.path,
        file_name: file.name,
        file_size: file.size,
        file_type: fileType,
        mime_type: file.type,
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (fileError) {
      console.error('File record creation error:', fileError)
      
      // Clean up uploaded file
      await supabase.storage
        .from('manuscripts')
        .remove([uploadData.path])

      return NextResponse.json(
        { error: 'Failed to save file record' },
        { status: 500 }
      )
    }

    // Log the file upload activity
    await supabase
      .from('activity_logs')
      .insert({
        manuscript_id: manuscriptId,
        user_id: user.id,
        action: 'file_uploaded',
        details: {
          file_name: file.name,
          file_type: fileType,
          file_size: file.size,
        },
      })

    return NextResponse.json({
      success: true,
      file: fileRecord,
      message: 'File uploaded successfully',
    })

  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: manuscriptId } = await params
    const supabase = await createClient()
    
    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify user owns the manuscript
    const { data: manuscript, error: manuscriptError } = await supabase
      .from('manuscripts')
      .select('*')
      .eq('id', manuscriptId)
      .eq('author_id', user.id)
      .single()

    if (manuscriptError || !manuscript) {
      return NextResponse.json(
        { error: 'Manuscript not found or access denied' },
        { status: 404 }
      )
    }

    // Get files for this manuscript
    const { data: files, error: filesError } = await supabase
      .from('manuscript_files')
      .select('*')
      .eq('manuscript_id', manuscriptId)
      .order('uploaded_at', { ascending: false })

    if (filesError) {
      console.error('Files fetch error:', filesError)
      return NextResponse.json(
        { error: 'Failed to fetch files' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      files: files || [],
    })

  } catch (error) {
    console.error('Files fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}