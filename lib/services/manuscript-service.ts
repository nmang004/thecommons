import { createClient } from '@/lib/supabase/server'
import { cacheWithFallback, CACHE_KEYS, CACHE_TTL, invalidateManuscriptCache } from '@/lib/redis/cache'
import { monitorDatabaseQuery } from '@/lib/performance/monitoring'

export interface Manuscript {
  id: string
  title: string
  abstract: string
  keywords: string[]
  field_of_study: string
  subfield?: string
  status: string
  author_id: string
  editor_id?: string
  submission_number?: string
  submitted_at?: string
  accepted_at?: string
  published_at?: string
  doi?: string
  view_count: number
  download_count: number
  citation_count: number
  cover_letter?: string
  funding_statement?: string
  conflict_of_interest?: string
  data_availability?: string
  created_at: string
  updated_at: string
  author?: {
    id: string
    full_name: string
    email: string
    affiliation?: string
    orcid?: string
  }
  editor?: {
    id: string
    full_name: string
    email: string
  }
  coauthors?: Array<{
    id: string
    name: string
    email: string
    affiliation?: string
    orcid?: string
    author_order: number
    is_corresponding: boolean
  }>
  files?: Array<{
    id: string
    file_name: string
    file_type: string
    file_size: number
    uploaded_at: string
  }>
  reviews?: Array<{
    id: string
    reviewer_id: string
    recommendation: string
    summary: string
    submitted_at: string
    round: number
  }>
}

