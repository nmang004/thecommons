// Enhanced Review System Types
// Comprehensive interfaces for the advanced review submission system

export interface ScoreWithComments {
  score: number // 1-5 scale
  comments: string
  weight?: number // For weighted scoring
}

export interface Comment {
  id: string
  text: string
  type: 'major' | 'minor' | 'suggestion' | 'positive' | 'question'
  category?: string
  lineNumber?: number
  resolved?: boolean
  createdAt: Date
  updatedAt?: Date
}

export interface PlagiarismReport {
  detected: boolean
  similarity: number // percentage
  sources: Array<{
    url: string
    title: string
    similarity: number
  }>
  report?: string
}

export interface StatisticalReview {
  appropriateMethods: boolean
  sampleSizeAdequate: boolean
  statisticalSignificance: boolean
  effectSizeReported: boolean
  confidenceIntervalsReported: boolean
  multipleTestingAccounted: boolean
  comments: string
}

export interface DataReview {
  dataAvailable: boolean
  dataLocation?: string
  dataFormat: string
  accessRestrictions?: string
  reproducible: boolean
  comments: string
}

export interface CodeReview {
  codeAvailable: boolean
  codeLocation?: string
  language: string
  documentation: 'none' | 'minimal' | 'adequate' | 'comprehensive'
  reproducible: boolean
  comments: string
}

export interface FigureReview {
  figureNumber: string
  quality: 'poor' | 'fair' | 'good' | 'excellent'
  clarity: 'poor' | 'fair' | 'good' | 'excellent'
  relevance: 'low' | 'medium' | 'high'
  suggestions: string
}

// Core review form structure
export interface ReviewForm {
  // Basic identification
  id?: string
  manuscriptId: string
  reviewerId: string
  assignmentId?: string
  templateId?: string
  
  // Review sections
  sections: {
    summary: {
      recommendation: 'accept' | 'minor_revision' | 'major_revision' | 'reject'
      confidence: 1 | 2 | 3 | 4 | 5
      expertise: 1 | 2 | 3 | 4 | 5
      overallAssessment?: string
    }
    
    qualityAssessment: {
      originality: ScoreWithComments
      significance: ScoreWithComments
      methodology: ScoreWithComments
      clarity: ScoreWithComments
      references: ScoreWithComments
      ethics?: ScoreWithComments
      reproducibility?: ScoreWithComments
    }
    
    detailedComments: {
      majorIssues: Comment[]
      minorIssues: Comment[]
      suggestions: Comment[]
      positiveAspects: Comment[]
      questionsForAuthors?: Comment[]
    }
    
    confidentialComments: {
      editorOnly: string
      ethicalConcerns?: string
      suspectedPlagiarism?: PlagiarismReport
      recommendedAction?: string
    }
    
    technicalReview?: {
      statistics?: StatisticalReview
      dataAvailability?: DataReview
      codeReproducibility?: CodeReview
      figuresAndTables?: FigureReview[]
      methodology?: {
        appropriate: boolean
        rigorous: boolean
        limitations: string
        suggestions: string
      }
    }
  }
  
  // Progress tracking
  progress: {
    sectionsCompleted: string[]
    timeSpent: number // in minutes
    lastSaved: Date
    autoSaveEnabled: boolean
    completionPercentage: number
  }
  
  // Collaboration
  isCollaborative?: boolean
  coReviewers?: string[]
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  submittedAt?: Date
  version: number
  isDraft: boolean
}

// PDF Annotation types
export interface PDFAnnotation {
  id: string
  reviewId?: string
  draftId?: string
  type: 'comment' | 'highlight' | 'drawing' | 'sticky_note'
  pageNumber: number
  position: {
    x: number
    y: number
    width: number
    height: number
  }
  highlightedText?: string
  commentText: string
  category: 'major' | 'minor' | 'suggestion' | 'positive' | 'question'
  isResolved: boolean
  createdAt: Date
  updatedAt: Date
}

