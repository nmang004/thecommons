'use client'

import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { 
  ReviewForm, 
  ReviewDraft, 
  ReviewTemplate, 
  ReviewFormState, 
  PDFAnnotation, 
  Comment,
  ReviewTools
} from '@/types/review'

// Auto-save interval (30 seconds)
const AUTO_SAVE_INTERVAL = 30 * 1000

// Initial form data structure
const initialForm: Partial<ReviewForm> = {
  sections: {
    summary: {
      recommendation: undefined as any,
      confidence: undefined as any,
      expertise: undefined as any,
    },
    qualityAssessment: {
      originality: { score: 0, comments: '' },
      significance: { score: 0, comments: '' },
      methodology: { score: 0, comments: '' },
      clarity: { score: 0, comments: '' },
      references: { score: 0, comments: '' },
    },
    detailedComments: {
      majorIssues: [],
      minorIssues: [],
      suggestions: [],
      positiveAspects: [],
    },
    confidentialComments: {
      editorOnly: '',
    },
  },
  progress: {
    sectionsCompleted: [],
    timeSpent: 0,
    lastSaved: new Date(),
    autoSaveEnabled: true,
    completionPercentage: 0,
  },
  isDraft: true,
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
}

// Initial tools state
const initialTools: ReviewTools = {
  pdfAnnotation: {
    enabled: false,
    annotations: [],
    currentTool: 'select',
  },
  citationChecker: {
    enabled: false,
    checkedCitations: [],
  },
  plagiarismChecker: {
    enabled: false,
  },
  statisticsValidator: {
    enabled: false,
    checks: [],
  },
}

