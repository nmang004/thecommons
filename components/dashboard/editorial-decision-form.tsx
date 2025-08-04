'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  X
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
    profiles?: {
      full_name: string
      email: string
    }
  }
  reviews: Review[]
  onSubmit: (decision: any) => void
  onCancel: () => void
  isLoading?: boolean
}

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

export function EditorialDecisionForm({
  manuscript,
  reviews,
  onSubmit,
  onCancel,
  isLoading = false
}: EditorialDecisionFormProps) {
  const [selectedDecision, setSelectedDecision] = useState('')
  const [decisionLetter, setDecisionLetter] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [customTemplates, setCustomTemplates] = useState<DecisionTemplate[]>([])
  const [activeTab, setActiveTab] = useState<'decision' | 'reviews' | 'templates'>('decision')

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

  const allTemplates = [...DEFAULT_TEMPLATES, ...customTemplates]

  // Generate review summary for templates
  const generateReviewSummary = () => {
    if (reviews.length === 0) return 'No reviews available.'

    const summaries = reviews.map((review, index) => {
      const reviewerName = review.profiles?.full_name || `Reviewer ${index + 1}`
      return `
**${reviewerName}** (Recommendation: ${review.recommendation.replace('_', ' ')}, Confidence: ${review.confidence_level}/5):

${review.summary}

${review.major_comments}

${review.minor_comments ? `Minor comments: ${review.minor_comments}` : ''}
`.trim()
    })

    return summaries.join('\n\n---\n\n')
  }

  // Apply template to decision letter
  const applyTemplate = (template: DecisionTemplate) => {
    let letter = template.template
    
    // Replace placeholders
    letter = letter.replace('{author_name}', manuscript.profiles?.full_name || 'Author')
    letter = letter.replace('{manuscript_title}', manuscript.title)
    letter = letter.replace('{review_summary}', generateReviewSummary())
    
    setDecisionLetter(letter)
    setSelectedDecision(template.decision)
    setSelectedTemplate(template.id)
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

  const handleSubmit = () => {
    if (!selectedDecision || !decisionLetter.trim()) return

    onSubmit({
      decision: selectedDecision,
      decisionLetter: decisionLetter.trim(),
      internalNotes: internalNotes.trim(),
      templateUsed: selectedTemplate
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-heading font-semibold text-gray-900">
            Editorial Decision
          </h3>
          <p className="text-sm text-gray-600 line-clamp-1">
            {manuscript.title}
          </p>
        </div>
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Review Summary */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-blue-900">Review Summary</h4>
          <Badge variant="outline" className="text-blue-800">
            {reviewStats.total} Reviews
          </Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{reviewStats.accept}</div>
            <div className="text-gray-600">Accept</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">{reviewStats.minorRevisions}</div>
            <div className="text-gray-600">Minor Rev.</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-orange-600">{reviewStats.majorRevisions}</div>
            <div className="text-gray-600">Major Rev.</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">{reviewStats.reject}</div>
            <div className="text-gray-600">Reject</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-600">{reviewStats.avgConfidence}</div>
            <div className="text-gray-600">Avg. Confidence</div>
          </div>
        </div>
      </Card>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="decision">Decision</TabsTrigger>
          <TabsTrigger value="reviews">Review Details</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Decision Tab */}
        <TabsContent value="decision" className="space-y-6 mt-6">
          {/* Decision Selection */}
          <div>
            <Label className="text-base font-medium mb-4 block">Select Decision</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DECISION_OPTIONS.map((option) => {
                const Icon = option.icon
                const isSelected = selectedDecision === option.value
                
                return (
                  <Card
                    key={option.value}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected 
                        ? `${option.color} ring-2 ring-offset-2` 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedDecision(option.value)}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-6 h-6 ${isSelected ? '' : 'text-gray-400'}`} />
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

          {/* Decision Letter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="decisionLetter" className="text-base font-medium">
                Decision Letter
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('templates')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Use Template
              </Button>
            </div>
            <Textarea
              id="decisionLetter"
              value={decisionLetter}
              onChange={(e) => setDecisionLetter(e.target.value)}
              rows={12}
              placeholder="Write your decision letter to the author..."
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              This letter will be sent to the corresponding author and all co-authors.
            </p>
          </div>

          {/* Internal Notes */}
          <div>
            <Label htmlFor="internalNotes" className="text-base font-medium mb-2 block">
              Internal Notes (Optional)
            </Label>
            <Textarea
              id="internalNotes"
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={4}
              placeholder="Add any internal notes for the editorial record (not visible to authors)..."
            />
          </div>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-4 mt-6">
          {reviews.length > 0 ? (
            reviews.map((review, index) => (
              <Card key={review.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {review.profiles?.full_name || `Reviewer ${index + 1}`}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Submitted {new Date(review.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={`${getRecommendationColor(review.recommendation)} border mb-1`}>
                      {review.recommendation.replace('_', ' ')}
                    </Badge>
                    <p className="text-xs text-gray-600">
                      Confidence: {review.confidence_level}/5
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Summary</h5>
                    <p className="text-sm text-gray-600 leading-relaxed">{review.summary}</p>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Major Comments</h5>
                    <p className="text-sm text-gray-600 leading-relaxed">{review.major_comments}</p>
                  </div>

                  {review.minor_comments && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Minor Comments</h5>
                      <p className="text-sm text-gray-600 leading-relaxed">{review.minor_comments}</p>
                    </div>
                  )}

                  {review.comments_for_editor && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-yellow-800 mb-2">
                        Confidential Comments (Editor Only)
                      </h5>
                      <p className="text-sm text-yellow-700 leading-relaxed">
                        {review.comments_for_editor}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Reviews Available</h4>
              <p className="text-gray-600">
                No peer reviews have been submitted for this manuscript yet.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4 mt-6">
          <div className="grid gap-4">
            {allTemplates
              .filter(template => !selectedDecision || template.decision === selectedDecision)
              .map((template) => (
                <Card key={template.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{template.name}</h4>
                      <Badge variant="outline" className="mb-2">
                        {template.decision.replace('_', ' ')}
                      </Badge>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {template.template.substring(0, 200)}...
                      </p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Preview template in a modal or expanded view
                          console.log('Preview template:', template)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          applyTemplate(template)
                          setActiveTab('decision')
                        }}
                      >
                        Use Template
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <AlertTriangle className="w-4 h-4" />
          <span>This decision will be permanent and cannot be undone.</span>
        </div>
        
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="outline"
            disabled={!selectedDecision || !decisionLetter.trim() || isLoading}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedDecision || !decisionLetter.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Decision
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}