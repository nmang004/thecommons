'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  User,
  AlertCircle,
  CheckCircle,
  Eye,
  Download
} from 'lucide-react'

interface DemoReviewInterfaceProps {
  assignmentId: string
  mode: 'review' | 'view'
}

// Sample manuscript data based on our hardcoded assignments
const getMockManuscriptData = (assignmentId: string) => {
  const manuscripts = {
    'ra_001': {
      id: 'ms_001',
      title: 'Machine Learning Approaches to Climate Change Prediction: A Comprehensive Analysis',
      abstract: 'This paper presents novel machine learning algorithms for predicting climate patterns with unprecedented accuracy. Our research demonstrates significant improvements over traditional meteorological models through deep learning techniques applied to satellite data and atmospheric measurements.',
      field_of_study: 'Environmental Science',
      authors: ['Dr. Jane Smith', 'Prof. Michael Chen', 'Dr. Sarah Wilson'],
      submitted_at: '2024-08-28T00:00:00Z',
      status: 'invited',
      due_date: '2024-09-09T00:00:00Z'
    },
    'ra_004': {
      id: 'ms_004',
      title: 'Sustainable Energy Storage Solutions: Advanced Battery Technologies',
      abstract: 'This comprehensive review examines cutting-edge battery technologies for renewable energy storage, including lithium-ion improvements, solid-state batteries, and emerging alternatives like sodium-ion and flow batteries.',
      field_of_study: 'Materials Science',
      authors: ['Dr. Alex Johnson', 'Prof. Lisa Anderson'],
      submitted_at: '2024-08-15T00:00:00Z',
      status: 'accepted',
      due_date: '2024-09-16T00:00:00Z'
    },
    'ra_006': {
      id: 'ms_006',
      title: 'Advanced Robotics in Manufacturing: Industry 4.0 Implementation',
      abstract: 'The integration of advanced robotics in manufacturing processes represents a paradigm shift in industrial automation. This research examines the implementation challenges and benefits of Industry 4.0 technologies.',
      field_of_study: 'Engineering',
      authors: ['Dr. Robert Kim', 'Prof. Maria Garcia'],
      submitted_at: '2024-07-15T00:00:00Z',
      status: 'completed',
      due_date: '2024-08-05T00:00:00Z',
      completed_at: '2024-08-04T00:00:00Z'
    }
  }
  
  return manuscripts[assignmentId as keyof typeof manuscripts] || manuscripts['ra_001']
}