export const useReviewFormStore = create<ReviewFormState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // State
        form: null,
        draft: null,
        template: null,
        currentSection: 'summary',
        isSubmitting: false,
        isSaving: false,
        hasUnsavedChanges: false,
        validationErrors: {},
        tools: initialTools,

        // Load review (either existing or create new)
        loadReview: async (manuscriptId: string, assignmentId?: string) => {
          try {
            set((state) => {
              state.isLoading = true
              state.validationErrors = {}
            })

            // Attempt to load existing draft first
            const draftResponse = await fetch(
              `/api/manuscripts/${manuscriptId}/review/draft${assignmentId ? `?assignment=${assignmentId}` : ''}`
            )
            
            let draft = null
            let existingForm = null
            
            if (draftResponse.ok) {
              const draftData = await draftResponse.json()
              draft = draftData.draft
              existingForm = draft?.formData
            }

            // Load template and manuscript info
            const formResponse = await fetch(
              `/api/manuscripts/${manuscriptId}/review/form${assignmentId ? `?assignment=${assignmentId}` : ''}`
            )
            
            if (!formResponse.ok) {
              throw new Error('Failed to load review form')
            }
            
            const formData = await formResponse.json()
            
            set((state) => {
              state.form = existingForm ? {
                ...initialForm,
                ...existingForm,
                manuscriptId,
                assignmentId,
              } as ReviewForm : {
                ...initialForm,
                manuscriptId,
                assignmentId,
                reviewerId: formData.reviewerId,
              } as ReviewForm
              
              state.draft = draft
              state.template = formData.template
              state.isLoading = false
              state.hasUnsavedChanges = false
            })

            // Load annotations if draft exists
            if (draft) {
              await get().loadAnnotations(draft.id)
            }

          } catch (error) {
            console.error('Failed to load review:', error)
            set((state) => {
              state.isLoading = false
            })
            throw error
          }
        },

        // Save draft
        saveDraft: async () => {
          const state = get()
          if (!state.form || state.isSaving) return

          try {
            set((draft) => {
              draft.isSaving = true
            })

            const response = await fetch(`/api/reviews/draft`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                manuscriptId: state.form.manuscriptId,
                assignmentId: state.form.assignmentId,
                formData: state.form,
                timeSpent: state.form.progress.timeSpent,
              }),
            })

            if (!response.ok) {
              throw new Error('Failed to save draft')
            }

            const result = await response.json()
            
            set((draft) => {
              draft.isSaving = false
              draft.hasUnsavedChanges = false
              if (draft.form) {
                draft.form.progress.lastSaved = new Date()
              }
              if (result.draft) {
                draft.draft = result.draft
              }
            })

          } catch (error) {
            console.error('Failed to save draft:', error)
            set((state) => {
              state.isSaving = false
            })
            throw error
          }
        },

        // Submit final review
        submitReview: async () => {
          const state = get()
          if (!state.form || state.isSubmitting) return

          try {
            set((draft) => {
              draft.isSubmitting = true
              draft.validationErrors = {}
            })

            // Validate all sections
            const isValid = get().validateForm()
            if (!isValid) {
              set((state) => {
                state.isSubmitting = false
              })
              return
            }

            const response = await fetch(`/api/reviews/submit`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                manuscriptId: state.form.manuscriptId,
                assignmentId: state.form.assignmentId,
                reviewData: state.form,
                draftId: state.draft?.id,
              }),
            })

            if (!response.ok) {
              const errorData = await response.json()
              if (errorData.validationErrors) {
                set((state) => {
                  state.validationErrors = errorData.validationErrors
                })
              }
              throw new Error(errorData.message || 'Failed to submit review')
            }

            const result = await response.json()
            
            set((state) => {
              state.isSubmitting = false
              state.hasUnsavedChanges = false
              if (state.form) {
                state.form.isDraft = false
                state.form.submittedAt = new Date()
              }
            })

            return result

          } catch (error) {
            console.error('Failed to submit review:', error)
            set((state) => {
              state.isSubmitting = false
            })
            throw error
          }
        },

        // Update a specific section
        updateSection: (section: string, data: any) => {
          set((state) => {
            if (!state.form) return
            
            // Update the specific section
            ;(state.form.sections as any)[section] = {
              ...(state.form.sections as any)[section],
              ...data,
            }
            
            // Mark as having unsaved changes
            state.hasUnsavedChanges = true
            state.form.updatedAt = new Date()
            
            // Update progress
            state.form.progress.completionPercentage = get().calculateProgress()
            
            // Clear validation errors for this section
            delete state.validationErrors[section]
          })
        },

        // Set current section
        setCurrentSection: (section: string) => {
          set((state) => {
            state.currentSection = section
          })
        },

        // Annotation methods
        addAnnotation: (annotation: Omit<PDFAnnotation, 'id' | 'createdAt' | 'updatedAt'>) => {
          set((state) => {
            const newAnnotation: PDFAnnotation = {
              ...annotation,
              id: `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
            state.tools.pdfAnnotation.annotations.push(newAnnotation)
            state.hasUnsavedChanges = true
          })
        },

        updateAnnotation: (id: string, updates: Partial<PDFAnnotation>) => {
          set((state) => {
            const annotation = state.tools.pdfAnnotation.annotations.find(a => a.id === id)
            if (annotation) {
              Object.assign(annotation, updates)
              annotation.updatedAt = new Date()
              state.hasUnsavedChanges = true
            }
          })
        },

        deleteAnnotation: (id: string) => {
          set((state) => {
            const index = state.tools.pdfAnnotation.annotations.findIndex(a => a.id === id)
            if (index !== -1) {
              state.tools.pdfAnnotation.annotations.splice(index, 1)
              state.hasUnsavedChanges = true
            }
          })
        },

        // Comment methods
        addComment: (section, comment: Omit<Comment, 'id' | 'createdAt'>) => {
          set((state) => {
            if (!state.form) return
            
            const newComment: Comment = {
              ...comment,
              id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              createdAt: new Date(),
            }
            
            ;(state.form.sections.detailedComments[section] as Comment[]).push(newComment)
            state.hasUnsavedChanges = true
          })
        },

        updateComment: (section, commentId: string, updates: Partial<Comment>) => {
          set((state) => {
            if (!state.form) return
            
            const comments = state.form.sections.detailedComments[section] as Comment[]
            const comment = comments.find(c => c.id === commentId)
            if (comment) {
              Object.assign(comment, updates)
              comment.updatedAt = new Date()
              state.hasUnsavedChanges = true
            }
          })
        },

        deleteComment: (section, commentId: string) => {
          set((state) => {
            if (!state.form) return
            
            const comments = state.form.sections.detailedComments[section] as Comment[]
            const index = comments.findIndex(c => c.id === commentId)
            if (index !== -1) {
              comments.splice(index, 1)
              state.hasUnsavedChanges = true
            }
          })
        },

        // Validation
        validateSection: (section: string) => {
          const state = get()
          if (!state.form) return false

          const errors: string[] = []

          switch (section) {
            case 'summary':
              if (!state.form.sections.summary.recommendation) {
                errors.push('Recommendation is required')
              }
              if (!state.form.sections.summary.confidence) {
                errors.push('Confidence level is required')
              }
              if (!state.form.sections.summary.expertise) {
                errors.push('Expertise level is required')
              }
              break

            case 'qualityAssessment':
              const qa = state.form.sections.qualityAssessment
              Object.keys(qa).forEach(key => {
                const assessment = qa[key as keyof typeof qa] as any
                if (!assessment.score || assessment.score < 1) {
                  errors.push(`${key} score is required`)
                }
                if (!assessment.comments?.trim()) {
                  errors.push(`${key} comments are required`)
                }
              })
              break

            case 'detailedComments':
              const dc = state.form.sections.detailedComments
              if (dc.majorIssues.length === 0 && dc.minorIssues.length === 0) {
                errors.push('At least one major or minor issue must be provided')
              }
              break
          }

          if (errors.length > 0) {
            set((state) => {
              state.validationErrors[section] = errors
            })
            return false
          }

          set((state) => {
            delete state.validationErrors[section]
          })
          return true
        },

        validateForm: () => {
          const sections = ['summary', 'qualityAssessment', 'detailedComments']
          return sections.every(section => get().validateSection(section))
        },

        // Calculate completion percentage
        calculateProgress: () => {
          const state = get()
          if (!state.form) return 0

          let totalSections = 3 // summary, qualityAssessment, detailedComments (required)
          let completedSections = 0

          // Check summary
          if (state.form.sections.summary.recommendation && 
              state.form.sections.summary.confidence && 
              state.form.sections.summary.expertise) {
            completedSections++
          }

          // Check quality assessment
          const qa = state.form.sections.qualityAssessment
          const qaComplete = Object.keys(qa).every(key => {
            const assessment = qa[key as keyof typeof qa] as any
            return assessment.score >= 1 && assessment.comments?.trim()
          })
          if (qaComplete) {
            completedSections++
          }

          // Check detailed comments
          const dc = state.form.sections.detailedComments
          if (dc.majorIssues.length > 0 || dc.minorIssues.length > 0) {
            completedSections++
          }

          // Optional sections
          if (state.form.sections.technicalReview) {
            totalSections++
            // Check if any technical review fields are filled
            const tr = state.form.sections.technicalReview
            if (tr.statistics || tr.dataAvailability || tr.codeReproducibility || tr.figuresAndTables?.length) {
              completedSections++
            }
          }

          if (state.form.sections.confidentialComments.editorOnly?.trim()) {
            if (totalSections === 3) totalSections++ // Add confidential comments as optional 4th section
            completedSections++
          }

          return Math.round((completedSections / totalSections) * 100)
        },

        // Load annotations
        loadAnnotations: async (draftId: string) => {
          try {
            const response = await fetch(`/api/reviews/annotations?draftId=${draftId}`)
            if (response.ok) {
              const annotations = await response.json()
              set((state) => {
                state.tools.pdfAnnotation.annotations = annotations
              })
            }
          } catch (error) {
            console.error('Failed to load annotations:', error)
          }
        },

        // Reset form
        resetForm: () => {
          set((state) => {
            state.form = null
            state.draft = null
            state.template = null
            state.currentSection = 'summary'
            state.isSubmitting = false
            state.isSaving = false
            state.hasUnsavedChanges = false
            state.validationErrors = {}
            state.tools = initialTools
          })
        },
      }))
    ),
    {
      name: 'review-form-store',
    }
  )
)

// Auto-save subscription
let autoSaveTimer: NodeJS.Timeout | null = null

// Subscribe to form changes for auto-save
useReviewFormStore.subscribe(
  (state) => state.hasUnsavedChanges,
  (hasUnsavedChanges) => {
    if (hasUnsavedChanges) {
      // Clear existing timer
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer)
      }
      
      // Set new timer
      autoSaveTimer = setTimeout(() => {
        const state = useReviewFormStore.getState()
        if (state.hasUnsavedChanges && !state.isSaving && state.form?.progress.autoSaveEnabled) {
          state.saveDraft().catch(console.error)
        }
      }, AUTO_SAVE_INTERVAL)
    }
  }
)