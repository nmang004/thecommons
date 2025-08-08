import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PDFAnnotation } from '@/types/review'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const reviewId = searchParams.get('reviewId')
    const draftId = searchParams.get('draftId')

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!reviewId && !draftId) {
      return NextResponse.json(
        { error: 'Either reviewId or draftId is required' },
        { status: 400 }
      )
    }

    // Build query based on what ID was provided
    let query = supabase
      .from('review_annotations')
      .select('*')
      .order('page_number', { ascending: true })

    if (reviewId) {
      // Verify user has access to this review
      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .select('reviewer_id')
        .eq('id', reviewId)
        .single()

      if (reviewError || !review || review.reviewer_id !== user.id) {
        return NextResponse.json(
          { error: 'Review not found or not accessible' },
          { status: 403 }
        )
      }

      query = query.eq('review_id', reviewId)
    } else {
      // Verify user has access to this draft
      const { data: draft, error: draftError } = await supabase
        .from('review_drafts')
        .select('reviewer_id')
        .eq('id', draftId)
        .single()

      if (draftError || !draft || draft.reviewer_id !== user.id) {
        return NextResponse.json(
          { error: 'Draft not found or not accessible' },
          { status: 403 }
        )
      }

      query = query.eq('draft_id', draftId)
    }

    const { data: annotations, error: annotationsError } = await query

    if (annotationsError) {
      console.error('Error fetching annotations:', annotationsError)
      return NextResponse.json(
        { error: 'Failed to fetch annotations' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      annotations: annotations || []
    })

  } catch (error) {
    console.error('Error in annotations GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      reviewId, 
      draftId, 
      annotations 
    }: { 
      reviewId?: string
      draftId?: string
      annotations: Omit<PDFAnnotation, 'id' | 'createdAt' | 'updatedAt'>[]
    } = body

    if (!reviewId && !draftId) {
      return NextResponse.json(
        { error: 'Either reviewId or draftId is required' },
        { status: 400 }
      )
    }

    if (!annotations || !Array.isArray(annotations)) {
      return NextResponse.json(
        { error: 'Annotations array is required' },
        { status: 400 }
      )
    }

    // Verify access
    if (reviewId) {
      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .select('reviewer_id')
        .eq('id', reviewId)
        .single()

      if (reviewError || !review || review.reviewer_id !== user.id) {
        return NextResponse.json(
          { error: 'Review not found or not accessible' },
          { status: 403 }
        )
      }
    } else {
      const { data: draft, error: draftError } = await supabase
        .from('review_drafts')
        .select('reviewer_id')
        .eq('id', draftId)
        .single()

      if (draftError || !draft || draft.reviewer_id !== user.id) {
        return NextResponse.json(
          { error: 'Draft not found or not accessible' },
          { status: 403 }
        )
      }
    }

    // First, delete existing annotations for this review/draft
    const deleteQuery = reviewId 
      ? supabase.from('review_annotations').delete().eq('review_id', reviewId)
      : supabase.from('review_annotations').delete().eq('draft_id', draftId)

    await deleteQuery

    // Insert new annotations if any
    if (annotations.length > 0) {
      const annotationsToInsert = annotations.map(annotation => ({
        review_id: reviewId || null,
        draft_id: draftId || null,
        annotation_type: annotation.type,
        page_number: annotation.pageNumber,
        position: annotation.position,
        highlighted_text: annotation.highlightedText,
        comment_text: annotation.commentText,
        category: annotation.category,
        is_resolved: annotation.isResolved || false,
        annotation_data: {
          type: annotation.type,
          pageNumber: annotation.pageNumber,
          position: annotation.position,
          highlightedText: annotation.highlightedText,
          commentText: annotation.commentText,
          category: annotation.category,
          isResolved: annotation.isResolved || false
        }
      }))

      const { data: insertedAnnotations, error: insertError } = await supabase
        .from('review_annotations')
        .insert(annotationsToInsert)
        .select()

      if (insertError) {
        console.error('Error inserting annotations:', insertError)
        return NextResponse.json(
          { error: 'Failed to save annotations' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Annotations saved successfully',
        annotations: insertedAnnotations
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Annotations cleared successfully',
      annotations: []
    })

  } catch (error) {
    console.error('Error in annotations POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      annotationId, 
      updates 
    }: { 
      annotationId: string
      updates: Partial<PDFAnnotation>
    } = body

    if (!annotationId) {
      return NextResponse.json(
        { error: 'Annotation ID is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this annotation
    const { data: annotation, error: annotationError } = await supabase
      .from('review_annotations')
      .select(`
        id,
        review_id,
        draft_id,
        reviews!inner(reviewer_id),
        review_drafts!inner(reviewer_id)
      `)
      .eq('id', annotationId)
      .single()

    if (annotationError || !annotation) {
      return NextResponse.json(
        { error: 'Annotation not found' },
        { status: 404 }
      )
    }

    // Check access through review or draft
    const hasAccess = (annotation.reviews && (annotation.reviews as any).reviewer_id === user.id) ||
                     (annotation.review_drafts && (annotation.review_drafts as any).reviewer_id === user.id)

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Update annotation
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (updates.commentText !== undefined) {
      updateData.comment_text = updates.commentText
    }
    if (updates.category !== undefined) {
      updateData.category = updates.category
    }
    if (updates.isResolved !== undefined) {
      updateData.is_resolved = updates.isResolved
    }
    if (updates.position !== undefined) {
      updateData.position = updates.position
    }
    if (updates.highlightedText !== undefined) {
      updateData.highlighted_text = updates.highlightedText
    }

    const { data: updatedAnnotation, error: updateError } = await supabase
      .from('review_annotations')
      .update(updateData)
      .eq('id', annotationId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating annotation:', updateError)
      return NextResponse.json(
        { error: 'Failed to update annotation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Annotation updated successfully',
      annotation: updatedAnnotation
    })

  } catch (error) {
    console.error('Error in annotations PUT:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const annotationId = searchParams.get('id')
    
    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!annotationId) {
      return NextResponse.json(
        { error: 'Annotation ID is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this annotation (similar to PUT)
    const { data: annotation, error: annotationError } = await supabase
      .from('review_annotations')
      .select(`
        id,
        review_id,
        draft_id,
        reviews!inner(reviewer_id),
        review_drafts!inner(reviewer_id)
      `)
      .eq('id', annotationId)
      .single()

    if (annotationError || !annotation) {
      return NextResponse.json(
        { error: 'Annotation not found' },
        { status: 404 }
      )
    }

    // Check access through review or draft
    const hasAccess = (annotation.reviews && (annotation.reviews as any).reviewer_id === user.id) ||
                     (annotation.review_drafts && (annotation.review_drafts as any).reviewer_id === user.id)

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Delete annotation
    const { error: deleteError } = await supabase
      .from('review_annotations')
      .delete()
      .eq('id', annotationId)

    if (deleteError) {
      console.error('Error deleting annotation:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete annotation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Annotation deleted successfully'
    })

  } catch (error) {
    console.error('Error in annotations DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}