export function DemoReviewInterface({ assignmentId, mode }: DemoReviewInterfaceProps) {
  const router = useRouter()
  const [manuscript] = useState(getMockManuscriptData(assignmentId))
  const [reviewData, setReviewData] = useState({
    summary: '',
    strengths: '',
    weaknesses: '',
    recommendations: '',
    confidentiality_comments: '',
    recommendation: 'minor_revision'
  })

  const isViewMode = mode === 'view'
  const daysLeft = Math.ceil((new Date(manuscript.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  
  useEffect(() => {
    // For completed reviews, load some sample review data
    if (manuscript.status === 'completed') {
      setReviewData({
        summary: 'This manuscript presents a well-structured analysis of advanced robotics implementation in manufacturing environments. The research methodology is sound and the findings are significant for the field.',
        strengths: '• Comprehensive literature review\n• Clear methodology with reproducible results\n• Strong statistical analysis\n• Practical implications for industry',
        weaknesses: '• Limited discussion of economic implications\n• Some figures could be larger for better readability\n• Minor grammatical errors throughout',
        recommendations: 'Accept with minor revisions. The authors should address the economic analysis gap and improve figure quality.',
        confidentiality_comments: 'The work is of high quality and makes a valuable contribution to the field.',
        recommendation: 'minor_revision'
      })
    }
  }, [manuscript.status])

  const handleSubmitReview = () => {
    // Mock submission
    alert('Review submitted successfully! (This is a demo - no actual submission occurred)')
    router.push('/reviewer')
  }

  const handleSaveDraft = () => {
    alert('Draft saved successfully!')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => router.push('/reviewer')}
          className="flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <div className="flex items-center space-x-4">
          <Badge 
            className={`${
              manuscript.status === 'invited' ? 'bg-blue-100 text-blue-800' :
              manuscript.status === 'accepted' ? 'bg-green-100 text-green-800' :
              'bg-purple-100 text-purple-800'
            }`}
          >
            {manuscript.status === 'invited' ? 'Invitation Pending' :
             manuscript.status === 'accepted' ? 'In Progress' :
             'Completed'}
          </Badge>
          
          {manuscript.status !== 'completed' && (
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-1" />
              {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
            </div>
          )}
        </div>
      </div>

      {/* Manuscript Information */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">
              {manuscript.title}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                {manuscript.authors.join(', ')}
              </span>
              <Badge variant="outline">{manuscript.field_of_study}</Badge>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Abstract</h3>
            <p className="text-gray-700 leading-relaxed">
              {manuscript.abstract}
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Submitted: {new Date(manuscript.submitted_at).toLocaleDateString()}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Supplementary Files
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Review Form */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-heading font-semibold text-gray-900">
              {isViewMode ? 'Review Summary' : 'Peer Review Form'}
            </h2>
            {manuscript.status === 'completed' && (
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-5 h-5 mr-2" />
                Review Completed
              </div>
            )}
          </div>

          <div className="grid gap-6">
            {/* Summary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Summary of the manuscript
              </label>
              <Textarea
                placeholder={isViewMode ? '' : "Provide a brief summary of the manuscript's main contributions and findings..."}
                value={reviewData.summary}
                onChange={(e) => setReviewData({...reviewData, summary: e.target.value})}
                disabled={isViewMode}
                className="min-h-[100px]"
              />
            </div>

            {/* Strengths */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Major strengths
              </label>
              <Textarea
                placeholder={isViewMode ? '' : "List the major strengths of this work..."}
                value={reviewData.strengths}
                onChange={(e) => setReviewData({...reviewData, strengths: e.target.value})}
                disabled={isViewMode}
                className="min-h-[100px]"
              />
            </div>

            {/* Weaknesses */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Major weaknesses
              </label>
              <Textarea
                placeholder={isViewMode ? '' : "List any major weaknesses or areas for improvement..."}
                value={reviewData.weaknesses}
                onChange={(e) => setReviewData({...reviewData, weaknesses: e.target.value})}
                disabled={isViewMode}
                className="min-h-[100px]"
              />
            </div>

            {/* Recommendations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specific recommendations
              </label>
              <Textarea
                placeholder={isViewMode ? '' : "Provide specific recommendations for improving the manuscript..."}
                value={reviewData.recommendations}
                onChange={(e) => setReviewData({...reviewData, recommendations: e.target.value})}
                disabled={isViewMode}
                className="min-h-[100px]"
              />
            </div>

            {/* Overall Recommendation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall recommendation
              </label>
              <select
                value={reviewData.recommendation}
                onChange={(e) => setReviewData({...reviewData, recommendation: e.target.value})}
                disabled={isViewMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="accept">Accept</option>
                <option value="minor_revision">Minor Revision</option>
                <option value="major_revision">Major Revision</option>
                <option value="reject">Reject</option>
              </select>
            </div>

            {/* Confidential Comments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confidential comments to editor
                <span className="text-xs text-gray-500 ml-1">(optional)</span>
              </label>
              <Textarea
                placeholder={isViewMode ? '' : "Private comments for the editor only..."}
                value={reviewData.confidentiality_comments}
                onChange={(e) => setReviewData({...reviewData, confidentiality_comments: e.target.value})}
                disabled={isViewMode}
                className="min-h-[80px]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          {!isViewMode && manuscript.status !== 'completed' && (
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <Button variant="outline" onClick={handleSaveDraft}>
                Save Draft
              </Button>
              <div className="space-x-3">
                <Button variant="outline" onClick={() => router.push('/reviewer')}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitReview} className="bg-blue-600 hover:bg-blue-700">
                  Submit Review
                </Button>
              </div>
            </div>
          )}

          {isViewMode && (
            <div className="flex justify-center pt-6 border-t border-gray-200">
              <Button variant="outline" onClick={() => router.push('/reviewer')}>
                <Eye className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Demo Notice */}
      <Card className="p-4 bg-amber-50 border-amber-200">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-amber-600 mr-2" />
          <div className="text-sm text-amber-800">
            <strong>Demo Mode:</strong> This is a demonstration interface. No actual review data is saved or submitted.
          </div>
        </div>
      </Card>
    </div>
  )
}