'use client'

import React, { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Users, 
  Upload, 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  Eye,
  DollarSign,
  Shield,
  Clock
} from 'lucide-react'

const APC_AMOUNT = 200 // Article Processing Charge in USD

interface ReviewAndPayStepProps {
  onSubmit: (data: any) => void
  isSubmitting: boolean
}

function ReviewSection({ title, icon: Icon, children, isComplete }: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  isComplete: boolean
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${isComplete ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {isComplete && <CheckCircle className="w-5 h-5 text-green-500" />}
      </div>
      {children}
    </Card>
  )
}

export default function ReviewAndPayStep({ onSubmit, isSubmitting }: ReviewAndPayStepProps) {
  const { getValues } = useFormContext()
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedPolicy, setAcceptedPolicy] = useState(false)

  const formData = getValues()
  
  // Check completeness of each section
  const hasManuscriptType = !!formData.manuscriptType && !!formData.fieldOfStudy
  const hasBasicInfo = !!formData.title && !!formData.abstract && formData.keywords?.length >= 3
  const hasAuthors = formData.authors?.length > 0 && formData.authors.some((a: any) => a.isCorresponding)
  const hasFiles = formData.manuscriptFiles?.some((f: any) => f.type === 'manuscript_main')

  const allSectionsComplete = hasManuscriptType && hasBasicInfo && hasAuthors && hasFiles
  const canSubmit = allSectionsComplete && acceptedTerms && acceptedPolicy

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const correspondingAuthor = formData.authors?.find((author: any) => author.isCorresponding)

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-lg font-heading font-semibold text-gray-900 mb-4 block">
          Review Your Submission
        </Label>
        <p className="text-gray-600 mb-6">
          Please review all information before submitting your manuscript and paying the Article Processing Charge.
        </p>
      </div>

      {/* Manuscript Details */}
      <ReviewSection title="Manuscript Details" icon={FileText} isComplete={hasManuscriptType && hasBasicInfo}>
        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium text-gray-500">Type:</span>
            <p className="text-gray-900">{formData.manuscriptType?.replace('-', ' ') || 'Not specified'}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Field of Study:</span>
            <p className="text-gray-900">{formData.fieldOfStudy || 'Not specified'}</p>
            {formData.subfield && (
              <p className="text-sm text-gray-600">Subfield: {formData.subfield}</p>
            )}
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Title:</span>
            <p className="text-gray-900 font-medium">{formData.title || 'Not provided'}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Abstract:</span>
            <p className="text-gray-700 text-sm line-clamp-3">
              {formData.abstract || 'Not provided'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formData.abstract?.split(/\s+/).filter((w: string) => w.length > 0).length || 0} words
            </p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Keywords:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {formData.keywords?.map((keyword: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              )) || <span className="text-gray-500">None provided</span>}
            </div>
          </div>
        </div>
      </ReviewSection>

      {/* Authors */}
      <ReviewSection title="Authors" icon={Users} isComplete={hasAuthors}>
        <div className="space-y-3">
          {formData.authors?.map((author: any, index: number) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {author.name || 'Unnamed Author'}
                    {author.isCorresponding && (
                      <Badge className="ml-2 bg-yellow-100 text-yellow-800">Corresponding</Badge>
                    )}
                  </p>
                  <p className="text-sm text-gray-600">{author.email}</p>
                  {author.affiliation && (
                    <p className="text-sm text-gray-600">{author.affiliation}</p>
                  )}
                  {author.orcid && (
                    <p className="text-xs text-gray-500">ORCID: {author.orcid}</p>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
              </div>
            </div>
          )) || <p className="text-gray-500">No authors added</p>}
        </div>
      </ReviewSection>

      {/* Files */}
      <ReviewSection title="Files" icon={Upload} isComplete={hasFiles}>
        <div className="space-y-2">
          {formData.manuscriptFiles?.map((file: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {file.type.replace('_', ' ')} • {formatFileSize(file.size || 0)}
                  </p>
                </div>
              </div>
            </div>
          )) || <p className="text-gray-500">No files uploaded</p>}
        </div>
      </ReviewSection>

      {/* Additional Information Summary */}
      {(formData.coverLetter || formData.suggestedReviewers?.length > 0 || formData.excludedReviewers?.length > 0) && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
          </div>
          <div className="space-y-3 text-sm">
            {formData.coverLetter && (
              <div>
                <span className="font-medium text-gray-700">Cover Letter:</span>
                <span className="text-gray-600 ml-1">Provided</span>
              </div>
            )}
            {formData.suggestedReviewers?.length > 0 && (
              <div>
                <span className="font-medium text-gray-700">Suggested Reviewers:</span>
                <span className="text-gray-600 ml-1">{formData.suggestedReviewers.length} suggested</span>
              </div>
            )}
            {formData.excludedReviewers?.length > 0 && (
              <div>
                <span className="font-medium text-gray-700">Excluded Reviewers:</span>
                <span className="text-gray-600 ml-1">{formData.excludedReviewers.length} excluded</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Submission Checklist */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Submission Checklist</h3>
        <div className="space-y-3">
          {[
            { check: hasManuscriptType, text: 'Manuscript type and field of study selected' },
            { check: !!formData.title, text: 'Title provided' },
            { check: !!formData.abstract, text: 'Abstract provided' },
            { check: formData.keywords?.length >= 3, text: 'At least 3 keywords provided' },
            { check: hasAuthors, text: 'Authors added with corresponding author designated' },
            { check: hasFiles, text: 'Main manuscript file uploaded' },
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              {item.check ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <span className={item.check ? 'text-gray-900' : 'text-red-600'}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Payment Information */}
      <Card className="p-6 border-2 border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Article Processing Charge</h3>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Article Processing Charge (APC)</span>
            <span className="text-2xl font-bold text-gray-900">${APC_AMOUNT}</span>
          </div>
          <p className="text-sm text-gray-600">
            This fee covers peer review, editorial processing, and publication costs. 
            Your article will be published open access upon acceptance.
          </p>
        </div>

        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>Secure payment processing via Stripe</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Payment is only charged upon manuscript acceptance</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span>Full refund if manuscript is rejected</span>
          </div>
        </div>
      </Card>

      {/* Terms and Conditions */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Terms and Conditions</h3>
        <div className="space-y-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="text-sm text-gray-700">
              I confirm that this manuscript represents original work, has not been published elsewhere, 
              and is not under consideration by another journal. I agree to The Commons' 
              <a href="/terms" className="text-primary hover:underline ml-1">Terms of Service</a> and 
              <a href="/ethics" className="text-primary hover:underline ml-1">Publication Ethics</a>.
            </span>
          </label>
          
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={acceptedPolicy}
              onChange={(e) => setAcceptedPolicy(e.target.checked)}
              className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="text-sm text-gray-700">
              I understand the peer review process, APC structure, and open access publishing model. 
              I agree to pay the Article Processing Charge upon manuscript acceptance.
            </span>
          </label>
        </div>
      </Card>

      {/* Submit Button */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Submit?</h3>
          <p className="text-sm text-gray-600 mb-4">
            {correspondingAuthor && (
              <>A confirmation email will be sent to <strong>{correspondingAuthor.email}</strong></>
            )}
          </p>
          
          <Button
            onClick={() => onSubmit(formData)}
            disabled={!canSubmit || isSubmitting}
            size="lg"
            className="w-full md:w-auto px-8 py-3"
          >
            {isSubmitting ? (
              'Processing Submission...'
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Submit Manuscript & Pay ${APC_AMOUNT}
              </>
            )}
          </Button>
          
          {!allSectionsComplete && (
            <p className="text-red-600 text-sm mt-2">
              Please complete all required sections before submitting
            </p>
          )}
          
          {!acceptedTerms || !acceptedPolicy ? (
            <p className="text-red-600 text-sm mt-2">
              Please accept the terms and conditions to continue
            </p>
          ) : null}
        </div>
      </Card>
    </div>
  )
}