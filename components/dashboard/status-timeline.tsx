'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { 
  FileText,
  UserPlus,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  RefreshCw,
  Award,
  Globe
} from 'lucide-react'

interface TimelineEvent {
  id: string
  title: string
  description: string
  date: string
  status: 'completed' | 'current' | 'upcoming'
  icon: React.ReactNode
  details?: string
}

interface StatusTimelineProps {
  manuscript: {
    id: string
    status: string
    submitted_at?: string
    created_at: string
    accepted_at?: string
    published_at?: string
    editor_id?: string
    review_assignments?: Array<{
      id: string
      status: string
      invited_at: string
      responded_at?: string
      completed_at?: string
      profiles?: {
        full_name: string
      }
    }>
    editorial_decisions?: Array<{
      id: string
      decision: string
      created_at: string
      editor: {
        full_name: string
      }
    }>
    activity_logs?: Array<{
      id: string
      action: string
      created_at: string
      details?: any
    }>
  }
  compact?: boolean
}

const STATUS_CONFIG = {
  'draft': { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  'submitted': { label: 'Submitted', color: 'bg-blue-100 text-blue-800' },
  'with_editor': { label: 'With Editor', color: 'bg-purple-100 text-purple-800' },
  'under_review': { label: 'Under Review', color: 'bg-yellow-100 text-yellow-800' },
  'revisions_requested': { label: 'Revisions Requested', color: 'bg-orange-100 text-orange-800' },
  'accepted': { label: 'Accepted', color: 'bg-green-100 text-green-800' },
  'rejected': { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  'published': { label: 'Published', color: 'bg-emerald-100 text-emerald-800' }
}

export function StatusTimeline({ manuscript, compact = false }: StatusTimelineProps) {
  const timeline = useMemo(() => {
    const events: TimelineEvent[] = []
    
    // 1. Submission
    events.push({
      id: 'submission',
      title: 'Manuscript Submitted',
      description: 'Initial submission received',
      date: manuscript.submitted_at || manuscript.created_at,
      status: 'completed',
      icon: <FileText className="w-4 h-4" />,
      details: 'Manuscript uploaded and submission completed'
    })

    // 2. Editor Assignment
    if (manuscript.editor_id) {
      const assignmentLog = manuscript.activity_logs?.find(log => 
        log.action === 'editor_assigned'
      )
      
      events.push({
        id: 'editor_assignment',
        title: 'Editor Assigned',
        description: assignmentLog?.details?.editor_name || 'Editor assigned to manuscript',
        date: assignmentLog?.created_at || manuscript.created_at,
        status: 'completed',
        icon: <UserPlus className="w-4 h-4" />,
        details: 'Manuscript assigned to handling editor'
      })
    } else if (manuscript.status === 'submitted') {
      events.push({
        id: 'editor_assignment',
        title: 'Awaiting Editor Assignment',
        description: 'Waiting for editorial assignment',
        date: new Date().toISOString(),
        status: 'current',
        icon: <Clock className="w-4 h-4" />,
        details: 'Manuscript awaiting assignment to handling editor'
      })
    }

    // 3. Reviewer Invitations
    if (manuscript.review_assignments && manuscript.review_assignments.length > 0) {
      const firstInvitation = manuscript.review_assignments.reduce((earliest, assignment) => 
        !earliest || assignment.invited_at < earliest.invited_at ? assignment : earliest
      )
      
      events.push({
        id: 'reviewers_invited',
        title: 'Reviewers Invited',
        description: `${manuscript.review_assignments.length} reviewer${manuscript.review_assignments.length > 1 ? 's' : ''} invited`,
        date: firstInvitation.invited_at,
        status: 'completed',
        icon: <Users className="w-4 h-4" />,
        details: `Peer review process initiated with ${manuscript.review_assignments.length} reviewers`
      })

      // 4. Reviews in progress/completed
      const completedReviews = manuscript.review_assignments.filter(ra => ra.status === 'completed')
      const acceptedReviews = manuscript.review_assignments.filter(ra => ra.status === 'accepted')
      
      if (completedReviews.length > 0) {
        const lastCompletedReview = completedReviews.reduce((latest, review) => 
          !latest || (review.completed_at && review.completed_at > (latest.completed_at || '')) ? review : latest
        )
        
        events.push({
          id: 'reviews_completed',
          title: `Reviews ${completedReviews.length === manuscript.review_assignments.length ? 'Completed' : 'In Progress'}`,
          description: `${completedReviews.length}/${manuscript.review_assignments.length} reviews completed`,
          date: lastCompletedReview.completed_at || new Date().toISOString(),
          status: completedReviews.length === manuscript.review_assignments.length ? 'completed' : 'current',
          icon: completedReviews.length === manuscript.review_assignments.length ? 
            <CheckCircle className="w-4 h-4" /> : 
            <Clock className="w-4 h-4" />,
          details: `Peer review ${completedReviews.length === manuscript.review_assignments.length ? 'completed' : 'in progress'}`
        })
      } else if (acceptedReviews.length > 0) {
        events.push({
          id: 'reviews_in_progress',
          title: 'Reviews In Progress',
          description: `${acceptedReviews.length} reviewer${acceptedReviews.length > 1 ? 's' : ''} working`,
          date: new Date().toISOString(),
          status: 'current',
          icon: <Clock className="w-4 h-4" />,
          details: 'Reviewers are currently evaluating the manuscript'
        })
      }
    } else if (manuscript.status === 'with_editor' || manuscript.status === 'under_review') {
      events.push({
        id: 'awaiting_reviewers',
        title: 'Awaiting Reviewers',
        description: 'Editor selecting peer reviewers',
        date: new Date().toISOString(),
        status: 'current',
        icon: <Clock className="w-4 h-4" />,
        details: 'Editor is identifying and inviting suitable reviewers'
      })
    }

    // 5. Editorial Decision
    if (manuscript.editorial_decisions && manuscript.editorial_decisions.length > 0) {
      const latestDecision = manuscript.editorial_decisions[manuscript.editorial_decisions.length - 1]
      
      events.push({
        id: 'editorial_decision',
        title: 'Editorial Decision',
        description: `${STATUS_CONFIG[latestDecision.decision as keyof typeof STATUS_CONFIG]?.label || latestDecision.decision}`,
        date: latestDecision.created_at,
        status: 'completed',
        icon: latestDecision.decision === 'accepted' ? 
          <CheckCircle className="w-4 h-4" /> : 
          latestDecision.decision === 'rejected' ?
          <XCircle className="w-4 h-4" /> :
          <RefreshCw className="w-4 h-4" />,
        details: `Editorial decision: ${STATUS_CONFIG[latestDecision.decision as keyof typeof STATUS_CONFIG]?.label || latestDecision.decision}`
      })
    } else if (manuscript.status === 'with_editor' && manuscript.review_assignments?.every(ra => ra.status === 'completed')) {
      events.push({
        id: 'awaiting_decision',
        title: 'Awaiting Decision',
        description: 'Editor reviewing completed assessments',
        date: new Date().toISOString(),
        status: 'current',
        icon: <Clock className="w-4 h-4" />,
        details: 'Editor is formulating decision based on peer reviews'
      })
    }

    // 6. Revisions (if applicable)
    if (manuscript.status === 'revisions_requested') {
      events.push({
        id: 'revisions_requested',
        title: 'Revisions in Progress',
        description: 'Author working on revisions',
        date: new Date().toISOString(),
        status: 'current',
        icon: <RefreshCw className="w-4 h-4" />,
        details: 'Author is addressing reviewer and editor comments'
      })
    }

    // 7. Acceptance
    if (manuscript.accepted_at) {
      events.push({
        id: 'acceptance',
        title: 'Manuscript Accepted',
        description: 'Accepted for publication',
        date: manuscript.accepted_at,
        status: 'completed',
        icon: <Award className="w-4 h-4" />,
        details: 'Manuscript has been accepted and is preparing for publication'
      })
    }

    // 8. Publication
    if (manuscript.published_at) {
      events.push({
        id: 'publication',
        title: 'Published',
        description: 'Article published and available',
        date: manuscript.published_at,
        status: 'completed',
        icon: <Globe className="w-4 h-4" />,
        details: 'Article is now publicly available'
      })
    } else if (manuscript.status === 'accepted') {
      events.push({
        id: 'preparing_publication',
        title: 'Preparing Publication',
        description: 'Preparing for publication',
        date: new Date().toISOString(),
        status: 'current',
        icon: <Clock className="w-4 h-4" />,
        details: 'Manuscript is being prepared for publication'
      })
    }

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [manuscript])

  const currentStatus = STATUS_CONFIG[manuscript.status as keyof typeof STATUS_CONFIG] || 
    { label: manuscript.status, color: 'bg-gray-100 text-gray-800' }

  if (compact) {
    return (
      <div className="flex items-center space-x-4">
        <Badge className={`${currentStatus.color} border`}>
          {currentStatus.label}
        </Badge>
        <div className="flex items-center space-x-2">
          {timeline.slice(-3).map((event, index) => (
            <div key={event.id} className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${
                event.status === 'completed' ? 'bg-green-500' :
                event.status === 'current' ? 'bg-blue-500' :
                'bg-gray-300'
              }`} />
              {index < 2 && <div className="w-4 h-px bg-gray-200" />}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-heading font-semibold text-gray-900">
          Manuscript Timeline
        </h3>
        <Badge className={`${currentStatus.color} border`}>
          Current: {currentStatus.label}
        </Badge>
      </div>
      
      <div className="relative">
        {timeline.map((event, index) => (
          <div key={event.id} className="relative flex items-start space-x-3 pb-6">
            {/* Timeline line */}
            {index < timeline.length - 1 && (
              <div 
                className="absolute left-4 top-8 w-px h-full bg-gray-200" 
                style={{ transform: 'translateX(-50%)' }}
              />
            )}
            
            {/* Event icon */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              event.status === 'completed' ? 'bg-green-100 text-green-600' :
              event.status === 'current' ? 'bg-blue-100 text-blue-600' :
              'bg-gray-100 text-gray-400'
            }`}>
              {event.icon}
            </div>
            
            {/* Event content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`text-sm font-medium ${
                  event.status === 'current' ? 'text-blue-900' : 'text-gray-900'
                }`}>
                  {event.title}
                </p>
                <time className="text-xs text-gray-500">
                  {new Date(event.date).toLocaleDateString()}
                </time>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {event.description}
              </p>
              {event.details && (
                <p className="text-xs text-gray-500 mt-1">
                  {event.details}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}