import { NextRequest } from 'next/server'

export async function GET(_request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thecommons.org'

  const robotsTxt = `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml

# RSS Feeds
Allow: /feed.xml

# Allow all public pages
Allow: /articles
Allow: /search
Allow: /fields
Allow: /about
Allow: /guidelines

# Disallow private areas
Disallow: /dashboard
Disallow: /author
Disallow: /editor
Disallow: /reviewer
Disallow: /admin
Disallow: /api
Disallow: /auth

# Crawl delay (be respectful)
Crawl-delay: 1`

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  })
}