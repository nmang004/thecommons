'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Save, 
  Send, 
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  BarChart3,
  MessageSquare,
  Settings,
  Shield,
  Eye,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useReviewFormStore } from '@/lib/stores/review-form-store'
import { QualityAssessmentSection } from './quality-assessment-section'
import { DetailedCommentsSection } from './detailed-comments-section'
import { TechnicalReviewSection } from './technical-review-section'
import { ConfidentialCommentsSection } from './confidential-comments-section'

interface ReviewFormProps {
  manuscriptId: string
  assignmentId?: string
  className?: string
}

interface SummarySection {
  recommendation: 'accept' | 'minor_revision' | 'major_revision' | 'reject' | null
  confidence: number
  expertise: number
  overallAssessment?: string
}

const SECTIONS = [
  {
    id: 'summary',
    label: 'Summary',
    icon: FileText,
    description: 'Overall recommendation and assessment',
    required: true
  },
  {
    id: 'qualityAssessment', 
    label: 'Quality Assessment',
    icon: BarChart3,
    description: 'Detailed quality evaluation',
    required: true
  },
  {
    id: 'detailedComments',
    label: 'Detailed Comments', 
    icon: MessageSquare,
    description: 'Categorized feedback',
    required: true
  },
  {
    id: 'technicalReview',
    label: 'Technical Review',
    icon: Settings,
    description: 'Technical aspects and reproducibility',
    required: false
  },
  {
    id: 'confidentialComments',
    label: 'Confidential Comments',
    icon: Shield, 
    description: 'Private feedback for editors',
    required: false
  }
] as const

const RECOMMENDATION_LABELS = {
  accept: 'Accept',
  minor_revision: 'Minor Revisions',
  major_revision: 'Major Revisions', 
  reject: 'Reject'
} as const

const EXPERTISE_LABELS = [
  'No expertise',
  'Limited expertise',
  'Some expertise', 
  'Knowledgeable',
  'Expert'
]

const CONFIDENCE_LABELS = [
  'Not confident',
  'Slightly confident',
  'Moderately confident',
  'Confident', 
  'Very confident'
]

