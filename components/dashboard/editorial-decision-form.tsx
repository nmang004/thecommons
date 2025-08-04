'use client'

import { useState, useEffect, useReducer } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { DecisionSummaryEditor } from './decision-components/DecisionSummaryEditor'
import { AuthorLetterBuilder } from './decision-components/AuthorLetterBuilder'
import { PostDecisionActions } from './decision-components/PostDecisionActions'
import { DecisionProcessingService, ProcessDecisionInput } from '@/lib/services/decision-processing-service'
import { createClient } from '@/lib/supabase/client'
import type { DecisionTemplate as DBDecisionTemplate, DecisionActions, ReviewComment } from '@/types/database'
import { 
  CheckCircle,
  XCircle,
  RefreshCw,
  FileText,
  Eye,
  History,
  Users,
  Send,
  Save,
  AlertTriangle,
  Clock,
  X,
  ArrowRight,
  ArrowLeft,
  Settings,
  MessageSquare
} from 'lucide-react'

interface Review {
  id: string
  recommendation: 'accept' | 'minor_revisions' | 'major_revisions' | 'reject'
  summary: string
  major_comments: string
  minor_comments?: string
  comments_for_editor?: string
  confidence_level: number
  profiles?: {
    full_name: string
  }
  submitted_at: string
}

interface DecisionTemplate {
  id: string
  name: string
  decision: string
  template: string
  category: 'accept' | 'reject' | 'revisions'
}

interface EditorialDecisionFormProps {
  manuscript: {
    id: string
    title: string
    abstract: string
    status: string
    submitted_at?: string
    field_of_study: string
    profiles?: {
      full_name: string
      email: string
    }
  }
  reviews: Review[]
  onSubmit: (decision: ProcessDecisionInput) => void
  onCancel: () => void
  isLoading?: boolean
  availableEditors?: Array<{
    id: string
    full_name: string
    role: string
  }>
  templates?: Array<{
    id: string
    name: string
    category: string
    template_content: {
    sections: Array<{
      id: string
      type: string
      content: string
      required: boolean
      order: number
    }>
    variables: string[]
    defaultActions?: DecisionActions
  }
  }>
  userId?: string
}

// Decision form state management
interface DecisionState {
  currentStep: number
  decision: string
  components: {
    editorSummary: string
    authorLetter: string
    reviewerComments: ReviewComment[]
    internalNotes: string
    conditions: string[]
    nextSteps: string[]
    decisionRationale: string
  }
  actions: {
    notifyAuthor: boolean
    notifyReviewers: boolean
    schedulePublication?: string | null
    assignProductionEditor?: string | null
    generateDOI: boolean
    sendToProduction: boolean
    followUpDate?: string | null
  }
  selectedTemplate?: DecisionTemplate
  isDraft: boolean
  isValid: boolean
}

type DecisionAction = 
  | { type: 'SET_STEP'; step: number }
  | { type: 'SET_DECISION'; decision: string }
  | { type: 'UPDATE_COMPONENT'; key: string; value: string | string[] }
  | { type: 'UPDATE_ACTIONS'; actions: DecisionActions }
  | { type: 'SET_TEMPLATE'; template: DecisionTemplate }
  | { type: 'SET_DRAFT'; isDraft: boolean }
  | { type: 'VALIDATE' }
  | { type: 'RESET' }

const DECISION_OPTIONS = [
  {
    value: 'accepted',
    label: 'Accept',
    description: 'Accept manuscript for publication',
    icon: CheckCircle,
    color: 'text-green-600 bg-green-50 border-green-200'
  },
  {
    value: 'revisions_requested',
    label: 'Request Revisions',
    description: 'Request author revisions before final decision',
    icon: RefreshCw,
    color: 'text-orange-600 bg-orange-50 border-orange-200'
  },
  {
    value: 'rejected',
    label: 'Reject',
    description: 'Reject manuscript from publication',
    icon: XCircle,
    color: 'text-red-600 bg-red-50 border-red-200'
  }
]

