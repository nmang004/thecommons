'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Users, Clock } from 'lucide-react'

interface DecisionSummaryEditorProps {
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
  reviews: Array<{
    id: string
    recommendation: string
    confidence_level: number
    profiles?: {
      full_name: string
    }
    submitted_at: string
  }>
  value: string
  onChange: (value: string) => void
  className?: string
}

export function DecisionSummaryEditor({
  manuscript,
  reviews,
  value,
  onChange,
  className
}: DecisionSummaryEditorProps) {
  const [focusedArea, setFocusedArea] = useState<string | null>(null)

  // Calculate review statistics
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
      case 'accept': return 'bg-green-100 text-green-800'
      case 'minor_revisions': return 'bg-blue-100 text-blue-800'
      case 'major_revisions': return 'bg-orange-100 text-orange-800'
      case 'reject': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSuggestedSummary = () => {
    const majorityRecommendation = Object.entries({
      accept: reviewStats.accept,
      minor_revisions: reviewStats.minorRevisions,
      major_revisions: reviewStats.majorRevisions,
      reject: reviewStats.reject
    }).reduce((a, b) => a[1] > b[1] ? a : b)[0]

    return `Based on ${reviewStats.total} peer review${reviewStats.total !== 1 ? 's' : ''}, the manuscript "${manuscript.title}" received a majority recommendation of ${majorityRecommendation.replace('_', ' ')} with an average reviewer confidence of ${reviewStats.avgConfidence}/5. The reviewers found the work to be in the field of ${manuscript.field_of_study} and ${reviewStats.total > 1 ? 'generally agreed' : 'recommended'} that...`
  }

  return (
    <div className={className}>
      {/* Manuscript Context Card */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-2">{manuscript.title}</CardTitle>
              <CardDescription className="mt-1">
                by {manuscript.profiles?.full_name || 'Unknown Author'} • {manuscript.field_of_study}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Badge variant="outline" className="whitespace-nowrap">
                <FileText className="w-3 h-3 mr-1" />
                {manuscript.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center text-gray-600">
              <Users className="w-4 h-4 mr-2" />
              {reviewStats.total} Review{reviewStats.total !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              Avg. Confidence: {reviewStats.avgConfidence}/5
            </div>
            <div className="text-right">
              {manuscript.submitted_at && (
                <span className="text-gray-500">
                  Submitted {new Date(manuscript.submitted_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Summary Grid */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Review Overview</CardTitle>
          <CardDescription>
            Summary of peer review recommendations and feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{reviewStats.accept}</div>
              <div className="text-sm text-gray-600">Accept</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{reviewStats.minorRevisions}</div>
              <div className="text-sm text-gray-600">Minor Rev.</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{reviewStats.majorRevisions}</div>
              <div className="text-sm text-gray-600">Major Rev.</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{reviewStats.reject}</div>
              <div className="text-sm text-gray-600">Reject</div>
            </div>
          </div>

          {/* Individual Review Cards */}
          <div className="space-y-3">
            {reviews.map((review, index) => (
              <div key={review.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-sm">
                    {review.profiles?.full_name || `Reviewer ${index + 1}`}
                  </span>
                  <Badge className={getRecommendationColor(review.recommendation)} variant="secondary">
                    {review.recommendation.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>Confidence: {review.confidence_level}/5</span>
                  <span>•</span>
                  <span>{new Date(review.submitted_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Editor Summary Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Editorial Summary</CardTitle>
          <CardDescription>
            Provide your editorial summary of the manuscript and review process
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Insert Suggested Summary */}
          {!value && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Suggested Summary Template</h4>
              <p className="text-sm text-blue-700 mb-3 leading-relaxed">
                {getSuggestedSummary()}
              </p>
              <button
                type="button"
                onClick={() => onChange(getSuggestedSummary())}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Use this template →
              </button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="editorSummary" className="text-sm font-medium">
              Your Editorial Summary
            </Label>
            <Textarea
              id="editorSummary"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setFocusedArea('summary')}
              onBlur={() => setFocusedArea(null)}
              placeholder="Summarize your editorial assessment of the manuscript, taking into account the peer review feedback, scientific merit, and fit with the journal's scope..."
              rows={6}
              className={`resize-none transition-colors ${
                focusedArea === 'summary' ? 'ring-2 ring-blue-500' : ''
              }`}
            />
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>This summary will be used internally and may be included in communications</span>
              <span>{value.length} characters</span>
            </div>
          </div>

          {/* Writing Tips */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-900 mb-2">Writing Tips</h4>
            <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
              <li>Summarize the key strengths and weaknesses identified by reviewers</li>
              <li>Note any conflicts or consensus in reviewer recommendations</li>
              <li>Include your own assessment of the manuscript's significance and quality</li>
              <li>Mention any specific concerns or requirements for revision</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}