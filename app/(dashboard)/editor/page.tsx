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
  Users,
  Calendar,
  TrendingUp,
  Filter,
  Search,
  Eye,
  UserPlus,
  Mail,
  ArrowRight
} from 'lucide-react'

export default async function EditorDashboard() {
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

  // Verify user has editor role
  if (profile.role !== 'editor' && profile.role !== 'admin') {
    redirect(`/${profile.role}`)
  }

  // Get manuscripts assigned to this editor or pending assignment
  const { data: manuscripts } = await supabase
    .from('manuscripts')
    .select(`
      *,
      profiles!author_id(full_name, affiliation),
      manuscript_coauthors(name, email, is_corresponding)
    `)
    .or(`editor_id.eq.${user.id},editor_id.is.null`)
    .neq('status', 'draft')
    .order('submitted_at', { ascending: true })

  // Get review assignments for manuscripts this editor manages
  const { data: reviewAssignments } = await supabase
    .from('review_assignments')
    .select(`
      *,
      manuscripts!inner(title, editor_id),
      profiles!reviewer_id(full_name)
    `)
    .eq('manuscripts.editor_id', user.id)

  // Calculate statistics
  const totalSubmissions = manuscripts?.length || 0
  const pendingAssignment = manuscripts?.filter(m => !m.editor_id).length || 0
  const underReview = manuscripts?.filter(m => m.status === 'under_review').length || 0
  const pendingDecision = manuscripts?.filter(m => 
    ['with_editor'].includes(m.status)
  ).length || 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800'
      case 'with_editor':
        return 'bg-purple-100 text-purple-800'
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800'
      case 'revisions_requested':
        return 'bg-orange-100 text-orange-800'
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'published':
        return 'bg-emerald-100 text-emerald-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const getUrgencyLevel = (submittedAt: string) => {
    const daysSinceSubmission = Math.floor(
      (new Date().getTime() - new Date(submittedAt).getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysSinceSubmission > 14) return 'high'
    if (daysSinceSubmission > 7) return 'medium'
    return 'low'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-heading font-bold text-gray-900">
                Editorial Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Manage submissions and coordinate peer review process
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
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
                <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900">{totalSubmissions}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Assignment</p>
                <p className="text-2xl font-bold text-gray-900">{pendingAssignment}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Under Review</p>
                <p className="text-2xl font-bold text-gray-900">{underReview}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Decision</p>
                <p className="text-2xl font-bold text-gray-900">{pendingDecision}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Manuscripts Queue */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-heading font-semibold text-gray-900">
                  Editorial Queue
                </h2>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>

              {manuscripts && manuscripts.length > 0 ? (
                <div className="space-y-4">
                  {manuscripts.slice(0, 5).map((manuscript) => {
                    const urgency = getUrgencyLevel(manuscript.submitted_at || manuscript.created_at)
                    
                    return (
                      <div
                        key={manuscript.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-gray-900 line-clamp-2">
                            {manuscript.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {urgency === 'high' && (
                              <span className="w-2 h-2 bg-red-500 rounded-full" title="High priority" />
                            )}
                            {urgency === 'medium' && (
                              <span className="w-2 h-2 bg-yellow-500 rounded-full" title="Medium priority" />
                            )}
                            <Badge className={getStatusColor(manuscript.status)}>
                              {formatStatus(manuscript.status)}
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {manuscript.abstract}
                        </p>
                        
                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <span>
                            Field: {manuscript.field_of_study}
                          </span>
                          <span>
                            Submitted {new Date(manuscript.submitted_at || manuscript.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center mt-3">
                          <div className="text-xs text-gray-500">
                            Author: {manuscript.profiles?.full_name || 'Unknown'}
                            {manuscript.profiles?.affiliation && (
                              <span className="ml-1">• {manuscript.profiles.affiliation}</span>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            {!manuscript.editor_id && (
                              <Button size="sm" variant="outline">
                                <UserPlus className="w-3 h-3 mr-1" />
                                Assign to Me
                              </Button>
                            )}
                            <Button size="sm">
                              <Eye className="w-3 h-3 mr-1" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No submissions in queue
                  </h3>
                  <p className="text-gray-600">
                    All current submissions are being handled by other editors
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
                  <Users className="w-4 h-4 mr-2" />
                  Find Reviewers
                  <ArrowRight className="w-3 h-3 ml-auto" />
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Review Calendar
                  <ArrowRight className="w-3 h-3 ml-auto" />
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Reminders
                  <ArrowRight className="w-3 h-3 ml-auto" />
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Editorial Reports
                  <ArrowRight className="w-3 h-3 ml-auto" />
                </Button>
              </div>
            </Card>

            {/* Review Status */}
            <Card className="p-6">
              <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
                Review Status
              </h3>
              <div className="space-y-3">
                {reviewAssignments && reviewAssignments.length > 0 ? (
                  reviewAssignments.slice(0, 3).map((assignment: any) => (
                    <div
                      key={assignment.id}
                      className="flex justify-between items-center text-sm"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {assignment.profiles.full_name}
                        </p>
                        <p className="text-gray-600">
                          {assignment.manuscripts.title.substring(0, 30)}...
                        </p>
                      </div>
                      <Badge
                        className={
                          assignment.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : assignment.status === 'accepted'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {assignment.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-600">
                    No active review assignments
                  </p>
                )}
              </div>
            </Card>

            {/* Editorial Guidelines */}
            <Card className="p-6">
              <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
                Editorial Guidelines
              </h3>
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  • Assign reviewers within 3 days of receiving a submission
                </p>
                <p>
                  • Ensure diverse reviewer expertise and backgrounds
                </p>
                <p>
                  • Make decisions within 2 weeks of receiving reviews
                </p>
                <p>
                  • Provide constructive feedback to authors
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}