const DEFAULT_TEMPLATES: DecisionTemplate[] = [
  {
    id: 'accept_standard',
    name: 'Standard Acceptance',
    decision: 'accepted',
    template: `Dear {author_name},

I am pleased to inform you that your manuscript "{manuscript_title}" has been accepted for publication in our journal.

The reviewers found your work to be of high quality and a valuable contribution to the field. {review_summary}

Your manuscript will now proceed to the production stage. You will receive further instructions regarding copyediting and proofs in due course.

Congratulations on this achievement.

Best regards,`,
    category: 'accept'
  },
  {
    id: 'accept_minor_revisions',
    name: 'Accept with Minor Revisions',
    decision: 'accepted',
    template: `Dear {author_name},

I am pleased to inform you that your manuscript "{manuscript_title}" has been accepted for publication, subject to minor revisions.

The reviewers have provided constructive feedback that will help strengthen your manuscript. Please address the following points:

{review_summary}

Please submit your revised manuscript within 30 days along with a detailed response letter addressing each point raised by the reviewers.

Best regards,`,
    category: 'accept'
  },
  {
    id: 'revisions_major',
    name: 'Major Revisions Required',
    decision: 'revisions_requested',
    template: `Dear {author_name},

Thank you for submitting your manuscript "{manuscript_title}" to our journal.

After careful consideration and peer review, I am writing to inform you that your manuscript requires major revisions before it can be considered for publication.

The reviewers have identified several important issues that need to be addressed:

{review_summary}

Please carefully consider all comments and provide a detailed response to each point. Revised manuscripts should be submitted within 60 days.

I look forward to receiving your revised submission.

Best regards,`,
    category: 'revisions'
  },
  {
    id: 'revisions_minor',
    name: 'Minor Revisions Required',
    decision: 'revisions_requested',
    template: `Dear {author_name},

Thank you for submitting your manuscript "{manuscript_title}" to our journal.

The reviewers have found your work interesting and relevant, but have identified some minor issues that should be addressed before publication:

{review_summary}

Please address these points and submit your revised manuscript within 30 days along with a response letter.

Best regards,`,
    category: 'revisions'
  },
  {
    id: 'reject_standard',
    name: 'Standard Rejection',
    decision: 'rejected',
    template: `Dear {author_name},

Thank you for submitting your manuscript "{manuscript_title}" to our journal.

After careful consideration and peer review, I regret to inform you that we cannot accept your manuscript for publication in our journal.

The reviewers' comments are provided below for your consideration:

{review_summary}

While your work was not suitable for our journal, the reviewers' feedback may be helpful if you decide to submit to another publication.

Thank you for considering our journal for your research.

Best regards,`,
    category: 'reject'
  },
  {
    id: 'reject_scope',
    name: 'Rejection - Outside Scope',
    decision: 'rejected',
    template: `Dear {author_name},

Thank you for submitting your manuscript "{manuscript_title}" to our journal.

After editorial review, I have determined that your manuscript falls outside the scope of our journal and is therefore not suitable for publication here.

{review_summary}

I would encourage you to consider submitting your work to a journal that specializes in your research area.

Thank you for your interest in our journal.

Best regards,`,
    category: 'reject'
  }
]

const decisionReducer = (state: DecisionState, action: DecisionAction): DecisionState => {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.step }
    case 'SET_DECISION':
      return { 
        ...state, 
        decision: action.decision,
        actions: {
          ...state.actions,
          // Set default actions based on decision
          notifyAuthor: true,
          generateDOI: action.decision === 'accepted',
          sendToProduction: action.decision === 'accepted'
        }
      }
    case 'UPDATE_COMPONENT':
      return {
        ...state,
        components: {
          ...state.components,
          [action.key]: action.value
        }
      }
    case 'UPDATE_ACTIONS':
      return {
        ...state,
        actions: { ...state.actions, ...action.actions }
      }
    case 'SET_TEMPLATE':
      return { ...state, selectedTemplate: action.template }
    case 'SET_DRAFT':
      return { ...state, isDraft: action.isDraft }
    case 'VALIDATE':       
      const isValid = !!state.decision && !!state.components.authorLetter.trim()
      return { ...state, isValid }
    case 'RESET':
      return initialDecisionState
    default:
      return state
  }
}

const initialDecisionState: DecisionState = {
  currentStep: 1,
  decision: '',
  components: {
    editorSummary: '',
    authorLetter: '',
    reviewerComments: [],
    internalNotes: '',
    conditions: [],
    nextSteps: [],
    decisionRationale: ''
  },
  actions: {
    notifyAuthor: true,
    notifyReviewers: false,
    generateDOI: false,
    sendToProduction: false
  },
  isDraft: false,
  isValid: false
}

