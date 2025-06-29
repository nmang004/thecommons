import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Award,
  Star,
  Timer
} from 'lucide-react'

export default async function ReviewerDashboard() {
  const supabase = await createClient()
  
  // Get the authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/register?step=profile')
  }

  // Verify user has reviewer role
  if (profile.role !== 'reviewer' && profile.role !== 'admin') {
    redirect(`/${profile.role}`)
  }

  // Get review assignments for this reviewer
  const { data: reviewAssignments } = await supabase
    .from('review_assignments')
    .select(`
      *,
      manuscripts(title, abstract, field_of_study, submitted_at),
      profiles!assigned_by(full_name)
    `)
    .eq('reviewer_id', user.id)
    .order('invited_at', { ascending: false })

  // Get completed reviews
  const { data: completedReviews } = await supabase
    .from('reviews')
    .select(`
      *,
      manuscripts(title, field_of_study)
    `)
    .eq('reviewer_id', user.id)
    .order('submitted_at', { ascending: false })

  // Calculate statistics
  const totalInvitations = reviewAssignments?.length || 0
  const pendingInvitations = reviewAssignments?.filter(a => a.status === 'invited').length || 0
  const activeReviews = reviewAssignments?.filter(a => a.status === 'accepted').length || 0
  const completedCount = completedReviews?.length || 0

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-heading font-bold text-gray-900">
                Reviewer Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your peer review assignments and track your contributions
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm text-gray-600">Reviewer Rating</p>
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="ml-1 font-medium">4.8</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Invitations</p>
                <p className="text-2xl font-bold text-gray-900">{totalInvitations}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Invitations</p>
                <p className="text-2xl font-bold text-gray-900">{pendingInvitations}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{activeReviews}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Review Assignments */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-heading font-semibold text-gray-900">
                  Review Assignments
                </h2>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>

              {reviewAssignments && reviewAssignments.length > 0 ? (
                <div className="space-y-4">
                  {reviewAssignments.slice(0, 5).map((assignment: any) => {
                    const daysLeft = getDaysUntilDue(assignment.due_date)
                    
                    return (
                      <div
                        key={assignment.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-gray-900 line-clamp-2">
                            {assignment.manuscripts.title}
                          </h3>
                          <Badge className={getStatusColor(assignment.status)}>
                            {formatStatus(assignment.status)}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {assignment.manuscripts.abstract}
                        </p>
                        
                        <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                          <span>
                            Field: {assignment.manuscripts.field_of_study}
                          </span>
                          <span>
                            Assigned by: {assignment.profiles.full_name}
                          </span>
                        </div>

                        {assignment.status === 'invited' && (
                          <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm text-gray-600">
                              <span>
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
                              <p className="text-xs text-gray-600 mb-2">Estimated time commitment:</p>
                              <p className="text-sm font-medium text-gray-900">2-3 weeks (10-15 hours)</p>
                            </div>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" className="flex-1">
                                Decline
                              </Button>
                              <Button size="sm" className="flex-1">
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
                              <div className="w-full bg-blue-200 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{width: '30%'}}></div>
                              </div>
                              <p className="text-xs text-blue-700 mt-1">30% complete (estimated)</p>
                            </div>
                            <Button size="sm" className="w-full">
                              <Clock className="w-3 h-3 mr-1" />
                              Continue Review
                            </Button>
                          </div>
                        )}

                        {assignment.status === 'completed' && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Completed {new Date(assignment.completed_at).toLocaleDateString()}
                            </span>
                            <Button size="sm" variant="outline">
                              View Review
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No review assignments
                  </h3>
                  <p className="text-gray-600">
                    You'll receive email notifications when editors invite you to review manuscripts
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Review Calendar
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Award className="w-4 h-4 mr-2" />
                  My Achievements
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Timer className="w-4 h-4 mr-2" />
                  Time Tracking
                </Button>
              </div>
            </Card>

            {/* Recent Reviews */}
            <Card className="p-6">
              <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
                Recent Reviews
              </h3>
              <div className="space-y-3">
                {completedReviews && completedReviews.length > 0 ? (
                  completedReviews.slice(0, 3).map((review: any) => (
                    <div
                      key={review.id}
                      className="text-sm"
                    >
                      <p className="font-medium text-gray-900 line-clamp-1">
                        {review.manuscripts.title}
                      </p>
                      <p className="text-gray-600">
                        {review.manuscripts.field_of_study}
                      </p>
                      <p className="text-gray-500">
                        {new Date(review.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-600">
                    No completed reviews yet
                  </p>
                )}
              </div>
            </Card>

            {/* Reviewer Stats */}
            <Card className="p-6">
              <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
                Your Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Average Review Time</span>
                  <span className="text-sm font-medium text-gray-900">12 days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Acceptance Rate</span>
                  <span className="text-sm font-medium text-gray-900">85%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Quality Score</span>
                  <span className="text-sm font-medium text-gray-900">4.8/5.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">On-time Rate</span>
                  <span className="text-sm font-medium text-gray-900">92%</span>
                </div>
              </div>
            </Card>

            {/* Review Guidelines */}
            <Card className="p-6">
              <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
                Review Guidelines
              </h3>
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  • Provide constructive and detailed feedback
                </p>
                <p>
                  • Complete reviews within the specified timeframe
                </p>
                <p>
                  • Maintain confidentiality of reviewed manuscripts
                </p>
                <p>
                  • Declare any conflicts of interest
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}