export function ReviewForm({ manuscriptId, assignmentId, className }: ReviewFormProps) {
  const router = useRouter()
  const {
    form,
    currentSection,
    isSubmitting,
    isSaving, 
    hasUnsavedChanges,
    validationErrors,
    loadReview,
    saveDraft,
    submitReview,
    setCurrentSection,
    updateSection,
    validateForm,
    calculateProgress,
    resetForm
  } = useReviewFormStore()

  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [timeSpent, setTimeSpent] = useState(0)

  // Time tracking
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(prev => prev + 1)
      if (form) {
        updateSection('progress', {
          ...form.progress,
          timeSpent: form.progress.timeSpent + 1
        })
      }
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [form, updateSection])

  // Load review data on mount
  useEffect(() => {
    loadReview(manuscriptId, assignmentId).catch(console.error)
    
    return () => {
      // Auto-save on unmount if there are unsaved changes
      if (hasUnsavedChanges && !isSubmitting) {
        saveDraft().catch(console.error)
      }
    }
  }, [manuscriptId, assignmentId, loadReview, hasUnsavedChanges, isSubmitting, saveDraft])

  if (!form) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Loading review form...</p>
        </div>
      </div>
    )
  }

  const progress = calculateProgress()
  const currentSectionIndex = SECTIONS.findIndex(s => s.id === currentSection)
  const hasValidationErrors = Object.keys(validationErrors).length > 0

  const handleSave = async () => {
    try {
      await saveDraft()
      // Success feedback could be added here
    } catch (error) {
      console.error('Failed to save draft:', error)
      // Error feedback could be added here
    }
  }

  const handleSubmit = async () => {
    try {
      const isValid = validateForm()
      if (!isValid) {
        setShowSubmitDialog(false)
        return
      }

      await submitReview()
      router.push('/dashboard/reviewer')
    } catch (error) {
      console.error('Failed to submit review:', error)
      // Error feedback could be added here
    } finally {
      setShowSubmitDialog(false)
    }
  }

  const handleExit = () => {
    if (hasUnsavedChanges) {
      setShowExitDialog(true)
    } else {
      router.push('/dashboard/reviewer')
    }
  }

  const handleExitConfirm = async () => {
    if (hasUnsavedChanges) {
      try {
        await saveDraft()
      } catch (error) {
        console.error('Failed to save draft:', error)
      }
    }
    resetForm()
    router.push('/dashboard/reviewer')
  }

  const navigateToSection = (sectionId: string) => {
    setCurrentSection(sectionId)
  }

  const navigateNext = () => {
    if (currentSectionIndex < SECTIONS.length - 1) {
      setCurrentSection(SECTIONS[currentSectionIndex + 1].id)
    }
  }

  const navigatePrevious = () => {
    if (currentSectionIndex > 0) {
      setCurrentSection(SECTIONS[currentSectionIndex - 1].id)
    }
  }

  // Summary section component
  const SummarySection = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Review Summary</h2>
        <p className="text-sm text-gray-600">
          Provide your overall assessment and recommendation
        </p>
      </div>

      {/* Recommendation */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            Recommendation <span className="text-red-500">*</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(RECOMMENDATION_LABELS).map(([key, label]) => (
              <div
                key={key}
                onClick={() => updateSection('summary', { 
                  ...form.sections.summary, 
                  recommendation: key as any 
                })}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  form.sections.summary.recommendation === key
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="text-center">
                  <h4 className="font-medium text-gray-900">{label}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {key === 'accept' && 'Ready for publication'}
                    {key === 'minor_revision' && 'Small changes needed'}
                    {key === 'major_revision' && 'Significant changes required'}
                    {key === 'reject' && 'Not suitable for publication'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Confidence and Expertise */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Confidence Level <span className="text-red-500">*</span>
            </h3>
            <p className="text-sm text-gray-600">
              How confident are you in your assessment?
            </p>
            
            <div className="space-y-2">
              {CONFIDENCE_LABELS.map((label, index) => (
                <div
                  key={index}
                  onClick={() => updateSection('summary', { 
                    ...form.sections.summary, 
                    confidence: (index + 1) as any
                  })}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    form.sections.summary.confidence === (index + 1)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      form.sections.summary.confidence === (index + 1)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`} />
                    <span className="text-sm">{index + 1}. {label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Expertise Level <span className="text-red-500">*</span>
            </h3>
            <p className="text-sm text-gray-600">
              What is your level of expertise in this area?
            </p>
            
            <div className="space-y-2">
              {EXPERTISE_LABELS.map((label, index) => (
                <div
                  key={index}
                  onClick={() => updateSection('summary', { 
                    ...form.sections.summary, 
                    expertise: (index + 1) as any
                  })}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    form.sections.summary.expertise === (index + 1)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      form.sections.summary.expertise === (index + 1)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`} />
                    <span className="text-sm">{index + 1}. {label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'summary':
        return <SummarySection />
      case 'qualityAssessment':
        return <QualityAssessmentSection />
      case 'detailedComments':
        return <DetailedCommentsSection />
      case 'technicalReview':
        return <TechnicalReviewSection />
      case 'confidentialComments':
        return <ConfidentialCommentsSection />
      default:
        return <SummarySection />
    }
  }

  return (
    <div className={`max-w-7xl mx-auto ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Review Submission
            </h1>
            <p className="text-gray-600 mt-1">
              Complete peer review for manuscript
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Auto-save indicator */}
            {isSaving && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
            
            {hasUnsavedChanges && !isSaving && (
              <div className="flex items-center space-x-2 text-sm text-amber-600">
                <AlertTriangle className="w-4 h-4" />
                <span>Unsaved changes</span>
              </div>
            )}
            
            {!hasUnsavedChanges && !isSaving && form.progress.lastSaved && (
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>All changes saved</span>
              </div>
            )}

            {/* Time spent */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{Math.floor(form.progress.timeSpent / 60)}h {form.progress.timeSpent % 60}m</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">
              Overall Progress
            </span>
            <span className="text-sm text-gray-600">
              {progress}% complete
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            {/* Section Navigation */}
            <Card className="p-4">
              <h3 className="font-medium text-gray-900 mb-4">Review Sections</h3>
              <nav className="space-y-2">
                {SECTIONS.map((section) => {
                  const Icon = section.icon
                  const isActive = currentSection === section.id
                  const hasErrors = validationErrors[section.id]?.length > 0
                  const isCompleted = form.progress.sectionsCompleted.includes(section.id)
                  
                  return (
                    <button
                      key={section.id}
                      onClick={() => navigateToSection(section.id)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${
                        isActive ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">
                            {section.label}
                          </span>
                          {section.required && (
                            <Badge variant="secondary" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {section.description}
                        </p>
                      </div>
                      <div className="flex flex-col items-center space-y-1">
                        {hasErrors && (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                        {isCompleted && !hasErrors && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </nav>
            </Card>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
                className="w-full"
                variant="outline"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Draft'}
              </Button>
              
              <Button
                onClick={() => setShowSubmitDialog(true)}
                disabled={isSubmitting || progress < 100}
                className="w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Review
              </Button>
              
              <Button
                onClick={handleExit}
                variant="ghost"
                className="w-full"
              >
                Exit Review
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card className="p-8">
            {/* Validation Errors Alert */}
            {hasValidationErrors && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertCircle className="w-4 h-4" />
                <AlertTitle className="text-red-800">Validation Errors</AlertTitle>
                <AlertDescription className="text-red-700">
                  Please fix the validation errors in the following sections before submitting:
                  <ul className="list-disc list-inside mt-2">
                    {Object.entries(validationErrors).map(([section, errors]) => (
                      <li key={section}>
                        <button
                          onClick={() => setCurrentSection(section)}
                          className="text-red-800 hover:underline font-medium"
                        >
                          {SECTIONS.find(s => s.id === section)?.label || section}
                        </button>
                        {errors.length > 1 && <span> ({errors.length} errors)</span>}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Section Content */}
            <div className="min-h-[600px]">
              {renderCurrentSection()}
            </div>

            {/* Navigation Footer */}
            <Separator className="my-8" />
            <div className="flex items-center justify-between">
              <Button
                onClick={navigatePrevious}
                disabled={currentSectionIndex === 0}
                variant="outline"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              <div className="text-sm text-gray-600">
                Section {currentSectionIndex + 1} of {SECTIONS.length}
              </div>
              
              <Button
                onClick={navigateNext}
                disabled={currentSectionIndex === SECTIONS.length - 1}
                variant="outline"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Review</DialogTitle>
            <DialogDescription>
              Are you ready to submit your review? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Review Summary:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Recommendation: {form.sections.summary.recommendation ? 
                  RECOMMENDATION_LABELS[form.sections.summary.recommendation] : 'Not selected'}
                </li>
                <li>• Confidence: {form.sections.summary.confidence ? 
                  CONFIDENCE_LABELS[form.sections.summary.confidence - 1] : 'Not selected'}
                </li>
                <li>• Expertise: {form.sections.summary.expertise ? 
                  EXPERTISE_LABELS[form.sections.summary.expertise - 1] : 'Not selected'}
                </li>
                <li>• Progress: {progress}% complete</li>
              </ul>
            </div>
            
            {hasValidationErrors && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription className="text-red-700">
                  Please fix validation errors before submitting.
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowSubmitDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || hasValidationErrors}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Review
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exit Review</DialogTitle>
            <DialogDescription>
              You have unsaved changes. What would you like to do?
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setShowExitDialog(false)}
            >
              Continue Reviewing
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                resetForm()
                router.push('/dashboard/reviewer')
              }}
            >
              Discard Changes
            </Button>
            <Button onClick={handleExitConfirm}>
              Save & Exit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}