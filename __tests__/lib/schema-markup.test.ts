import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import {
  generateArticleSchema,
  generateOrganizationSchema,
  generateWebsiteSchema,
  generateBreadcrumbSchema,
  generateDataCatalogSchema,
  generateFieldCollectionSchema,
  generateAcademicPersonSchema,
  generateReviewSchema,
  generateFAQSchema,
  generateEducationalContentSchema
} from '@/lib/utils/schema-markup'

describe('Schema Markup Generation', () => {
  const originalEnv = process.env.NEXT_PUBLIC_APP_URL

  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://test.thecommons.org'
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalEnv
  })

  describe('generateArticleSchema', () => {
    const mockArticle = {
      id: 'article-123',
      title: 'Machine Learning in Healthcare',
      abstract: 'This study explores the application of machine learning algorithms in healthcare diagnostics.',
      keywords: ['machine learning', 'healthcare', 'diagnostics'],
      field_of_study: 'Computer Science',
      published_at: '2024-01-15T00:00:00.000Z',
      doi: '10.1000/test.doi',
      author: {
        full_name: 'Dr. Jane Smith',
        affiliation: 'University of Technology',
        orcid: 'https://orcid.org/0000-0002-1825-0097'
      },
      coauthors: [
        {
          name: 'Dr. John Doe',
          affiliation: 'Medical Institute',
          orcid: 'https://orcid.org/0000-0000-0000-000X'
        }
      ]
    }

    it('should generate valid ScholarlyArticle schema', () => {
      const schema = generateArticleSchema(mockArticle)

      expect(schema['@context']).toBe('https://schema.org')
      expect(schema['@type']).toBe('ScholarlyArticle')
      expect(schema.headline).toBe(mockArticle.title)
      expect(schema.description).toBe(mockArticle.abstract)
      expect(schema.datePublished).toBe(mockArticle.published_at)
      expect(schema.url).toBe('https://test.thecommons.org/articles/article-123')
    })

    it('should include author information', () => {
      const schema = generateArticleSchema(mockArticle)

      expect(schema.author).toHaveLength(2)
      expect(schema.author[0].name).toBe('Dr. Jane Smith')
      expect(schema.author[0].affiliation.name).toBe('University of Technology')
      expect(schema.author[0].identifier.value).toBe(mockArticle.author.orcid)
      expect(schema.author[1].name).toBe('Dr. John Doe')
    })

    it('should handle DOI identifier correctly', () => {
      const schema = generateArticleSchema(mockArticle)

      expect(Array.isArray(schema.identifier)).toBe(true)
      expect(schema.identifier[0].propertyID).toBe('DOI')
      expect(schema.identifier[0].value).toBe(mockArticle.doi)
      expect(schema.identifier[1].propertyID).toBe('URL')
    })

    it('should handle article without DOI', () => {
      const articleWithoutDOI = { ...mockArticle, doi: undefined }
      const schema = generateArticleSchema(articleWithoutDOI)

      expect(Array.isArray(schema.identifier)).toBe(false)
      expect(schema.identifier.propertyID).toBe('URL')
      expect(schema.identifier.value).toContain('/articles/article-123')
    })

    it('should include keywords', () => {
      const schema = generateArticleSchema(mockArticle)
      expect(schema.keywords).toBe('machine learning, healthcare, diagnostics')
    })

    it('should include publisher information', () => {
      const schema = generateArticleSchema(mockArticle)

      expect(schema.publisher.name).toBe('The Commons')
      expect(schema.publisher.url).toBe('https://test.thecommons.org')
      expect(schema.publisher.logo.url).toBe('https://test.thecommons.org/images/logo.png')
    })

    it('should set correct accessibility and license', () => {
      const schema = generateArticleSchema(mockArticle)

      expect(schema.isAccessibleForFree).toBe(true)
      expect(schema.license).toBe('https://creativecommons.org/licenses/by/4.0/')
      expect(schema.creativeWorkStatus).toBe('Published')
    })
  })

  describe('generateOrganizationSchema', () => {
    it('should generate valid Organization schema', () => {
      const schema = generateOrganizationSchema()

      expect(schema['@context']).toBe('https://schema.org')
      expect(schema['@type']).toBe('Organization')
      expect(schema.name).toBe('The Commons')
      expect(schema.url).toBe('https://test.thecommons.org')
      expect(schema.foundingDate).toBe('2024')
    })

    it('should include contact information', () => {
      const schema = generateOrganizationSchema()

      expect(schema.contactPoint.contactType).toBe('Editorial')
      expect(schema.contactPoint.email).toBe('editorial@thecommons.org')
      expect(schema.contactPoint.availableLanguage).toBe('English')
    })

    it('should include knowledge areas', () => {
      const schema = generateOrganizationSchema()

      expect(schema.knowsAbout).toContain('Academic Publishing')
      expect(schema.knowsAbout).toContain('Open Access')
      expect(schema.knowsAbout).toContain('Peer Review')
    })
  })

  describe('generateWebsiteSchema', () => {
    it('should generate valid WebSite schema with search action', () => {
      const schema = generateWebsiteSchema()

      expect(schema['@type']).toBe('WebSite')
      expect(schema.name).toBe('The Commons')
      expect(schema.potentialAction['@type']).toBe('SearchAction')
      expect(schema.potentialAction.target.urlTemplate).toContain('/search?q={search_term_string}')
    })
  })

  describe('generateBreadcrumbSchema', () => {
    it('should generate valid BreadcrumbList schema', () => {
      const items = [
        { name: 'Home', url: '/' },
        { name: 'Articles', url: '/articles' },
        { name: 'Computer Science', url: '/articles?field=computer-science' }
      ]

      const schema = generateBreadcrumbSchema(items)

      expect(schema['@type']).toBe('BreadcrumbList')
      expect(schema.itemListElement).toHaveLength(3)
      expect(schema.itemListElement[0].position).toBe(1)
      expect(schema.itemListElement[0].name).toBe('Home')
      expect(schema.itemListElement[2].position).toBe(3)
    })

    it('should handle absolute URLs correctly', () => {
      const items = [
        { name: 'External', url: 'https://external.example.com' },
        { name: 'Internal', url: '/internal' }
      ]

      const schema = generateBreadcrumbSchema(items)

      expect(schema.itemListElement[0].item).toBe('https://external.example.com')
      expect(schema.itemListElement[1].item).toBe('https://test.thecommons.org/internal')
    })
  })

  describe('generateDataCatalogSchema', () => {
    it('should generate valid DataCatalog schema', () => {
      const schema = generateDataCatalogSchema()

      expect(schema['@type']).toBe('DataCatalog')
      expect(schema.name).toBe('The Commons Article Database')
      expect(schema.dataset.isAccessibleForFree).toBe(true)
      expect(schema.dataset.license).toBe('https://creativecommons.org/licenses/by/4.0/')
    })
  })

  describe('generateFieldCollectionSchema', () => {
    it('should generate valid Collection schema', () => {
      const schema = generateFieldCollectionSchema('Computer Science', 150)

      expect(schema['@type']).toBe('Collection')
      expect(schema.name).toBe('Computer Science - Academic Articles')
      expect(schema.numberOfItems).toBe(150)
      expect(schema.about.name).toBe('Computer Science')
      expect(schema.url).toContain('field=Computer%20Science')
    })
  })

  describe('generateAcademicPersonSchema', () => {
    const mockProfile = {
      id: 'author-123',
      full_name: 'Dr. Jane Smith',
      affiliation: 'University of Technology',
      orcid: 'https://orcid.org/0000-0002-1825-0097',
      h_index: 25,
      total_publications: 45,
      bio: 'Research focus on machine learning applications in healthcare.',
      expertise: ['Machine Learning', 'Healthcare Informatics', 'Data Science']
    }

    it('should generate valid Person schema', () => {
      const schema = generateAcademicPersonSchema(mockProfile)

      expect(schema['@type']).toBe('Person')
      expect(schema.name).toBe(mockProfile.full_name)
      expect(schema.description).toBe(mockProfile.bio)
      expect(schema.url).toBe('https://test.thecommons.org/authors/author-123')
    })

    it('should include affiliation and ORCID', () => {
      const schema = generateAcademicPersonSchema(mockProfile)

      expect(schema.affiliation.name).toBe('University of Technology')
      expect(schema.identifier.propertyID).toBe('ORCID')
      expect(schema.identifier.value).toBe(mockProfile.orcid)
    })

    it('should include expertise', () => {
      const schema = generateAcademicPersonSchema(mockProfile)

      expect(schema.knowsAbout).toEqual(mockProfile.expertise)
      expect(schema.hasOccupation.name).toBe('Academic Researcher')
    })

    it('should handle missing optional fields', () => {
      const minimalProfile = {
        id: 'author-456',
        full_name: 'Dr. John Doe'
      }

      const schema = generateAcademicPersonSchema(minimalProfile)

      expect(schema.name).toBe('Dr. John Doe')
      expect(schema.affiliation).toBeUndefined()
      expect(schema.identifier).toBeUndefined()
    })
  })

  describe('generateReviewSchema', () => {
    const mockReview = {
      id: 'review-123',
      manuscript_id: 'manuscript-456',
      reviewer_name: 'Dr. Anonymous',
      recommendation: 'accept',
      submitted_at: '2024-01-20T00:00:00.000Z'
    }

    it('should generate valid Review schema', () => {
      const schema = generateReviewSchema(mockReview)

      expect(schema['@type']).toBe('Review')
      expect(schema.datePublished).toBe(mockReview.submitted_at)
      expect(schema.itemReviewed.url).toBe('https://test.thecommons.org/articles/manuscript-456')
    })

    it('should map recommendation to rating value', () => {
      const acceptSchema = generateReviewSchema({ ...mockReview, recommendation: 'accept' })
      expect(acceptSchema.reviewRating.ratingValue).toBe(5)

      const minorSchema = generateReviewSchema({ ...mockReview, recommendation: 'minor_revisions' })
      expect(minorSchema.reviewRating.ratingValue).toBe(4)

      const majorSchema = generateReviewSchema({ ...mockReview, recommendation: 'major_revisions' })
      expect(majorSchema.reviewRating.ratingValue).toBe(3)

      const rejectSchema = generateReviewSchema({ ...mockReview, recommendation: 'reject' })
      expect(rejectSchema.reviewRating.ratingValue).toBe(2)
    })

    it('should keep reviewer anonymous', () => {
      const schema = generateReviewSchema(mockReview)
      expect(schema.author.name).toBe('Anonymous Reviewer')
    })
  })

  describe('generateFAQSchema', () => {
    const mockFAQs = [
      {
        question: 'What is open access publishing?',
        answer: 'Open access publishing makes scholarly articles freely available to readers without subscription fees.'
      },
      {
        question: 'How long does peer review take?',
        answer: 'Our peer review process typically takes 4-6 weeks from submission to decision.'
      }
    ]

    it('should generate valid FAQPage schema', () => {
      const schema = generateFAQSchema(mockFAQs)

      expect(schema['@type']).toBe('FAQPage')
      expect(schema.mainEntity).toHaveLength(2)
      expect(schema.mainEntity[0]['@type']).toBe('Question')
      expect(schema.mainEntity[0].name).toBe(mockFAQs[0].question)
      expect(schema.mainEntity[0].acceptedAnswer.text).toBe(mockFAQs[0].answer)
    })
  })

  describe('generateEducationalContentSchema', () => {
    it('should generate valid LearningResource schema', () => {
      const schema = generateEducationalContentSchema(
        'Author Guidelines',
        'Comprehensive guidelines for manuscript submission',
        'https://test.thecommons.org/guidelines'
      )

      expect(schema['@type']).toBe('LearningResource')
      expect(schema.name).toBe('Author Guidelines')
      expect(schema.learningResourceType).toBe('Guidelines')
      expect(schema.educationalLevel).toBe('Graduate')
      expect(schema.audience.educationalRole).toBe('Researcher')
      expect(schema.isAccessibleForFree).toBe(true)
    })
  })

  describe('Environment handling', () => {
    it('should use default URL when environment variable is not set', () => {
      delete process.env.NEXT_PUBLIC_APP_URL
      
      const schema = generateOrganizationSchema()
      expect(schema.url).toBe('https://thecommons.org')
    })

    it('should use environment URL when set', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://custom.domain.com'
      
      const schema = generateOrganizationSchema()
      expect(schema.url).toBe('https://custom.domain.com')
    })
  })
})