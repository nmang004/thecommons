'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  FileText, 
  Download, 
  Clock, 
  Star,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Save,
  Send
} from 'lucide-react'

interface ReviewSubmissionFormProps {
  assignment: any
  existingReview?: any
  manuscript: any
}

export function ReviewSubmissionForm({ 
  assignment, 
  existingReview, 
  manuscript 
}: ReviewSubmissionFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    recommendation: existingReview?.recommendation || '',
    summary: existingReview?.summary || '',
    majorComments: existingReview?.major_comments || '',
    minorComments: existingReview?.minor_comments || '',
    commentsForEditor: existingReview?.comments_for_editor || '',
    confidenceLevel: existingReview?.confidence_level || 3,
    timeSpentHours: existingReview?.time_spent_hours || ''
  })

  const isOverdue = new Date() > new Date(assignment.due_date)
  const daysUntilDue = Math.ceil(
    (new Date(assignment.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  const handleSubmit = async (isDraft = false) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentId: assignment.id,
          manuscriptId: assignment.manuscript_id,
          reviewData: formData,
          isDraft
        }),
      })

      if (response.ok) {
        router.push('/reviewer?submitted=true')
      } else {
        // Handle error
        console.error('Failed to submit review')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'accept':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'minor_revisions':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'major_revisions':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'reject':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-heading font-bold text-gray-900">
              Peer Review Submission
            </h1>
            <p className="text-gray-600">
              {existingReview ? 'Edit your review' : 'Submit your peer review'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            isOverdue 
              ? 'bg-red-100 text-red-800' 
              : daysUntilDue <= 3 
              ? 'bg-orange-100 text-orange-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            <Clock className="w-3 h-3 mr-1" />
            {isOverdue 
              ? `Overdue by ${Math.abs(daysUntilDue)} days`
              : `Due in ${daysUntilDue} days`
            }
          </div>
        </div>
      </div>

      {/* Manuscript Information */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-heading font-semibold text-gray-900 mb-2">
              {manuscript.title}
            </h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
              <span>Field: {manuscript.field_of_study}</span>
              {manuscript.subfield && <span>• {manuscript.subfield}</span>}
            </div>
            {manuscript.keywords && manuscript.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {manuscript.keywords.map((keyword: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-medium text-gray-900 mb-2">Abstract</h3>
          <p className="text-gray-700 leading-relaxed">
            {manuscript.abstract}
          </p>
        </div>

        {/* Files */}
        {manuscript.manuscript_files && manuscript.manuscript_files.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <h3 className="font-medium text-gray-900 mb-3">Manuscript Files</h3>
            <div className="space-y-2">
              {manuscript.manuscript_files.map((file: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.file_name}</p>
                      <p className="text-xs text-gray-500">
                        {file.file_type.replace('_', ' ').toUpperCase()} • {(file.file_size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Review Form */}
      <Card className="p-6">
        <h2 className="text-xl font-heading font-semibold text-gray-900 mb-6">
          Your Review
        </h2>

        <div className="space-y-6">
          {/* Recommendation */}
          <div>
            <Label htmlFor="recommendation" className="text-base font-medium">
              Overall Recommendation *
            </Label>
            <p className="text-sm text-gray-600 mb-3">
              Select your recommendation based on the manuscript's quality and contribution
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { value: 'accept', label: 'Accept', desc: 'Publish as is with minimal changes' },
                { value: 'minor_revisions', label: 'Minor Revisions', desc: 'Minor improvements needed' },
                { value: 'major_revisions', label: 'Major Revisions', desc: 'Significant changes required' },
                { value: 'reject', label: 'Reject', desc: 'Not suitable for publication' }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, recommendation: option.value })}
                  className={`p-4 text-left border-2 rounded-lg transition-colors ${
                    formData.recommendation === option.value
                      ? getRecommendationColor(option.value) + ' border-current'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-gray-600 mt-1">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div>
            <Label htmlFor="summary" className="text-base font-medium">
              Summary for Authors *
            </Label>
            <p className="text-sm text-gray-600 mb-3">
              Provide a clear summary of your review (visible to authors)
            </p>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              rows={4}
              placeholder="Summarize the manuscript's strengths, weaknesses, and your overall assessment..."
              className="min-h-[100px]"
            />
          </div>

          {/* Major Comments */}
          <div>
            <Label htmlFor="majorComments" className="text-base font-medium">
              Major Comments *
            </Label>
            <p className="text-sm text-gray-600 mb-3">
              Detailed feedback on content, methodology, and contribution (visible to authors)
            </p>
            <Textarea
              id="majorComments"
              value={formData.majorComments}
              onChange={(e) => setFormData({ ...formData, majorComments: e.target.value })}
              rows={6}
              placeholder="Provide detailed comments on the manuscript's scientific merit, methodology, analysis, and conclusions..."
              className="min-h-[150px]"
            />
          </div>

          {/* Minor Comments */}
          <div>
            <Label htmlFor="minorComments" className="text-base font-medium">
              Minor Comments
            </Label>
            <p className="text-sm text-gray-600 mb-3">
              Technical corrections, style suggestions, typos (visible to authors)
            </p>
            <Textarea
              id="minorComments"
              value={formData.minorComments}
              onChange={(e) => setFormData({ ...formData, minorComments: e.target.value })}
              rows={4}
              placeholder="List specific technical corrections, formatting issues, or minor suggestions..."
            />
          </div>

          {/* Comments for Editor */}
          <div>
            <Label htmlFor="commentsForEditor" className="text-base font-medium">
              Confidential Comments for Editor
            </Label>
            <p className="text-sm text-gray-600 mb-3">
              Private comments only the editor will see
            </p>
            <Textarea
              id="commentsForEditor"
              value={formData.commentsForEditor}
              onChange={(e) => setFormData({ ...formData, commentsForEditor: e.target.value })}
              rows={3}
              placeholder="Share any concerns or additional context that only the editor should know..."
            />
          </div>

          {/* Confidence Level */}
          <div>
            <Label className="text-base font-medium">
              Confidence Level *
            </Label>
            <p className="text-sm text-gray-600 mb-3">
              How confident are you in your assessment of this manuscript?
            </p>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData({ ...formData, confidenceLevel: level })}
                  className={`flex-1 p-3 text-center border rounded-lg transition-colors ${
                    formData.confidenceLevel === level
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Star className={`w-4 h-4 mx-auto mb-1 ${
                    formData.confidenceLevel === level ? 'fill-current' : ''
                  }`} />
                  <div className="text-xs font-medium">{level}</div>
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Low confidence</span>
              <span>High confidence</span>
            </div>
          </div>

          {/* Time Spent */}
          <div>
            <Label htmlFor="timeSpent" className="text-base font-medium">
              Time Spent (hours)
            </Label>
            <p className="text-sm text-gray-600 mb-3">
              Approximately how many hours did you spend on this review?
            </p>
            <input
              type="number"
              id="timeSpent"
              value={formData.timeSpentHours}
              onChange={(e) => setFormData({ ...formData, timeSpentHours: e.target.value })}
              min="0"
              step="0.5"
              className="w-32 px-3 py-2 border border-gray-300 rounded-md"
              placeholder="8.5"
            />
          </div>
        </div>

        {/* Submission Actions */}
        <div className="border-t pt-6 mt-8">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {existingReview ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Review submitted on {new Date(existingReview.submitted_at).toLocaleDateString()}
                </div>
              ) : (
                <div className="flex items-center text-amber-600">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Your review has not been submitted yet
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button 
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting || !formData.recommendation || !formData.summary || !formData.majorComments}
              >
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}