export interface ManuscriptFilters {
  status?: string
  field?: string
  authorId?: string
  editorId?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export class ManuscriptService {
  private async getSupabase() {
    return await createClient()
  }

  // Get manuscripts for a specific user (author)
  async getUserManuscripts(userId: string, filters: ManuscriptFilters = {}): Promise<{
    manuscripts: Manuscript[]
    totalCount: number
  }> {
    const {
      status = '',
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = filters

    const cacheKey = CACHE_KEYS.MANUSCRIPTS.LIST(userId, status)

    return cacheWithFallback(
      cacheKey,
      async () => {
        return monitorDatabaseQuery('getUserManuscripts', async () => {
          const supabase = await this.getSupabase()
          
          let query = supabase
            .from('manuscripts')
            .select(`
              *,
              author:profiles!manuscripts_author_id_fkey (
                id, full_name, email, affiliation, orcid
              ),
              editor:profiles!manuscripts_editor_id_fkey (
                id, full_name, email
              ),
              coauthors:manuscript_coauthors (*),
              files:manuscript_files (
                id, file_name, file_type, file_size, uploaded_at
              )
            `, { count: 'exact' })
            .eq('author_id', userId)
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range((page - 1) * limit, page * limit - 1)

          if (status) {
            query = query.eq('status', status)
          }

          const { data, error, count } = await query

          if (error) {
            throw new Error(`Failed to fetch user manuscripts: ${error.message}`)
          }

          return {
            manuscripts: data || [],
            totalCount: count || 0
          }
        })
      },
      { ttl: CACHE_TTL.SHORT }
    )
  }

  // Get manuscripts for editor dashboard
  async getEditorQueue(editorId: string, filters: ManuscriptFilters = {}): Promise<{
    manuscripts: Manuscript[]
    totalCount: number
  }> {
    const {
      status = '',
      sortBy = 'submitted_at',
      sortOrder = 'asc',
      page = 1,
      limit = 20
    } = filters

    const cacheKey = CACHE_KEYS.MANUSCRIPTS.QUEUE(editorId)

    return cacheWithFallback(
      cacheKey,
      async () => {
        return monitorDatabaseQuery('getEditorQueue', async () => {
          const supabase = await this.getSupabase()
          
          let query = supabase
            .from('manuscripts')
            .select(`
              *,
              author:profiles!manuscripts_author_id_fkey (
                id, full_name, email, affiliation
              ),
              review_assignments (
                id, reviewer_id, status, due_date,
                reviewer:profiles!review_assignments_reviewer_id_fkey (
                  full_name
                )
              ),
              reviews (
                id, recommendation, submitted_at, round
              )
            `, { count: 'exact' })
            .or(`editor_id.eq.${editorId},editor_id.is.null`)
            .not('status', 'eq', 'draft')
            .not('status', 'eq', 'published')
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range((page - 1) * limit, page * limit - 1)

          if (status) {
            query = query.eq('status', status)
          }

          const { data, error, count } = await query

          if (error) {
            throw new Error(`Failed to fetch editor queue: ${error.message}`)
          }

          return {
            manuscripts: data || [],
            totalCount: count || 0
          }
        })
      },
      { ttl: CACHE_TTL.SHORT }
    )
  }

  // Get manuscript by ID with full details
  async getManuscriptById(id: string, includeReviews: boolean = false): Promise<Manuscript | null> {
    const cacheKey = includeReviews 
      ? CACHE_KEYS.MANUSCRIPTS.REVIEWS(id)
      : CACHE_KEYS.MANUSCRIPTS.DETAIL(id)

    const result = await cacheWithFallback(
      cacheKey,
      async () => {
        return monitorDatabaseQuery('getManuscriptById', async () => {
          const supabase = await this.getSupabase()
          
          const selectFields = `
            *,
            author:profiles!manuscripts_author_id_fkey (
              id, full_name, email, affiliation, orcid, avatar_url
            ),
            editor:profiles!manuscripts_editor_id_fkey (
              id, full_name, email
            ),
            coauthors:manuscript_coauthors (*),
            files:manuscript_files (*)
            ${includeReviews ? ',reviews (*), review_assignments (*)' : ''}
          `

          const { data, error } = await supabase
            .from('manuscripts')
            .select(selectFields)
            .eq('id', id)
            .single()

          if (error || !data) {
            return null
          }

          return data
        })
      },
      { ttl: CACHE_TTL.MEDIUM }
    )

    // Ensure we return the correct type
    return (result && typeof result === 'object' && 'id' in result) ? result as Manuscript : null
  }

  // Update manuscript status
  async updateManuscriptStatus(
    manuscriptId: string, 
    status: string, 
    editorId?: string
  ): Promise<void> {
    return monitorDatabaseQuery('updateManuscriptStatus', async () => {
      const supabase = await this.getSupabase()
      
      const updateData: {
        status: string
        updated_at: string
        editor_id?: string
      } = { 
        status,
        updated_at: new Date().toISOString()
      }

      if (editorId) {
        updateData.editor_id = editorId
      }

      if (status === 'published') {
        updateData.published_at = new Date().toISOString()
      } else if (status === 'accepted') {
        updateData.accepted_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('manuscripts')
        .update(updateData)
        .eq('id', manuscriptId)

      if (error) {
        throw new Error(`Failed to update manuscript status: ${error.message}`)
      }

      // Invalidate caches
      await invalidateManuscriptCache(manuscriptId)
    })
  }

  // Submit manuscript
  async submitManuscript(manuscriptData: Partial<Manuscript>): Promise<string> {
    return monitorDatabaseQuery('submitManuscript', async () => {
      const supabase = await this.getSupabase()
      
      const { data, error } = await supabase
        .from('manuscripts')
        .insert({
          ...manuscriptData,
          status: 'submitted',
          submitted_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (error || !data) {
        throw new Error(`Failed to submit manuscript: ${error?.message}`)
      }

      // Invalidate related caches
      if (manuscriptData.author_id) {
        await invalidateManuscriptCache(undefined, manuscriptData.author_id)
      }

      return data.id
    })
  }

  // Get dashboard statistics
  async getDashboardStats(userId: string, role: string): Promise<{
    totalManuscripts: number
    underReview: number
    published: number
    pending: number
    recentActivity: Array<{
      action: string
      manuscript_title: string
      timestamp: string
    }>
  }> {
    const cacheKey = CACHE_KEYS.STATS.DASHBOARD(userId)

    return cacheWithFallback(
      cacheKey,
      async () => {
        return monitorDatabaseQuery('getDashboardStats', async () => {
          const supabase = await this.getSupabase()
          
          let query = supabase
            .from('manuscripts')
            .select('status, title, updated_at')

          if (role === 'author') {
            query = query.eq('author_id', userId)
          } else if (role === 'editor') {
            query = query.eq('editor_id', userId)
          }

          const { data, error } = await query

          if (error) {
            throw new Error(`Failed to fetch dashboard stats: ${error.message}`)
          }

          const manuscripts = data || []
          
          return {
            totalManuscripts: manuscripts.length,
            underReview: manuscripts.filter(m => m.status === 'under_review').length,
            published: manuscripts.filter(m => m.status === 'published').length,
            pending: manuscripts.filter(m => ['submitted', 'with_editor', 'revisions_requested'].includes(m.status)).length,
            recentActivity: manuscripts
              .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
              .slice(0, 5)
              .map(m => ({
                action: `Status: ${m.status}`,
                manuscript_title: m.title,
                timestamp: m.updated_at
              }))
          }
        })
      },
      { ttl: CACHE_TTL.SHORT }
    )
  }

  // Search manuscripts with advanced filters
  async searchManuscripts(searchQuery: string, filters: ManuscriptFilters = {}): Promise<{
    manuscripts: Manuscript[]
    totalCount: number
  }> {
    return monitorDatabaseQuery('searchManuscripts', async () => {
      const supabase = await this.getSupabase()
      
      const {
        status,
        field,
        sortBy = 'updated_at',
        sortOrder = 'desc',
        page = 1,
        limit = 10
      } = filters

      let query = supabase
        .from('manuscripts')
        .select(`
          *,
          author:profiles!manuscripts_author_id_fkey (
            id, full_name, affiliation
          )
        `, { count: 'exact' })
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range((page - 1) * limit, page * limit - 1)

      if (searchQuery) {
        query = query.or(
          `title.ilike.%${searchQuery}%,abstract.ilike.%${searchQuery}%,keywords.cs.{${searchQuery}}`
        )
      }

      if (status) {
        query = query.eq('status', status)
      }

      if (field) {
        query = query.eq('field_of_study', field)
      }

      const { data, error, count } = await query

      if (error) {
        throw new Error(`Failed to search manuscripts: ${error.message}`)
      }

      return {
        manuscripts: data || [],
        totalCount: count || 0
      }
    })
  }

  // Get performance analytics
  async getPerformanceAnalytics(timeRange: '7d' | '30d' | '90d' = '30d'): Promise<{
    submissionTrend: Array<{ date: string; count: number }>
    statusDistribution: Array<{ status: string; count: number }>
    fieldDistribution: Array<{ field: string; count: number }>
    avgProcessingTime: number
  }> {
    const cacheKey = `analytics:manuscripts:${timeRange}`

    return cacheWithFallback(
      cacheKey,
      async () => {
        return monitorDatabaseQuery('getPerformanceAnalytics', async () => {
          const supabase = await this.getSupabase()
          
          const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
          const startDate = new Date()
          startDate.setDate(startDate.getDate() - days)

          const { data, error } = await supabase
            .from('manuscripts')
            .select('status, field_of_study, created_at, submitted_at, published_at')
            .gte('created_at', startDate.toISOString())

          if (error) {
            throw new Error(`Failed to fetch analytics: ${error.message}`)
          }

          const manuscripts = data || []

          // Calculate submission trend
          const submissionTrend = Array.from({ length: days }, (_, i) => {
            const date = new Date()
            date.setDate(date.getDate() - (days - 1 - i))
            const dateStr = date.toISOString().split('T')[0]
            
            const count = manuscripts.filter(m => 
              m.created_at?.startsWith(dateStr)
            ).length

            return { date: dateStr, count }
          })

          // Status distribution
          const statusCounts = manuscripts.reduce((acc: Record<string, number>, m) => {
            acc[m.status] = (acc[m.status] || 0) + 1
            return acc
          }, {})

          const statusDistribution = Object.entries(statusCounts)
            .map(([status, count]) => ({ status, count }))

          // Field distribution
          const fieldCounts = manuscripts.reduce((acc: Record<string, number>, m) => {
            acc[m.field_of_study] = (acc[m.field_of_study] || 0) + 1
            return acc
          }, {})

          const fieldDistribution = Object.entries(fieldCounts)
            .map(([field, count]) => ({ field, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)

          // Average processing time (submission to publication)
          const publishedManuscripts = manuscripts.filter(m => 
            m.status === 'published' && m.submitted_at && m.published_at
          )

          const avgProcessingTime = publishedManuscripts.length > 0
            ? publishedManuscripts.reduce((sum, m) => {
                const submitted = new Date(m.submitted_at!).getTime()
                const published = new Date(m.published_at!).getTime()
                return sum + (published - submitted)
              }, 0) / publishedManuscripts.length / (1000 * 60 * 60 * 24) // Convert to days
            : 0

          return {
            submissionTrend,
            statusDistribution,
            fieldDistribution,
            avgProcessingTime: Math.round(avgProcessingTime)
          }
        })
      },
      { ttl: CACHE_TTL.LONG }
    )
  }
}

// Create singleton instance
export const manuscriptService = new ManuscriptService()