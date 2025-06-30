import { createClient } from '@/lib/supabase/server'
import { cache, CACHE_TTL } from '@/lib/redis/cache'
import { NextRequest } from 'next/server'

export async function GET(_request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thecommons.org'
    
    // Try to get cached sitemap
    const cachedSitemap = await cache.get<string>('sitemap:xml')
    if (cachedSitemap) {
      return new Response(cachedSitemap, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
          'X-Cache': 'HIT',
        },
      })
    }

    const supabase = await createClient()

    // Get all published articles with optimized query
    const { data: articles, error } = await supabase
      .from('manuscripts')
      .select('id, updated_at, published_at, view_count, field_of_study')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(10000) // Reasonable limit for sitemap

    if (error) {
      throw error
    }

    // Get all unique fields of study
    const { data: fieldsData, error: fieldsError } = await supabase
      .from('manuscripts')
      .select('field_of_study')
      .eq('status', 'published')

    if (fieldsError) {
      throw fieldsError
    }

    const uniqueFields = [...new Set(fieldsData?.map(item => item.field_of_study) || [])]

    const staticPages = [
      { url: '', priority: '1.0', changefreq: 'daily' },
      { url: '/articles', priority: '0.9', changefreq: 'daily' },
      { url: '/search', priority: '0.8', changefreq: 'weekly' },
      { url: '/fields', priority: '0.8', changefreq: 'weekly' },
      { url: '/about', priority: '0.7', changefreq: 'monthly' },
      { url: '/guidelines', priority: '0.7', changefreq: 'monthly' },
      { url: '/guidelines/authors', priority: '0.6', changefreq: 'monthly' },
      { url: '/guidelines/reviewers', priority: '0.6', changefreq: 'monthly' },
    ]

    // Calculate priority based on view count for articles
    const getArticlePriority = (viewCount: number): string => {
      if (viewCount > 1000) return '0.9'
      if (viewCount > 500) return '0.8'
      if (viewCount > 100) return '0.7'
      return '0.6'
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${staticPages.map(page => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('')}
  ${articles?.map(article => `
  <url>
    <loc>${baseUrl}/articles/${article.id}</loc>
    <lastmod>${new Date(article.updated_at || article.published_at || article.created_at).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${getArticlePriority(article.view_count || 0)}</priority>
  </url>`).join('') || ''}
  ${uniqueFields.map(field => `
  <url>
    <loc>${baseUrl}/articles?field=${encodeURIComponent(field)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
</urlset>`

    // Cache the sitemap for 1 hour
    await cache.set('sitemap:xml', sitemap, { ttl: CACHE_TTL.LONG })

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Cache': 'MISS',
      },
    })
  } catch (error) {
    console.error('Sitemap generation error:', error)
    return new Response('Error generating sitemap', { status: 500 })
  }
}