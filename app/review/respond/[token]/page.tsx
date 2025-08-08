import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ReviewerResponseForm } from '@/components/forms/reviewer-response-form'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar,
  FileText,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'

interface InvitationData {
  id: string
  manuscript_id: string
  reviewer_id: string
  invitation_status: string
  review_deadline: string
  response_deadline: string
  custom_message?: string
  responded_at?: string
  decline_reason?: string
  invitation_token: string
  manuscripts: {
    title: string
    abstract: string
    field_of_study: string
    subfield?: string
    keywords?: string[]
    author_count: number
  }
  profiles: {
    full_name: string
    email: string
    affiliation?: string
    expertise: string[]
  }
  invited_by_profile: {
    full_name: string
    email: string
    role: string
  }
}

interface PageProps {
  params: Promise<{
    token: string
  }>
  searchParams: Promise<{
    action?: 'accept' | 'decline'
    utm_source?: string
  }>
}

async function getInvitationData(token: string): Promise<InvitationData | null> {
  const supabase = await createClient()
  
  const { data: invitation, error } = await supabase
    .from('reviewer_invitations')
    .select(`
      *,
      manuscripts (
        title,
        abstract,
        field_of_study,
        subfield,
        keywords,
        author_count
      ),
      profiles (
        full_name,
        email,
        affiliation,
        expertise
      ),
      invited_by_profile:profiles!invited_by (
        full_name,
        email,
        role
      )
    `)
    .eq('invitation_token', token)
    .single()

  if (error) {
    console.error('Error fetching invitation:', error)
    return null
  }

  return invitation as InvitationData
}

function InvitationStatusBadge({ status }: { status: string }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'accepted':
        return { 
          icon: CheckCircle, 
          color: 'bg-green-100 text-green-800 border-green-200',
          label: 'Accepted' 
        }
      case 'declined':
        return { 
          icon: XCircle, 
          color: 'bg-red-100 text-red-800 border-red-200',
          label: 'Declined' 
        }
      case 'expired':
        return { 
          icon: Clock, 
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          label: 'Expired' 
        }
      case 'cancelled':
        return { 
          icon: XCircle, 
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          label: 'Cancelled' 
        }
      default:
        return { 
          icon: Clock, 
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          label: 'Pending Response' 
        }
    }
  }

  const { icon: Icon, color, label } = getStatusConfig(status)

  return (
    <Badge className={`${color} font-medium`}>
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </Badge>
  )
}

