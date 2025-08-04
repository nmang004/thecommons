import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/security/rate-limiting'
import { pdfGenerator } from '@/lib/academic/pdf-generator'
import { createClient } from '@/lib/supabase/server'
import type { ManuscriptCoauthor } from '@/types/database'

// Types for the database query results
interface AuthorProfile {
  full_name: string
  affiliation?: string | null
  orcid?: string | null
}

interface ArticleQueryResult {
  id: string
  title: string
  abstract: string
  keywords: string[] | null
  field_of_study: string
  published_at: string | null
  doi: string | null
  author: AuthorProfile | AuthorProfile[]
  coauthors: ManuscriptCoauthor[]
}

async function handler(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const articleId = searchParams.get('articleId')
    const format = searchParams.get('format') || 'a4'
    const includeWatermark = searchParams.get('watermark') === 'true'
    const includeLineNumbers = searchParams.get('lineNumbers') === 'true'
    
    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Get article data
    const { data: article, error } = await supabase
      .from('manuscripts')
      .select(`
        id,
        title,
        abstract,
        keywords,
        field_of_study,
        published_at,
        doi,
        author:profiles!manuscripts_author_id_fkey (
          full_name,
          affiliation,
          orcid
        ),
        coauthors:manuscript_coauthors (
          name,
          affiliation,
          orcid
        )
      `)
      .eq('id', articleId)
      .eq('status', 'published')
      .single() as Promise<{ data: ArticleQueryResult | null; error: any }>

    if (error || !article) {
      return NextResponse.json(
        { error: 'Article not found or not published' },
        { status: 404 }
      )
    }

    // Transform data for PDF generation
    const mainAuthor = Array.isArray(article.author) ? article.author[0] : article.author
    const articleData = {
      id: article.id,
      title: article.title,
      abstract: article.abstract,
      authors: [
        {
          name: mainAuthor?.full_name || 'Unknown Author',
          affiliation: mainAuthor?.affiliation,
          orcid: mainAuthor?.orcid
        },
        ...article.coauthors.map((coauthor) => ({
          name: coauthor.name,
          affiliation: coauthor.affiliation,
          orcid: coauthor.orcid
        }))
      ],
      content: `This is the article content for ${article.title}. In a real implementation, this would be the full article text.`,
      doi: article.doi,
      publishedAt: article.published_at,
      keywords: article.keywords || [],
      fieldOfStudy: article.field_of_study
    }

    // Generate PDF
    const pdfBuffer = await pdfGenerator.generateArticlePDF(articleData, {
      format: format as 'a4' | 'letter',
      includeWatermark,
      includeLineNumbers
    })

    // Return PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${article.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      }
    })

  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

// Apply rate limiting
export const GET = withRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 20 // 20 PDF generations per hour
})(handler)