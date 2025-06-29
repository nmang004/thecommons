import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  FileText, 
  Users, 
  Download,
  Eye,
  CreditCard,
  Clock,
  AlertCircle,
  ArrowLeft,
  Mail
} from 'lucide-react'

export default async function SubmissionDetailPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { id: manuscriptId } = await params
  const { payment, revision } = await searchParams
  const supabase = await createClient()
  
  // Get the authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // Get manuscript details with related data
  const { data: manuscript, error: manuscriptError } = await supabase
    .from('manuscripts')
    .select(`
      *,
      manuscript_coauthors(*),
      manuscript_files(*),
      payments(*)
    `)
    .eq('id', manuscriptId)
    .eq('author_id', user.id)
    .single()

  if (manuscriptError || !manuscript) {
    redirect('/author')
  }

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

  const isPaymentSuccess = payment === 'success'
  const hasPayment = manuscript.payments && manuscript.payments.length > 0
  const isSubmitted = manuscript.status !== 'draft'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <a href="/author">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </a>
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">
                {manuscript.title}
              </h1>
              <div className="flex items-center gap-4">
                <Badge className={getStatusColor(manuscript.status)}>
                  {formatStatus(manuscript.status)}
                </Badge>
                {manuscript.submission_number && (
                  <span className="text-sm text-gray-600">
                    #{manuscript.submission_number}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {isPaymentSuccess && isSubmitted && (
          <Card className="p-6 mb-6 border-green-200 bg-green-50">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <h2 className="text-lg font-semibold text-green-900">
                  Submission Successful!
                </h2>
                <p className="text-green-800">
                  Your manuscript has been submitted and payment processed. 
                  You will receive email updates as it progresses through review.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Revision Required Message */}
        {manuscript.status === 'revisions_requested' && (
          <Card className="p-6 mb-6 border-orange-200 bg-orange-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-orange-600" />
                <div>
                  <h2 className="text-lg font-semibold text-orange-900">
                    Revisions Requested
                  </h2>
                  <p className="text-orange-800">
                    The reviewers have requested revisions to your manuscript. Please address their comments and resubmit.
                  </p>
                </div>
              </div>
              <Button asChild className="bg-orange-600 hover:bg-orange-700">
                <a href={`/author/submissions/${manuscript.id}/revise`}>
                  Submit Revision
                </a>
              </Button>
            </div>
          </Card>
        )}

        {/* Revision Submitted Message */}
        {revision === 'submitted' && (
          <Card className="p-6 mb-6 border-blue-200 bg-blue-50">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-blue-600" />
              <div>
                <h2 className="text-lg font-semibold text-blue-900">
                  Revision Submitted!
                </h2>
                <p className="text-blue-800">
                  Your revised manuscript has been submitted for re-review. You will receive updates as it progresses.
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Manuscript Details */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Manuscript Details</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Abstract:</span>
                  <p className="text-gray-900 mt-1">{manuscript.abstract}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-500">Field of Study:</span>
                  <p className="text-gray-900">{manuscript.field_of_study}</p>
                  {manuscript.subfield && (
                    <p className="text-sm text-gray-600">Subfield: {manuscript.subfield}</p>
                  )}
                </div>
                
                {manuscript.keywords && manuscript.keywords.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Keywords:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {manuscript.keywords.map((keyword: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Authors */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Authors</h3>
              </div>
              
              <div className="space-y-3">
                {manuscript.manuscript_coauthors?.map((author: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {author.name}
                        {author.is_corresponding && (
                          <Badge className="ml-2 bg-yellow-100 text-yellow-800 text-xs">
                            Corresponding
                          </Badge>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">{author.email}</p>
                      {author.affiliation && (
                        <p className="text-sm text-gray-600">{author.affiliation}</p>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-500">#{author.author_order}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Files */}
            {manuscript.manuscript_files && manuscript.manuscript_files.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Download className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Uploaded Files</h3>
                </div>
                
                <div className="space-y-2">
                  {manuscript.manuscript_files.map((file: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.file_name}</p>
                          <p className="text-xs text-gray-500">
                            {file.file_type.replace('_', ' ')} • {Math.round(file.file_size / 1024)} KB
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Timeline */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Submission Timeline</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Manuscript Created</p>
                    <p className="text-xs text-gray-500">
                      {new Date(manuscript.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {manuscript.submitted_at && (
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Submitted for Review</p>
                      <p className="text-xs text-gray-500">
                        {new Date(manuscript.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Editorial Assignment</p>
                    <p className="text-xs text-gray-400">Pending</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Peer Review</p>
                    <p className="text-xs text-gray-400">Pending</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment Information */}
            {hasPayment && (
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Payment</h3>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Amount:</span>
                    <span className="text-sm font-medium">${manuscript.payments[0].amount / 100}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge className="bg-green-100 text-green-800 text-xs">Paid</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Date:</span>
                    <span className="text-sm text-gray-600">
                      {new Date(manuscript.payments[0].created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Contact Support */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">Need Help?</h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Questions about your submission? Our editorial team is here to help.
              </p>
              
              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}