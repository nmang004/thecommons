'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Filter, SortAsc, SortDesc, Calendar, User, Download, Eye, Quote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format } from 'date-fns'
import Link from 'next/link'
import type { Manuscript, Profile } from '@/types/database'

type ArticleWithAuthor = Manuscript & {
  author: Profile
  coauthors?: { name: string; affiliation?: string | null }[]
}

interface ArticleArchiveProps {
  searchParams: { [key: string]: string | string[] | undefined }
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
]

const SORT_OPTIONS = [
  { value: 'published_at', label: 'Publication Date' },
  { value: 'view_count', label: 'Most Viewed' },
  { value: 'download_count', label: 'Most Downloaded' },
  { value: 'citation_count', label: 'Most Cited' },
  { value: 'title', label: 'Title (A-Z)' },
]

export default function ArticleArchive({ searchParams }: ArticleArchiveProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const [articles, setArticles] = useState<ArticleWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState(searchParams.q as string || '')
  const [selectedField, setSelectedField] = useState(searchParams.field as string || '')
  const [sortBy, setSortBy] = useState(searchParams.sort as string || 'published_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    searchParams.order as 'asc' | 'desc' || 'desc'
  )

  const itemsPerPage = 12

  useEffect(() => {
    fetchArticles()
  }, [searchQuery, selectedField, sortBy, sortOrder, currentPage])

  const fetchArticles = async () => {
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
          author_id,
          status,
          submitted_at,
          accepted_at,
          published_at,
          created_at,
          updated_at,
          doi,
          view_count,
          download_count,
          citation_count,
          submission_number,
          corresponding_author_id,
          editor_id,
          cover_letter,
          funding_statement,
          conflict_of_interest,
          data_availability,
          profiles!manuscripts_author_id_fkey (
            id,
            email,
            full_name,
            affiliation,
            bio,
            orcid,
            created_at,
            updated_at
          ),
          manuscript_coauthors (
            name,
            affiliation
          )
        `, { count: 'exact' })
        .eq('status', 'published')
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

      // Apply search filters
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,abstract.ilike.%${searchQuery}%,keywords.cs.{${searchQuery}}`)
      }

      if (selectedField) {
        query = query.eq('field_of_study', selectedField)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching articles:', error)
        return
      }

      // Transform the data to match the ArticleWithAuthor type
      const transformedData = (data || []).map((item: any) => ({
        ...item,
        author: item.profiles || {
          id: 'unknown',
          email: '',
          full_name: 'Unknown Author',
          affiliation: null,
          bio: null,
          orcid: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Profile,
        coauthors: item.manuscript_coauthors || []
      })) as ArticleWithAuthor[]

      setArticles(transformedData)
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error fetching articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateURL()
  }

  const updateURL = () => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (selectedField) params.set('field', selectedField)
    if (sortBy !== 'published_at') params.set('sort', sortBy)
    if (sortOrder !== 'desc') params.set('order', sortOrder)
    if (currentPage > 1) params.set('page', currentPage.toString())

    const queryString = params.toString()
    router.push(`/articles${queryString ? `?${queryString}` : ''}`)
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Search Input */}
              <div className="md:col-span-5 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search articles, keywords, or authors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Field Filter */}
              <div className="md:col-span-3">
                <Select value={selectedField} onValueChange={setSelectedField}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Fields" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Fields</SelectItem>
                    {FIELDS_OF_STUDY.map((field) => (
                      <SelectItem key={field} value={field}>
                        {field}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Options */}
              <div className="md:col-span-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
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
              </div>

              {/* Sort Order */}
              <div className="md:col-span-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="w-full"
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
              </div>

              {/* Search Button */}
              <div className="md:col-span-1">
                <Button type="submit" className="w-full">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? 'Loading...' : `Showing ${articles.length} of ${totalCount} articles`}
        </p>
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
      </div>

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
      ) : articles.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">No articles found matching your criteria.</p>
            <Button onClick={() => {
              setSearchQuery('')
              setSelectedField('')
              setCurrentPage(1)
            }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <Card key={article.id} className="card-academic group hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    {article.field_of_study}
                  </Badge>
                  <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                    <span className="flex items-center">
                      <Eye className="h-3 w-3 mr-1" />
                      {article.view_count}
                    </span>
                    <span className="flex items-center">
                      <Download className="h-3 w-3 mr-1" />
                      {article.download_count}
                    </span>
                    <span className="flex items-center">
                      <Quote className="h-3 w-3 mr-1" />
                      {article.citation_count}
                    </span>
                  </div>
                </div>
                <CardTitle className="text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  <Link href={`/articles/${article.id}`}>
                    {article.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                  {article.abstract}
                </p>
                
                <div className="flex items-center mb-3">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="font-medium">{article.author.full_name}</p>
                    {article.author.affiliation && (
                      <p className="text-xs text-muted-foreground">{article.author.affiliation}</p>
                    )}
                  </div>
                </div>

                {article.coauthors && article.coauthors.length > 0 && (
                  <p className="text-xs text-muted-foreground mb-3">
                    + {article.coauthors.length} co-author{article.coauthors.length > 1 ? 's' : ''}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    {format(new Date(article.published_at), 'MMM dd, yyyy')}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {article.keywords?.slice(0, 2).map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                    {article.keywords?.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{article.keywords.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
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