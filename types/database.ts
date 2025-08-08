export type UserRole = 'author' | 'editor' | 'reviewer' | 'admin'

// Enhanced type definitions for reviewer-related data
export interface ReviewerSpecializations {
  fields: string[]
  keywords: string[]
  methodologies?: string[]
  languages?: string[]
}

export interface CollaborationHistory {
  coauthors: {
    profileId: string
    name: string
    collaborationCount: number
    recentCollaborations: string[] // manuscript IDs or DOIs
  }[]
  institutionalAffiliations: {
    institution: string
    department?: string
    startDate?: string
    endDate?: string
  }[]
}

export interface ReviewPreferences {
  maxReviewsPerMonth?: number
  preferredReviewTurnaroundDays?: number
  excludedFields?: string[]
  preferredManuscriptTypes?: string[]
  availabilityWindows?: {
    startDate: string
    endDate: string
    maxReviews: number
  }[]
}

// Enhanced reviewer dashboard interfaces
export interface ReviewerSettings {
  monthlyCapacity: number
  preferredDeadlines: number
  blackoutDates: string[] // ISO date strings
  autoDeclineRules: AutoDeclineRule[]
  workloadPreferences: {
    maxConcurrentReviews: number
    preferredFields: string[]
    availabilityStatus: 'available' | 'busy' | 'unavailable'
    notificationPreferences: {
      emailReminders: boolean
      deadlineWarnings: boolean
      achievementNotifications: boolean
    }
  }
}

export interface AutoDeclineRule {
  id: string
  name: string
  enabled: boolean
  conditions: {
    fieldsToExclude?: string[]
    maxWorkloadPercentage?: number
    minDaysToDeadline?: number
    excludeKeywords?: string[]
  }
}

export interface ReviewerAnalytics {
  id: string
  reviewer_id: string
  total_reviews_completed: number
  total_invitations_received: number
  total_invitations_accepted: number
  average_review_time_days: number
  acceptance_rate: number
  average_quality_score: number
  on_time_completion_rate: number
  response_rate: number
  total_badges_earned: number
  quality_badge_count: number
  timeliness_badge_count: number
  volume_badge_count: number
  current_month_reviews: number
  last_month_reviews: number
  current_year_reviews: number
  last_calculated_at: string
  created_at: string
  updated_at: string
}

export interface Badge {
  id: string
  name: string
  description: string
  category: 'volume' | 'quality' | 'timeliness' | 'expertise' | 'service' | 'special'
  icon_url?: string
  color: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  criteria: Record<string, any>
  is_active: boolean
  is_public: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ProfileBadge {
  id: string
  profile_id: string
  badge_id: string
  awarded_at: string
  awarded_for?: Record<string, any>
  progress_data?: Record<string, any>
  created_at: string
  // Joined data
  badge?: Badge
}

export interface ReviewerWorkloadHistory {
  id: string
  reviewer_id: string
  date: string
  active_reviews: number
  pending_invitations: number
  monthly_capacity: number
  workload_percentage: number
  availability_status: string
  notes?: string
  created_at: string
}

// Dashboard interface matching the technical spec
export interface ReviewerDashboard {
  // Review Queue
  queue: {
    pending: ReviewAssignment[]
    inProgress: ReviewAssignment[]
    completed: ReviewAssignment[]
    declined: ReviewAssignment[]
  }
  
  // Performance Analytics
  analytics: {
    totalReviews: number
    averageReviewTime: number
    acceptanceRate: number
    qualityScore: number
    timeliness: number
    recognition: Badge[]
  }
  
  // Workload Management
  workload: {
    currentAssignments: number
    monthlyCapacity: number
    blackoutDates: DateRange[]
    preferredDeadlines: number
    autoDeclineRules: AutoDeclineRule[]
  }
  