export function EditorialDecisionForm({
  manuscript,
  reviews,
  onSubmit,
  onCancel,
  isLoading = false,
  availableEditors = [],
  templates = [],
  userId
}: EditorialDecisionFormProps) {
  const [state, dispatch] = useReducer(decisionReducer, initialDecisionState)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState('')
  const [customTemplates, setCustomTemplates] = useState<DecisionTemplate[]>([])
  const supabase = createClient()

  // Load custom templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await fetch('/api/editorial/templates')
        if (response.ok) {
          const data = await response.json()
          setCustomTemplates(data.templates || [])
        }
      } catch (error) {
        console.error('Error loading templates:', error)
      }
    }
    loadTemplates()
  }, [])

  // Validate form on state changes
  useEffect(() => {
    dispatch({ type: 'VALIDATE' })
  }, [state.decision, state.components.authorLetter])

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!state.decision || !state.components.authorLetter.trim()) return

    const autoSaveInterval = setInterval(() => {
      handleSaveDraft()
    }, 30000) // 30 seconds

    return () => clearInterval(autoSaveInterval)
  }, [state])

  const allTemplates = [...DEFAULT_TEMPLATES, ...customTemplates, ...templates]

  // Decision step configuration
  const DECISION_STEPS = [
    { id: 1, title: 'Decision Type', description: 'Select your editorial decision', icon: CheckCircle },
    { id: 2, title: 'Editorial Summary', description: 'Summarize your assessment', icon: FileText },
    { id: 3, title: 'Author Letter', description: 'Compose the decision letter', icon: MessageSquare },
    { id: 4, title: 'Actions & Settings', description: 'Configure post-decision actions', icon: Settings },
    { id: 5, title: 'Review & Submit', description: 'Final review and submission', icon: Send }
  ]

  const currentStepConfig = DECISION_STEPS.find(step => step.id === state.currentStep)
  const progressPercentage = (state.currentStep / DECISION_STEPS.length) * 100

  // Handle step navigation
  const canGoNext = () => {
    switch (state.currentStep) {
      case 1: return !!state.decision
      case 2: return !!state.components.editorSummary.trim()
      case 3: return !!state.components.authorLetter.trim()
      case 4: return true // Actions are optional
      case 5: return state.isValid
      default: return false
    }
  }

  const handleNextStep = () => {
    if (canGoNext() && state.currentStep < DECISION_STEPS.length) {
      dispatch({ type: 'SET_STEP', step: state.currentStep + 1 })
    }
  }

  const handlePreviousStep = () => {
    if (state.currentStep > 1) {
      dispatch({ type: 'SET_STEP', step: state.currentStep - 1 })
    }
  }

  // Handle template application
  const applyTemplate = (template: DecisionTemplate) => {
    dispatch({ type: 'SET_TEMPLATE', template })
    dispatch({ type: 'SET_DECISION', decision: template.decision_type || template.decision })
    
    // Apply template content to author letter
    let letterContent = template.template_content?.sections?.map((s) => s.content).join('\n\n') || ''
    
    // Replace variables
    letterContent = letterContent.replace(/{{author_name}}/g, manuscript.profiles?.full_name || 'Author')
    letterContent = letterContent.replace(/{{manuscript_title}}/g, manuscript.title)
    letterContent = letterContent.replace(/{{editor_name}}/g, 'Editor Name')
    letterContent = letterContent.replace(/{{journal_name}}/g, 'The Commons')
    
    dispatch({ type: 'UPDATE_COMPONENT', key: 'authorLetter', value: letterContent })
    
    // Apply default actions if specified
    if (template.template_content?.defaultActions) {
      dispatch({ type: 'UPDATE_ACTIONS', actions: template.template_content.defaultActions })
    }
  }

  // Get review statistics
  const reviewStats = {
    total: reviews.length,
    accept: reviews.filter(r => r.recommendation === 'accept').length,
    minorRevisions: reviews.filter(r => r.recommendation === 'minor_revisions').length,
    majorRevisions: reviews.filter(r => r.recommendation === 'major_revisions').length,
    reject: reviews.filter(r => r.recommendation === 'reject').length,
    avgConfidence: reviews.length > 0 ? 
      Math.round(reviews.reduce((sum, r) => sum + r.confidence_level, 0) / reviews.length * 10) / 10 : 0
  }

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'accept': return 'text-green-600 bg-green-50'
      case 'minor_revisions': return 'text-blue-600 bg-blue-50'
      case 'major_revisions': return 'text-orange-600 bg-orange-50'
      case 'reject': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  // Handle form submission
  const handleSubmit = async (isDraft: boolean = false) => {
    if (!state.isValid && !isDraft) return

    setIsProcessing(true)
    setProcessingStep(isDraft ? 'Saving draft...' : 'Processing decision...')

    try {
      const decisionService = new DecisionProcessingService(supabase)
      
      const input: ProcessDecisionInput = {
        manuscriptId: manuscript.id,
        editorId: userId || '',
        decision: state.decision as any,
        components: state.components,
        actions: state.actions,
        templateId: state.selectedTemplate?.id,
        templateVersion: 1,
        isDraft
      }

      const result = await decisionService.processDecision(input)

      if (result.success) {
        onSubmit({
          success: true,
          decisionId: result.decisionId,
          isDraft,
          queuedActions: result.queuedActions
        })
      } else {
        throw new Error(result.error || 'Failed to process decision')
      }
    } catch (error) {
      console.error('Decision submission error:', error)
      // Handle error (show toast, etc.)
    } finally {
      setIsProcessing(false)
      setProcessingStep('')
    }
  }

  const handleSaveDraft = () => handleSubmit(true)
  const handleFinalSubmit = () => handleSubmit(false)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-xl font-heading font-semibold text-gray-900">
            Editorial Decision Workflow
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2 max-w-2xl">
            {manuscript.title}
          </p>
        </div>
        <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {currentStepConfig && (
              <>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <currentStepConfig.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    Step {state.currentStep}: {currentStepConfig.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {currentStepConfig.description}
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {state.currentStep} of {DECISION_STEPS.length}
          </div>
        </div>
        
        <Progress value={progressPercentage} className="w-full" />
        
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          {DECISION_STEPS.map((step) => (
            <div key={step.id} className={`flex-1 text-center ${
              step.id === state.currentStep ? 'font-medium text-blue-600' : 
              step.id < state.currentStep ? 'text-green-600' : ''
            }`}>
              {step.title}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white border rounded-lg">
        {/* Step 1: Decision Selection */}
        {state.currentStep === 1 && (
          <div className="p-6">
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Select Editorial Decision</h4>
              <p className="text-sm text-gray-600">
                Choose the appropriate decision based on the peer review feedback and your editorial assessment.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DECISION_OPTIONS.map((option) => {
                const Icon = option.icon
                const isSelected = state.decision === option.value
                
                return (
                  <Card
                    key={option.value}
                    className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                      isSelected 
                        ? `${option.color} ring-2 ring-offset-2 ring-blue-500` 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => dispatch({ type: 'SET_DECISION', decision: option.value })}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-6 h-6 ${
                        isSelected ? 'text-current' : 'text-gray-400'
                      }`} />
                      <div>
                        <h4 className="font-medium">{option.label}</h4>
                        <p className="text-sm text-gray-600">{option.description}</p>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 2: Editorial Summary */}
        {state.currentStep === 2 && (
          <DecisionSummaryEditor
            manuscript={manuscript}
            reviews={reviews}
            value={state.components.editorSummary}
            onChange={(value) => dispatch({ type: 'UPDATE_COMPONENT', key: 'editorSummary', value })}
            className="p-6"
          />
        )}

        {/* Step 3: Author Letter */}
        {state.currentStep === 3 && (
          <AuthorLetterBuilder
            manuscript={manuscript}
            reviews={reviews}
            value={state.components.authorLetter}
            onChange={(value) => dispatch({ type: 'UPDATE_COMPONENT', key: 'authorLetter', value })}
            selectedTemplate={state.selectedTemplate}
            onTemplateSelect={applyTemplate}
            className="p-6"
          />
        )}

        {/* Step 4: Post-Decision Actions */}
        {state.currentStep === 4 && (
          <PostDecisionActions
            decision={state.decision}
            actions={state.actions}
            onChange={(actions) => dispatch({ type: 'UPDATE_ACTIONS', actions })}
            availableEditors={availableEditors}
            className="p-6"
          />
        )}

        {/* Step 5: Review & Submit */}
        {state.currentStep === 5 && (
          <div className="p-6 space-y-6">
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Review Your Decision</h4>
              <p className="text-sm text-gray-600">
                Please review all details before submitting your editorial decision.
              </p>
            </div>

            {/* Decision Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Decision Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Decision</Label>
                    <div className="mt-1">
                      <Badge className={DECISION_OPTIONS.find(d => d.value === state.decision)?.color}>
                        {DECISION_OPTIONS.find(d => d.value === state.decision)?.label}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Template Used</Label>
                    <div className="mt-1 text-sm">
                      {state.selectedTemplate?.name || 'No template'}
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">Active Actions</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(state.actions)
                      .filter(([_, value]) => value === true)
                      .map(([key, _]) => (
                      <Badge key={key} variant="outline" className="text-xs">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Warning */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900">Important Notice</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Once submitted, this editorial decision cannot be undone. The decision letter will be sent to the author and all configured actions will be triggered automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>




      {/* Navigation & Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t bg-gray-50 px-6 py-4 rounded-b-lg">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handlePreviousStep}
            disabled={state.currentStep === 1 || isProcessing}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
        </div>
        
        <div className="flex items-center space-x-3">
          {state.currentStep < DECISION_STEPS.length ? (
            <>
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={!state.decision || isProcessing}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button
                onClick={handleNextStep}
                disabled={!canGoNext() || isProcessing}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isProcessing}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button
                onClick={handleFinalSubmit}
                disabled={!state.isValid || isProcessing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    {processingStep}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Decision
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

