/**
 * Auth0 Type Definitions for The Commons Platform
 * Comprehensive types for Auth0 integration with reviewer system
 */

// Core Auth0 User Types
export interface Auth0User {
  user_id: string
  email: string
  email_verified: boolean
  name?: string
  nickname?: string
  picture?: string
  created_at: string
  updated_at: string
  app_metadata: Auth0AppMetadata
  user_metadata: Auth0UserMetadata
}

// Application Metadata (managed by Auth0 admin)
export interface Auth0AppMetadata {
  role: UserRole
  roles?: UserRole[] // For users with multiple roles
  permissions?: string[]
  
  // Reviewer-specific metadata
  reviewer_status?: ReviewerStatus
  onboarding_complete?: boolean
  expertise_areas?: string[]
  max_concurrent_reviews?: number
  
  // Application tracking
  application_id?: string
  applied_at?: string
  approved_by?: string
  approved_at?: string
  rejected_by?: string
  rejected_at?: string
  rejection_reason?: string
  
  // Role switching
  primary_role?: UserRole
  last_role_switch?: string
}

// User Metadata (user-editable profile data)
export interface Auth0UserMetadata {
  // Academic profile
  affiliation?: string
  orcid?: string
  bio?: string
  h_index?: number
  total_publications?: number
  website_url?: string
  linkedin_url?: string
  twitter_handle?: string
  
  // Reviewer-specific preferences
  preferred_email_for_reviews?: string
  availability_status?: AvailabilityStatus
  last_availability_update?: string
  
  // Communication preferences
  notification_preferences?: NotificationPreferences
  
  // Calendar integration
  calendar_integration?: CalendarIntegration
  
  // Application data (temporary during application process)
  cv_url?: string
  motivation?: string
  references?: ReviewerReference[]
}

// Enums and Union Types
export type UserRole = 'author' | 'reviewer' | 'editor' | 'admin'

export type ReviewerStatus = 'pending' | 'active' | 'inactive' | 'suspended' | 'rejected'

export type AvailabilityStatus = 'available' | 'busy' | 'unavailable' | 'on_leave'

// Detailed interface definitions
export interface NotificationPreferences {
  email: boolean
  sms: boolean
  in_app: boolean
  calendar_invites: boolean
  phone_number?: string
  reminder_frequency: 'immediate' | 'daily' | 'weekly' | 'minimal'
  review_invitation_email: boolean
  review_reminder_email: boolean
  review_decision_email: boolean
  system_updates_email: boolean
}

export interface CalendarIntegration {
  google_calendar_id?: string
  google_calendar_connected?: boolean
  outlook_connected?: boolean
  calendar_sync_enabled?: boolean
  default_availability?: 'available' | 'busy'
  blocked_dates?: string[] // ISO date strings
  working_hours?: {
    timezone: string
    monday: { start: string; end: string } | null
    tuesday: { start: string; end: string } | null
    wednesday: { start: string; end: string } | null
    thursday: { start: string; end: string } | null
    friday: { start: string; end: string } | null
    saturday: { start: string; end: string } | null
    sunday: { start: string; end: string } | null
  }
}

export interface ReviewerReference {
  name: string
  email: string
  affiliation: string
  relationship: 'colleague' | 'supervisor' | 'mentor' | 'collaborator' | 'other'
  contacted?: boolean
  response_received?: boolean
  recommendation?: 'strong_support' | 'support' | 'neutral' | 'concern' | 'oppose'
}

// Application and onboarding types
export interface ReviewerApplication {
  user_id: string
  expertise_areas: string[]
  motivation: string
  cv_url?: string
  references: ReviewerReference[]
  additional_info?: string
  preferred_review_frequency?: 'light' | 'moderate' | 'heavy'
  areas_of_interest?: string[]
  language_preferences?: string[]
  special_requirements?: string
}

export interface ReviewerOnboardingData {
  max_concurrent_reviews: number
  availability_status: AvailabilityStatus
  notification_preferences: NotificationPreferences
  bio: string
  expertise_confirmation: boolean
  guidelines_accepted: boolean
  calendar_integration_setup?: boolean
}

// API Response Types
export interface ReviewerApplicationResponse {
  success: boolean
  application_id?: string
  message: string
  errors?: string[]
}

export interface ReviewerStatusResponse {
  user_id: string
  status: ReviewerStatus
  role: UserRole
  roles?: UserRole[]
  onboarding_complete: boolean
  application_data?: {
    application_id: string
    applied_at: string
    approved_by?: string
    approved_at?: string
  }
  profile_completion: number // 0-100 percentage
  next_steps?: string[]
}

