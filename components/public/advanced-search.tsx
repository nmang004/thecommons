'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  X, 
  BookOpen, 
  SortAsc,
  SortDesc
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import ArticleCard from '@/components/ui/article-card'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface SearchFilters {
  query: string
  author: string
  title: string
  abstract: string
  keywords: string[]
  fields: string[]
  dateFrom: string
  dateTo: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  hasSupplementary: boolean
  minCitations: string
}

interface Article {
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

const FIELDS_OF_STUDY = [
  'Biology',
  'Chemistry',
  'Computer Science',
  'Environmental Science',
  'Mathematics',
  'Medicine',
  'Physics',
  'Psychology',
  'Engineering',
  'Social Sciences',
  'Economics',
  'Political Science',
  'Anthropology',
  'Philosophy',
  'Literature',
]

const SORT_OPTIONS = [
  { value: 'published_at', label: 'Publication Date' },
  { value: 'view_count', label: 'Views' },
  { value: 'download_count', label: 'Downloads' },
  { value: 'citation_count', label: 'Citations' },
  { value: 'title', label: 'Title' },
  { value: 'relevance', label: 'Relevance' },
]

export default function AdvancedSearch({ 
  searchParams 
}: { 
  searchParams: { [key: string]: string | string[] | undefined } 
}) {
  const supabase = createClientComponentClient()

  const [filters, setFilters] = useState<SearchFilters>({
    query: (searchParams.q as string) || '',
    author: (searchParams.author as string) || '',
    title: (searchParams.title as string) || '',
    abstract: (searchParams.abstract as string) || '',
    keywords: [],
    fields: [],
    dateFrom: (searchParams.dateFrom as string) || '',
    dateTo: (searchParams.dateTo as string) || '',
    sortBy: (searchParams.sort as string) || 'published_at',
    sortOrder: (searchParams.order as 'asc' | 'desc') || 'desc',
    hasSupplementary: false,
    minCitations: '',
  })

  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [keywordInput, setKeywordInput] = useState('')
  
  const itemsPerPage = 12

  useEffect(() => {
    if (filters.query || hasActiveFilters()) {
      performSearch()
    }
  }, [filters, currentPage])

  const hasActiveFilters = () => {
    return filters.author || 
           filters.title || 
           filters.abstract || 
           filters.keywords.length > 0 || 
           filters.fields.length > 0 || 
           filters.dateFrom || 
           filters.dateTo || 
           filters.hasSupplementary || 
           filters.minCitations
  }

  const performSearch = async () => {
    setLoading(true)
    try {
      let query = supabase
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
        .order(filters.sortBy, { ascending: filters.sortOrder === 'asc' })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

      // Apply search filters
      if (filters.query) {
        query = query.or(`title.ilike.%${filters.query}%,abstract.ilike.%${filters.query}%,keywords.cs.{${filters.query}}`)
      }

      if (filters.title) {
        query = query.ilike('title', `%${filters.title}%`)
      }

      if (filters.abstract) {
        query = query.ilike('abstract', `%${filters.abstract}%`)
      }

      if (filters.author) {
        query = query.or(`profiles.full_name.ilike.%${filters.author}%`)
      }

      if (filters.fields.length > 0) {
        query = query.in('field_of_study', filters.fields)
      }

      if (filters.keywords.length > 0) {
        const keywordFilter = filters.keywords.map(k => `keywords.cs.{${k}}`).join(',')
        query = query.or(keywordFilter)
      }

      if (filters.dateFrom) {
        query = query.gte('published_at', filters.dateFrom)
      }

      if (filters.dateTo) {
        query = query.lte('published_at', filters.dateTo)
      }

      if (filters.minCitations) {
        query = query.gte('citation_count', parseInt(filters.minCitations))
      }

      const { data, error, count } = await query

      if (error) {
        console.error('Search error:', error)
        return
      }

      setArticles(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const addKeyword = () => {
    if (keywordInput.trim() && !filters.keywords.includes(keywordInput.trim())) {
      handleFilterChange('keywords', [...filters.keywords, keywordInput.trim()])
      setKeywordInput('')
    }
  }

  const removeKeyword = (keyword: string) => {
    handleFilterChange('keywords', filters.keywords.filter(k => k !== keyword))
  }

  const toggleField = (field: string) => {
    const newFields = filters.fields.includes(field)
      ? filters.fields.filter(f => f !== field)
      : [...filters.fields, field]
    handleFilterChange('fields', newFields)
  }

  const clearFilters = () => {
    setFilters({
      query: '',
      author: '',
      title: '',
      abstract: '',
      keywords: [],
      fields: [],
      dateFrom: '',
      dateTo: '',
      sortBy: 'published_at',
      sortOrder: 'desc',
      hasSupplementary: false,
      minCitations: '',
    })
    setCurrentPage(1)
    setArticles([])
    setTotalCount(0)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch()
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Advanced Search
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Main Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search all fields..."
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="space-y-4 pt-4 border-t">
                {/* Specific Field Searches */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Title</label>
                    <Input
                      placeholder="Search titles..."
                      value={filters.title}
                      onChange={(e) => handleFilterChange('title', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Author</label>
                    <Input
                      placeholder="Search authors..."
                      value={filters.author}
                      onChange={(e) => handleFilterChange('author', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Abstract</label>
                    <Input
                      placeholder="Search abstracts..."
                      value={filters.abstract}
                      onChange={(e) => handleFilterChange('abstract', e.target.value)}
                    />
                  </div>
                </div>

                {/* Keywords */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Keywords</label>
                  <div className="flex space-x-2 mb-2">
                    <Input
                      placeholder="Add keyword..."
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    />
                    <Button type="button" onClick={addKeyword} variant="outline">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filters.keywords.map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="flex items-center">
                        {keyword}
                        <X 
                          className="h-3 w-3 ml-1 cursor-pointer" 
                          onClick={() => removeKeyword(keyword)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Fields of Study */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Fields of Study</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                    {FIELDS_OF_STUDY.map((field) => (
                      <div key={field} className="flex items-center space-x-2">
                        <Checkbox
                          id={`field-${field}`}
                          checked={filters.fields.includes(field)}
                          onCheckedChange={() => toggleField(field)}
                        />
                        <label 
                          htmlFor={`field-${field}`}
                          className="text-sm cursor-pointer"
                        >
                          {field}
                        </label>
                      </div>
                    ))}
                  </div>
                  {filters.fields.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {filters.fields.map((field) => (
                        <Badge key={field} variant="outline" className="flex items-center">
                          {field}
                          <X 
                            className="h-3 w-3 ml-1 cursor-pointer" 
                            onClick={() => toggleField(field)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Published From</label>
                    <Input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Published To</label>
                    <Input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    />
                  </div>
                </div>

                {/* Additional Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Minimum Citations</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={filters.minCitations}
                      onChange={(e) => handleFilterChange('minCitations', e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasSupplementary"
                        checked={filters.hasSupplementary}
                        onCheckedChange={(checked) => handleFilterChange('hasSupplementary', checked)}
                      />
                      <label htmlFor="hasSupplementary" className="text-sm">
                        Has supplementary files
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sort Options */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-4">
                <Select 
                  value={filters.sortBy} 
                  onValueChange={(value) => handleFilterChange('sortBy', value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {filters.sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={clearFilters}>
                  Clear All
                </Button>
                <Button type="submit">
                  Search
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {(loading || totalCount > 0) && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {loading ? 'Searching...' : `Found ${totalCount} article${totalCount !== 1 ? 's' : ''}`}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || loading}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || loading}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Articles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3 mb-4"></div>
                <div className="flex items-center justify-between">
                  <div className="h-3 bg-muted rounded w-24"></div>
                  <div className="h-3 bg-muted rounded w-16"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : articles.length === 0 && (filters.query || hasActiveFilters()) ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="heading-3 mb-2">No articles found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or removing some filters.
            </p>
            <Button onClick={clearFilters} variant="outline">
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      ) : articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : null}

      {/* Pagination */}
      {totalPages > 1 && articles.length > 0 && (
        <div className="flex items-center justify-center space-x-2 pt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || loading}
          >
            Previous
          </Button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
            return (
              <Button
                key={pageNumber}
                variant={currentPage === pageNumber ? 'default' : 'outline'}
                onClick={() => setCurrentPage(pageNumber)}
                disabled={loading}
                className="w-10"
              >
                {pageNumber}
              </Button>
            )
          })}
          
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || loading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}