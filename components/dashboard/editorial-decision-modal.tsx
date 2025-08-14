'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  X, 
  Send,
  CheckCircle,
  XCircle,
  RotateCcw,
  AlertTriangle,
  Eye
} from 'lucide-react'

interface EditorialDecisionModalProps {
  isOpen: boolean
  onClose: () => void
  manuscript: any
  reviews: any[]
  onSubmitDecision: (decision: DecisionData) => void
}

interface DecisionData {
  decision: 'accept' | 'reject' | 'major_revisions' | 'minor_revisions'
  decisionLetter: string
  internalNotes: string
  publicComments: string
}

const DECISION_OPTIONS = [
  {
    id: 'accept',
    label: 'Accept',
    description: 'Manuscript is suitable for publication with minimal or no changes',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200'
  },
  {
    id: 'minor_revisions',
    label: 'Minor Revisions',
    description: 'Manuscript requires minor changes before acceptance',
    icon: RotateCcw,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200'
  },
  {
    id: 'major_revisions',
    label: 'Major Revisions',
    description: 'Manuscript requires substantial revisions before reconsideration',
    icon: RotateCcw,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200'
  },
  {
    id: 'reject',
    label: 'Reject',
    description: 'Manuscript is not suitable for publication',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200'
  }
]

export function EditorialDecisionModal({
  isOpen,
  onClose,
  manuscript,
  reviews,
  onSubmitDecision
}: EditorialDecisionModalProps) {
  const [decision, setDecision] = useState<string>('')
  const [decisionLetter, setDecisionLetter] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [publicComments, setPublicComments] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!decision || !decisionLetter.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmitDecision({
        decision: decision as DecisionData['decision'],
        decisionLetter: decisionLetter.trim(),
        internalNotes: internalNotes.trim(),
        publicComments: publicComments.trim()
      })
      onClose()
    } catch (error) {
      console.error('Failed to submit decision:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedDecisionOption = DECISION_OPTIONS.find(opt => opt.id === decision)

  // Calculate review summary
  const reviewSummary = reviews.reduce((acc, review) => {
    const recommendation = review.recommendation
    acc[recommendation] = (acc[recommendation] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-heading font-semibold text-gray-900">
              Editorial Decision
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Make a decision for: {manuscript.title.substring(0, 80)}...
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Decision Form */}
          <div className="flex-1 p-6 max-h-[70vh] overflow-y-auto">
            {/* Review Summary */}
            <Card className="p-4 mb-6 bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-3">Review Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {reviews.length}
                  </div>
                  <div className="text-xs text-gray-600">Total Reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {reviewSummary.accept || 0}
                  </div>
                  <div className="text-xs text-gray-600">Accept</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-yellow-600">
                    {(reviewSummary.major_revisions || 0) + (reviewSummary.minor_revisions || 0)}
                  </div>
                  <div className="text-xs text-gray-600">Revisions</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-red-600">
                    {reviewSummary.reject || 0}
                  </div>
                  <div className="text-xs text-gray-600">Reject</div>
                </div>
              </div>
            </Card>

            {/* Decision Selection */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-4">Select Decision</h4>
              <div className="space-y-3">
                {DECISION_OPTIONS.map((option) => {
                  const Icon = option.icon
                  return (
                    <div key={option.id}>
                      <div 
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          decision === option.id 
                            ? `${option.bgColor} border-2` 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => setDecision(option.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center ${
                            decision === option.id 
                              ? 'bg-blue-600 border-blue-600' 
                              : 'border-gray-300'
                          }`}>
                            {decision === option.id && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                          <Icon className={`w-5 h-5 ${option.color} mt-0.5`} />
                          <div>
                            <div className="font-medium text-gray-900">{option.label}</div>
                            <div className="text-sm text-gray-600">{option.description}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Decision Letter */}
            <div className="mb-6">
              <Label htmlFor="decision-letter" className="text-sm font-medium text-gray-700 mb-2 block">
                Decision Letter <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="decision-letter"
                placeholder="Write your decision letter to the authors. This will be sent to them along with the reviewer comments..."
                value={decisionLetter}
                onChange={(e) => setDecisionLetter(e.target.value)}
                rows={8}
                className="min-h-32"
              />
              <p className="text-xs text-gray-600 mt-1">
                This message will be sent to the corresponding author and all co-authors.
              </p>
            </div>

            {/* Public Comments */}
            <div className="mb-6">
              <Label htmlFor="public-comments" className="text-sm font-medium text-gray-700 mb-2 block">
                Additional Comments (Optional)
              </Label>
              <Textarea
                id="public-comments"
                placeholder="Any additional comments that will be visible to authors..."
                value={publicComments}
                onChange={(e) => setPublicComments(e.target.value)}
                rows={3}
              />
            </div>

            {/* Internal Notes */}
            <div>
              <Label htmlFor="internal-notes" className="text-sm font-medium text-gray-700 mb-2 block">
                Internal Notes (Editor Only)
              </Label>
              <Textarea
                id="internal-notes"
                placeholder="Private notes for your reference and other editors..."
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-gray-600 mt-1">
                These notes are only visible to editors and will not be shared with authors.
              </p>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-full lg:w-96 p-6 bg-gray-50 border-l border-gray-200">
            {/* Decision Preview */}
            {selectedDecisionOption && (
              <Card className="p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Decision Preview</h4>
                <div className="flex items-center space-x-3 mb-3">
                  <selectedDecisionOption.icon className={`w-6 h-6 ${selectedDecisionOption.color}`} />
                  <div>
                    <div className="font-medium text-gray-900">{selectedDecisionOption.label}</div>
                    <div className="text-sm text-gray-600">
                      {decision === 'accept' && 'Manuscript will move to production'}
                      {decision === 'minor_revisions' && 'Authors have 30 days to revise'}
                      {decision === 'major_revisions' && 'Authors have 60 days to revise'}
                      {decision === 'reject' && 'Manuscript will be closed'}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Reviews at a Glance */}
            <Card className="p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Reviews at a Glance</h4>
              <div className="space-y-3">
                {reviews.map((review, idx) => (
                  <div key={review.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      Reviewer {idx + 1}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {review.recommendation.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
              <Separator className="my-3" />
              <Button variant="ghost" size="sm" className="w-full">
                <Eye className="w-4 h-4 mr-2" />
                View All Reviews
              </Button>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button 
                onClick={handleSubmit}
                disabled={!decision || !decisionLetter.trim() || isSubmitting}
                className="w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Submitting...' : 'Submit Decision'}
              </Button>
              
              <Button variant="outline" onClick={onClose} className="w-full">
                Cancel
              </Button>
            </div>

            {/* Guidelines */}
            <Card className="p-4 mt-6">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-gray-600">
                  <p className="font-medium text-gray-700 mb-1">Decision Guidelines</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Be constructive in your feedback</li>
                    <li>• Provide clear reasoning for your decision</li>
                    <li>• Consider all reviewer comments</li>
                    <li>• Decisions are final and cannot be undone</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}