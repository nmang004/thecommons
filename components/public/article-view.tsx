'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import {
  Download,
  Share2,
  Bookmark,
  Quote,
  Eye,
  Calendar,
  ExternalLink,
  FileText,
  Printer
} from 'lucide-react'
import { OrcidProfileBadge } from '@/components/orcid/orcid-profile-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Link from 'next/link'

interface ArticleViewProps {
  article: {
    id: string
    title: string
    abstract: string
    keywords: string[]
    field_of_study: string
    subfield?: string
    published_at: string
    doi?: string
    view_count: number
    download_count: number
    citation_count: number
    funding_statement?: string
    conflict_of_interest?: string
    data_availability?: string
    author: {
      id: string
      full_name: string
      affiliation?: string
      orcid?: string
      avatar_url?: string
    }
    coauthors: Array<{
      name: string
      affiliation?: string
      orcid?: string
      author_order: number
      is_corresponding: boolean
    }>
    files: Array<{
      id: string
      file_name: string
      file_path: string
      file_type: string
      file_size: number
    }>
  }
}

export default function ArticleView({ article }: ArticleViewProps) {
  const [activeSection, setActiveSection] = useState('')
  const [isBookmarked, setIsBookmarked] = useState(false)

  // Mock article data with ORCID information for MVP demo
  const mockArticleWithOrcid = {
    ...article,
    author: {
      ...article.author,
      orcid: '0000-0002-1825-0097',
      orcidVerified: true
    },
    coauthors: [
      {
        name: 'Dr. Alex Kim',
        orcid: '0000-0002-7183-4567',
        verified: true,
        affiliation: 'UC Berkeley',
        author_order: 2,
        is_corresponding: false
      },
      {
        name: 'Dr. Maria Rodriguez',
        orcid: '',
        verified: false,
        affiliation: 'State University',
        author_order: 3,
        is_corresponding: false
      }
    ]
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { threshold: 0.5, rootMargin: '-100px 0px' }
    )

    const sections = document.querySelectorAll('section[id]')
    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])


  const generateCitation = (formatType: 'apa' | 'mla' | 'chicago' | 'bibtex') => {
    const authors = [article.author, ...article.coauthors.sort((a, b) => a.author_order - b.author_order)]
    const authorString = authors.map(a => 
      'full_name' in a ? a.full_name : a.name
    ).join(', ')
    const year = article.published_at ? new Date(article.published_at).getFullYear() : new Date().getFullYear()
    const date = article.published_at ? format(new Date(article.published_at), 'MMMM dd, yyyy') : 'No date'

    switch (formatType) {
      case 'apa':
        return `${authorString} (${year}). ${article.title}. The Commons. ${article.doi ? `https://doi.org/${article.doi}` : ''}`
      case 'mla':
        return `${authorString}. "${article.title}." The Commons, ${date}. Web.`
      case 'chicago':
        return `${authorString}. "${article.title}." The Commons. Accessed ${date}. ${article.doi ? `https://doi.org/${article.doi}` : ''}`
      case 'bibtex':
        return `@article{${article.id},
  title={${article.title}},
  author={${authorString}},
  journal={The Commons},
  year={${year}},
  ${article.doi ? `doi={${article.doi}},` : ''}
  url={https://thecommons.org/articles/${article.id}}
}`
      default:
        return ''
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: article.title,
        text: article.abstract,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const mainFile = article.files?.find(f => f.file_type === 'manuscript_main')

  return (
    <>
      {/* Article Header */}
      <header className="bg-gradient-to-r from-primary/5 to-secondary/5 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-2 mb-4">
              <Badge variant="outline">{article.field_of_study}</Badge>
              {article.subfield && <Badge variant="secondary">{article.subfield}</Badge>}
            </div>
            
            <h1 className="heading-display text-foreground mb-6 font-serif leading-tight">
              {article.title}
            </h1>

            {/* Authors */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              {[mockArticleWithOrcid.author, ...mockArticleWithOrcid.coauthors.sort((a, b) => a.author_order - b.author_order)].map((author, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={'avatar_url' in author ? author.avatar_url : undefined}
                      alt={'full_name' in author ? author.full_name : author.name}
                    />
                    <AvatarFallback>
                      {('full_name' in author ? author.full_name : author.name).split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-foreground">
                        {'full_name' in author ? author.full_name : author.name}
                        {'is_corresponding' in author && author.is_corresponding && <sup className="text-primary ml-1">*</sup>}
                      </p>
                      {/* ORCID Badge */}
                      {(author.orcid || ('orcidVerified' in author && author.orcidVerified)) && (
                        <OrcidProfileBadge
                          orcidId={author.orcid || mockArticleWithOrcid.author.orcid}
                          isVerified={('verified' in author ? author.verified : author.orcidVerified) || false}
                          variant="compact"
                        />
                      )}
                    </div>
                    {author.affiliation && (
                      <p className="text-sm text-muted-foreground">{author.affiliation}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-6">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Published {article.published_at ? format(new Date(article.published_at), 'MMMM dd, yyyy') : 'No date'}
              </div>
              {article.doi && (
                <div className="flex items-center">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  <Link href={`https://doi.org/${article.doi}`} className="hover:text-primary">
                    DOI: {article.doi}
                  </Link>
                </div>
              )}
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {article.view_count} views
                </span>
                <span className="flex items-center">
                  <Download className="h-4 w-4 mr-1" />
                  {article.download_count} downloads
                </span>
                <span className="flex items-center">
                  <Quote className="h-4 w-4 mr-1" />
                  {article.citation_count} citations
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {mainFile && (
                <Button asChild className="btn-primary">
                  <Link href={`/api/files/${mainFile.id}/download`}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Link>
                </Button>
              )}
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsBookmarked(!isBookmarked)}
              >
                <Bookmark className={`h-4 w-4 mr-2 ${isBookmarked ? 'fill-current' : ''}`} />
                Bookmark
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {/* Main Content */}
          <main className="lg:col-span-3 space-y-8">
            {/* Abstract */}
            <section id="abstract" className="prose-academic">
              <Card>
                <CardHeader>
                  <CardTitle className="heading-2">Abstract</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-lg max-w-none text-academic-lg leading-relaxed text-justify">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                    >
                      {article.abstract}
                    </ReactMarkdown>
                  </div>
                  
                  {article.keywords && article.keywords.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-semibold mb-3">Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {article.keywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="text-sm">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Main Article Content */}
            <section id="content" className="prose-academic">
              <Card>
                <CardContent className="p-8">
                  <div className="text-academic-lg leading-relaxed text-justify font-serif">
                    <p className="first-letter:text-7xl first-letter:font-bold first-letter:mr-3 first-letter:float-left first-letter:leading-[4rem] first-letter:text-primary">
                      This article content would be rendered from the full manuscript file. 
                      In a complete implementation, this would parse and display the actual 
                      article content with proper academic formatting, including sections, 
                      figures, tables, and references.
                    </p>
                    
                    <p className="mt-6">
                      The content would support LaTeX mathematics, code syntax highlighting, 
                      interactive figures, and other academic publishing features required 
                      for scholarly articles.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Additional Information */}
            {(article.funding_statement || article.conflict_of_interest || article.data_availability) && (
              <section id="additional-info">
                <Card>
                  <CardHeader>
                    <CardTitle className="heading-3">Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {article.funding_statement && (
                      <div>
                        <h4 className="font-semibold mb-2">Funding</h4>
                        <p className="text-sm text-muted-foreground">{article.funding_statement}</p>
                      </div>
                    )}
                    {article.conflict_of_interest && (
                      <div>
                        <h4 className="font-semibold mb-2">Conflicts of Interest</h4>
                        <p className="text-sm text-muted-foreground">{article.conflict_of_interest}</p>
                      </div>
                    )}
                    {article.data_availability && (
                      <div>
                        <h4 className="font-semibold mb-2">Data Availability</h4>
                        <p className="text-sm text-muted-foreground">{article.data_availability}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            )}
          </main>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Table of Contents */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contents</CardTitle>
              </CardHeader>
              <CardContent>
                <nav className="space-y-2 text-sm">
                  <Link 
                    href="#abstract" 
                    className={`block py-1 px-2 rounded hover:bg-muted transition-colors ${
                      activeSection === 'abstract' ? 'bg-primary/10 text-primary' : ''
                    }`}
                  >
                    Abstract
                  </Link>
                  <Link 
                    href="#content" 
                    className={`block py-1 px-2 rounded hover:bg-muted transition-colors ${
                      activeSection === 'content' ? 'bg-primary/10 text-primary' : ''
                    }`}
                  >
                    Main Content
                  </Link>
                  {(article.funding_statement || article.conflict_of_interest || article.data_availability) && (
                    <Link 
                      href="#additional-info" 
                      className={`block py-1 px-2 rounded hover:bg-muted transition-colors ${
                        activeSection === 'additional-info' ? 'bg-primary/10 text-primary' : ''
                      }`}
                    >
                      Additional Information
                    </Link>
                  )}
                </nav>
              </CardContent>
            </Card>

            {/* Citation Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Citation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => navigator.clipboard.writeText(generateCitation('apa'))}
                >
                  <Quote className="h-4 w-4 mr-2" />
                  Copy APA Citation
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => navigator.clipboard.writeText(generateCitation('mla'))}
                >
                  <Quote className="h-4 w-4 mr-2" />
                  Copy MLA Citation
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => navigator.clipboard.writeText(generateCitation('bibtex'))}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Copy BibTeX
                </Button>
              </CardContent>
            </Card>

            {/* Files */}
            {article.files && article.files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Files</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {article.files.map((file) => (
                    <Button
                      key={file.id}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      asChild
                    >
                      <Link href={`/api/files/${file.id}/download`}>
                        <Download className="h-4 w-4 mr-2" />
                        {file.file_name}
                      </Link>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Article Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="heading-3 text-primary">{article.view_count}</p>
                    <p className="text-xs text-muted-foreground">Views</p>
                  </div>
                  <div>
                    <p className="heading-3 text-secondary">{article.download_count}</p>
                    <p className="text-xs text-muted-foreground">Downloads</p>
                  </div>
                  <div>
                    <p className="heading-3 text-accent">{article.citation_count}</p>
                    <p className="text-xs text-muted-foreground">Citations</p>
                  </div>
                  <div>
                    <p className="heading-3 text-info">0</p>
                    <p className="text-xs text-muted-foreground">Shares</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Related Articles */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Related Articles</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Related articles would be shown here based on field of study, keywords, and citation patterns.
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </>
  )
}