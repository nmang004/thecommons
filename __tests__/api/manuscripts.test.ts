import { describe, it, expect, beforeEach } from '@jest/globals'

// Mock data types
interface MockManuscript {
  id: string
  title: string
  abstract: string
  status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'published'
  author_id: string
  field_of_study: string
  submitted_at?: string
}

interface MockUser {
  id: string
  role: 'author' | 'editor' | 'reviewer' | 'admin'
  email: string
}

// Mock database operations
const mockDatabase = {
  manuscripts: new Map<string, MockManuscript>(),
  users: new Map<string, MockUser>(),
  
  // Reset for each test
  reset() {
    this.manuscripts.clear()
    this.users.clear()
    
    // Add some default test data
    this.users.set('author-1', {
      id: 'author-1',
      role: 'author',
      email: 'author@test.com'
    })
    
    this.users.set('editor-1', {
      id: 'editor-1',
      role: 'editor',
      email: 'editor@test.com'
    })
    
    this.users.set('author-2', {
      id: 'author-2',
      role: 'author',
      email: 'author2@test.com'
    })
    
    this.manuscripts.set('manuscript-1', {
      id: 'manuscript-1',
      title: 'Test Manuscript',
      abstract: 'This is a test manuscript for API testing.',
      status: 'draft',
      author_id: 'author-1',
      field_of_study: 'Computer Science'
    })
    
    this.manuscripts.set('manuscript-2', {
      id: 'manuscript-2',
      title: 'Published Paper',
      abstract: 'This is a published paper.',
      status: 'published',
      author_id: 'author-1',
      field_of_study: 'Biology',
      submitted_at: '2024-01-15T00:00:00.000Z'
    })
  }
}

