import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const field = searchParams.get('field')
  
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('manuscripts')
      .select(`
        id,
        title,
        abstract,
        keywords,
        field_of_study,
        published_at,
        author:profiles!manuscripts_author_id_fkey (
          full_name,
          affiliation
        )
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50)

    if (field) {
      query = query.eq('field_of_study', field)
    }

    const { data: articles, error } = await query

    if (error) {
      throw error
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thecommons.org'
    const feedTitle = field ? `The Commons - ${field}` : 'The Commons - Latest Articles'
    const feedDescription = field 
      ? `Latest open access articles in ${field} from The Commons`
      : 'Latest open access academic articles from The Commons'

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title><![CDATA[${feedTitle}]]></title>
    <description><![CDATA[${feedDescription}]]></description>
    <link>${baseUrl}</link>
    <atom:link href="${baseUrl}/feed.xml${field ? `?field=${encodeURIComponent(field)}` : ''}" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <managingEditor>editorial@thecommons.org (The Commons Editorial Team)</managingEditor>
    <webMaster>webmaster@thecommons.org (The Commons)</webMaster>
    <generator>The Commons RSS Generator</generator>
    <image>
      <url>${baseUrl}/images/logo.png</url>
      <title><![CDATA[${feedTitle}]]></title>
      <link>${baseUrl}</link>
    </image>
    ${articles?.map(article => `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <description><![CDATA[${article.abstract || 'No abstract available.'}]]></description>
      <link>${baseUrl}/articles/${article.id}</link>
      <guid isPermaLink="true">${baseUrl}/articles/${article.id}</guid>
      <pubDate>${article.published_at ? new Date(article.published_at).toUTCString() : new Date().toUTCString()}</pubDate>
      <dc:creator><![CDATA[${(article.author as any)?.full_name || 'Unknown Author'}]]></dc:creator>
      <category><![CDATA[${article.field_of_study}]]></category>
      ${(article.keywords as any)?.map((keyword: any) => `<category><![CDATA[${keyword}]]></category>`).join('') || ''}
    </item>`).join('') || ''}
  </channel>
</rss>`

    return new Response(rssXml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('RSS Feed Error:', error)
    return new Response('Error generating RSS feed', { status: 500 })
  }
}