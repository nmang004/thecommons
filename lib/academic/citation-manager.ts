import { cache, CACHE_TTL } from '@/lib/redis/cache'

interface Citation {
  id: string
  type: 'article' | 'book' | 'chapter' | 'conference' | 'thesis' | 'website' | 'dataset'
  title: string
  authors: Array<{
    firstName: string
    lastName: string
    middleName?: string
    suffix?: string
  }>
  year: number
  journal?: string
  volume?: string
  issue?: string
  pages?: string
  publisher?: string
  doi?: string
  url?: string
  isbn?: string
  pmid?: string
  arxivId?: string
  accessedDate?: string
  language?: string
  abstract?: string
}

interface CitationStyle {
  name: string
  format: 'apa' | 'mla' | 'chicago' | 'harvard' | 'ieee' | 'nature' | 'science' | 'vancouver'
  inText: (citation: Citation, page?: string) => string
  bibliography: (citation: Citation) => string
}

export class AcademicCitationManager {
  private static instance: AcademicCitationManager
  private citationStyles: Map<string, CitationStyle> = new Map()
  
  public static getInstance(): AcademicCitationManager {
    if (!AcademicCitationManager.instance) {
      AcademicCitationManager.instance = new AcademicCitationManager()
    }
    return AcademicCitationManager.instance
  }

  constructor() {
    this.initializeCitationStyles()
  }

  private initializeCitationStyles() {
    // APA Style (7th Edition)
    this.citationStyles.set('apa', {
      name: 'APA (7th Edition)',
      format: 'apa',
      inText: (citation: Citation, page?: string) => {
        const authors = this.formatAuthorsInText(citation.authors, 'apa')
        const pageRef = page ? `, p. ${page}` : ''
        return `(${authors}, ${citation.year}${pageRef})`
      },
      bibliography: (citation: Citation) => {
        const authors = this.formatAuthorsBibliography(citation.authors, 'apa')
        const title = this.formatTitle(citation.title, citation.type, 'apa')
        
        switch (citation.type) {
          case 'article':
            return `${authors} (${citation.year}). ${title} <em>${citation.journal}</em>${citation.volume ? `, ${citation.volume}` : ''}${citation.issue ? `(${citation.issue})` : ''}${citation.pages ? `, ${citation.pages}` : ''}. ${citation.doi ? `https://doi.org/${citation.doi}` : citation.url || ''}`
          
          case 'book':
            return `${authors} (${citation.year}). <em>${citation.title}</em>${citation.publisher ? `. ${citation.publisher}` : ''}.`
          
          default:
            return `${authors} (${citation.year}). ${title}`
        }
      }
    })

    // MLA Style (9th Edition)
    this.citationStyles.set('mla', {
      name: 'MLA (9th Edition)',
      format: 'mla',
      inText: (citation: Citation, page?: string) => {
        const author = citation.authors[0]
        const authorName = author ? author.lastName : 'Unknown'
        const pageRef = page ? ` ${page}` : ''
        return `(${authorName}${pageRef})`
      },
      bibliography: (citation: Citation) => {
        const authors = this.formatAuthorsBibliography(citation.authors, 'mla')
        
        switch (citation.type) {
          case 'article':
            return `${authors} "${citation.title}." <em>${citation.journal}</em>${citation.volume ? `, vol. ${citation.volume}` : ''}${citation.issue ? `, no. ${citation.issue}` : ''}, ${citation.year}${citation.pages ? `, pp. ${citation.pages}` : ''}.${citation.doi ? ` DOI: ${citation.doi}.` : ''}`
          
          case 'book':
            return `${authors} <em>${citation.title}</em>${citation.publisher ? `. ${citation.publisher}` : ''}, ${citation.year}.`
          
          default:
            return `${authors} "${citation.title}." ${citation.year}.`
        }
      }
    })

    // Chicago Style (17th Edition)
    this.citationStyles.set('chicago', {
      name: 'Chicago (17th Edition)',
      format: 'chicago',
      inText: (citation: Citation, page?: string) => {
        const authors = this.formatAuthorsInText(citation.authors, 'chicago')
        const pageRef = page ? `, ${page}` : ''
        return `(${authors} ${citation.year}${pageRef})`
      },
      bibliography: (citation: Citation) => {
        const authors = this.formatAuthorsBibliography(citation.authors, 'chicago')
        
        switch (citation.type) {
          case 'article':
            return `${authors} "${citation.title}." <em>${citation.journal}</em>${citation.volume ? ` ${citation.volume}` : ''}${citation.issue ? `, no. ${citation.issue}` : ''} (${citation.year})${citation.pages ? `: ${citation.pages}` : ''}.${citation.doi ? ` https://doi.org/${citation.doi}.` : ''}`
          
          case 'book':
            return `${authors} <em>${citation.title}</em>${citation.publisher ? `. ${citation.publisher}` : ''}, ${citation.year}.`
          
          default:
            return `${authors} "${citation.title}." ${citation.year}.`
        }
      }
    })

    // Nature Style
    this.citationStyles.set('nature', {
      name: 'Nature',
      format: 'nature',
      inText: (citation: Citation) => {
        // Nature uses numbered citations
        return `<sup>${citation.id}</sup>`
      },
      bibliography: (citation: Citation) => {
        const authors = this.formatAuthorsNature(citation.authors)
        
        switch (citation.type) {
          case 'article':
            return `${authors} ${citation.title}. <em>${citation.journal}</em>${citation.volume ? ` <strong>${citation.volume}</strong>` : ''}${citation.pages ? `, ${citation.pages}` : ''} (${citation.year}).`
          
          case 'book':
            return `${authors} <em>${citation.title}</em>${citation.publisher ? ` (${citation.publisher}` : ''}${citation.year ? `, ${citation.year})` : ')'}${citation.publisher ? '' : '.'}`
          
          default:
            return `${authors} ${citation.title} (${citation.year}).`
        }
      }
    })

    // IEEE Style
    this.citationStyles.set('ieee', {
      name: 'IEEE',
      format: 'ieee',
      inText: (citation: Citation) => {
        return `[${citation.id}]`
      },
      bibliography: (citation: Citation) => {
        const authors = this.formatAuthorsIEEE(citation.authors)
        
        switch (citation.type) {
          case 'article':
            return `${authors}, "${citation.title}," <em>${citation.journal}</em>${citation.volume ? `, vol. ${citation.volume}` : ''}${citation.issue ? `, no. ${citation.issue}` : ''}${citation.pages ? `, pp. ${citation.pages}` : ''}, ${citation.year}.`
          
          case 'book':
            return `${authors}, <em>${citation.title}</em>${citation.publisher ? `. ${citation.publisher}` : ''}, ${citation.year}.`
          
          default:
            return `${authors}, "${citation.title}," ${citation.year}.`
        }
      }
    })
  }

