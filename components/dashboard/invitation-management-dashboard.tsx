'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  Users,
  BarChart3,
  RefreshCw,
  Calendar,
  Loader2,
  Plus,
  Filter
} from 'lucide-react'

interface InvitationStats {
  total: number
  pending: number
  accepted: number
  declined: number
  expired: number
  cancelled: number
  responseRate: number
  avgResponseTime: number
}

interface Invitation {
  id: string
  invitation_status: string
  created_at: string
  responded_at?: string
  review_deadline: string
  response_deadline: string
  decline_reason?: string
  reminder_count: number
  profiles: {
    full_name: string
    email: string
    affiliation?: string
  }
}

interface InvitationManagementDashboardProps {
  manuscriptId: string
  manuscriptTitle: string
  onInvitationsSent?: () => void
}

export function InvitationManagementDashboard({
  manuscriptId,
  manuscriptTitle,
  onInvitationsSent
}: InvitationManagementDashboardProps) {
  const [stats, setStats] = useState<InvitationStats | null>(null)
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingInvitations, setSendingInvitations] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showNewInvitationDialog, setShowNewInvitationDialog] = useState(false)

  // New invitation form state
  const [newInvitation, setNewInvitation] = useState({
    reviewerIds: [] as string[],
    reviewDeadline: '',
    customMessage: '',
    staggered: false,
    priority: 'normal' as 'normal' | 'high' | 'urgent'
  })

  useEffect(() => {
    fetchInvitationData()
  }, [manuscriptId])

  const fetchInvitationData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/invitations/create?manuscriptId=${manuscriptId}`)
      
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setInvitations(data.invitations)
      }
    } catch (error) {
      console.error('Error fetching invitation data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendInvitations = async () => {
    if (newInvitation.reviewerIds.length === 0 || !newInvitation.reviewDeadline) {
      alert('Please select reviewers and set a deadline')
      return
    }

    setSendingInvitations(true)
    try {
      const response = await fetch('/api/invitations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          manuscriptId,
          reviewerIds: newInvitation.reviewerIds,
          reviewDeadline: newInvitation.reviewDeadline,
          customMessage: newInvitation.customMessage || undefined,
          staggered: newInvitation.staggered,
          priority: newInvitation.priority
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Invitations sent to ${result.result.successCount} reviewer(s)`)
        setShowNewInvitationDialog(false)
        setNewInvitation({
          reviewerIds: [],
          reviewDeadline: '',
          customMessage: '',
          staggered: false,
          priority: 'normal'
        })
        fetchInvitationData() // Refresh data
        onInvitationsSent?.()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error sending invitations:', error)
      alert('Failed to send invitations')
    } finally {
      setSendingInvitations(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'declined':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-4 h-4" />
      case 'declined':
        return <XCircle className="w-4 h-4" />
      case 'expired':
        return <Clock className="w-4 h-4" />
      case 'cancelled':
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const filteredInvitations = invitations.filter(invitation => 
    filterStatus === 'all' || invitation.invitation_status === filterStatus
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-heading font-semibold text-gray-900">
            Reviewer Invitations
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {manuscriptTitle}
          </p>
        </div>
        
        <div className="flex space-x-3">
          <Button
            onClick={fetchInvitationData}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Dialog open={showNewInvitationDialog} onOpenChange={setShowNewInvitationDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Send Invitations
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Send New Reviewer Invitations</DialogTitle>
                <DialogDescription>
                  Invite reviewers to evaluate this manuscript
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Review Deadline
                  </Label>
                  <Input
                    type="date"
                    value={newInvitation.reviewDeadline}
                    onChange={(e) => setNewInvitation(prev => ({
                      ...prev,
                      reviewDeadline: e.target.value
                    }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Priority Level
                  </Label>
                  <Select
                    value={newInvitation.priority}
                    onValueChange={(value: 'normal' | 'high' | 'urgent') => 
                      setNewInvitation(prev => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Custom Message (Optional)
                  </Label>
                  <Textarea
                    value={newInvitation.customMessage}
                    onChange={(e) => setNewInvitation(prev => ({
                      ...prev,
                      customMessage: e.target.value
                    }))}
                    rows={4}
                    placeholder="Add a personal message to the invitation..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    onClick={() => setShowNewInvitationDialog(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendInvitations}
                    disabled={sendingInvitations || newInvitation.reviewerIds.length === 0}
                  >
                    {sendingInvitations ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Invitations
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Sent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Accepted</p>
                <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Response Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(stats.responseRate)}%
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Invitations List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Invitation History
          </h3>
          
          <div className="flex items-center space-x-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredInvitations.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              {filterStatus === 'all' ? 'No invitations sent yet' : `No ${filterStatus} invitations`}
            </h4>
            <p className="text-gray-600">
              {filterStatus === 'all' 
                ? 'Start by sending invitations to potential reviewers'
                : `Try changing the filter to see other invitations`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="font-medium text-gray-900">
                        {invitation.profiles.full_name}
                      </div>
                      <Badge className={getStatusColor(invitation.invitation_status)}>
                        {getStatusIcon(invitation.invitation_status)}
                        <span className="ml-1 capitalize">
                          {invitation.invitation_status}
                        </span>
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>{invitation.profiles.email}</div>
                      {invitation.profiles.affiliation && (
                        <div>{invitation.profiles.affiliation}</div>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-sm text-gray-500 space-y-1">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Sent: {new Date(invitation.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Due: {new Date(invitation.review_deadline).toLocaleDateString()}
                    </div>
                    {invitation.responded_at && (
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Responded: {new Date(invitation.responded_at).toLocaleDateString()}
                      </div>
                    )}
                    {invitation.reminder_count > 0 && (
                      <div className="flex items-center text-amber-600">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        {invitation.reminder_count} reminder(s) sent
                      </div>
                    )}
                  </div>
                </div>

                {invitation.decline_reason && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>Decline reason:</strong> {invitation.decline_reason}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}