// Review Template types
export interface ReviewTemplate {
  id: string
  name: string
  description: string
  fieldOfStudy: string
  templateData: {
    sections: {
      qualityAssessment: Record<string, {
        weight: number
        description: string
        required?: boolean
      }>
      technicalReview?: Record<string, {
        required: boolean
        description?: string
      }>
    }
    scoringScale: {
      min: number
      max: number
      labels: string[]
    }
    customFields?: Array<{
      name: string
      type: 'text' | 'number' | 'select' | 'boolean'
      required: boolean
      options?: string[]
    }>
  }
  isPublic: boolean
  createdBy?: string
  usageCount: number
  version: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Review Draft for auto-saving
export interface ReviewDraft {
  id: string
  manuscriptId: string
  reviewerId: string
  assignmentId?: string
  formData: Partial<ReviewForm>
  completionPercentage: number
  timeSpentMinutes: number
  sectionsCompleted: string[]
  lastSavedAt: Date
  createdAt: Date
}

// Review tools interfaces
export interface ReviewTools {
  pdfAnnotation: {
    enabled: boolean
    annotations: PDFAnnotation[]
    currentTool: 'select' | 'highlight' | 'comment' | 'drawing'
  }
  
  citationChecker: {
    enabled: boolean
    checkedCitations: Array<{
      citation: string
      valid: boolean
      suggestions?: string[]
    }>
  }
  
  plagiarismChecker: {
    enabled: boolean
    results?: PlagiarismReport
    lastChecked?: Date
  }
  
  statisticsValidator: {
    enabled: boolean
    checks: Array<{
      test: string
      valid: boolean
      comment: string
    }>
  }
}

// State management types
export interface ReviewFormState {
  // Current review data
  form: ReviewForm | null
  draft: ReviewDraft | null
  template: ReviewTemplate | null
  
  // UI state
  currentSection: string
  isSubmitting: boolean
  isSaving: boolean
  hasUnsavedChanges: boolean
  validationErrors: Record<string, string[]>
  
  // Tools state
  tools: ReviewTools
  
  // Actions
  loadReview: (manuscriptId: string, assignmentId?: string) => Promise<void>
  saveDraft: () => Promise<void>
  submitReview: () => Promise<void>
  updateSection: (section: string, data: any) => void
  setCurrentSection: (section: string) => void
  addAnnotation: (annotation: Omit<PDFAnnotation, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateAnnotation: (id: string, updates: Partial<PDFAnnotation>) => void
  deleteAnnotation: (id: string) => void
  addComment: (section: keyof ReviewForm['sections']['detailedComments'], comment: Omit<Comment, 'id' | 'createdAt'>) => void
  updateComment: (section: keyof ReviewForm['sections']['detailedComments'], commentId: string, updates: Partial<Comment>) => void
  deleteComment: (section: keyof ReviewForm['sections']['detailedComments'], commentId: string) => void
  validateSection: (section: string) => boolean
  calculateProgress: () => number
  resetForm: () => void
}

// API response types
export interface ReviewFormResponse {
  success: boolean
  data?: ReviewForm | ReviewDraft
  template?: ReviewTemplate
  manuscript?: {
    id: string
    title: string
    authors: string[]
    abstract: string
    keywords: string[]
    fieldOfStudy: string
  }
  assignment?: {
    id: string
    dueDate: string
    status: string
  }
  error?: string
}

export interface ReviewSubmissionResponse {
  success: boolean
  reviewId?: string
  message: string
  validationErrors?: Record<string, string[]>
  error?: string
}

// Export utility types
export type ReviewStatus = 'draft' | 'submitted' | 'under_revision' | 'final'
export type ReviewRecommendation = 'accept' | 'minor_revision' | 'major_revision' | 'reject'
export type QualityAspect = 'originality' | 'significance' | 'methodology' | 'clarity' | 'references' | 'ethics' | 'reproducibility'
export type CommentType = 'major' | 'minor' | 'suggestion' | 'positive' | 'question'
export type AnnotationType = 'comment' | 'highlight' | 'drawing' | 'sticky_note'