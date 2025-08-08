'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  User,
} from 'lucide-react'

interface ReviewerResponseFormProps {
  invitationToken: string
  defaultAction?: 'accept' | 'decline'
  manuscriptTitle: string
}

interface ConflictDeclaration {
  hasConflict: boolean
  conflictType?: string
  conflictDescription?: string
}

interface AlternativeReviewer {
  name: string
  email: string
  affiliation: string
  expertise: string
  reason: string
}

export function ReviewerResponseForm({ 
  invitationToken, 
  defaultAction, 
  manuscriptTitle: _manuscriptTitle 
}: ReviewerResponseFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [response, setResponse] = useState<'accept' | 'decline' | null>(defaultAction || null)
  const [expertiseRating, setExpertiseRating] = useState<number>(4)
  const [availabilityConfirmed, setAvailabilityConfirmed] = useState(false)
  const [conflictDeclaration, setConflictDeclaration] = useState<ConflictDeclaration>({
    hasConflict: false
  })
  const [declineReason, setDeclineReason] = useState('')
  const [customDeclineReason, setCustomDeclineReason] = useState('')
  const [alternativeReviewer, setAlternativeReviewer] = useState<Partial<AlternativeReviewer>>({})
  const [additionalComments, setAdditionalComments] = useState('')

  const declineReasons = [
    'Lack of expertise in this specific area',
    'Current workload too heavy',
    'Conflict of interest',
    'Time constraints/unavailable during review period',
    'Topic outside my research interests',
    'Recent review of similar work',
    'Other (please specify)'
  ]

  const conflictTypes = [
    'Financial interest',
    'Personal relationship with authors',
    'Institutional affiliation',
    'Recent collaboration',
    'Competitive research',
    'Other conflict'
  ]

  const handleSubmit = async () => {
    if (!response) return

    setIsSubmitting(true)

    try {
      const payload = {
        decision: response,
        expertiseRating: response === 'accept' ? expertiseRating : undefined,
        conflictDeclaration: response === 'accept' ? conflictDeclaration : undefined,
        declineReason: response === 'decline' ? (
          declineReason === 'Other (please specify)' ? customDeclineReason : declineReason
        ) : undefined,
        alternativeReviewer: response === 'decline' && alternativeReviewer.name ? alternativeReviewer : undefined,
        additionalComments: additionalComments.trim() || undefined,
        availabilityConfirmed: response === 'accept' ? availabilityConfirmed : undefined
      }

      const response_api = await fetch(`/api/invitations/respond/${invitationToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response_api.ok) {
        const error = await response_api.text()
        throw new Error(error || 'Failed to submit response')
      }

      // Redirect to success page or refresh
      router.refresh()
    } catch (error) {
      console.error('Error submitting response:', error)
      alert('Failed to submit response. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = () => {
    if (!response) return false
    
    if (response === 'accept') {
      return availabilityConfirmed && (!conflictDeclaration.hasConflict || conflictDeclaration.conflictDescription)
    }
    
    if (response === 'decline') {
      return declineReason && (declineReason !== 'Other (please specify)' || customDeclineReason.trim())
    }
    
    return false
  }

  return (
    <div className="space-y-6">
      {/* Decision Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className={`p-6 cursor-pointer transition-all border-2 ${
            response === 'accept' 
              ? 'border-green-500 bg-green-50 ring-2 ring-green-200' 
              : 'border-gray-200 hover:border-green-300'
          }`}
          onClick={() => setResponse('accept')}
        >
          <div className="flex items-center space-x-3">
            <CheckCircle className={`w-6 h-6 ${
              response === 'accept' ? 'text-green-600' : 'text-gray-400'
            }`} />
            <div>
              <h3 className="font-semibold text-gray-900">Accept Review</h3>
              <p className="text-sm text-gray-600">
                I am available and willing to review this manuscript
              </p>
            </div>
          </div>
        </Card>

        <Card 
          className={`p-6 cursor-pointer transition-all border-2 ${
            response === 'decline' 
              ? 'border-red-500 bg-red-50 ring-2 ring-red-200' 
              : 'border-gray-200 hover:border-red-300'
          }`}
          onClick={() => setResponse('decline')}
        >
          <div className="flex items-center space-x-3">
            <XCircle className={`w-6 h-6 ${
              response === 'decline' ? 'text-red-600' : 'text-gray-400'
            }`} />
            <div>
              <h3 className="font-semibold text-gray-900">Decline Review</h3>
              <p className="text-sm text-gray-600">
                I am unable to review this manuscript
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Accept-specific fields */}
      {response === 'accept' && (
        <div className="space-y-6">
          {/* Expertise Rating */}
          <div>
            <Label className="text-sm font-medium text-gray-900 mb-2 block">
              How would you rate your expertise in this manuscript's topic?
            </Label>
            <Select value={expertiseRating.toString()} onValueChange={(value) => setExpertiseRating(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 - Expert (This is my primary research area)</SelectItem>
                <SelectItem value="4">4 - Very Knowledgeable (Closely related to my research)</SelectItem>
                <SelectItem value="3">3 - Knowledgeable (Somewhat related to my research)</SelectItem>
                <SelectItem value="2">2 - Some Knowledge (Familiar with the general area)</SelectItem>
                <SelectItem value="1">1 - Limited Knowledge (Outside my expertise)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Availability Confirmation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="availability"
                checked={availabilityConfirmed}
                onCheckedChange={(checked) => setAvailabilityConfirmed(checked as boolean)}
              />
              <div className="space-y-1">
                <Label 
                  htmlFor="availability" 
                  className="text-sm font-medium text-blue-900 cursor-pointer"
                >
                  Availability Confirmation
                </Label>
                <p className="text-sm text-blue-800">
                  I confirm that I am available to complete this review and can meet the specified deadline.
                  I understand that timely completion is essential for the peer review process.
                </p>
              </div>
            </div>
          </div>

          {/* Conflict of Interest Declaration */}
          <div className="border border-amber-200 rounded-lg p-4 bg-amber-50">
            <h4 className="font-medium text-amber-900 mb-3 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Conflict of Interest Declaration
            </h4>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="no-conflict"
                  checked={!conflictDeclaration.hasConflict}
                  onCheckedChange={(checked) => setConflictDeclaration({
                    hasConflict: !checked,
                    conflictType: undefined,
                    conflictDescription: undefined
                  })}
                />
                <Label htmlFor="no-conflict" className="text-sm text-amber-900 cursor-pointer">
                  I have no conflicts of interest that would affect my ability to provide an impartial review
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="has-conflict"
                  checked={conflictDeclaration.hasConflict}
                  onCheckedChange={(checked) => setConflictDeclaration(prev => ({
                    ...prev,
                    hasConflict: checked as boolean
                  }))}
                />
                <Label htmlFor="has-conflict" className="text-sm text-amber-900 cursor-pointer">
                  I have a potential conflict of interest (please describe below)
                </Label>
              </div>

              {conflictDeclaration.hasConflict && (
                <div className="space-y-3 ml-6">
                  <div>
                    <Label className="text-sm font-medium text-amber-900 mb-1 block">
                      Type of Conflict
                    </Label>
                    <Select 
                      value={conflictDeclaration.conflictType || ''} 
                      onValueChange={(value) => setConflictDeclaration(prev => ({
                        ...prev,
                        conflictType: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select conflict type" />
                      </SelectTrigger>
                      <SelectContent>
                        {conflictTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-amber-900 mb-1 block">
                      Please describe the conflict
                    </Label>
                    <Textarea
                      value={conflictDeclaration.conflictDescription || ''}
                      onChange={(e) => setConflictDeclaration(prev => ({
                        ...prev,
                        conflictDescription: e.target.value
                      }))}
                      placeholder="Please provide details about the potential conflict of interest..."
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Decline-specific fields */}
      {response === 'decline' && (
        <div className="space-y-6">
          {/* Decline Reason */}
          <div>
            <Label className="text-sm font-medium text-gray-900 mb-2 block">
              Please select your reason for declining (required)
            </Label>
            <Select value={declineReason} onValueChange={setDeclineReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {declineReasons.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom decline reason */}
          {declineReason === 'Other (please specify)' && (
            <div>
              <Label className="text-sm font-medium text-gray-900 mb-2 block">
                Please specify your reason
              </Label>
              <Textarea
                value={customDeclineReason}
                onChange={(e) => setCustomDeclineReason(e.target.value)}
                placeholder="Please provide your specific reason for declining..."
                rows={3}
              />
            </div>
          )}

          {/* Alternative Reviewer Suggestion */}
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <h4 className="font-medium text-blue-900 mb-3 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Suggest an Alternative Reviewer (Optional)
            </h4>
            <p className="text-sm text-blue-800 mb-4">
              If you know someone who would be well-suited to review this manuscript, please provide their details below.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-blue-900 mb-1 block">
                  Name
                </Label>
                <Input
                  value={alternativeReviewer.name || ''}
                  onChange={(e) => setAlternativeReviewer(prev => ({
                    ...prev,
                    name: e.target.value
                  }))}
                  placeholder="Dr. Jane Smith"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-blue-900 mb-1 block">
                  Email
                </Label>
                <Input
                  type="email"
                  value={alternativeReviewer.email || ''}
                  onChange={(e) => setAlternativeReviewer(prev => ({
                    ...prev,
                    email: e.target.value
                  }))}
                  placeholder="jane.smith@university.edu"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-blue-900 mb-1 block">
                  Affiliation
                </Label>
                <Input
                  value={alternativeReviewer.affiliation || ''}
                  onChange={(e) => setAlternativeReviewer(prev => ({
                    ...prev,
                    affiliation: e.target.value
                  }))}
                  placeholder="University of Example"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-blue-900 mb-1 block">
                  Relevant Expertise
                </Label>
                <Input
                  value={alternativeReviewer.expertise || ''}
                  onChange={(e) => setAlternativeReviewer(prev => ({
                    ...prev,
                    expertise: e.target.value
                  }))}
                  placeholder="Machine Learning, NLP"
                />
              </div>

              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-blue-900 mb-1 block">
                  Why is this person suitable?
                </Label>
                <Textarea
                  value={alternativeReviewer.reason || ''}
                  onChange={(e) => setAlternativeReviewer(prev => ({
                    ...prev,
                    reason: e.target.value
                  }))}
                  placeholder="Explain why this person would be a good fit for reviewing this manuscript..."
                  rows={2}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Comments */}
      <div>
        <Label className="text-sm font-medium text-gray-900 mb-2 block">
          Additional Comments (Optional)
        </Label>
        <Textarea
          value={additionalComments}
          onChange={(e) => setAdditionalComments(e.target.value)}
          placeholder="Any additional comments for the editor..."
          rows={3}
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit() || isSubmitting}
          size="lg"
          className={`min-w-32 ${
            response === 'accept' 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              {response === 'accept' ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept Review
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Decline Review
                </>
              )}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}