  // Professional Development
  development: {
    reviewTraining: Course[]
    certifications: Certificate[]
    mentorshipProgram: MentorshipStatus
    reviewFeedback: Feedback[]
  }
}

export interface DateRange {
  startDate: string
  endDate: string
}

export interface Course {
  id: string
  title: string
  description: string
  duration: string
  status: 'not_started' | 'in_progress' | 'completed'
  completedAt?: string
}

export interface Certificate {
  id: string
  name: string
  issuedBy: string
  issuedAt: string
  expiresAt?: string
  credentialUrl?: string
}

export interface MentorshipStatus {
  role?: 'mentor' | 'mentee' | 'both'
  activeMentorships: number
  completedMentorships: number
  averageRating?: number
}

export interface Feedback {
  id: string
  type: 'editor' | 'author'
  rating: number
  comments: string
  receivedAt: string
  manuscriptTitle: string
}

export interface COIDeclarations {
  financialInterests: {
    organization: string
    relationship: string
    amount?: number
    currency?: string
    startDate?: string
    endDate?: string
  }[]
  personalRelationships: {
    name: string
    relationship: string
    institution?: string
  }[]
  institutionalAffiliations: {
    institution: string
    role: string
    startDate?: string
    endDate?: string
  }[]
  otherConflicts?: {
    description: string
    severity: 'low' | 'medium' | 'high'
  }[]
}

export interface SuggestedReviewers {
  reviewers: {
    name: string
    email: string
    affiliation?: string
    expertise: string[]
    justification: string
  }[]
}

export interface ExcludedReviewers {
  reviewers: {
    name: string
    email?: string
    affiliation?: string
    reason: string
  }[]
}

export interface BillingDetails {
  name: string
  email: string
  address?: {
    line1: string
    line2?: string
    city: string
    state?: string
    postal_code: string
    country: string
  }
  phone?: string
}

export interface ActivityDetails {
  manuscriptId?: string
  manuscriptTitle?: string
  reviewerId?: string
  editorId?: string
  previousStatus?: string
  newStatus?: string
  reason?: string
  metadata?: Record<string, unknown>
}

export interface NotificationData {
  manuscriptId?: string
  manuscriptTitle?: string
  actionUrl?: string
  metadata?: Record<string, unknown>
}

export interface ConflictEvidence {
  type: 'publication' | 'affiliation' | 'financial' | 'personal' | 'other'
  source: string
  confidence: number
  details: Record<string, unknown>
}

export interface Publications {
  publications: {
    title: string
    doi?: string
    year: number
    journal?: string
    authors: string[]
  }[]
}

export type ManuscriptStatus =
  | 'draft'
  | 'submitted'
  | 'with_editor'
  | 'under_review'
  | 'revisions_requested'
  | 'accepted'
  | 'rejected'
  | 'published'

export type FileType =
  | 'manuscript_main'
  | 'manuscript_anonymized'
  | 'figure'
  | 'supplementary'
  | 'revision'
  | 'cover_letter'

export type ReviewRecommendation = 'accept' | 'minor_revisions' | 'major_revisions' | 'reject'

export type AssignmentStatus = 'invited' | 'accepted' | 'declined' | 'completed' | 'expired'

export interface Profile {
  id: string
  full_name: string
  email: string
  affiliation?: string | null
  orcid?: string | null
  role: UserRole
  expertise?: string[] | null
  bio?: string | null
  avatar_url?: string | null
  h_index?: number | null
  total_publications: number
  linkedin_url?: string | null
  twitter_handle?: string | null
  website_url?: string | null
  // Enhanced reviewer fields
  current_review_load?: number | null
  avg_review_quality_score?: number | null
  response_rate?: number | null
  specializations?: ReviewerSpecializations | null
  collaboration_history?: CollaborationHistory | null
  preferred_fields?: string[] | null
  availability_status?: string | null
  max_concurrent_reviews?: number | null
  review_preferences?: ReviewPreferences | null
  reviewer_settings?: ReviewerSettings | null
  coi_declarations?: COIDeclarations | null
  coi_last_updated?: string | null
  created_at: string
  updated_at: string
}

export interface Manuscript {
  id: string
  title: string
  abstract: string
  keywords?: string[] | null
  field_of_study: string
  subfield?: string | null
  author_id: string
  corresponding_author_id?: string | null
  editor_id?: string | null
  status: ManuscriptStatus
  submission_number?: string | null
  submitted_at?: string | null
  accepted_at?: string | null
  published_at?: string | null
  doi?: string | null
  view_count: number
  download_count: number
  citation_count: number
  cover_letter?: string | null
  suggested_reviewers?: SuggestedReviewers | null
  excluded_reviewers?: ExcludedReviewers | null
  funding_statement?: string | null
  conflict_of_interest?: string | null
  data_availability?: string | null
  created_at: string
  updated_at: string
}

export interface ManuscriptFile {
  id: string
  manuscript_id: string
  file_path: string
  file_name: string
  file_size: number
  file_type: FileType
  mime_type: string
  version: number
  uploaded_at: string
  uploaded_by: string
}

export interface ManuscriptCoauthor {
  id: string
  manuscript_id: string
  name: string
  email: string
  affiliation?: string | null
  orcid?: string | null
  author_order: number
  is_corresponding: boolean
  contribution_statement?: string | null
}

export interface Review {
  id: string
  manuscript_id: string
  reviewer_id: string
  recommendation: ReviewRecommendation
  summary: string
  major_comments: string
  minor_comments?: string | null
  comments_for_editor?: string | null
  review_quality_score?: number | null
  confidence_level?: number | null
  time_spent_hours?: number | null
  submitted_at: string
  round: number
}

export interface ReviewAssignment {
  id: string
  manuscript_id: string
  reviewer_id: string
  assigned_by: string
  status: AssignmentStatus
  invited_at: string
  responded_at?: string | null
  completed_at?: string | null
  due_date: string
  reminder_count: number
  last_reminder_at?: string | null
  decline_reason?: string | null
}

export interface Payment {
  id: string
  manuscript_id: string
  stripe_charge_id: string
  stripe_payment_intent_id: string
  amount: number
  currency: string
  status: string
  receipt_url?: string | null
  invoice_url?: string | null
  billing_details?: BillingDetails | null
  created_at: string
}

export interface EditorialDecision {
  id: string
  manuscript_id: string
  editor_id: string
  decision: ManuscriptStatus
  decision_letter: string
  internal_notes?: string | null
  
