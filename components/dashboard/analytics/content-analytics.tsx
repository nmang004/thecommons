'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts'
import { 
  Eye, Download, Share2, BookOpen, Globe, TrendingUp, 
  Award, Users, Calendar, Filter, ExternalLink
} from 'lucide-react'

interface ContentMetrics {
  totalArticles: number
  totalViews: number
  totalDownloads: number
  totalShares: number
  avgViewsPerArticle: number
  avgDownloadsPerArticle: number
  topPerformingField: string
  citationIndex: number
}

interface ArticlePerformance {
  id: string
  title: string
  field: string
  publishedDate: string
  views: number
  downloads: number
  citations: number
  shares: number
  engagementScore: number
}

interface FieldAnalytics {
  field: string
  articles: number
  totalViews: number
  totalDownloads: number
  avgCitations: number
  growthRate: number
}

interface GeographicData {
  country: string
  countryCode: string
  views: number
  downloads: number
  users: number
  percentage: number
}

interface ContentTrend {
  month: string
  views: number
  downloads: number
  newArticles: number
  citations: number
}

function MetricCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon, 
  description,
  loading = false 
}: {
  title: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
  icon: React.ReactNode
  description?: string
  loading?: boolean
}) {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
        <Skeleton className="h-8 w-32 mt-2" />
        <Skeleton className="h-3 w-48 mt-2" />
      </Card>
    )
  }

  const changeColor = changeType === 'increase' ? 'text-green-600' : 
                      changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'

  return (
    <Card className="p-6 card-academic">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline space-x-2">
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {change !== undefined && (
              <Badge 
                variant="secondary" 
                className={`${changeColor} text-xs`}
              >
                {change > 0 ? '+' : ''}{change}%
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
          {icon}
        </div>
      </div>
    </Card>
  )
}

interface ContentAnalyticsProps {
  timeRange?: '7d' | '30d' | '90d' | '1y'
  className?: string
}

export function ContentAnalytics({ 
  timeRange = '30d', 
  className = '' 
}: ContentAnalyticsProps) {
  const [metrics, setMetrics] = useState<ContentMetrics | null>(null)
  const [topArticles, setTopArticles] = useState<ArticlePerformance[]>([])
  const [fieldAnalytics, setFieldAnalytics] = useState<FieldAnalytics[]>([])
  const [geographicData, setGeographicData] = useState<GeographicData[]>([])
  const [contentTrends, setContentTrends] = useState<ContentTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchContentAnalytics = async () => {
    try {
      setLoading(true)
      
      // Fetch content performance data
      const response = await fetch(`/api/analytics/dashboard?type=content&range=${timeRange}`)
      
      if (response.ok) {
        const data = await response.json()
        const contentData = data.data || []
        
        // Calculate overall metrics
        const totalArticles = contentData.reduce((sum: number, field: any) => sum + field.published_articles, 0)
        const totalViews = contentData.reduce((sum: number, field: any) => sum + field.total_views, 0)
        const totalDownloads = contentData.reduce((sum: number, field: any) => sum + field.total_downloads, 0)
        
        setMetrics({
          totalArticles,
          totalViews,
          totalDownloads,
          totalShares: Math.round(totalViews * 0.15), // Estimated
          avgViewsPerArticle: totalArticles > 0 ? Math.round(totalViews / totalArticles) : 0,
          avgDownloadsPerArticle: totalArticles > 0 ? Math.round(totalDownloads / totalArticles) : 0,
          topPerformingField: contentData[0]?.field_of_study || 'Unknown',
          citationIndex: 2.4 // Mock citation index
        })

        // Process field analytics
        setFieldAnalytics(contentData.map((field: any) => ({
          field: field.field_of_study,
          articles: field.published_articles,
          totalViews: field.total_views,
          totalDownloads: field.total_downloads,
          avgCitations: field.avg_citations_per_article || 0,
          growthRate: Math.round(Math.random() * 30 - 10) // Mock growth rate
        })))
      }

      // Fetch geographic distribution
      const geoResponse = await fetch(`/api/analytics/dashboard?type=geographic&range=${timeRange}`)
      if (geoResponse.ok) {
        const geoData = await geoResponse.json()
        const geoAnalytics = geoData.data || []
        
        const totalViews = geoAnalytics.reduce((sum: any, country: any) => sum + country.views, 0)
        
        setGeographicData(geoAnalytics.slice(0, 10).map((country: any) => ({
          country: country.country === 'US' ? 'United States' : 
                  country.country === 'GB' ? 'United Kingdom' :
                  country.country === 'DE' ? 'Germany' :
                  country.country === 'FR' ? 'France' :
                  country.country === 'JP' ? 'Japan' : country.country,
          countryCode: country.country,
          views: country.views,
          downloads: country.downloads,
          users: Math.round(country.views * 0.3), // Estimated unique users
          percentage: totalViews > 0 ? (country.views / totalViews) * 100 : 0
        })))
      }

      // Mock data for remaining components
      setTopArticles([
        {
          id: '1',
          title: 'Machine Learning Applications in Climate Change Prediction',
          field: 'Computer Science',
          publishedDate: '2024-05-15',
          views: 15420,
          downloads: 8930,
          citations: 23,
          shares: 156,
          engagementScore: 92
        },
        {
          id: '2',
          title: 'CRISPR Gene Editing: Recent Advances and Future Prospects',
          field: 'Biology',
          publishedDate: '2024-04-28',
          views: 12850,
          downloads: 7340,
          citations: 18,
          shares: 134,
          engagementScore: 89
        },
        {
          id: '3',
          title: 'Quantum Computing and Cryptographic Security',
          field: 'Physics',
          publishedDate: '2024-05-02',
          views: 11240,
          downloads: 6520,
          citations: 15,
          shares: 98,
          engagementScore: 84
        },
        {
          id: '4',
          title: 'Sustainable Energy Solutions for Urban Development',
          field: 'Engineering',
          publishedDate: '2024-04-12',
          views: 9850,
          downloads: 5420,
          citations: 12,
          shares: 87,
          engagementScore: 78
        },
        {
          id: '5',
          title: 'Neuroplasticity and Learning: A Comprehensive Review',
          field: 'Neuroscience',
          publishedDate: '2024-03-20',
          views: 8960,
          downloads: 4890,
          citations: 21,
          shares: 76,
          engagementScore: 82
        }
      ])

      setContentTrends([
        { month: 'Jan', views: 45000, downloads: 28000, newArticles: 45, citations: 156 },
        { month: 'Feb', views: 52000, downloads: 31000, newArticles: 52, citations: 189 },
        { month: 'Mar', views: 48000, downloads: 29000, newArticles: 48, citations: 167 },
        { month: 'Apr', views: 61000, downloads: 36000, newArticles: 58, citations: 203 },
        { month: 'May', views: 68000, downloads: 42000, newArticles: 67, citations: 234 },
        { month: 'Jun', views: 75000, downloads: 47000, newArticles: 73, citations: 267 }
      ])

      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch content analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContentAnalytics()
    
    // Auto-refresh every 10 minutes
    const interval = setInterval(fetchContentAnalytics, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [timeRange])

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const COLORS = ['#1e3a8a', '#d97706', '#16a34a', '#dc2626', '#7c3aed', '#0891b2', '#c2410c']

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Content Analytics</h2>
          <p className="text-muted-foreground mt-1">
            Article performance, engagement metrics, and academic impact analysis
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Articles"
          value={metrics ? formatNumber(metrics.totalArticles) : '0'}
          change={14}
          changeType="increase"
          icon={<BookOpen className="h-6 w-6 text-blue-600" />}
          description="Published articles"
          loading={loading}
        />
        
        <MetricCard
          title="Total Views"
          value={metrics ? formatNumber(metrics.totalViews) : '0'}
          change={22}
          changeType="increase"
          icon={<Eye className="h-6 w-6 text-green-600" />}
          description={`${metrics ? Math.round(metrics.avgViewsPerArticle) : 0} avg per article`}
          loading={loading}
        />
        
        <MetricCard
          title="Total Downloads"
          value={metrics ? formatNumber(metrics.totalDownloads) : '0'}
          change={18}
          changeType="increase"
          icon={<Download className="h-6 w-6 text-purple-600" />}
          description={`${metrics ? Math.round(metrics.avgDownloadsPerArticle) : 0} avg per article`}
          loading={loading}
        />
        
        <MetricCard
          title="Citation Index"
          value={metrics ? metrics.citationIndex.toFixed(1) : '0.0'}
          change={8}
          changeType="increase"
          icon={<Award className="h-6 w-6 text-amber-600" />}
          description="Average citations per article"
          loading={loading}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Performance Trends */}
        <Card className="p-6 card-academic">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Content Performance Trends</h3>
            <p className="text-sm text-muted-foreground">
              Views, downloads, and publication trends over time
            </p>
          </div>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={contentTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    formatNumber(value),
                    name === 'views' ? 'Views' : 
                    name === 'downloads' ? 'Downloads' : 
                    name === 'newArticles' ? 'New Articles' : 'Citations'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#1e3a8a" 
                  strokeWidth={2}
                  name="Views"
                />
                <Line 
                  type="monotone" 
                  dataKey="downloads" 
                  stroke="#16a34a" 
                  strokeWidth={2}
                  name="Downloads"
                />
                <Line 
                  type="monotone" 
                  dataKey="citations" 
                  stroke="#d97706" 
                  strokeWidth={2}
                  name="Citations"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Field Performance */}
        <Card className="p-6 card-academic">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Performance by Field</h3>
            <p className="text-sm text-muted-foreground">
              Research field comparison by total views
            </p>
          </div>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fieldAnalytics.slice(0, 6)} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis 
                  dataKey="field" 
                  type="category"
                  tick={{ fontSize: 12 }}
                  width={100}
                />
                <Tooltip 
                  formatter={(value: number) => [formatNumber(value), 'Views']}
                />
                <Bar 
                  dataKey="totalViews" 
                  fill="#1e3a8a" 
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Top Performing Articles */}
      <Card className="p-6 card-academic">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Top Performing Articles</h3>
          <p className="text-sm text-muted-foreground">
            Articles ranked by engagement score and performance metrics
          </p>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Article</th>
                  <th className="text-left p-3 font-semibold">Field</th>
                  <th className="text-left p-3 font-semibold">Views</th>
                  <th className="text-left p-3 font-semibold">Downloads</th>
                  <th className="text-left p-3 font-semibold">Citations</th>
                  <th className="text-left p-3 font-semibold">Engagement</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {topArticles.map((article, index) => (
                  <tr key={article.id} className="border-b hover:bg-muted/30">
                    <td className="p-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold">
                              {index + 1}
                            </span>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate max-w-xs">
                            {article.title}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Published {new Date(article.publishedDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">{article.field}</Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <Eye className="h-4 w-4 text-blue-600" />
                        <span>{formatNumber(article.views)}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <Download className="h-4 w-4 text-green-600" />
                        <span>{formatNumber(article.downloads)}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <Award className="h-4 w-4 text-amber-600" />
                        <span>{article.citations}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <span>{article.engagementScore}%</span>
                        <div className="w-16 h-2 bg-muted rounded-full">
                          <div 
                            className="h-2 bg-primary rounded-full"
                            style={{ width: `${article.engagementScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <Button size="sm" variant="ghost">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Geographic Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 card-academic">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Geographic Distribution</h3>
            <p className="text-sm text-muted-foreground">
              Global reach and engagement by country
            </p>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {geographicData.slice(0, 6).map((country, index) => (
                <div key={country.countryCode} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium w-4">{index + 1}</span>
                    <Globe className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{country.country}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">{formatNumber(country.views)}</div>
                      <div className="text-xs text-muted-foreground">views</div>
                    </div>
                    <div className="w-20 h-2 bg-muted rounded-full">
                      <div 
                        className="h-2 bg-blue-500 rounded-full"
                        style={{ width: `${Math.min(country.percentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8">
                      {country.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6 card-academic">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Content Insights</h3>
            <p className="text-sm text-muted-foreground">
              Key performance indicators and trends
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Most Viewed Field</span>
              </div>
              <Badge variant="secondary">
                {metrics?.topPerformingField || 'Unknown'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Share2 className="h-5 w-5 text-green-600" />
                <span className="font-medium">Total Shares</span>
              </div>
              <span className="font-bold">
                {formatNumber(metrics?.totalShares || 0)}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Engagement Rate</span>
              </div>
              <span className="font-bold">68.5%</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-amber-600" />
                <span className="font-medium">Avg. Time on Page</span>
              </div>
              <span className="font-bold">4:32</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}