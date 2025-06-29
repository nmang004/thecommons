'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  ArrowLeft,
  FileText,
  Download,
  Users,
  Mail,
  User,
  MapPin,
  Eye,
  MessageSquare,
  Award,
  Send,
  UserPlus,
  MoreHorizontal
} from 'lucide-react'

interface ManuscriptDetailViewProps {
  manuscript: any
  potentialReviewers: any[]
  currentEditor: any
}

export function ManuscriptDetailView({ 
  manuscript, 
  potentialReviewers,
  currentEditor: _currentEditor 
}: ManuscriptDetailViewProps) {
  const router = useRouter()
  const [showReviewerSelector, setShowReviewerSelector] = useState(false)
  const [showDecisionForm, setShowDecisionForm] = useState(false)
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([])
  const [decisionData, setDecisionData] = useState({
    decision: '',
    decisionLetter: '',
    internalNotes: ''
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'with_editor':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'revisions_requested':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'published':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'accept':
        return 'text-green-600'
      case 'minor_revisions':
        return 'text-blue-600'
      case 'major_revisions':
        return 'text-orange-600'
      case 'reject':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const formatRecommendation = (rec: string) => {
    return rec.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const handleAssignReviewers = async () => {
    if (selectedReviewers.length === 0) return

    try {
      const response = await fetch('/api/reviews/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          manuscriptId: manuscript.id,
          reviewerIds: selectedReviewers,
          dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 3 weeks from now
          message: 'You have been invited to review this manuscript.'
        }),
      })

      if (response.ok) {
        setShowReviewerSelector(false)
        setSelectedReviewers([])
        router.refresh()
      }
    } catch (error) {
      console.error('Error assigning reviewers:', error)
    }
  }

  const handleEditorialDecision = async () => {
    if (!decisionData.decision || !decisionData.decisionLetter) return

    try {
      const response = await fetch('/api/editorial/decision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          manuscriptId: manuscript.id,
          decision: decisionData.decision,
          decisionLetter: decisionData.decisionLetter,
          internalNotes: decisionData.internalNotes
        }),
      })

      if (response.ok) {
        setShowDecisionForm(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Error making editorial decision:', error)
    }
  }

  const allReviewsComplete = manuscript.review_assignments?.every((assignment: any) => 
    assignment.status === 'completed'
  ) && manuscript.review_assignments?.length > 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Queue
          </Button>
          <div>
            <h1 className="text-2xl font-heading font-bold text-gray-900">
              Manuscript Details
            </h1>
            <p className="text-gray-600">
              Review and manage this submission
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className={`${getStatusColor(manuscript.status)} border`}>
            {formatStatus(manuscript.status)}
          </Badge>
          <Button variant="outline">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Manuscript Info */}
          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h2 className="text-xl font-heading font-semibold text-gray-900 mb-2">
                  {manuscript.title}
                </h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                  <span>Field: {manuscript.field_of_study}</span>
                  {manuscript.subfield && <span>• {manuscript.subfield}</span>}
                  <span>• Submitted {new Date(manuscript.submitted_at || manuscript.created_at).toLocaleDateString()}</span>
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
              <div className="text-right">
                <p className="text-sm text-gray-600">Submission ID</p>
                <p className="font-mono text-sm">{manuscript.submission_number || manuscript.id.slice(-8)}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-2">Abstract</h3>
              <p className="text-gray-700 leading-relaxed">
                {manuscript.abstract}
              </p>
            </div>

            {/* Author Information */}
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium text-gray-900 mb-3">Authors</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {manuscript.profiles?.full_name} 
                      <Badge variant="outline" className="ml-2 text-xs">Corresponding</Badge>
                    </p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Mail className="w-3 h-3 mr-1" />
                      {manuscript.profiles?.email}
                    </p>
                    {manuscript.profiles?.affiliation && (
                      <p className="text-sm text-gray-600 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {manuscript.profiles.affiliation}
                      </p>
                    )}
                  </div>
                </div>
                {manuscript.manuscript_coauthors?.map((coauthor: any) => (
                  <div key={coauthor.id} className="flex items-center space-x-3 ml-11">
                    <div>
                      <p className="font-medium text-gray-900">
                        {coauthor.name}
                        {coauthor.is_corresponding && (
                          <Badge variant="outline" className="ml-2 text-xs">Corresponding</Badge>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">{coauthor.email}</p>
                      {coauthor.affiliation && (
                        <p className="text-sm text-gray-600">{coauthor.affiliation}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Files */}
            {manuscript.manuscript_files && manuscript.manuscript_files.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium text-gray-900 mb-3">Files</h3>
                <div className="space-y-2">
                  {manuscript.manuscript_files.map((file: any) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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

            {/* Additional Information */}
            {(manuscript.cover_letter || manuscript.funding_statement || manuscript.conflict_of_interest) && (
              <div className="border-t pt-4 mt-4 space-y-4">
                <h3 className="font-medium text-gray-900">Additional Information</h3>
                
                {manuscript.cover_letter && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Cover Letter</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                      {manuscript.cover_letter}
                    </p>
                  </div>
                )}

                {manuscript.funding_statement && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Funding</h4>
                    <p className="text-sm text-gray-600">{manuscript.funding_statement}</p>
                  </div>
                )}

                {manuscript.conflict_of_interest && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Conflicts of Interest</h4>
                    <p className="text-sm text-gray-600">{manuscript.conflict_of_interest}</p>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Reviews */}
          {manuscript.reviews && manuscript.reviews.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
                Peer Reviews ({manuscript.reviews.length})
              </h3>
              <div className="space-y-6">
                {manuscript.reviews.map((review: any) => (
                  <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{review.profiles?.full_name || 'Anonymous Reviewer'}</p>
                          <p className="text-sm text-gray-600">
                            Submitted {new Date(review.submitted_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`${getRecommendationColor(review.recommendation)} bg-transparent border`}>
                          {formatRecommendation(review.recommendation)}
                        </Badge>
                        <div className="flex items-center mt-1">
                          <Award className="w-3 h-3 text-gray-400 mr-1" />
                          <span className="text-xs text-gray-600">
                            Confidence: {review.confidence_level}/5
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Summary</h4>
                        <p className="text-sm text-gray-600">{review.summary}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Major Comments</h4>
                        <p className="text-sm text-gray-600">{review.major_comments}</p>
                      </div>

                      {review.minor_comments && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Minor Comments</h4>
                          <p className="text-sm text-gray-600">{review.minor_comments}</p>
                        </div>
                      )}

                      {review.comments_for_editor && (
                        <div className="bg-yellow-50 p-3 rounded-md">
                          <h4 className="text-sm font-medium text-yellow-800 mb-1">
                            Confidential Comments (Editor Only)
                          </h4>
                          <p className="text-sm text-yellow-700">{review.comments_for_editor}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
              Editorial Actions
            </h3>
            <div className="space-y-3">
              {!manuscript.editor_id && (
                <Button className="w-full justify-start">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign to Me
                </Button>
              )}
              
              {manuscript.status === 'submitted' && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setShowReviewerSelector(true)}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Assign Reviewers
                </Button>
              )}

              {manuscript.status === 'under_review' && !allReviewsComplete && (
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Reminders
                </Button>
              )}

              {allReviewsComplete && (
                <Button 
                  className="w-full justify-start"
                  onClick={() => setShowDecisionForm(true)}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Make Decision
                </Button>
              )}

              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact Author
              </Button>

              <Button variant="outline" className="w-full justify-start">
                <Eye className="w-4 h-4 mr-2" />
                Preview Article
              </Button>
            </div>
          </Card>

          {/* Review Status */}
          <Card className="p-6">
            <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
              Review Status
            </h3>
            <div className="space-y-3">
              {manuscript.review_assignments && manuscript.review_assignments.length > 0 ? (
                manuscript.review_assignments.map((assignment: any) => (
                  <div key={assignment.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {assignment.profiles?.full_name || 'Unknown Reviewer'}
                      </p>
                      <p className="text-xs text-gray-600">
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        className={
                          assignment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          assignment.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                          assignment.status === 'declined' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }
                      >
                        {assignment.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">No reviewers assigned</p>
              )}
            </div>
          </Card>

          {/* Timeline */}
          <Card className="p-6">
            <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
              Timeline
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Submitted</p>
                  <p className="text-xs text-gray-600">
                    {new Date(manuscript.submitted_at || manuscript.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {manuscript.review_assignments && manuscript.review_assignments.length > 0 && (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Under Review</p>
                    <p className="text-xs text-gray-600">
                      {manuscript.review_assignments.length} reviewers assigned
                    </p>
                  </div>
                </div>
              )}

              {allReviewsComplete && (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Reviews Complete</p>
                    <p className="text-xs text-gray-600">Awaiting editorial decision</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Reviewer Selector Modal */}
      {showReviewerSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-heading font-semibold mb-4">Assign Reviewers</h3>
            
            <div className="space-y-3 mb-6">
              {potentialReviewers.map((reviewer) => (
                <div key={reviewer.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    checked={selectedReviewers.includes(reviewer.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedReviewers([...selectedReviewers, reviewer.id])
                      } else {
                        setSelectedReviewers(selectedReviewers.filter(id => id !== reviewer.id))
                      }
                    }}
                    className="rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{reviewer.full_name}</p>
                    <p className="text-sm text-gray-600">{reviewer.affiliation}</p>
                    {reviewer.expertise && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {reviewer.expertise.slice(0, 3).map((skill: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">H-index: {reviewer.h_index || 'N/A'}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowReviewerSelector(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAssignReviewers}
                disabled={selectedReviewers.length === 0}
              >
                Assign {selectedReviewers.length} Reviewer{selectedReviewers.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Decision Form Modal */}
      {showDecisionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-heading font-semibold mb-4">Editorial Decision</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <Label htmlFor="decision">Decision *</Label>
                <select
                  id="decision"
                  value={decisionData.decision}
                  onChange={(e) => setDecisionData({ ...decisionData, decision: e.target.value })}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select decision...</option>
                  <option value="accepted">Accept</option>
                  <option value="revisions_requested">Request Revisions</option>
                  <option value="rejected">Reject</option>
                </select>
              </div>

              <div>
                <Label htmlFor="decisionLetter">Decision Letter *</Label>
                <Textarea
                  id="decisionLetter"
                  value={decisionData.decisionLetter}
                  onChange={(e) => setDecisionData({ ...decisionData, decisionLetter: e.target.value })}
                  rows={8}
                  placeholder="Write your decision letter to the authors..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="internalNotes">Internal Notes</Label>
                <Textarea
                  id="internalNotes"
                  value={decisionData.internalNotes}
                  onChange={(e) => setDecisionData({ ...decisionData, internalNotes: e.target.value })}
                  rows={3}
                  placeholder="Internal notes (not visible to authors)..."
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowDecisionForm(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleEditorialDecision}
                disabled={!decisionData.decision || !decisionData.decisionLetter}
              >
                Submit Decision
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}