  // Enhanced decision components
  components?: {
    editorSummary?: string
    authorLetter: string
    reviewerComments: ReviewComment[]
    internalNotes?: string
    conditions?: string[]
    nextSteps?: string[]
    decisionRationale?: string
  } | null
  
  // Template information
  template_id?: string | null
  template_version?: number | null
  
  // Post-decision actions
  actions?: {
    notifyAuthor: boolean
    notifyReviewers: boolean
    schedulePublication?: string | null // ISO date string
    assignProductionEditor?: string | null // user ID
    generateDOI?: boolean
    sendToProduction?: boolean
    followUpDate?: string | null // ISO date string
  } | null
  
  // Draft and versioning
  draft_data?: Record<string, unknown> | null
  version: number
  is_draft?: boolean
  
  // Metadata
  submitted_at?: string | null
  created_at: string
  updated_at?: string | null
}

export interface ReviewComment {
  id: string
  review_id: string
  reviewer_name?: string
  comment_type: 'summary' | 'major' | 'minor' | 'confidential'
  content: string
  include_in_letter: boolean
  position?: number
}

export interface DecisionTemplate {
  id: string
  name: string
  category: 'accept' | 'minor_revision' | 'major_revision' | 'reject' | 'desk_reject'
  decision_type: ManuscriptStatus
  template_content: {
    sections: TemplateSection[]
    variables: string[]
    defaultActions?: DecisionActions
  }
  is_public: boolean
  created_by: string
  usage_count: number
  tags?: string[] | null
  description?: string | null
  created_at: string
  updated_at: string
}

export interface TemplateSection {
  id: string
  type: 'text' | 'variable' | 'review_summary' | 'conditions' | 'next_steps'
  content: string
  required: boolean
  order: number
}

export interface DecisionActions {
  notifyAuthor: boolean
  notifyReviewers: boolean
  schedulePublication?: boolean
  assignProductionEditor?: boolean
  generateDOI?: boolean
  sendToProduction?: boolean
  daysUntilFollowUp?: number
}

export interface ActivityLog {
  id: string
  manuscript_id?: string | null
  user_id?: string | null
  action: string
  details?: ActivityDetails | null
  ip_address?: string | null
  user_agent?: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  data?: NotificationData | null
  read: boolean
  created_at: string
}

export interface FieldOfStudy {
  id: string
  name: string
  parent_id?: string | null
  description?: string | null
  icon?: string | null
  color?: string | null
  manuscript_count: number
}

export interface ReviewerConflict {
  id: string
  reviewer_id: string
  conflicted_with_id: string
  conflict_type: string
  severity: string
  description?: string | null
  evidence?: ConflictEvidence | null
  detected_automatically: boolean
  reported_by?: string | null
  status: string
  valid_from: string
  valid_until?: string | null
  created_at: string
  updated_at: string
}

export interface InstitutionalAffiliationHistory {
  id: string
  profile_id: string
  institution_name: string
  department?: string | null
  position_title?: string | null
  start_date?: string | null
  end_date?: string | null
  is_primary: boolean
  source?: string | null
  created_at: string
}

export interface CollaborationNetwork {
  id: string
  person_a_id: string
  person_b_id: string
  relationship_type: string
  collaboration_count: number
  first_collaboration_date?: string | null
  last_collaboration_date?: string | null
  publications?: Publications | null
  confidence_score: number
  source?: string | null
  created_at: string
  updated_at: string
}

export interface ReviewerPerformanceMetrics {
  id: string
  reviewer_id: string
  period_start: string
  period_end: string
  invitations_received: number
  invitations_accepted: number
  reviews_completed: number
  reviews_completed_on_time: number
  avg_review_time_days?: number | null
  avg_quality_score?: number | null
  total_review_time_hours?: number | null
  reliability_score?: number | null
  expertise_alignment_score?: number | null
  created_at: string
  updated_at: string
}

export interface ReviewerAvailability {
  id: string
  reviewer_id: string
  available_from: string
  available_until?: string | null
  max_reviews: number
  preferred_fields?: string[] | null
  notes?: string | null
  created_at: string
  updated_at: string
}

// Database types for Supabase
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at' | 'total_publications'> & {
          created_at?: string
          updated_at?: string
          total_publications?: number
        }
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      manuscripts: {
        Row: Manuscript
        Insert: Omit<
          Manuscript,
          'id' | 'created_at' | 'updated_at' | 'view_count' | 'download_count' | 'citation_count'
        > & {
          id?: string
          created_at?: string
          updated_at?: string
          view_count?: number
          download_count?: number
          citation_count?: number
        }
        Update: Partial<Omit<Manuscript, 'id' | 'created_at'>>
      }
      manuscript_files: {
        Row: ManuscriptFile
        Insert: Omit<ManuscriptFile, 'id' | 'uploaded_at' | 'version'> & {
          id?: string
          uploaded_at?: string
          version?: number
        }
        Update: Partial<Omit<ManuscriptFile, 'id' | 'uploaded_at'>>
      }
      manuscript_coauthors: {
        Row: ManuscriptCoauthor
        Insert: Omit<ManuscriptCoauthor, 'id' | 'is_corresponding'> & {
          id?: string
          is_corresponding?: boolean
        }
        Update: Partial<Omit<ManuscriptCoauthor, 'id'>>
      }
      reviews: {
        Row: Review
        Insert: Omit<Review, 'id' | 'submitted_at' | 'round'> & {
          id?: string
          submitted_at?: string
          round?: number
        }
        Update: Partial<Omit<Review, 'id' | 'submitted_at'>>
      }
      review_assignments: {
        Row: ReviewAssignment
        Insert: Omit<ReviewAssignment, 'id' | 'invited_at' | 'reminder_count'> & {
          id?: string
          invited_at?: string
          reminder_count?: number
        }
        Update: Partial<Omit<ReviewAssignment, 'id' | 'invited_at'>>
      }
      payments: {
        Row: Payment
        Insert: Omit<Payment, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<Payment, 'id' | 'created_at'>>
      }
      editorial_decisions: {
        Row: EditorialDecision
        Insert: Omit<EditorialDecision, 'id' | 'created_at' | 'updated_at' | 'version'> & {
          id?: string
          created_at?: string
          updated_at?: string
          version?: number
        }
        Update: Partial<Omit<EditorialDecision, 'id' | 'created_at'>>
      }
      editorial_templates: {
        Row: DecisionTemplate
        Insert: Omit<DecisionTemplate, 'id' | 'created_at' | 'updated_at' | 'usage_count'> & {
          id?: string
          created_at?: string
          updated_at?: string
          usage_count?: number
        }
        Update: Partial<Omit<DecisionTemplate, 'id' | 'created_at'>>
      }
      activity_logs: {
        Row: ActivityLog
        Insert: Omit<ActivityLog, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<ActivityLog, 'id' | 'created_at'>>
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'created_at' | 'read'> & {
          id?: string
          created_at?: string
          read?: boolean
        }
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>
      }
      fields_of_study: {
        Row: FieldOfStudy
        Insert: Omit<FieldOfStudy, 'id' | 'manuscript_count'> & {
          id?: string
          manuscript_count?: number
        }
        Update: Partial<Omit<FieldOfStudy, 'id'>>
      }
      reviewer_analytics: {
        Row: ReviewerAnalytics
        Insert: Omit<ReviewerAnalytics, 'id' | 'created_at' | 'updated_at' | 'last_calculated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
          last_calculated_at?: string
        }
        Update: Partial<Omit<ReviewerAnalytics, 'id' | 'created_at'>>
      }
      badges: {
        Row: Badge
        Insert: Omit<Badge, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Badge, 'id' | 'created_at'>>
      }
      profile_badges: {
        Row: ProfileBadge
        Insert: Omit<ProfileBadge, 'id' | 'created_at' | 'awarded_at'> & {
          id?: string
          created_at?: string
          awarded_at?: string
        }
        Update: Partial<Omit<ProfileBadge, 'id' | 'created_at'>>
      }
      reviewer_workload_history: {
        Row: ReviewerWorkloadHistory
        Insert: Omit<ReviewerWorkloadHistory, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<ReviewerWorkloadHistory, 'id' | 'created_at'>>
      }
    }
    Views: {}
    Functions: {}
    Enums: {
      user_role: UserRole
      manuscript_status: ManuscriptStatus
      file_type: FileType
      review_recommendation: ReviewRecommendation
      assignment_status: AssignmentStatus
    }
  }
}