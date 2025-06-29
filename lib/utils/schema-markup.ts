interface Article {
  id: string
  title: string
  abstract: string
  keywords?: string[]
  field_of_study: string
  published_at: string
  doi?: string
  author: {
    full_name: string
    affiliation?: string
    orcid?: string
  }
  coauthors?: Array<{
    name: string
    affiliation?: string
    orcid?: string
  }>
}

export function generateArticleSchema(article: Article) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thecommons.org'
  
  const authors = [
    article.author,
    ...(article.coauthors || [])
  ].map(author => ({
    '@type': 'Person',
    'name': 'full_name' in author ? author.full_name : 'name' in author ? author.name : '',
    'affiliation': author.affiliation ? {
      '@type': 'Organization',
      'name': author.affiliation
    } : undefined,
    'identifier': author.orcid ? {
      '@type': 'PropertyValue',
      'propertyID': 'ORCID',
      'value': author.orcid
    } : undefined
  }))

  return {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    'headline': article.title,
    'description': article.abstract,
    'author': authors,
    'publisher': {
      '@type': 'Organization',
      'name': 'The Commons',
      'url': baseUrl,
      'logo': {
        '@type': 'ImageObject',
        'url': `${baseUrl}/images/logo.png`
      }
    },
    'datePublished': article.published_at,
    'dateModified': article.published_at,
    'url': `${baseUrl}/articles/${article.id}`,
    'identifier': article.doi ? [
      {
        '@type': 'PropertyValue',
        'propertyID': 'DOI',
        'value': article.doi
      },
      {
        '@type': 'PropertyValue',
        'propertyID': 'URL',
        'value': `${baseUrl}/articles/${article.id}`
      }
    ] : {
      '@type': 'PropertyValue',
      'propertyID': 'URL',
      'value': `${baseUrl}/articles/${article.id}`
    },
    'keywords': article.keywords?.join(', '),
    'about': {
      '@type': 'Thing',
      'name': article.field_of_study
    },
    'isPartOf': {
      '@type': 'Periodical',
      'name': 'The Commons',
      'issn': '2999-9999', // You would need to get an actual ISSN
      'publisher': {
        '@type': 'Organization',
        'name': 'The Commons'
      }
    },
    'license': 'https://creativecommons.org/licenses/by/4.0/',
    'copyrightHolder': {
      '@type': 'Organization',
      'name': 'The Commons'
    },
    'copyrightYear': new Date(article.published_at).getFullYear(),
    'isAccessibleForFree': true,
    'creativeWorkStatus': 'Published'
  }
}

export function generateOrganizationSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thecommons.org'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'The Commons',
    'alternateName': 'The Commons Academic Publishing',
    'url': baseUrl,
    'logo': {
      '@type': 'ImageObject',
      'url': `${baseUrl}/images/logo.png`,
      'width': 512,
      'height': 512
    },
    'description': 'Open access academic publishing platform democratizing access to scholarly knowledge through fair pricing, transparent peer review, and immediate global accessibility.',
    'foundingDate': '2024',
    'contactPoint': {
      '@type': 'ContactPoint',
      'contactType': 'Editorial',
      'email': 'editorial@thecommons.org',
      'availableLanguage': 'English'
    },
    'sameAs': [
      // Add social media URLs when available
      // 'https://twitter.com/thecommons',
      // 'https://linkedin.com/company/thecommons'
    ],
    'publishingPrinciples': `${baseUrl}/guidelines`,
    'knowsAbout': [
      'Academic Publishing',
      'Open Access',
      'Peer Review',
      'Scholarly Communication',
      'Research Dissemination'
    ]
  }
}

export function generateWebsiteSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thecommons.org'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'The Commons',
    'url': baseUrl,
    'description': 'Open access academic publishing platform',
    'publisher': {
      '@type': 'Organization',
      'name': 'The Commons'
    },
    'potentialAction': {
      '@type': 'SearchAction',
      'target': {
        '@type': 'EntryPoint',
        'urlTemplate': `${baseUrl}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  }
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thecommons.org'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`
    }))
  }
}

export function generateDataCatalogSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thecommons.org'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'DataCatalog',
    'name': 'The Commons Article Database',
    'description': 'Comprehensive database of open access academic articles across all fields of study',
    'url': `${baseUrl}/articles`,
    'publisher': {
      '@type': 'Organization',
      'name': 'The Commons'
    },
    'dataset': {
      '@type': 'Dataset',
      'name': 'Open Access Academic Articles',
      'description': 'Collection of peer-reviewed academic articles published under open access license',
      'license': 'https://creativecommons.org/licenses/by/4.0/',
      'isAccessibleForFree': true
    }
  }
}

// Academic collection schema for field-specific pages
export function generateFieldCollectionSchema(field: string, articleCount: number) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thecommons.org'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Collection',
    'name': `${field} - Academic Articles`,
    'description': `Collection of peer-reviewed academic articles in ${field}`,
    'url': `${baseUrl}/articles?field=${encodeURIComponent(field)}`,
    'numberOfItems': articleCount,
    'about': {
      '@type': 'Thing',
      'name': field
    },
    'isPartOf': {
      '@type': 'DataCatalog',
      'name': 'The Commons Article Database',
      'url': `${baseUrl}/articles`
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'The Commons'
    }
  }
}

// Academic person schema for author profiles
export function generateAcademicPersonSchema(profile: {
  id: string
  full_name: string
  affiliation?: string
  orcid?: string
  h_index?: number
  total_publications?: number
  bio?: string
  expertise?: string[]
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thecommons.org'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    'name': profile.full_name,
    'description': profile.bio,
    'url': `${baseUrl}/authors/${profile.id}`,
    'affiliation': profile.affiliation ? {
      '@type': 'Organization',
      'name': profile.affiliation
    } : undefined,
    'identifier': profile.orcid ? {
      '@type': 'PropertyValue',
      'propertyID': 'ORCID',
      'value': profile.orcid
    } : undefined,
    'knowsAbout': profile.expertise,
    'hasOccupation': {
      '@type': 'Occupation',
      'name': 'Academic Researcher'
    },
    'memberOf': {
      '@type': 'Organization',
      'name': 'The Commons Community'
    }
  }
}

// Review schema for peer review metadata
export function generateReviewSchema(review: {
  id: string
  manuscript_id: string
  reviewer_name: string
  recommendation: string
  submitted_at: string
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thecommons.org'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    'reviewBody': 'Peer review completed for academic manuscript',
    'reviewRating': {
      '@type': 'Rating',
      'ratingValue': review.recommendation === 'accept' ? 5 : 
                    review.recommendation === 'minor_revisions' ? 4 :
                    review.recommendation === 'major_revisions' ? 3 : 2,
      'bestRating': 5,
      'worstRating': 1
    },
    'author': {
      '@type': 'Person',
      'name': 'Anonymous Reviewer' // Keep reviewers anonymous
    },
    'datePublished': review.submitted_at,
    'itemReviewed': {
      '@type': 'ScholarlyArticle',
      'url': `${baseUrl}/articles/${review.manuscript_id}`
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'The Commons'
    }
  }
}

// FAQ schema for guidelines pages
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer
      }
    }))
  }
}

// Course/educational content schema for guidelines
export function generateEducationalContentSchema(title: string, description: string, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    'name': title,
    'description': description,
    'url': url,
    'learningResourceType': 'Guidelines',
    'educationalLevel': 'Graduate',
    'audience': {
      '@type': 'EducationalAudience',
      'educationalRole': 'Researcher'
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'The Commons'
    },
    'isAccessibleForFree': true,
    'inLanguage': 'en'
  }
}