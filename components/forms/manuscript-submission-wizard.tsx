'use client'

import React, { useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
// Using standard progress bar instead of AnimatedProgress for now
// import { AnimatedProgress } from '@/components/ui/animated-progress'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Profile } from '@/types/database'

// Import step components
import TypeAndFieldStep from './steps/type-and-field-step'
import TitleAndAbstractStep from './steps/title-and-abstract-step'
import AuthorsStep from './steps/authors-step'
import FilesStep from './steps/files-step'
import AdditionalInfoStep from './steps/additional-info-step'
import ReviewAndPayStep from './steps/review-and-pay-step'

// Validation schemas for each step
const typeAndFieldSchema = z.object({
  manuscriptType: z.string().min(1, 'Please select a manuscript type'),
  fieldOfStudy: z.string().min(1, 'Please select a field of study'),
  subfield: z.string().optional(),
})

const titleAndAbstractSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(300, 'Title too long'),
  abstract: z.string().min(100, 'Abstract must be at least 100 characters').max(3000, 'Abstract too long'),
  keywords: z.array(z.string()).min(3, 'Please add at least 3 keywords').max(10, 'Maximum 10 keywords'),
})

const authorsSchema = z.object({
  authors: z.array(z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Valid email required'),
    affiliation: z.string().optional(),
    orcid: z.string().optional(),
    isCorresponding: z.boolean(),
    contributionStatement: z.string().optional(),
  })).min(1, 'At least one author is required'),
})

const filesSchema = z.object({
  manuscriptFiles: z.array(z.object({
    file: z.any(),
    type: z.string(),
    name: z.string(),
  })).min(1, 'Main manuscript file is required'),
})

const additionalInfoSchema = z.object({
  coverLetter: z.string().optional(),
  suggestedReviewers: z.array(z.object({
    name: z.string(),
    email: z.string().email(),
    affiliation: z.string(),
    expertise: z.string(),
  })).optional(),
  excludedReviewers: z.array(z.object({
    name: z.string(),
    reason: z.string(),
  })).optional(),
  fundingStatement: z.string().optional(),
  conflictOfInterest: z.string().optional(),
  dataAvailability: z.string().optional(),
})

// Combined schema
const submissionSchema = typeAndFieldSchema
  .merge(titleAndAbstractSchema)
  .merge(authorsSchema)
  .merge(filesSchema)
  .merge(additionalInfoSchema)

type SubmissionFormData = z.infer<typeof submissionSchema>

interface ManuscriptSubmissionWizardProps {
  profile: Profile
}

const STEPS = [
  { id: 1, title: 'Type & Field', description: 'Select manuscript type and field of study' },
  { id: 2, title: 'Title & Abstract', description: 'Enter your manuscript title and abstract' },
  { id: 3, title: 'Authors', description: 'Add authors and affiliations' },
  { id: 4, title: 'Files', description: 'Upload your manuscript files' },
  { id: 5, title: 'Additional Info', description: 'Cover letter and reviewer suggestions' },
  { id: 6, title: 'Review & Pay', description: 'Review submission and pay APC' },
]

export default function ManuscriptSubmissionWizard({ profile }: ManuscriptSubmissionWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const methods = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    mode: 'onBlur',
    defaultValues: {
      authors: [{
        name: profile.full_name,
        email: profile.email,
        affiliation: profile.affiliation || '',
        orcid: profile.orcid || '',
        isCorresponding: true,
        contributionStatement: '',
      }],
      manuscriptFiles: [],
      keywords: [],
      suggestedReviewers: [],
      excludedReviewers: [],
    },
  })

  const { trigger, getValues: _getValues } = methods

  const validateCurrentStep = async () => {
    let fieldsToValidate: (keyof SubmissionFormData)[] = []
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ['manuscriptType', 'fieldOfStudy']
        break
      case 2:
        fieldsToValidate = ['title', 'abstract', 'keywords']
        break
      case 3:
        fieldsToValidate = ['authors']
        break
      case 4:
        fieldsToValidate = ['manuscriptFiles']
        break
      case 5:
        // Optional step, no required validation
        return true
      case 6:
        // Final review step
        return true
      default:
        return true
    }

    return await trigger(fieldsToValidate)
  }

  const handleNext = async () => {
    const isValid = await validateCurrentStep()
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (data: SubmissionFormData) => {
    setIsSubmitting(true)
    try {
      // Submit manuscript data
      const response = await fetch('/api/manuscripts/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Submission failed')
      }

      const result = await response.json()
      const manuscriptId = result.manuscript.id

      // Upload files if they exist
      if (data.manuscriptFiles && data.manuscriptFiles.length > 0) {
        for (const fileData of data.manuscriptFiles) {
          const formData = new FormData()
          formData.append('file', fileData.file)
          formData.append('type', fileData.type)

          const fileResponse = await fetch(`/api/manuscripts/${manuscriptId}/files`, {
            method: 'POST',
            body: formData,
          })

          if (!fileResponse.ok) {
            console.warn(`Failed to upload file: ${fileData.name}`)
          }
        }
      }

      // Create Stripe checkout session
      const checkoutResponse = await fetch(`/api/manuscripts/${manuscriptId}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json()
        throw new Error(errorData.error || 'Payment setup failed')
      }

      const checkoutResult = await checkoutResponse.json()
      
      // Redirect to Stripe Checkout
      if (checkoutResult.checkout_url) {
        window.location.href = checkoutResult.checkout_url
      } else {
        throw new Error('Failed to create checkout session')
      }

    } catch (error) {
      console.error('Submission error:', error)
      alert(error instanceof Error ? error.message : 'Submission failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <TypeAndFieldStep />
      case 2:
        return <TitleAndAbstractStep />
      case 3:
        return <AuthorsStep />
      case 4:
        return <FilesStep />
      case 5:
        return <AdditionalInfoStep />
      case 6:
        return <ReviewAndPayStep onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      default:
        return <TypeAndFieldStep />
    }
  }

  const progress = (currentStep / STEPS.length) * 100

  return (
    <FormProvider {...methods}>
      <div className="p-6">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStep} of {STEPS.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step) => (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-2 ${
                    step.id === currentStep
                      ? 'bg-primary text-white'
                      : step.id < currentStep
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step.id}
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-900">{step.title}</div>
                  <div className="text-xs text-gray-600">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        <div className="mb-8">
          {renderCurrentStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep < STEPS.length ? (
            <Button
              type="button"
              onClick={handleNext}
              className="flex items-center"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => methods.handleSubmit(handleSubmit)()}
              disabled={isSubmitting}
              className="flex items-center"
            >
              {isSubmitting ? 'Submitting...' : 'Submit & Pay'}
            </Button>
          )}
        </div>
      </div>
    </FormProvider>
  )
}