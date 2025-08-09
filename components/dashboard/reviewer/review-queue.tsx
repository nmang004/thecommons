'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  FileText,
  User,
  Eye,
  Play,
  X
} from 'lucide-react'
import { ReviewAssignment } from '@/types/database'

interface ReviewQueueProps {
  queue: {
    pending: ReviewAssignment[]
    inProgress: ReviewAssignment[]
    completed: ReviewAssignment[]
    declined: ReviewAssignment[]
  }
  compact?: boolean
  limit?: number
}

export function ReviewQueue({ queue, compact = false, limit }: ReviewQueueProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'inProgress' | 'completed' | 'declined'>('all')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'invited':
        return 'bg-blue-100 text-blue-800'
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'declined':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-purple-100 text-purple-800'
      case 'expired':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getUrgencyColor = (daysLeft: number) => {
    if (daysLeft < 0) return 'text-red-600'
    if (daysLeft <= 3) return 'text-orange-600'
    if (daysLeft <= 7) return 'text-yellow-600'
    return 'text-gray-600'
  }

  // Combine all assignments for filtering
  const allAssignments = [
    ...queue.pending,
    ...queue.inProgress,
    ...queue.completed,
    ...queue.declined
  ]

  // Apply filter
  let filteredAssignments = allAssignments
  if (selectedFilter !== 'all') {
    filteredAssignments = queue[selectedFilter as keyof typeof queue]
  }

  // Apply limit if specified
  if (limit) {
    filteredAssignments = filteredAssignments.slice(0, limit)
  }

  // Sort by priority (invited first, then by due date)
  filteredAssignments.sort((a: any, b: any) => {
    if (a.status === 'invited' && b.status !== 'invited') return -1
    if (b.status === 'invited' && a.status !== 'invited') return 1
    
    const aDue = new Date(a.due_date).getTime()
    const bDue = new Date(b.due_date).getTime()
    return aDue - bDue
  })

  const handleAcceptReview = async (assignmentId: string) => {
    // TODO: Implement accept review logic
    console.log('Accept review:', assignmentId)
  }

  const handleDeclineReview = async (assignmentId: string) => {
    // TODO: Implement decline review logic
    console.log('Decline review:', assignmentId)
  }

  const handleContinueReview = (assignmentId: string) => {
    // TODO: Navigate to review interface
    console.log('Continue review:', assignmentId)
  }

  if (!compact) {
    return (
      <div className="space-y-6">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('all')}
          >
            All ({allAssignments.length})
          </Button>
          <Button
            variant={selectedFilter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('pending')}
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending ({queue.pending.length})
          </Button>
          <Button
            variant={selectedFilter === 'inProgress' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('inProgress')}
          >
            <Clock className="w-3 h-3 mr-1" />
            In Progress ({queue.inProgress.length})
          </Button>
          <Button
            variant={selectedFilter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('completed')}
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed ({queue.completed.length})
          </Button>
        </div>

        {/* Review List */}
        <div className="space-y-4">
          {filteredAssignments.length > 0 ? (
            filteredAssignments.map((assignment: any) => (
              <ReviewCard 
                key={assignment.id} 
                assignment={assignment}
                onAccept={handleAcceptReview}
                onDecline={handleDeclineReview}
                onContinue={handleContinueReview}
                getDaysUntilDue={getDaysUntilDue}
                getUrgencyColor={getUrgencyColor}
                getStatusColor={getStatusColor}
                formatStatus={formatStatus}
              />
            ))
          ) : (
            <Card className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No reviews found
              </h3>
              <p className="text-gray-600">
                {selectedFilter === 'all' 
                  ? "You don't have any review assignments at the moment."
                  : `No ${selectedFilter.replace(/([A-Z])/g, ' $1').toLowerCase()} reviews.`
                }
              </p>
            </Card>
          )}
        </div>
      </div>
    )
  }

  // Compact view for overview tab
  return (
    <div className="space-y-3">
      {filteredAssignments.length > 0 ? (
        filteredAssignments.map((assignment: any) => (
          <div
            key={assignment.id}
            className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-sm text-gray-900 line-clamp-1">
                {assignment.manuscripts?.title}
              </h4>
              <Badge className={`${getStatusColor(assignment.status)} text-xs`}>
                {formatStatus(assignment.status)}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>{assignment.manuscripts?.field_of_study}</span>
              <span className={getUrgencyColor(getDaysUntilDue(assignment.due_date))}>
                {assignment.status === 'invited' ? 'Respond by' : 'Due'}: {' '}
                {new Date(assignment.due_date).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-600 text-center py-4">
          No recent review activity
        </p>
      )}
    </div>
  )
}

// Individual Review Card Component
function ReviewCard({ 
  assignment, 
  onAccept, 
  onDecline, 
  onContinue,
  getDaysUntilDue,
  getUrgencyColor,
  getStatusColor,
  formatStatus
}: any) {
  const daysLeft = getDaysUntilDue(assignment.due_date)
  
  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
            {assignment.manuscripts?.title}
          </h3>
          <Badge className={getStatusColor(assignment.status)}>
            {formatStatus(assignment.status)}
          </Badge>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 line-clamp-3 mb-4">
        {assignment.manuscripts?.abstract}
      </p>
      
      <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <FileText className="w-3 h-3 mr-1" />
            {assignment.manuscripts?.field_of_study}
          </span>
          <span className="flex items-center">
            <User className="w-3 h-3 mr-1" />
            {assignment.profiles?.full_name}
          </span>
        </div>
      </div>

      {assignment.status === 'invited' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">
              Respond by: {new Date(assignment.due_date).toLocaleDateString()}
            </span>
            <span className={`font-medium ${
              daysLeft < 0 ? 'text-red-600' :
              daysLeft <= 2 ? 'text-orange-600' :
              'text-gray-600'
            }`}>
              {daysLeft < 0 
                ? `${Math.abs(daysLeft)} days overdue`
                : `${daysLeft} days left`
              }
            </span>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-xs text-gray-600 mb-1">Estimated time commitment:</p>
            <p className="text-sm font-medium text-gray-900">2-3 weeks (10-15 hours)</p>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={() => onDecline(assignment.id)}
            >
              <X className="w-3 h-3 mr-1" />
              Decline
            </Button>
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => onAccept(assignment.id)}
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Accept & Start
            </Button>
          </div>
        </div>
      )}

      {assignment.status === 'accepted' && (
        <div className="space-y-3">
          <div className="bg-blue-50 p-3 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-blue-900">
                Review in Progress
              </span>
              <span className={`text-sm font-medium ${getUrgencyColor(daysLeft)}`}>
                {daysLeft < 0 
                  ? `Overdue by ${Math.abs(daysLeft)} days`
                  : `Due in ${daysLeft} days`
                }
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2 mb-1">
              <div className="bg-blue-600 h-2 rounded-full" style={{width: '30%'}}></div>
            </div>
            <p className="text-xs text-blue-700">30% complete (estimated)</p>
          </div>
          
          <Button 
            size="sm" 
            className="w-full"
            onClick={() => onContinue(assignment.id)}
          >
            <Play className="w-3 h-3 mr-1" />
            Continue Review
          </Button>
        </div>
      )}

      {assignment.status === 'completed' && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Completed {new Date(assignment.completed_at || '').toLocaleDateString()}
          </span>
          <Button size="sm" variant="outline">
            <Eye className="w-3 h-3 mr-1" />
            View Review
          </Button>
        </div>
      )}
    </Card>
  )
}