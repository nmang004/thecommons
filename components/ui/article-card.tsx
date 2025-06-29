'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Calendar, User, Download, Eye, Star, Share2, Bookmark } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import type { Manuscript, Profile } from '@/types/database'

interface ArticleCardProps {
  article: Manuscript & {
    author: Profile
    coauthors?: { name: string; affiliation?: string | null }[]
  }
  variant?: 'default' | 'compact' | 'featured'
  showActions?: boolean
  className?: string
}

export default function ArticleCard({
  article,
  variant = 'default',
  showActions = true,
  className,
}: ArticleCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [bookmarkCount, setBookmarkCount] = useState(0)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'badge-success'
      case 'accepted':
        return 'badge-primary'
      case 'under_review':
        return 'badge-warning'
      case 'submitted':
        return 'badge-secondary'
      default:
        return 'badge-secondary'
    }
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    setBookmarkCount(prev => isBookmarked ? prev - 1 : prev + 1)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.abstract,
          url: window.location.origin + `/articles/${article.id}`,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.origin + `/articles/${article.id}`)
    }
  }

  if (variant === 'compact') {
    return (
      <Card className={`card-academic transition-all hover:shadow-md ${className}`}>
        <CardContent className="p-4">
          <div className="flex space-x-3">
            <div className="flex-shrink-0">
              <Avatar className="h-10 w-10">
                <AvatarImage src={article.author.avatar_url || ''} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {article.author.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 min-w-0">
              <Link
                href={`/articles/${article.id}`}
                className="block hover:text-primary transition-colors"
              >
                <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-1">
                  {article.title}
                </h3>
              </Link>
              <p className="text-xs text-muted-foreground mb-2">
                {article.author.full_name}
                {article.coauthors && article.coauthors.length > 0 &&
                  ` +${article.coauthors.length} more`}
              </p>
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>{formatDate(article.published_at || article.created_at)}</span>
                <span>{article.field_of_study}</span>
                <div className="flex items-center space-x-1">
                  <Eye className="h-3 w-3" />
                  <span>{article.view_count}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (variant === 'featured') {
    return (
      <Card className={`card-academic overflow-hidden ${className}`}>
        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-6">
          <div className="flex items-start justify-between mb-3">
            <Badge className={getStatusColor(article.status)} variant="secondary">
              {article.status === 'published' ? 'Published' : 'Featured'}
            </Badge>
            {showActions && (
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBookmark}
                  className="h-8 w-8 p-0"
                >
                  <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="h-8 w-8 p-0"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <Link
            href={`/articles/${article.id}`}
            className="block hover:text-primary transition-colors"
          >
            <h2 className="heading-3 line-clamp-2 mb-3">{article.title}</h2>
          </Link>
          <p className="text-muted-foreground mb-4 line-clamp-3">
            {article.abstract}
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {article.keywords?.slice(0, 4).map((keyword) => (
              <Badge key={keyword} variant="outline" className="text-xs">
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
        
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={article.author.avatar_url || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {article.author.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{article.author.full_name}</p>
              <p className="text-xs text-muted-foreground">
                {article.author.affiliation}
              </p>
            </div>
          </div>

          {article.coauthors && article.coauthors.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Co-authors:</p>
              <div className="space-y-1">
                {article.coauthors.slice(0, 3).map((coauthor, index) => (
                  <p key={index} className="text-xs">
                    {coauthor.name}
                    {coauthor.affiliation && (
                      <span className="text-muted-foreground">
                        , {coauthor.affiliation}
                      </span>
                    )}
                  </p>
                ))}
                {article.coauthors.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{article.coauthors.length - 3} more authors
                  </p>
                )}
              </div>
            </div>
          )}

          <Separator className="mb-4" />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(article.published_at || article.created_at)}</span>
              </div>
              <span>{article.field_of_study}</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <Eye className="h-3 w-3" />
                <span>{article.view_count.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Download className="h-3 w-3" />
                <span>{article.download_count.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default variant
  return (
    <Card className={`card-academic ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Badge className={getStatusColor(article.status)} variant="secondary">
            {article.status.replace('_', ' ').toUpperCase()}
          </Badge>
          {showActions && (
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBookmark}
                className="h-8 w-8 p-0"
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="h-8 w-8 p-0"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <Link
          href={`/articles/${article.id}`}
          className="block hover:text-primary transition-colors"
        >
          <h3 className="heading-4 line-clamp-2 mb-2">{article.title}</h3>
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {truncateText(article.abstract, 200)}
        </p>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex flex-wrap gap-1 mb-3">
          {article.keywords?.slice(0, 3).map((keyword) => (
            <Badge key={keyword} variant="outline" className="text-xs">
              {keyword}
            </Badge>
          ))}
        </div>

        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={article.author.avatar_url || ''} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {article.author.full_name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{article.author.full_name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {article.author.affiliation}
            </p>
          </div>
        </div>

        {article.coauthors && article.coauthors.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            +{article.coauthors.length} co-author{article.coauthors.length > 1 ? 's' : ''}
          </p>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t border-border">
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(article.published_at || article.created_at)}</span>
            </div>
            <span>{article.field_of_study}</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Eye className="h-3 w-3" />
              <span>{article.view_count}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Download className="h-3 w-3" />
              <span>{article.download_count}</span>
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}