  async formatCitation(citation: Citation, style: string, format: 'inText' | 'bibliography', page?: string): Promise<string> {
    const cacheKey = `citation:${citation.id}:${style}:${format}:${page || 'nopage'}`
    
    // Try to get cached formatted citation
    const cached = await cache.get<string>(cacheKey)
    if (cached) {
      return cached
    }

    const citationStyle = this.citationStyles.get(style.toLowerCase())
    if (!citationStyle) {
      throw new Error(`Citation style '${style}' is not supported`)
    }

    let formattedCitation: string
    if (format === 'inText') {
      formattedCitation = citationStyle.inText(citation, page)
    } else {
      formattedCitation = citationStyle.bibliography(citation)
    }

    // Cache the formatted citation for 24 hours
    await cache.set(cacheKey, formattedCitation, { ttl: CACHE_TTL.VERY_LONG })
    
    return formattedCitation
  }

  async formatBibliography(citations: Citation[], style: string): Promise<string> {
    const cacheKey = `bibliography:${citations.map(c => c.id).join(',')}:${style}`
    
    const cached = await cache.get<string>(cacheKey)
    if (cached) {
      return cached
    }

    // Sort citations appropriately for the style
    const sortedCitations = this.sortCitations(citations, style)
    
    const formattedCitations = await Promise.all(
      sortedCitations.map(citation => 
        this.formatCitation(citation, style, 'bibliography')
      )
    )

    const bibliography = formattedCitations.join('\n\n')
    
    // Cache the bibliography for 24 hours
    await cache.set(cacheKey, bibliography, { ttl: CACHE_TTL.VERY_LONG })
    
    return bibliography
  }

