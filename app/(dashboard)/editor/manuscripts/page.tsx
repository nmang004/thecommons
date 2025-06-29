import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Filter,
  Search,
  Eye,
  UserPlus,
  MoreHorizontal,
  Users,
  AlertTriangle,
  ArrowUpDown
} from 'lucide-react'

export default async function EditorManuscriptsPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'editor' && profile.role !== 'admin')) {
    redirect(`/${profile?.role || 'author'}`)
  }

  // Get manuscripts for this editor
  const { data: manuscripts } = await supabase
    .from('manuscripts')
    .select(`
      *,
      profiles!author_id(full_name, affiliation, email),
      manuscript_coauthors(name, email, is_corresponding),
      review_assignments(
        id,
        status,
        due_date,
        profiles!reviewer_id(full_name)
      )
    `)
    .or(`editor_id.eq.${user.id},editor_id.is.null`)
    .neq('status', 'draft')
    .order('submitted_at', { ascending: false })

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

  const getUrgencyIndicator = (submittedAt: string, status: string) => {
    const daysSinceSubmission = Math.floor(
      (new Date().getTime() - new Date(submittedAt).getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (status === 'submitted' && daysSinceSubmission > 3) {
      return { level: 'high', message: 'Needs assignment' }
    }
    if (status === 'with_editor' && daysSinceSubmission > 7) {
      return { level: 'medium', message: 'Needs reviewers' }
    }
    if (status === 'under_review' && daysSinceSubmission > 21) {
      return { level: 'medium', message: 'Follow up needed' }
    }
    return null
  }

  const getReviewerCount = (manuscript: any) => {
    if (!manuscript.review_assignments) return 0
    return manuscript.review_assignments.filter((a: any) => 
      ['invited', 'accepted', 'completed'].includes(a.status)
    ).length
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-heading font-bold text-gray-900">
                Manuscript Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage submissions, assign reviewers, and make editorial decisions
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
              <Button variant="outline">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                Sort
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Filter Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button className="py-2 px-1 border-b-2 border-blue-500 font-medium text-sm text-blue-600">
                All Manuscripts ({manuscripts?.length || 0})
              </button>
              <button className="py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700">
                Pending Assignment ({manuscripts?.filter(m => !m.editor_id).length || 0})
              </button>
              <button className="py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700">
                Under Review ({manuscripts?.filter(m => m.status === 'under_review').length || 0})
              </button>
              <button className="py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700">
                Pending Decision ({manuscripts?.filter(m => m.status === 'with_editor').length || 0})
              </button>
            </nav>
          </div>
        </div>

        {/* Manuscripts Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manuscript
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reviewers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days in Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {manuscripts && manuscripts.length > 0 ? (
                  manuscripts.map((manuscript: any) => {
                    const urgency = getUrgencyIndicator(
                      manuscript.submitted_at || manuscript.created_at,
                      manuscript.status
                    )
                    const reviewerCount = getReviewerCount(manuscript)
                    const daysSinceSubmission = Math.floor(
                      (new Date().getTime() - new Date(manuscript.submitted_at || manuscript.created_at).getTime()) / (1000 * 60 * 60 * 24)
                    )
                    
                    return (
                      <tr key={manuscript.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-start space-x-3">
                            {urgency && (
                              <div className="flex-shrink-0 mt-1">
                                <AlertTriangle className={`w-4 h-4 ${
                                  urgency.level === 'high' ? 'text-red-500' : 'text-yellow-500'
                                }`} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                {manuscript.title}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {manuscript.profiles?.full_name}
                                {manuscript.profiles?.affiliation && (
                                  <span className="ml-1">• {manuscript.profiles.affiliation}</span>
                                )}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {manuscript.field_of_study}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={`${getStatusColor(manuscript.status)} border`}>
                            {formatStatus(manuscript.status)}
                          </Badge>
                          {urgency && (
                            <p className="text-xs text-gray-500 mt-1">
                              {urgency.message}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            {reviewerCount > 0 ? (
                              <div>
                                <span className="text-gray-900 font-medium">
                                  {reviewerCount} assigned
                                </span>
                                <div className="text-xs text-gray-500 mt-1">
                                  {manuscript.review_assignments?.map((assignment: any) => (
                                    <div key={assignment.id}>
                                      {assignment.profiles?.full_name} 
                                      <span className={`ml-1 ${
                                        assignment.status === 'completed' ? 'text-green-600' :
                                        assignment.status === 'accepted' ? 'text-blue-600' :
                                        assignment.status === 'declined' ? 'text-red-600' :
                                        'text-gray-600'
                                      }`}>
                                        ({assignment.status})
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">No reviewers</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {daysSinceSubmission} days
                          </div>
                          <div className="text-xs text-gray-500">
                            Since {new Date(manuscript.submitted_at || manuscript.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            {!manuscript.editor_id && (
                              <Button size="sm" variant="outline">
                                <UserPlus className="w-3 h-3 mr-1" />
                                Assign
                              </Button>
                            )}
                            {manuscript.editor_id === user.id && (
                              <Button size="sm" variant="outline">
                                <Users className="w-3 h-3 mr-1" />
                                Reviewers
                              </Button>
                            )}
                            <Button size="sm" variant="ghost">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No manuscripts found
                      </h3>
                      <p className="text-gray-600">
                        Manuscripts will appear here when they are submitted
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}