function InvitationExpiredMessage({ invitation }: { invitation: InvitationData }) {
  return (
    <Card className="p-6 border-yellow-200 bg-yellow-50">
      <div className="flex items-center space-x-3 mb-4">
        <AlertTriangle className="w-5 h-5 text-yellow-600" />
        <h3 className="text-lg font-heading font-semibold text-yellow-900">
          Invitation Expired
        </h3>
      </div>
      
      <p className="text-yellow-800 mb-4">
        This review invitation expired on{' '}
        {new Date(invitation.response_deadline).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
        .
      </p>

      <div className="bg-white p-4 rounded-lg border border-yellow-200">
        <h4 className="font-medium text-gray-900 mb-2">Still interested in reviewing?</h4>
        <p className="text-sm text-gray-600 mb-3">
          If you would still like to review this manuscript, please contact the editor directly.
        </p>
        <Button variant="outline" asChild>
          <a href={`mailto:${invitation.invited_by_profile.email}`}>
            Contact Editor
          </a>
        </Button>
      </div>
    </Card>
  )
}

function InvitationAlreadyRespondedMessage({ invitation }: { invitation: InvitationData }) {
  const isAccepted = invitation.invitation_status === 'accepted'
  
  return (
    <Card className={`p-6 border-2 ${
      isAccepted 
        ? 'border-green-200 bg-green-50' 
        : 'border-red-200 bg-red-50'
    }`}>
      <div className="flex items-center space-x-3 mb-4">
        {isAccepted ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : (
          <XCircle className="w-5 h-5 text-red-600" />
        )}
        <h3 className={`text-lg font-heading font-semibold ${
          isAccepted ? 'text-green-900' : 'text-red-900'
        }`}>
          {isAccepted ? 'Review Accepted' : 'Review Declined'}
        </h3>
      </div>
      
      <p className={`mb-4 ${isAccepted ? 'text-green-800' : 'text-red-800'}`}>
        You {isAccepted ? 'accepted' : 'declined'} this review invitation on{' '}
        {new Date(invitation.responded_at!).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
        .
      </p>

      {isAccepted && (
        <div className="bg-white p-4 rounded-lg border border-green-200">
          <h4 className="font-medium text-gray-900 mb-2">Next Steps</h4>
          <p className="text-sm text-gray-600 mb-3">
            Thank you for accepting this review. You should receive further instructions 
            from the editor soon.
          </p>
          <div className="flex space-x-3">
            <Button asChild>
              <a href="/reviewer/dashboard">
                Go to Reviewer Dashboard
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={`mailto:${invitation.invited_by_profile.email}`}>
                Contact Editor
              </a>
            </Button>
          </div>
        </div>
      )}

      {!isAccepted && invitation.decline_reason && (
        <div className="bg-white p-4 rounded-lg border border-red-200">
          <h4 className="font-medium text-gray-900 mb-2">Decline Reason</h4>
          <p className="text-sm text-gray-600">
            {invitation.decline_reason}
          </p>
        </div>
      )}
    </Card>
  )
}

export default async function ReviewerResponsePage({ params, searchParams }: PageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const invitation = await getInvitationData(resolvedParams.token)

  if (!invitation) {
    notFound()
  }

  // Check if invitation is valid
  const now = new Date()
  const responseDeadline = new Date(invitation.response_deadline)
  const isExpired = now > responseDeadline && invitation.invitation_status === 'pending'
  const hasResponded = invitation.responded_at !== null
  
  // Update status if expired
  if (isExpired && invitation.invitation_status === 'pending') {
    const supabase = await createClient()
    await supabase
      .from('reviewer_invitations')
      .update({ invitation_status: 'expired' })
      .eq('id', invitation.id)
    
    invitation.invitation_status = 'expired'
  }

  // Track email click if coming from email
  if (resolvedSearchParams.utm_source === 'email') {
    // Track the click asynchronously
    fetch(`/api/track/email-click/${resolvedParams.token}`, { method: 'POST' }).catch(() => {})
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-gray-900">
                The Commons
              </h1>
              <p className="text-sm text-gray-600">Academic Publishing Platform</p>
            </div>
          </div>
          
          <h2 className="text-xl font-heading font-semibold text-gray-900 mb-2">
            Peer Review Invitation
          </h2>
          
          <InvitationStatusBadge status={invitation.invitation_status} />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Manuscript Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Manuscript Information */}
            <Card className="p-6">
              <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
                📄 Manuscript Details
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Title</h4>
                  <p className="text-gray-700 leading-relaxed">
                    {invitation.manuscripts.title}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Field of Study</h4>
                    <Badge variant="secondary">
                      {invitation.manuscripts.field_of_study}
                    </Badge>
                    {invitation.manuscripts.subfield && (
                      <Badge variant="outline" className="ml-2">
                        {invitation.manuscripts.subfield}
                      </Badge>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Authors</h4>
                    <p className="text-gray-600">
                      {invitation.manuscripts.author_count} author{invitation.manuscripts.author_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {invitation.manuscripts.keywords && invitation.manuscripts.keywords.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {invitation.manuscripts.keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Abstract</h4>
                  <p className="text-gray-700 leading-relaxed text-sm bg-gray-50 p-4 rounded-lg">
                    {invitation.manuscripts.abstract}
                  </p>
                </div>
              </div>
            </Card>

            {/* Custom Message from Editor */}
            {invitation.custom_message && (
              <Card className="p-6 border-amber-200 bg-amber-50">
                <h3 className="text-lg font-heading font-semibold text-amber-900 mb-4">
                  ✉️ Message from Editor
                </h3>
                <p className="text-amber-800 leading-relaxed">
                  {invitation.custom_message}
                </p>
              </Card>
            )}

            {/* Response Section */}
            {!hasResponded && !isExpired ? (
              <Card className="p-6">
                <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
                  Your Response
                </h3>
                <Suspense fallback={<div className="animate-pulse bg-gray-100 h-48 rounded-lg" />}>
                  <ReviewerResponseForm 
                    invitationToken={resolvedParams.token}
                    defaultAction={resolvedSearchParams.action}
                    manuscriptTitle={invitation.manuscripts.title}
                  />
                </Suspense>
              </Card>
            ) : isExpired ? (
              <InvitationExpiredMessage invitation={invitation} />
            ) : (
              <InvitationAlreadyRespondedMessage invitation={invitation} />
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Review Timeline */}
            <Card className="p-6">
              <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
                📅 Timeline
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Response Due</p>
                    <p className="text-sm text-gray-600">
                      {new Date(invitation.response_deadline).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Review Due</p>
                    <p className="text-sm text-gray-600">
                      {new Date(invitation.review_deadline).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Reviewer Information */}
            <Card className="p-6">
              <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
                👤 Invited Reviewer
              </h3>
              
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-gray-900">
                    {invitation.profiles.full_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {invitation.profiles.email}
                  </p>
                </div>

                {invitation.profiles.affiliation && (
                  <div>
                    <p className="text-sm text-gray-600">
                      {invitation.profiles.affiliation}
                    </p>
                  </div>
                )}

                {invitation.profiles.expertise.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Expertise</p>
                    <div className="flex flex-wrap gap-1">
                      {invitation.profiles.expertise.slice(0, 3).map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {invitation.profiles.expertise.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{invitation.profiles.expertise.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Editor Contact */}
            <Card className="p-6">
              <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
                📧 Editor Contact
              </h3>
              
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-gray-900">
                    {invitation.invited_by_profile.full_name}
                  </p>
                  <p className="text-sm text-gray-600 capitalize">
                    {invitation.invited_by_profile.role}
                  </p>
                </div>

                <Button variant="outline" size="sm" asChild>
                  <a 
                    href={`mailto:${invitation.invited_by_profile.email}?subject=Re: Review Invitation - ${invitation.manuscripts.title}`}
                    className="flex items-center"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Contact Editor
                  </a>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}