  private sortCitations(citations: Citation[], style: string): Citation[] {
    switch (style.toLowerCase()) {
      case 'apa':
      case 'mla':
      case 'chicago':
        // Sort alphabetically by first author's last name
        return citations.sort((a, b) => {
          const aAuthor = a.authors[0]?.lastName || 'zzz'
          const bAuthor = b.authors[0]?.lastName || 'zzz'
          return aAuthor.localeCompare(bAuthor)
        })
      
      case 'nature':
      case 'ieee':
        // Keep original order (numbered citations)
        return citations
      
      default:
        return citations
    }
  }

  private formatAuthorsInText(authors: Citation['authors'], style: string): string {
    if (authors.length === 0) return 'Unknown'
    
    switch (style) {
      case 'apa':
        if (authors.length === 1) {
          return authors[0].lastName
        } else if (authors.length === 2) {
          return `${authors[0].lastName} & ${authors[1].lastName}`
        } else if (authors.length <= 20) {
          return `${authors[0].lastName} et al.`
        } else {
          return `${authors[0].lastName} et al.`
        }
      
      case 'chicago':
        if (authors.length === 1) {
          return authors[0].lastName
        } else if (authors.length === 2) {
          return `${authors[0].lastName} and ${authors[1].lastName}`
        } else {
          return `${authors[0].lastName} et al.`
        }
      
      default:
        return authors[0].lastName
    }
  }

  private formatAuthorsBibliography(authors: Citation['authors'], style: string): string {
    if (authors.length === 0) return 'Unknown Author.'
    
    switch (style) {
      case 'apa':
        return this.formatAuthorsAPA(authors)
      
      case 'mla':
        return this.formatAuthorsMLA(authors)
      
      case 'chicago':
        return this.formatAuthorsChicago(authors)
      
      default:
        return this.formatAuthorsAPA(authors)
    }
  }

  private formatAuthorsAPA(authors: Citation['authors']): string {
    if (authors.length === 0) return 'Unknown Author.'
    
    const formattedAuthors = authors.map((author, index) => {
      const initial = author.middleName ? `${author.firstName.charAt(0)}. ${author.middleName.charAt(0)}.` : `${author.firstName.charAt(0)}.`
      
      if (index === 0) {
        return `${author.lastName}, ${initial}`
      } else {
        return `${initial} ${author.lastName}`
      }
    })
    
    if (authors.length === 1) {
      return `${formattedAuthors[0]}.`
    } else if (authors.length === 2) {
      return `${formattedAuthors[0]}, & ${formattedAuthors[1]}.`
    } else {
      const lastAuthor = formattedAuthors.pop()
      return `${formattedAuthors.join(', ')}, & ${lastAuthor}.`
    }
  }

  private formatAuthorsMLA(authors: Citation['authors']): string {
    if (authors.length === 0) return 'Unknown Author.'
    
    if (authors.length === 1) {
      const author = authors[0]
      return `${author.lastName}, ${author.firstName}${author.middleName ? ` ${author.middleName}` : ''}.`
    } else {
      const firstAuthor = authors[0]
      return `${firstAuthor.lastName}, ${firstAuthor.firstName}${firstAuthor.middleName ? ` ${firstAuthor.middleName}` : ''}, et al.`
    }
  }

  private formatAuthorsChicago(authors: Citation['authors']): string {
    if (authors.length === 0) return 'Unknown Author.'
    
    const formattedAuthors = authors.map((author, index) => {
      if (index === 0) {
        return `${author.lastName}, ${author.firstName}${author.middleName ? ` ${author.middleName}` : ''}`
      } else {
        return `${author.firstName}${author.middleName ? ` ${author.middleName}` : ''} ${author.lastName}`
      }
    })
    
    if (authors.length === 1) {
      return `${formattedAuthors[0]}.`
    } else if (authors.length === 2) {
      return `${formattedAuthors[0]}, and ${formattedAuthors[1]}.`
    } else {
      const lastAuthor = formattedAuthors.pop()
      return `${formattedAuthors.join(', ')}, and ${lastAuthor}.`
    }
  }

  private formatAuthorsNature(authors: Citation['authors']): string {
    if (authors.length === 0) return 'Unknown'
    
    const formattedAuthors = authors.map(author => {
      const initial = author.middleName ? `${author.firstName.charAt(0)}. ${author.middleName.charAt(0)}.` : `${author.firstName.charAt(0)}.`
      return `${author.lastName}, ${initial}`
    })
    
    if (authors.length <= 2) {
      return formattedAuthors.join(' & ')
    } else {
      return `${formattedAuthors.slice(0, 1).join('')} et al.`
    }
  }

