'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, TrendingUp, Calendar, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ArticleCard from '@/components/ui/article-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Manuscript, Profile } from '@/types/database'

type ArticleWithAuthor = Manuscript & {
  author: Profile
  coauthors?: { name: string; affiliation?: string | null }[]
}

// Mock data - in real app this would come from props or API
const recentArticles: ArticleWithAuthor[] = [
  {
    id: '1',
    title: 'Machine Learning Approaches for Climate Change Prediction: A Comprehensive Review',
    abstract: 'This comprehensive review examines the latest machine learning techniques applied to climate change prediction, analyzing their effectiveness and potential for future environmental modeling...',
    keywords: ['Machine Learning', 'Climate Change', 'Environmental Science'],
    field_of_study: 'Environmental Science',
    subfield: 'Climate Science',
    author_id: '1',
    status: 'published',
    submitted_at: '2024-01-08T00:00:00Z',
    accepted_at: '2024-01-12T00:00:00Z',
    published_at: '2024-01-15T00:00:00Z',
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    doi: '10.1000/sample.doi.1',
    submission_number: 'SUB-2024-001',
    corresponding_author_id: '1',
    editor_id: null,
    cover_letter: null,
    funding_statement: null,
    conflict_of_interest: null,
    data_availability: null,
    view_count: 1250,
    download_count: 340,
    citation_count: 12,
    author: {
      id: '1',
      email: 'sarah.chen@stanford.edu',
      full_name: 'Dr. Sarah Chen',
      affiliation: 'Stanford University',
      bio: 'Environmental scientist specializing in climate modeling',
      orcid: '0000-0000-0000-0001',
      created_at: '2023-06-01T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
    },
    coauthors: [
      { name: 'Dr. Michael Rodriguez', affiliation: 'MIT' },
      { name: 'Dr. Lisa Wang', affiliation: 'UC Berkeley' },
    ],
  },
  {
    id: '2',
    title: 'Quantum Computing Applications in Drug Discovery: Current State and Future Prospects',
    abstract: 'An exploration of how quantum computing is revolutionizing pharmaceutical research through enhanced molecular simulation and drug interaction modeling...',
    keywords: ['Quantum Computing', 'Drug Discovery', 'Pharmaceuticals'],
    field_of_study: 'Computer Science',
    author: {
      id: '2',
      full_name: 'Dr. Ahmed Hassan',
      affiliation: 'Oxford University',
      avatar_url: null,
    },
    coauthors: [],
    status: 'published' as const,
    published_at: '2024-01-12T00:00:00Z',
    created_at: '2024-01-08T00:00:00Z',
    view_count: 890,
    download_count: 245,
    citation_count: 8,
  },
  {
    id: '3',
    title: 'CRISPR-Cas9 Gene Editing: Ethical Considerations in Human Therapeutic Applications',
    abstract: 'A thorough examination of the ethical implications surrounding CRISPR-Cas9 gene editing technology in human therapeutic contexts...',
    keywords: ['CRISPR', 'Gene Editing', 'Bioethics'],
    field_of_study: 'Biology',
    author: {
      id: '3',
      full_name: 'Dr. Emily Johnson',
      affiliation: 'Harvard Medical School',
      avatar_url: null,
    },
    coauthors: [
      { name: 'Dr. Robert Kim', affiliation: 'Johns Hopkins' },
    ],
    status: 'published' as const,
    published_at: '2024-01-10T00:00:00Z',
    created_at: '2024-01-05T00:00:00Z',
    view_count: 2100,
    download_count: 580,
    citation_count: 15,
  },
]

const trendingTopics = [
  { name: 'Artificial Intelligence', count: 145, growth: '+12%' },
  { name: 'Climate Science', count: 89, growth: '+8%' },
  { name: 'Quantum Computing', count: 67, growth: '+15%' },
  { name: 'Biotechnology', count: 123, growth: '+6%' },
  { name: 'Renewable Energy', count: 78, growth: '+10%' },
]

export default function RecentArticlesSection() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const articlesPerSlide = 2
  const totalSlides = Math.ceil(recentArticles.length / articlesPerSlide)

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)
  }

  const visibleArticles = recentArticles.slice(
    currentSlide * articlesPerSlide,
    (currentSlide + 1) * articlesPerSlide
  )

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content - Recent Articles */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="heading-1 mb-2">Latest Research</h2>
                <p className="text-muted-foreground">
                  Discover the most recent publications from researchers worldwide
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                  className="h-10 w-10 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextSlide}
                  disabled={currentSlide === totalSlides - 1}
                  className="h-10 w-10 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Articles Carousel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {visibleArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {/* Featured Article */}
            {recentArticles[0] && (
              <div className="mb-8">
                <h3 className="heading-3 mb-4">Featured Article</h3>
                <ArticleCard 
                  article={recentArticles[0]} 
                  variant="featured" 
                  className="max-w-none"
                />
              </div>
            )}

            {/* View All Button */}
            <div className="text-center">
              <Button asChild size="lg" variant="outline">
                <Link href="/articles">
                  Browse All Articles
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Topics */}
            <Card className="card-academic">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                  Trending Topics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {trendingTopics.map((topic, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <div>
                      <Link 
                        href={`/search?field=${encodeURIComponent(topic.name)}`}
                        className="font-medium hover:text-primary transition-colors text-sm"
                      >
                        {topic.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {topic.count} articles
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {topic.growth}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="card-academic">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-secondary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">New issue published</p>
                      <p className="text-xs text-muted-foreground">
                        Environmental Science Vol. 12 • 2 hours ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Special issue call</p>
                      <p className="text-xs text-muted-foreground">
                        AI in Healthcare • 1 day ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Editorial board update</p>
                      <p className="text-xs text-muted-foreground">
                        3 days ago
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="card-academic bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardContent className="p-6">
                <h4 className="font-semibold mb-4 text-center">This Month</h4>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="heading-3 text-primary">24</p>
                    <p className="text-xs text-muted-foreground">Articles Published</p>
                  </div>
                  <div>
                    <p className="heading-3 text-secondary">157</p>
                    <p className="text-xs text-muted-foreground">Submissions</p>
                  </div>
                  <div>
                    <p className="heading-3 text-accent">89</p>
                    <p className="text-xs text-muted-foreground">New Authors</p>
                  </div>
                  <div>
                    <p className="heading-3 text-info">45K</p>
                    <p className="text-xs text-muted-foreground">Downloads</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}