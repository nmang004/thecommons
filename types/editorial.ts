// Editorial System Type Definitions

export type EditorStatus = 'active' | 'completed' | 'reassigned' | 'declined'
export type Priority = 'low' | 'normal' | 'high' | 'urgent'
export type AvailabilityStatus = 'available' | 'busy' | 'unavailable' | 'on_leave'
export type DecisionType = 'accept' | 'reject' | 'major_revision' | 'minor_revision' | 'desk_reject'
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled'

// Editorial Assignment Interface
export interface EditorialAssignment {
  id: string
  manuscriptId: string
  editorId: string
  assignedAt: Date
  assignedBy?: string
  status: EditorStatus
  priority: Priority
  workloadScore: number
  notes?: string
  completedAt?: Date
  reassignedTo?: string
  reassignedAt?: Date
  createdAt: Date
  updatedAt: Date
}

// Editorial Workload Interface
export interface EditorialWorkload {
  editorId: string
  activeManuscripts: number
  capacityLimit: number
  currentWorkloadScore: number
  averageDecisionTime?: string // Interval as string
  lastAssignment?: Date
  lastCompleted?: Date
  availabilityStatus: AvailabilityStatus
  specializations?: string[]
  performanceScore?: number
  totalManuscriptsHandled: number
  manuscriptsThisMonth: number
  manuscriptsThisWeek: number
  averageTurnaroundDays?: number
  createdAt: Date
  updatedAt: Date
}

// Decision Template Interface
export interface DecisionTemplate {
  id: string
  name: string
  decisionType: DecisionType
  subjectTemplate?: string
  bodyTemplate: string
  variables: Record<string, any>
  placeholders?: string[]
  isDefault: boolean
  isActive: boolean
  usageCount: number
  createdBy?: string
  lastUsedAt?: Date
  createdAt: Date
  updatedAt: Date
}

// Reviewer Invitation Interface
export interface ReviewerInvitation {
  id: string
  manuscriptId: string
  reviewerId: string
  invitedBy: string
  invitationStatus: InvitationStatus
  customMessage?: string
  reviewDeadline?: Date
  responseDeadline?: Date
  respondedAt?: Date
  reminderCount: number
  lastReminderSent?: Date
  declineReason?: string
  suggestedAlternative?: string
  invitationToken: string
  createdAt: Date
  updatedAt: Date
}

// Editorial Analytics Cache Interface
export interface EditorialAnalyticsCache {
  id: string
  metricType: string
  metricData: Record<string, any>
  dateRangeStart?: Date
  dateRangeEnd?: Date
  filters?: Record<string, any>
  calculatedAt: Date
  expiresAt?: Date
  createdAt: Date
}

// API Request/Response Types

// Manuscript Queue Request
export interface ManuscriptQueueRequest {
  view?: 'all' | 'new_submissions' | 'my_manuscripts' | 'in_review' | 'awaiting_decision' | 'revisions'
  status?: string[]
  field?: string[]
  editor?: string
  priority?: Priority
  search?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// Manuscript Update Request
export interface ManuscriptUpdateRequest {
  assignedEditorId?: string
  priority?: Priority
  status?: string
  notes?: string
}

// Bulk Reviewer Invitation Request
export interface BulkReviewerInvitationRequest {
  manuscriptId: string
  invitations: {
    reviewerId: string
    customMessage?: string
    reviewDeadline: string
  }[]
}

// Reviewer Availability Response
export interface ReviewerAvailabilityResponse {
  reviewerId: string
  isAvailable: boolean
  currentReviews: number
  maxReviews: number
  nextAvailableDate?: Date
  specializations: string[]
  recentManuscripts: {
    id: string
    title: string
    status: string
    assignedDate: Date
  }[]
}

// Decision Send Request
export interface DecisionSendRequest {
  decisionId: string
  recipients: string[]
  ccRecipients?: string[]
  attachments?: string[]
  sendImmediately?: boolean
  scheduledSendTime?: Date
}

// Analytics Report Request
export interface AnalyticsReportRequest {
  reportType: 'editorial' | 'reviewer' | 'manuscript' | 'custom'
  dateRangeStart: Date
  dateRangeEnd: Date
  filters?: {
    editors?: string[]
    fields?: string[]
    status?: string[]
  }
  format?: 'json' | 'csv' | 'pdf'
  includeCharts?: boolean
}

// Analytics Export Response
export interface AnalyticsExportResponse {
  reportId: string
  downloadUrl: string
  expiresAt: Date
  format: string
  sizeBytes: number
}

// Workload Calculation Result
export interface WorkloadCalculation {
  activeCount: number
  workloadScore: number
  capacityRemaining: number
  isAvailable: boolean
}

// Editorial Decision Component
export interface EditorialDecisionComponent {
  id: string
  type: 'summary' | 'reviewer_comments' | 'author_letter' | 'internal_notes'
  content: string
  order: number
  isRequired: boolean
  metadata?: Record<string, any>
}

// Editorial Action
export interface EditorialAction {
  type: 'notify_author' | 'notify_reviewers' | 'schedule_publication' | 'generate_doi' | 'send_to_production'
  enabled: boolean
  config?: Record<string, any>
  scheduledFor?: Date
}

// Template Variable
export interface TemplateVariable {
  key: string
  value: string
  type: 'text' | 'date' | 'number' | 'boolean'
  required: boolean
  defaultValue?: any
}