  private formatAuthorsIEEE(authors: Citation['authors']): string {
    if (authors.length === 0) return 'Unknown'
    
    const formattedAuthors = authors.map(author => {
      const initial = author.middleName ? `${author.firstName.charAt(0)}. ${author.middleName.charAt(0)}.` : `${author.firstName.charAt(0)}.`
      return `${initial} ${author.lastName}`
    })
    
    if (authors.length <= 6) {
      const lastAuthor = formattedAuthors.pop()
      return formattedAuthors.length > 0 ? `${formattedAuthors.join(', ')}, and ${lastAuthor}` : lastAuthor!
    } else {
      return `${formattedAuthors[0]} et al.`
    }
  }

  private formatTitle(title: string, type: Citation['type'], style: string): string {
    switch (style) {
      case 'apa':
        if (type === 'article') {
          return title // Sentence case, no quotes
        } else {
          return `<em>${title}</em>` // Italics for books
        }
      
      case 'mla':
        if (type === 'article') {
          return `"${title}"` // Quotes for articles
        } else {
          return `<em>${title}</em>` // Italics for books
        }
      
      default:
        return title
    }
  }

  async importCitationFromDOI(doi: string): Promise<Citation> {
    const cacheKey = `doi:${doi}`
    
    const cached = await cache.get<Citation>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      // In a real implementation, you would query DOI APIs like CrossRef
      // For this example, we'll return a mock citation
      const citation: Citation = {
        id: doi,
        type: 'article',
        title: 'Sample Article Title',
        authors: [
          { firstName: 'John', lastName: 'Smith' },
          { firstName: 'Jane', lastName: 'Doe' }
        ],
        year: 2023,
        journal: 'Journal of Academic Research',
        volume: '15',
        issue: '3',
        pages: '123-145',
        doi: doi
      }

      // Cache the imported citation for 30 days
      await cache.set(cacheKey, citation, { ttl: CACHE_TTL.VERY_LONG * 30 })
      
      return citation
    } catch (error) {
      console.error('DOI import error:', error)
      throw new Error('Failed to import citation from DOI')
    }
  }

  async generateCitationFromBibTeX(bibtex: string): Promise<Citation> {
    // Parse BibTeX format and convert to Citation object
    // This is a simplified parser - in production, use a proper BibTeX parser
    
    const typeMatch = bibtex.match(/@(\w+)\{/)
    const type = typeMatch ? typeMatch[1].toLowerCase() : 'article'
    
    const titleMatch = bibtex.match(/title\s*=\s*\{([^}]+)\}/)
    const title = titleMatch ? titleMatch[1] : 'Unknown Title'
    
    const yearMatch = bibtex.match(/year\s*=\s*\{?(\d{4})\}?/)
    const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear()
    
    const doiMatch = bibtex.match(/doi\s*=\s*\{([^}]+)\}/)
    const doi = doiMatch ? doiMatch[1] : undefined
    
    return {
      id: doi || `bibtex-${Date.now()}`,
      type: type as Citation['type'],
      title,
      authors: [], // Would need more complex parsing for authors
      year,
      doi
    }
  }

  getSupportedStyles(): string[] {
    return Array.from(this.citationStyles.keys())
  }

  async validateCitation(citation: Citation): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []

    // Required fields
    if (!citation.title) errors.push('Title is required')
    if (citation.authors.length === 0) errors.push('At least one author is required')
    if (!citation.year) errors.push('Year is required')

    // Year validation
    if (citation.year < 1500 || citation.year > new Date().getFullYear() + 5) {
      errors.push('Year seems invalid')
    }

    // Type-specific validation
    if (citation.type === 'article' && !citation.journal) {
      warnings.push('Journal name is recommended for articles')
    }

    if (citation.type === 'book' && !citation.publisher) {
      warnings.push('Publisher is recommended for books')
    }

    // DOI validation
    if (citation.doi && !citation.doi.match(/^10\.\d+\/.+/)) {
      errors.push('DOI format is invalid')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
}

export const citationManager = AcademicCitationManager.getInstance()