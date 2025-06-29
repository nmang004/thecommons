import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Eye,
  Download
} from 'lucide-react'

export default async function AuthorDashboard() {
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

  // Verify user has author role
  if (profile.role !== 'author' && profile.role !== 'admin') {
    redirect(`/${profile.role}`)
  }

  // Get author's manuscripts with related data
  const { data: manuscripts } = await supabase
    .from('manuscripts')
    .select(`
      *,
      manuscript_files(id, file_name, file_type, file_size),
      payments(id, amount, status, created_at),
      manuscript_coauthors(id, name, email, is_corresponding)
    `)
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })

  // Calculate statistics
  const totalSubmissions = manuscripts?.length || 0
  const published = manuscripts?.filter(m => m.status === 'published').length || 0
  const underReview = manuscripts?.filter(m => 
    ['submitted', 'with_editor', 'under_review'].includes(m.status)
  ).length || 0
  const needsRevision = manuscripts?.filter(m => m.status === 'revisions_requested').length || 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'submitted':
      case 'with_editor':
        return 'bg-blue-100 text-blue-800'
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-heading font-bold text-gray-900">
                Welcome back, {profile.full_name}
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your submissions and track your publishing progress
              </p>
            </div>
            <Button className="flex items-center" asChild>
              <a href="/author/submit">
                <Plus className="w-4 h-4 mr-2" />
                New Submission
              </a>
            </Button>
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
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-2xl font-bold text-gray-900">{published}</p>
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
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Needs Revision</p>
                <p className="text-2xl font-bold text-gray-900">{needsRevision}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Manuscripts List */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-heading font-semibold text-gray-900">
                  Your Manuscripts
                </h2>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>

              {manuscripts && manuscripts.length > 0 ? (
                <div className="space-y-4">
                  {manuscripts.slice(0, 5).map((manuscript) => (
                    <a
                      key={manuscript.id}
                      href={`/author/submissions/${manuscript.id}`}
                      className="block border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors hover:shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900 line-clamp-2">
                          {manuscript.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(manuscript.status)}>
                            {formatStatus(manuscript.status)}
                          </Badge>
                          {manuscript.submission_number && (
                            <span className="text-xs text-gray-500">
                              #{manuscript.submission_number}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {manuscript.abstract}
                      </p>
                      
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <span>
                            {manuscript.submitted_at 
                              ? `Submitted ${new Date(manuscript.submitted_at).toLocaleDateString()}`
                              : `Created ${new Date(manuscript.created_at).toLocaleDateString()}`
                            }
                          </span>
                          {manuscript.manuscript_files && manuscript.manuscript_files.length > 0 && (
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {manuscript.manuscript_files.length} files
                            </span>
                          )}
                          {manuscript.payments && manuscript.payments.length > 0 && (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-3 h-3" />
                              Paid
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            {manuscript.view_count}
                          </div>
                          <div className="flex items-center">
                            <Download className="w-4 h-4 mr-1" />
                            {manuscript.download_count}
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No manuscripts yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Start your publishing journey by submitting your first manuscript
                  </p>
                  <Button asChild>
                    <a href="/author/submit">
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Submission
                    </a>
                  </Button>
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
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/author/submit">
                    <Plus className="w-4 h-4 mr-2" />
                    New Submission
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  View Drafts
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6">
              <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  No recent activity to display
                </p>
              </div>
            </Card>

            {/* Publishing Tips */}
            <Card className="p-6">
              <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
                Publishing Tips
              </h3>
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  • Ensure your manuscript follows our formatting guidelines
                </p>
                <p>
                  • Include comprehensive supplementary materials
                </p>
                <p>
                  • Suggest qualified reviewers in your field
                </p>
                <p>
                  • Respond promptly to reviewer comments
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}