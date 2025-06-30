import { createServiceClient } from '@/lib/supabase/server'
import { cache, cacheWithFallback, CACHE_KEYS, CACHE_TTL } from '@/lib/redis/cache'

export interface Article {
  id: string
  title: string
  abstract: string
  keywords: string[]
  field_of_study: string
  subfield?: string
  published_at: string
  view_count: number
  download_count: number
  citation_count: number
  author: {
    full_name: string
    affiliation?: string
  }
  coauthors: Array<{
    name: string
    affiliation?: string
  }>
}

export interface SearchFilters {
  query?: string
  field?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export class ArticleService {
  private supabase = createServiceClient()

  async getPublishedArticles(filters: SearchFilters = {}): Promise<{
    articles: Article[]
    totalCount: number
  }> {
    const {
      query = '',
      field = '',
      sortBy = 'published_at',
      sortOrder = 'desc',
      page = 1,
      limit = 12
    } = filters

    const cacheKey = CACHE_KEYS.ARTICLES.LIST(
      JSON.stringify({ query, field, sortBy, sortOrder, page, limit })
    )

    return cacheWithFallback(
      cacheKey,
      async () => {
        const supabase = await this.supabase
        let supabaseQuery = supabase
          .from('manuscripts')
          .select(`
            id,
            title,
            abstract,
            keywords,
            field_of_study,
            subfield,
            published_at,
            view_count,
            download_count,
            citation_count,
            author:profiles!manuscripts_author_id_fkey (
              full_name,
              affiliation
            ),
            coauthors:manuscript_coauthors (
              name,
              affiliation
            )
          `, { count: 'exact' })
          .eq('status', 'published')
          .order(sortBy, { ascending: sortOrder === 'asc' })
          .range((page - 1) * limit, page * limit - 1)

        // Apply filters
        if (query) {
          supabaseQuery = supabaseQuery.or(
            `title.ilike.%${query}%,abstract.ilike.%${query}%,keywords.cs.{${query}}`
          )
        }

        if (field) {
          supabaseQuery = supabaseQuery.eq('field_of_study', field)
        }

        const { data, error, count } = await supabaseQuery

        if (error) {
          throw new Error(`Failed to fetch articles: ${error.message}`)
        }

        // Transform the data to match Article interface
        const transformedData = (data || []).map(item => ({
          ...item,
          author: Array.isArray(item.author) ? item.author[0] : item.author
        })) as Article[]

        return {
          articles: transformedData,
          totalCount: count || 0
        }
      },
      { ttl: CACHE_TTL.MEDIUM }
    )
  }

  async getArticleById(id: string): Promise<Article | null> {
    const cacheKey = CACHE_KEYS.ARTICLES.DETAIL(id)

    return cacheWithFallback(
      cacheKey,
      async () => {
        const supabase = await this.supabase
        const { data, error } = await supabase
          .from('manuscripts')
          .select(`
            *,
            author:profiles!manuscripts_author_id_fkey (
              id,
              full_name,
              affiliation,
              orcid,
              avatar_url
            ),
            coauthors:manuscript_coauthors (*),
            files:manuscript_files (*)
          `)
          .eq('id', id)
          .eq('status', 'published')
          .single()

        if (error || !data) {
          return null
        }

        return data
      },
      { ttl: CACHE_TTL.LONG }
    )
  }

  async getRecentArticles(limit: number = 6): Promise<Article[]> {
    return cacheWithFallback(
      CACHE_KEYS.ARTICLES.RECENT,
      async () => {
        const supabase = await this.supabase
        const { data, error } = await supabase
          .from('manuscripts')
          .select(`
            id,
            title,
            abstract,
            keywords,
            field_of_study,
            published_at,
            view_count,
            download_count,
            citation_count,
            author:profiles!manuscripts_author_id_fkey (
              full_name,
              affiliation
            ),
            coauthors:manuscript_coauthors (
              name,
              affiliation
            )
          `)
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(limit)

        if (error) {
          throw new Error(`Failed to fetch recent articles: ${error.message}`)
        }

        // Transform the data to match Article interface
        return (data || []).map(item => ({
          ...item,
          author: Array.isArray(item.author) ? item.author[0] : item.author
        })) as Article[]
      },
      { ttl: CACHE_TTL.MEDIUM }
    )
  }

  async getPopularArticles(limit: number = 6): Promise<Article[]> {
    return cacheWithFallback(
      CACHE_KEYS.ARTICLES.POPULAR,
      async () => {
        const supabase = await this.supabase
        const { data, error } = await supabase
          .from('manuscripts')
          .select(`
            id,
            title,
            abstract,
            keywords,
            field_of_study,
            published_at,
            view_count,
            download_count,
            citation_count,
            author:profiles!manuscripts_author_id_fkey (
              full_name,
              affiliation
            ),
            coauthors:manuscript_coauthors (
              name,
              affiliation
            )
          `)
          .eq('status', 'published')
          .order('view_count', { ascending: false })
          .limit(limit)

        if (error) {
          throw new Error(`Failed to fetch popular articles: ${error.message}`)
        }

        // Transform the data to match Article interface
        return (data || []).map(item => ({
          ...item,
          author: Array.isArray(item.author) ? item.author[0] : item.author
        })) as Article[]
      },
      { ttl: CACHE_TTL.LONG }
    )
  }

  async getTrendingTopics(limit: number = 10): Promise<Array<{
    name: string
    count: number
    growth: string
  }>> {
    return cacheWithFallback(
      CACHE_KEYS.ARTICLES.TRENDING,
      async () => {
        // This would typically involve more complex analytics
        // For now, we'll return the most common fields of study
        const supabase = await this.supabase
        const { data, error } = await supabase
          .from('manuscripts')
          .select('field_of_study')
          .eq('status', 'published')

        if (error) {
          throw new Error(`Failed to fetch trending topics: ${error.message}`)
        }

        const fieldCounts = (data || []).reduce((acc: Record<string, number>, item) => {
          acc[item.field_of_study] = (acc[item.field_of_study] || 0) + 1
          return acc
        }, {})

        const trending = Object.entries(fieldCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, limit)
          .map(([name, count]) => ({
            name,
            count,
            growth: `+${Math.floor(Math.random() * 15) + 5}%` // Mock growth data
          }))

        return trending
      },
      { ttl: CACHE_TTL.VERY_LONG }
    )
  }

  async getFieldsOfStudy(): Promise<Array<{
    name: string
    count: number
  }>> {
    return cacheWithFallback(
      CACHE_KEYS.FIELDS.WITH_COUNTS,
      async () => {
        const supabase = await this.supabase
        const { data, error } = await supabase
          .from('manuscripts')
          .select('field_of_study')
          .eq('status', 'published')

        if (error) {
          throw new Error(`Failed to fetch fields of study: ${error.message}`)
        }

        const fieldCounts = (data || []).reduce((acc: Record<string, number>, item) => {
          acc[item.field_of_study] = (acc[item.field_of_study] || 0) + 1
          return acc
        }, {})

        return Object.entries(fieldCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
      },
      { ttl: CACHE_TTL.VERY_LONG }
    )
  }

  async incrementViewCount(articleId: string): Promise<void> {
    // Increment in database
    const supabase = await this.supabase
    await supabase.rpc('increment_view_count', { manuscript_id: articleId })

    // Invalidate related caches
    await cache.del(CACHE_KEYS.ARTICLES.DETAIL(articleId))
    await cache.flush(`${CACHE_KEYS.ARTICLES.LIST('*')}`)
    await cache.del(CACHE_KEYS.ARTICLES.POPULAR)
  }

  async incrementDownloadCount(articleId: string): Promise<void> {
    // Increment in database
    const supabase = await this.supabase
    await supabase.rpc('increment_download_count', { manuscript_id: articleId })

    // Invalidate related caches
    await cache.del(CACHE_KEYS.ARTICLES.DETAIL(articleId))
    await cache.flush(`${CACHE_KEYS.ARTICLES.LIST('*')}`)
  }

  async searchArticles(searchQuery: string, filters: SearchFilters = {}): Promise<{
    articles: Article[]
    totalCount: number
    suggestions?: string[]
  }> {
    const cacheKey = CACHE_KEYS.SEARCH.RESULTS(
      searchQuery,
      JSON.stringify(filters)
    )

    return cacheWithFallback(
      cacheKey,
      async () => {
        const result = await this.getPublishedArticles({
          ...filters,
          query: searchQuery
        })

        // In a production system, you might also return search suggestions
        return {
          ...result,
          suggestions: [] // Could implement autocomplete suggestions here
        }
      },
      { ttl: CACHE_TTL.SHORT }
    )
  }
}

// Create singleton instance
export const articleService = new ArticleService()