export interface PendingApplicationSummary {
  user_id: string
  name: string
  email: string
  affiliation?: string
  expertise_areas: string[]
  applied_at: string
  cv_url?: string
  motivation?: string
  references_count: number
  profile_completeness: number
}

// Role management types
export interface RoleUpdateRequest {
  user_id: string
  action: 'add_reviewer' | 'remove_reviewer' | 'approve_application' | 'reject_application' | 'switch_role'
  target_role?: UserRole
  reason?: string
  approved_by?: string
}

export interface RoleUpdateResponse {
  success: boolean
  message: string
  user_id: string
  new_roles: UserRole[]
  effective_date: string
}

// Permission types
export interface ReviewerPermissions {
  can_review: boolean
  can_accept_invitations: boolean
  can_decline_invitations: boolean
  can_view_manuscripts: boolean
  can_submit_reviews: boolean
  can_edit_profile: boolean
  can_set_availability: boolean
  can_suggest_reviewers: boolean
  max_concurrent_reviews: number
  can_access_mentorship?: boolean
}

// Statistics and analytics types
export interface ReviewerAnalytics {
  user_id: string
  reviews_completed: number
  reviews_in_progress: number
  reviews_overdue: number
  average_review_time: number // in hours
  quality_score: number // 0-100
  acceptance_rate: number // 0-100
  response_rate: number // 0-100
  expertise_match_score: number // 0-100
  peer_ratings: {
    helpfulness: number
    thoroughness: number
    timeliness: number
    constructiveness: number
  }
  achievements: Array<{
    type: string
    title: string
    description: string
    earned_at: string
    icon?: string
  }>
  current_streak: number // days
  total_contribution_hours: number
}

// Multi-role user types
export interface MultiRoleUser extends Auth0User {
  app_metadata: Auth0AppMetadata & {
    roles: UserRole[]
    primary_role: UserRole
    role_history: Array<{
      role: UserRole
      assigned_at: string
      assigned_by: string
      reason?: string
    }>
  }
}

// Invitation-related types for reviewers
export interface ReviewerInvitationData {
  invitation_id: string
  manuscript_id: string
  manuscript_title: string
  abstract_preview: string
  field_of_study: string
  keywords: string[]
  review_deadline: string
  response_deadline: string
  invitation_status: 'pending' | 'accepted' | 'declined' | 'expired'
  expertise_match_score: number
  estimated_time_hours: number
  compensation?: {
    amount: number
    currency: string
    type: 'fixed' | 'hourly'
  }
}

// Search and filtering types
export interface ReviewerSearchFilters {
  expertise_areas?: string[]
  availability_status?: AvailabilityStatus[]
  min_quality_score?: number
  max_current_load?: number
  language_preferences?: string[]
  affiliation_type?: 'academic' | 'industry' | 'government' | 'nonprofit'
  review_experience_level?: 'novice' | 'intermediate' | 'expert'
  geographic_region?: string
}

export interface ReviewerSearchResult {
  user_id: string
  name: string
  email: string
  affiliation: string
  expertise_areas: string[]
  availability_status: AvailabilityStatus
  quality_score: number
  current_review_load: number
  expertise_match_score: number // for specific manuscript
  last_active: string
  profile_image?: string
}

// Error types
export interface Auth0Error {
  error: string
  error_description: string
  statusCode?: number
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

// Environment configuration
export interface Auth0Config {
  domain: string
  clientId: string
  clientSecret: string
  audience: string
  scope: string
  roles: {
    AUTHOR: string
    REVIEWER: string
    EDITOR: string
    ADMIN: string
  }
  customClaims: {
    namespace: string
  }
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredAuth0Fields = 'user_id' | 'email' | 'email_verified' | 'created_at'
export type OptionalAuth0Fields = Omit<Auth0User, RequiredAuth0Fields>

// Type guards
export function isValidUserRole(role: any): role is UserRole {
  return ['author', 'reviewer', 'editor', 'admin'].includes(role)
}

export function isValidReviewerStatus(status: any): status is ReviewerStatus {
  return ['pending', 'active', 'inactive', 'suspended', 'rejected'].includes(status)
}

export function isValidAvailabilityStatus(status: any): status is AvailabilityStatus {
  return ['available', 'busy', 'unavailable', 'on_leave'].includes(status)
}

export function isMultiRoleUser(user: Auth0User): user is MultiRoleUser {
  return Array.isArray(user.app_metadata.roles) && user.app_metadata.roles.length > 1
}

export function hasReviewerRole(user: Auth0User): boolean {
  const roles = user.app_metadata.roles || [user.app_metadata.role]
  return roles.includes('reviewer')
}

export function canPerformReviews(user: Auth0User): boolean {
  return hasReviewerRole(user) && user.app_metadata.reviewer_status === 'active'
}