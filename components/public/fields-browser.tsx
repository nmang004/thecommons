'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  TrendingUp,
  BookOpen,
  Users,
  ArrowRight,
  Search,
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { format } from 'date-fns'

interface FieldData {
  name: string
  count: number
  description: string
  icon: string
  color: string
  recentArticles: Array<{
    id: string
    title: string
    published_at: string
    view_count: number
  }>
  trending: boolean
  growth: number
}

interface FieldsBrowserProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

const FIELD_CONFIGS = {
  'Biology': {
    description: 'Life sciences, molecular biology, genetics, ecology, and related biological research.',
    icon: '🧬',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  'Chemistry': {
    description: 'Organic, inorganic, physical chemistry, biochemistry, and chemical engineering.',
    icon: '⚗️',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  'Computer Science': {
    description: 'Artificial intelligence, software engineering, algorithms, and computational research.',
    icon: '💻',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  'Environmental Science': {
    description: 'Climate change, sustainability, ecology, environmental policy, and conservation.',
    icon: '🌍',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
  'Mathematics': {
    description: 'Pure and applied mathematics, statistics, mathematical modeling, and analysis.',
    icon: '📐',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  'Medicine': {
    description: 'Clinical research, medical sciences, public health, and healthcare innovation.',
    icon: '🏥',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  'Physics': {
    description: 'Theoretical and experimental physics, quantum mechanics, and materials science.',
    icon: '⚛️',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  'Psychology': {
    description: 'Cognitive science, behavioral research, neuroscience, and mental health studies.',
    icon: '🧠',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
  },
  'Engineering': {
    description: 'Mechanical, electrical, civil engineering, and technological innovation.',
    icon: '🔧',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
  'Social Sciences': {
    description: 'Sociology, anthropology, political science, and human behavior research.',
    icon: '👥',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
}

const SORT_OPTIONS = [
  { value: 'count', label: 'Article Count' },
  { value: 'name', label: 'Field Name' },
  { value: 'trending', label: 'Trending' },
  { value: 'recent', label: 'Recent Activity' },
]

export default function FieldsBrowser({ searchParams }: FieldsBrowserProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const [fields, setFields] = useState<FieldData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('count')
  const [showAll, setShowAll] = useState(false)
  const [expandedField, setExpandedField] = useState<string | null>(null)

  useEffect(() => {
    fetchFieldsData()
  }, [])

  const fetchFieldsData = async () => {
    setLoading(true)
    try {
      // Fetch field counts
      const { data: manuscripts, error } = await supabase
        .from('manuscripts')
        .select('field_of_study, published_at, view_count, id, title')
        .eq('status', 'published')

      if (error) {
        console.error('Error fetching fields data:', error)
        return
      }

      // Process field data
      const fieldCounts = manuscripts.reduce((acc: Record<string, any>, article) => {
        const field = article.field_of_study
        if (!acc[field]) {
          acc[field] = {
            count: 0,
            articles: [],
            totalViews: 0,
          }
        }
        acc[field].count++
        acc[field].totalViews += article.view_count || 0
        acc[field].articles.push({
          id: article.id,
          title: article.title,
          published_at: article.published_at,
          view_count: article.view_count || 0,
        })
        return acc
      }, {})

      // Convert to FieldData array
      const fieldsData: FieldData[] = Object.entries(fieldCounts).map(([name, data]: [string, any]) => {
        const config = FIELD_CONFIGS[name as keyof typeof FIELD_CONFIGS] || {
          description: 'Research in this academic field.',
          icon: '📚',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
        }

        // Sort articles by publication date and get recent ones
        const recentArticles = data.articles
          .sort((a: any, b: any) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
          .slice(0, 3)

        // Calculate growth (mock data for now)
        const growth = Math.floor(Math.random() * 20) + 5

        return {
          name,
          count: data.count,
          description: config.description,
          icon: config.icon,
          color: config.color,
          recentArticles,
          trending: growth > 15,
          growth,
        }
      })

      setFields(fieldsData)
    } catch (error) {
      console.error('Error fetching fields data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredFields = fields
    .filter(field => 
      field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      field.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'trending':
          return b.growth - a.growth
        case 'recent':
          return new Date(b.recentArticles[0]?.published_at || 0).getTime() - 
                 new Date(a.recentArticles[0]?.published_at || 0).getTime()
        case 'count':
        default:
          return b.count - a.count
      }
    })

  const displayedFields = showAll ? filteredFields : filteredFields.slice(0, 8)

  const handleFieldClick = (fieldName: string) => {
    router.push(`/articles?field=${encodeURIComponent(fieldName)}`)
  }

  const toggleExpanded = (fieldName: string) => {
    setExpandedField(expandedField === fieldName ? null : fieldName)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 bg-muted rounded-full"></div>
                <div className="h-6 w-32 bg-muted rounded"></div>
              </div>
              <div className="h-4 w-full bg-muted rounded mb-2"></div>
              <div className="h-4 w-3/4 bg-muted rounded mb-4"></div>
              <div className="flex justify-between items-center">
                <div className="h-4 w-20 bg-muted rounded"></div>
                <div className="h-4 w-16 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Search and Filter Controls */}
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
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
          </div>
        </CardContent>
      </Card>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="text-center p-6">
          <BookOpen className="h-8 w-8 mx-auto mb-3 text-primary" />
          <p className="heading-3 text-primary mb-2">{fields.length}</p>
          <p className="text-sm text-muted-foreground">Active Fields</p>
        </Card>
        <Card className="text-center p-6">
          <TrendingUp className="h-8 w-8 mx-auto mb-3 text-secondary" />
          <p className="heading-3 text-secondary mb-2">
            {fields.reduce((sum, field) => sum + field.count, 0)}
          </p>
          <p className="text-sm text-muted-foreground">Total Articles</p>
        </Card>
        <Card className="text-center p-6">
          <Users className="h-8 w-8 mx-auto mb-3 text-accent" />
          <p className="heading-3 text-accent mb-2">
            {fields.filter(field => field.trending).length}
          </p>
          <p className="text-sm text-muted-foreground">Trending Fields</p>
        </Card>
        <Card className="text-center p-6">
          <Calendar className="h-8 w-8 mx-auto mb-3 text-info" />
          <p className="heading-3 text-info mb-2">
            {fields.filter(field => field.recentArticles.length > 0).length}
          </p>
          <p className="text-sm text-muted-foreground">Recently Active</p>
        </Card>
      </div>

      {/* Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayedFields.map((field) => (
          <Card 
            key={field.name} 
            className="card-academic group hover:shadow-lg transition-all duration-300 cursor-pointer"
            onClick={() => handleFieldClick(field.name)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{field.icon}</div>
                  <div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {field.name}
                    </CardTitle>
                    {field.trending && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Trending
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleExpanded(field.name)
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {expandedField === field.name ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {field.description}
              </p>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <BookOpen className="h-3 w-3 mr-1" />
                    {field.count} articles
                  </span>
                  {field.growth > 0 && (
                    <span className="flex items-center text-green-600">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{field.growth}%
                    </span>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>

              {/* Expanded Content */}
              {expandedField === field.name && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium mb-2 text-sm">Recent Articles</h4>
                  <div className="space-y-2">
                    {field.recentArticles.slice(0, 3).map((article) => (
                      <div key={article.id} className="text-xs">
                        <Link 
                          href={`/articles/${article.id}`}
                          className="text-primary hover:underline line-clamp-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {article.title}
                        </Link>
                        <p className="text-muted-foreground">
                          {format(new Date(article.published_at), 'MMM dd, yyyy')} • {article.view_count} views
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Show More/Less Button */}
      {filteredFields.length > 8 && (
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Show Less' : `Show All ${filteredFields.length} Fields`}
          </Button>
        </div>
      )}

      {/* No Results */}
      {filteredFields.length === 0 && !loading && (
        <Card className="text-center py-12">
          <CardContent>
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="heading-3 mb-2">No fields found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria.
            </p>
            <Button onClick={() => setSearchQuery('')} variant="outline">
              Clear Search
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-none">
        <CardContent className="p-8 text-center">
          <h2 className="heading-2 mb-4">Don't See Your Field?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            We welcome research from all academic disciplines. If your field isn't listed, 
            we encourage you to be among the first to publish in that area on The Commons.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link href="/author/submit">
                Submit Research
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contact">
                Suggest a Field
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}