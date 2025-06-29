export type UserRole = 'author' | 'editor' | 'reviewer' | 'admin'

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
  suggested_reviewers?: any | null
  excluded_reviewers?: any | null
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
  billing_details?: any | null
  created_at: string
}

export interface EditorialDecision {
  id: string
  manuscript_id: string
  editor_id: string
  decision: ManuscriptStatus
  decision_letter: string
  internal_notes?: string | null
  created_at: string
}

export interface ActivityLog {
  id: string
  manuscript_id?: string | null
  user_id?: string | null
  action: string
  details?: any | null
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
  data?: any | null
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
        Insert: Omit<EditorialDecision, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<EditorialDecision, 'id' | 'created_at'>>
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