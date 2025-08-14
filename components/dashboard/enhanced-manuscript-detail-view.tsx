'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusTimeline } from './status-timeline'
import { CommunicationPanel } from './communication-panel'
import { ReviewerAssignmentModal } from './reviewer-assignment-modal'
import { EditorialDecisionModal } from './editorial-decision-modal'
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
  Send,
  UserPlus,
  MoreHorizontal,
  History,
  Flag,
  AlertTriangle,
  ExternalLink,
  CreditCard,
  StickyNote,
  Gavel
} from 'lucide-react'

interface ManuscriptDetailViewProps {
  manuscript: any
  potentialReviewers: any[]
  currentEditor: any
}

export function EnhancedManuscriptDetailView({ 
  manuscript, 
  potentialReviewers,
  currentEditor 
}: ManuscriptDetailViewProps) {
  const router = useRouter()
  const [showReviewerSelector, setShowReviewerSelector] = useState(false)
  const [showDecisionForm, setShowDecisionForm] = useState(false)
  // const [selectedReviewers, setSelectedReviewers] = useState<string[]>([])
  // const [decisionData, setDecisionData] = useState({
  //   decision: '',
  //   decisionLetter: '',
  //   internalNotes: ''
  // })
  const [activeTab, setActiveTab] = useState('overview')

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

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const getUrgencyLevel = (submittedAt: string, status: string) => {
    const daysSinceSubmission = Math.floor(
      (new Date().getTime() - new Date(submittedAt).getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (status === 'submitted' && daysSinceSubmission > 3) return 'high'
    if (status === 'with_editor' && daysSinceSubmission > 7) return 'medium'
    if (status === 'under_review' && daysSinceSubmission > 21) return 'medium'
    return 'low'
  }

  const urgencyLevel = getUrgencyLevel(manuscript.submitted_at || manuscript.created_at, manuscript.status)
  const daysSinceSubmission = Math.floor(
    (new Date().getTime() - new Date(manuscript.submitted_at || manuscript.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  const allReviewsComplete = manuscript.review_assignments?.every((assignment: any) => 
    assignment.status === 'completed'
  ) && manuscript.review_assignments?.length > 0

  const handleAssignReviewers = async (reviewerIds: string[], customMessage?: string) => {
    try {
      // Here you would make an API call to assign reviewers
      console.log('Assigning reviewers:', reviewerIds, 'with message:', customMessage)
      // await assignReviewers(manuscript.id, reviewerIds, customMessage)
      setShowReviewerSelector(false)
      // You might want to refresh the manuscript data here
    } catch (error) {
      console.error('Failed to assign reviewers:', error)
    }
  }

  const handleSubmitDecision = async (decisionData: any) => {
    try {
      // Here you would make an API call to submit the editorial decision
      console.log('Submitting decision:', decisionData)
      // await submitEditorialDecision(manuscript.id, decisionData)
      setShowDecisionForm(false)
      // You might want to refresh the manuscript data here
    } catch (error) {
      console.error('Failed to submit decision:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200 -mx-6 -mt-6 px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Queue
          </Button>
          <div className="flex items-center space-x-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 mr-6">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-heading font-bold text-gray-900 line-clamp-2">
                {manuscript.title}
              </h1>
              {urgencyLevel !== 'low' && (
                <div className="flex-shrink-0">
                  <AlertTriangle className={`w-5 h-5 ${
                    urgencyLevel === 'high' ? 'text-red-500' : 'text-yellow-500'
                  }`} />
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
              <span>ID: {manuscript.submission_number || manuscript.id.slice(-8)}</span>
              <span>•</span>
              <span>Submitted {new Date(manuscript.submitted_at || manuscript.created_at).toLocaleDateString()}</span>
              <span>•</span>
              <span>{daysSinceSubmission} days in system</span>
              <span>•</span>
              <span>{manuscript.field_of_study}</span>
            </div>

            <StatusTimeline manuscript={manuscript} compact={true} />
          </div>

          <div className="flex-shrink-0 text-right">
            <Badge className={`${getStatusColor(manuscript.status)} border mb-2`}>
              {formatStatus(manuscript.status)}
            </Badge>
            <div className="text-sm text-gray-600">
              <div>Author: {manuscript.profiles?.full_name}</div>
              {manuscript.profiles?.affiliation && (
                <div>{manuscript.profiles.affiliation}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tabbed Content Area */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-9">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="authors">Authors</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="communications">Messages</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 mt-6">
              <Card className="p-6">
                <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
                  Abstract & Metadata
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Abstract</h4>
                    <p className="text-gray-700 leading-relaxed">
                      {manuscript.abstract}
                    </p>
                  </div>

                  {manuscript.keywords && manuscript.keywords.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {manuscript.keywords.map((keyword: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Field of Study</h4>
                      <p className="text-sm text-gray-600">{manuscript.field_of_study}</p>
                    </div>
                    {manuscript.subfield && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Subfield</h4>
                        <p className="text-sm text-gray-600">{manuscript.subfield}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <StatusTimeline manuscript={manuscript} />
              </Card>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-6 mt-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-heading font-semibold text-gray-900">
                    Manuscript Content
                  </h3>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Full Screen View
                  </Button>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-96">
                  <p className="text-center text-gray-500 mt-20">
                    PDF viewer would be embedded here
                  </p>
                  <p className="text-center text-sm text-gray-400 mt-2">
                    Integration with PDF.js or similar viewer
                  </p>
                </div>
              </Card>
            </TabsContent>

            {/* Authors Tab */}
            <TabsContent value="authors" className="space-y-6 mt-6">
              <Card className="p-6">
                <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
                  Author Information
                </h3>
                
                <div className="space-y-4">
                  {/* Corresponding Author */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {manuscript.profiles?.full_name}
                          <Badge variant="outline" className="ml-2 text-xs">Corresponding</Badge>
                        </h4>
                        <p className="text-sm text-gray-600 flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {manuscript.profiles?.email}
                        </p>
                      </div>
                    </div>
                    {manuscript.profiles?.affiliation && (
                      <p className="text-sm text-gray-600 flex items-center ml-13">
                        <MapPin className="w-3 h-3 mr-1" />
                        {manuscript.profiles.affiliation}
                      </p>
                    )}
                    {manuscript.profiles?.orcid && (
                      <p className="text-sm text-gray-600 ml-13">
                        ORCID: {manuscript.profiles.orcid}
                      </p>
                    )}
                  </div>

                  {/* Co-authors */}
                  {manuscript.manuscript_coauthors?.map((coauthor: any) => (
                    <div key={coauthor.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {coauthor.name}
                            {coauthor.is_corresponding && (
                              <Badge variant="outline" className="ml-2 text-xs">Corresponding</Badge>
                            )}
                          </h4>
                          <p className="text-sm text-gray-600">{coauthor.email}</p>
                        </div>
                      </div>
                      {coauthor.affiliation && (
                        <p className="text-sm text-gray-600 ml-13">{coauthor.affiliation}</p>
                      )}
                      {coauthor.contribution_statement && (
                        <p className="text-sm text-gray-600 ml-13 mt-2">
                          <strong>Contribution:</strong> {coauthor.contribution_statement}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-6 mt-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-heading font-semibold text-gray-900">
                    Peer Reviews ({manuscript.reviews?.length || 0})
                  </h3>
                  {manuscript.status === 'submitted' && (
                    <Button size="sm" onClick={() => setShowReviewerSelector(true)}>
                      <Users className="w-4 h-4 mr-2" />
                      Assign Reviewers
                    </Button>
                  )}
                </div>

                {manuscript.reviews && manuscript.reviews.length > 0 ? (
                  <div className="space-y-6">
                    {manuscript.reviews.map((review: any) => (
                      <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {review.profiles?.full_name || 'Anonymous Reviewer'}
                              </p>
                              <p className="text-sm text-gray-600">
                                Submitted {new Date(review.submitted_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="mb-1">
                              {review.recommendation.replace('_', ' ')}
                            </Badge>
                            <p className="text-xs text-gray-600">
                              Confidence: {review.confidence_level}/5
                            </p>
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
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h4>
                    <p className="text-gray-600 mb-4">
                      This manuscript hasn't been reviewed yet.
                    </p>
                    {manuscript.status === 'submitted' && (
                      <Button onClick={() => setShowReviewerSelector(true)}>
                        <Users className="w-4 h-4 mr-2" />
                        Assign Reviewers
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Communications Tab */}
            <TabsContent value="communications" className="mt-6">
              <CommunicationPanel
                manuscript={manuscript}
                currentUser={currentEditor}
              />
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files" className="space-y-6 mt-6">
              <Card className="p-6">
                <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
                  Manuscript Files
                </h3>

                {manuscript.manuscript_files && manuscript.manuscript_files.length > 0 ? (
                  <div className="space-y-3">
                    {manuscript.manuscript_files.map((file: any) => (
                      <div key={file.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-8 h-8 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">{file.file_name}</p>
                            <p className="text-sm text-gray-600">
                              {file.file_type.replace('_', ' ').toUpperCase()} • {(file.file_size / 1024 / 1024).toFixed(1)} MB
                            </p>
                            <p className="text-xs text-gray-500">
                              Version {file.version} • Uploaded {new Date(file.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Files</h4>
                    <p className="text-gray-600">
                      No manuscript files have been uploaded.
                    </p>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Payment Status Tab */}
            <TabsContent value="payment" className="space-y-6 mt-6">
              <Card className="p-6">
                <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
                  Payment Status
                </h3>

                <div className="space-y-4">
                  {/* Payment Summary */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Processing Fee</h4>
                          <p className="text-sm text-gray-600">Article Processing Charge</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">$1,200</p>
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          Paid
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Payment Method: Credit Card ****1234</p>
                      <p>Transaction ID: txn_1234567890</p>
                      <p>Payment Date: {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Waiver Status (if applicable) */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Fee Waiver Status</h4>
                    <div className="text-sm text-gray-600">
                      <p>No fee waiver requested</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Authors from developing countries may be eligible for fee waivers
                      </p>
                    </div>
                  </div>

                  {/* Invoice */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Invoice</h4>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <p>Invoice #: INV-2024-001234</p>
                        <p>Issued: {new Date().toLocaleDateString()}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Internal Notes Tab */}
            <TabsContent value="notes" className="space-y-6 mt-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-heading font-semibold text-gray-900">
                    Internal Notes
                  </h3>
                  <Button size="sm">
                    <StickyNote className="w-4 h-4 mr-2" />
                    Add Note
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Example notes */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{currentEditor.full_name}</p>
                          <p className="text-xs text-gray-600">
                            {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">Editor Note</Badge>
                    </div>
                    <p className="text-sm text-gray-700">
                      Initial review - manuscript quality is good, will expedite reviewer assignments.
                      Potential conflict of interest with Dr. Smith needs verification.
                    </p>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Dr. Jane Smith</p>
                          <p className="text-xs text-gray-600">
                            {new Date(Date.now() - 86400000).toLocaleDateString()} at 2:30 PM
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">Admin Note</Badge>
                    </div>
                    <p className="text-sm text-gray-700">
                      Payment confirmed. Author submitted copyright form. Ready for editorial processing.
                    </p>
                  </div>

                  {/* Empty state for no notes */}
                  <div className="text-center py-8 border border-gray-200 rounded-lg border-dashed">
                    <StickyNote className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No additional notes</h4>
                    <p className="text-gray-600 mb-4">
                      Add internal notes to track important information about this manuscript.
                    </p>
                    <Button size="sm">
                      <StickyNote className="w-4 h-4 mr-2" />
                      Add First Note
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-6 mt-6">
              <Card className="p-6">
                <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
                  Activity History
                </h3>

                <div className="text-center py-8">
                  <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Activity Log</h4>
                  <p className="text-gray-600">
                    Detailed activity history will be displayed here.
                  </p>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar - Actions & Status */}
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

              {allReviewsComplete && (
                <div className="space-y-2">
                  <Button 
                    className="w-full justify-start"
                    onClick={() => router.push(`/editor/manuscripts/${manuscript.id}/decision`)}
                  >
                    <Gavel className="w-4 h-4 mr-2" />
                    Editorial Decision Workflow
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowDecisionForm(true)}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Quick Decision
                  </Button>
                </div>
              )}

              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact Author
              </Button>

              <Button variant="outline" className="w-full justify-start">
                <Flag className="w-4 h-4 mr-2" />
                Set Priority
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
                ))
              ) : (
                <p className="text-sm text-gray-600">No reviewers assigned</p>
              )}
            </div>
          </Card>

          {/* Metrics */}
          <Card className="p-6">
            <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
              Metrics
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Days in system</span>
                <span className="text-sm font-medium">{daysSinceSubmission}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Reviewers assigned</span>
                <span className="text-sm font-medium">{manuscript.review_assignments?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Reviews completed</span>
                <span className="text-sm font-medium">
                  {manuscript.review_assignments?.filter((ra: any) => ra.status === 'completed').length || 0}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Reviewer Assignment Modal */}
      <ReviewerAssignmentModal
        isOpen={showReviewerSelector}
        onClose={() => setShowReviewerSelector(false)}
        manuscript={manuscript}
        potentialReviewers={potentialReviewers}
        onAssignReviewers={handleAssignReviewers}
      />

      {/* Editorial Decision Modal */}
      <EditorialDecisionModal
        isOpen={showDecisionForm}
        onClose={() => setShowDecisionForm(false)}
        manuscript={manuscript}
        reviews={manuscript.reviews || []}
        onSubmitDecision={handleSubmitDecision}
      />
    </div>
  )
}