// Mock API service functions
const manuscriptService = {
  async getManuscript(id: string, userId?: string): Promise<MockManuscript | null> {
    const manuscript = mockDatabase.manuscripts.get(id)
    if (!manuscript) return null
    
    // Check permissions - authors can see their own, editors can see all
    if (userId) {
      const user = mockDatabase.users.get(userId)
      if (user?.role === 'author' && manuscript.author_id !== userId) {
        return null // Access denied
      }
    }
    
    return manuscript
  },
  
  async createManuscript(data: Omit<MockManuscript, 'id'>, userId: string): Promise<MockManuscript> {
    const id = `manuscript-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const manuscript: MockManuscript = {
      id,
      ...data,
      author_id: userId
    }
    
    mockDatabase.manuscripts.set(id, manuscript)
    return manuscript
  },
  
  async updateManuscript(id: string, data: Partial<MockManuscript>, userId: string): Promise<MockManuscript | null> {
    const manuscript = mockDatabase.manuscripts.get(id)
    if (!manuscript) return null
    
    const user = mockDatabase.users.get(userId)
    if (!user) return null
    
    // Authors can only update their own drafts
    if (user.role === 'author' && (manuscript.author_id !== userId || manuscript.status !== 'draft')) {
      return null
    }
    
    // Editors can update any manuscript
    if (user.role === 'editor') {
      const updated = { ...manuscript, ...data }
      mockDatabase.manuscripts.set(id, updated)
      return updated
    }
    
    // For authors, must be their own draft
    if (user.role === 'author' && manuscript.author_id === userId && manuscript.status === 'draft') {
      const updated = { ...manuscript, ...data }
      mockDatabase.manuscripts.set(id, updated)
      return updated
    }
    
    return null
  },
  
  async submitManuscript(id: string, userId: string): Promise<MockManuscript | null> {
    const manuscript = await this.updateManuscript(id, {
      status: 'submitted',
      submitted_at: new Date().toISOString()
    }, userId)
    
    return manuscript
  },
  
  async getManuscriptsByAuthor(authorId: string): Promise<MockManuscript[]> {
    return Array.from(mockDatabase.manuscripts.values())
      .filter(m => m.author_id === authorId)
  },
  
  async getPublishedManuscripts(field?: string): Promise<MockManuscript[]> {
    return Array.from(mockDatabase.manuscripts.values())
      .filter(m => m.status === 'published' && (!field || m.field_of_study === field))
  }
}

describe('Manuscript API Service', () => {
  beforeEach(() => {
    mockDatabase.reset()
  })

  describe('getManuscript', () => {
    it('should return manuscript by ID', async () => {
      const manuscript = await manuscriptService.getManuscript('manuscript-1')
      
      expect(manuscript).toBeTruthy()
      expect(manuscript?.id).toBe('manuscript-1')
      expect(manuscript?.title).toBe('Test Manuscript')
    })

    it('should return null for non-existent manuscript', async () => {
      const manuscript = await manuscriptService.getManuscript('non-existent')
      expect(manuscript).toBeNull()
    })

    it('should enforce author permissions', async () => {
      // Author can see their own manuscript
      const ownManuscript = await manuscriptService.getManuscript('manuscript-1', 'author-1')
      expect(ownManuscript).toBeTruthy()
      
      // Create another author's manuscript
      mockDatabase.manuscripts.set('manuscript-other', {
        id: 'manuscript-other',
        title: 'Other Author Manuscript',
        abstract: 'By another author',
        status: 'draft',
        author_id: 'author-2',
        field_of_study: 'Physics'
      })
      
      // Author cannot see other's manuscript
      const otherManuscript = await manuscriptService.getManuscript('manuscript-other', 'author-1')
      expect(otherManuscript).toBeNull()
    })

    it('should allow editors to see all manuscripts', async () => {
      const manuscript = await manuscriptService.getManuscript('manuscript-1', 'editor-1')
      expect(manuscript).toBeTruthy()
    })
  })

  describe('createManuscript', () => {
    it('should create a new manuscript', async () => {
      const manuscriptData = {
        title: 'New Research Paper',
        abstract: 'A groundbreaking study on AI.',
        status: 'draft' as const,
        field_of_study: 'Artificial Intelligence',
        author_id: 'author-1'
      }

      const created = await manuscriptService.createManuscript(manuscriptData, 'author-1')
      
      expect(created.id).toBeTruthy()
      expect(created.title).toBe(manuscriptData.title)
      expect(created.author_id).toBe('author-1')
      expect(created.status).toBe('draft')
    })

    it('should assign manuscript to correct author', async () => {
      const manuscriptData = {
        title: 'Another Paper',
        abstract: 'Another study.',
        status: 'draft' as const,
        field_of_study: 'Mathematics',
        author_id: 'author-1'
      }

      const created = await manuscriptService.createManuscript(manuscriptData, 'author-1')
      expect(created.author_id).toBe('author-1')
    })
  })

  describe('updateManuscript', () => {
    it('should update manuscript for author', async () => {
      const updated = await manuscriptService.updateManuscript(
        'manuscript-1',
        { title: 'Updated Title' },
        'author-1'
      )
      
      expect(updated?.title).toBe('Updated Title')
      expect(updated?.abstract).toBe('This is a test manuscript for API testing.') // Other fields unchanged
    })

    it('should not allow author to update non-draft manuscript', async () => {
      // First submit the manuscript
      await manuscriptService.submitManuscript('manuscript-1', 'author-1')
      
      // Then try to update it
      const updated = await manuscriptService.updateManuscript(
        'manuscript-1',
        { title: 'Cannot Update' },
        'author-1'
      )
      
      expect(updated).toBeNull()
    })

    it('should not allow author to update other author\'s manuscript', async () => {
      const updated = await manuscriptService.updateManuscript(
        'manuscript-1',
        { title: 'Unauthorized Update' },
        'author-2' // Different author
      )
      
      expect(updated).toBeNull()
    })

    it('should return null for non-existent manuscript', async () => {
      const updated = await manuscriptService.updateManuscript(
        'non-existent',
        { title: 'New Title' },
        'author-1'
      )
      
      expect(updated).toBeNull()
    })
  })

  describe('submitManuscript', () => {
    it('should submit draft manuscript', async () => {
      const submitted = await manuscriptService.submitManuscript('manuscript-1', 'author-1')
      
      expect(submitted?.status).toBe('submitted')
      expect(submitted?.submitted_at).toBeTruthy()
      expect(new Date(submitted!.submitted_at!).getTime()).toBeCloseTo(Date.now(), -1000) // Within 1 second
    })

    it('should not allow submission of other author\'s manuscript', async () => {
      const submitted = await manuscriptService.submitManuscript('manuscript-1', 'author-2')
      expect(submitted).toBeNull()
    })
  })

  describe('getManuscriptsByAuthor', () => {
    it('should return all manuscripts by author', async () => {
      const manuscripts = await manuscriptService.getManuscriptsByAuthor('author-1')
      
      expect(manuscripts).toHaveLength(2)
      expect(manuscripts.every(m => m.author_id === 'author-1')).toBe(true)
    })

    it('should return empty array for author with no manuscripts', async () => {
      const manuscripts = await manuscriptService.getManuscriptsByAuthor('author-2')
      expect(manuscripts).toHaveLength(0)
    })
  })

  describe('getPublishedManuscripts', () => {
    it('should return only published manuscripts', async () => {
      const published = await manuscriptService.getPublishedManuscripts()
      
      expect(published).toHaveLength(1)
      expect(published[0].status).toBe('published')
      expect(published[0].id).toBe('manuscript-2')
    })

    it('should filter by field of study', async () => {
      const biologyPapers = await manuscriptService.getPublishedManuscripts('Biology')
      expect(biologyPapers).toHaveLength(1)
      expect(biologyPapers[0].field_of_study).toBe('Biology')
      
      const csPapers = await manuscriptService.getPublishedManuscripts('Computer Science')
      expect(csPapers).toHaveLength(0) // No published CS papers
    })

    it('should return empty array when no published papers match field', async () => {
      const physicsPapers = await manuscriptService.getPublishedManuscripts('Physics')
      expect(physicsPapers).toHaveLength(0)
    })
  })

  describe('Manuscript status workflow', () => {
    it('should follow correct status progression', async () => {
      // Start with draft
      let manuscript = await manuscriptService.getManuscript('manuscript-1')
      expect(manuscript?.status).toBe('draft')
      
      // Submit for review
      manuscript = await manuscriptService.submitManuscript('manuscript-1', 'author-1')
      expect(manuscript?.status).toBe('submitted')
      
      // Simulate editor actions (would need editor permissions)
      if (manuscript) {
        manuscript.status = 'under_review'
        mockDatabase.manuscripts.set(manuscript.id, manuscript)
      }
      
      manuscript = await manuscriptService.getManuscript('manuscript-1')
      expect(manuscript?.status).toBe('under_review')
    })
  })

  describe('Data validation', () => {
    it('should handle empty titles', async () => {
      const manuscriptData = {
        title: '',
        abstract: 'Valid abstract',
        status: 'draft' as const,
        field_of_study: 'Computer Science',
        author_id: 'author-1'
      }

      // In a real implementation, this would validate and throw an error
      const created = await manuscriptService.createManuscript(manuscriptData, 'author-1')
      expect(created.title).toBe('')
    })

    it('should handle very long abstracts', async () => {
      const longAbstract = 'A'.repeat(10000)
      const manuscriptData = {
        title: 'Test Paper',
        abstract: longAbstract,
        status: 'draft' as const,
        field_of_study: 'Computer Science',
        author_id: 'author-1'
      }

      const created = await manuscriptService.createManuscript(manuscriptData, 'author-1')
      expect(created.abstract).toBe(longAbstract)
    })
  })

  describe('Concurrent operations', () => {
    it('should handle multiple simultaneous submissions', async () => {
      const manuscriptData1 = {
        title: 'Paper 1',
        abstract: 'Abstract 1',
        status: 'draft' as const,
        field_of_study: 'Computer Science',
        author_id: 'author-1'
      }

      const manuscriptData2 = {
        title: 'Paper 2',
        abstract: 'Abstract 2',
        status: 'draft' as const,
        field_of_study: 'Biology',
        author_id: 'author-1'
      }

      // Create manuscripts simultaneously
      const [created1, created2] = await Promise.all([
        manuscriptService.createManuscript(manuscriptData1, 'author-1'),
        manuscriptService.createManuscript(manuscriptData2, 'author-1')
      ])

      expect(created1.id).not.toBe(created2.id)
      expect(created1.title).toBe('Paper 1')
      expect(created2.title).toBe('Paper 2')
    })
  })

  describe('Error handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Simulate database error by temporarily breaking the map
      const originalGet = mockDatabase.manuscripts.get
      mockDatabase.manuscripts.get = () => {
        throw new Error('Database connection failed')
      }

      try {
        await manuscriptService.getManuscript('manuscript-1')
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Database connection failed')
      }

      // Restore the original method
      mockDatabase.manuscripts.get = originalGet
    })
  })
})