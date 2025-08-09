// Review Quality Assurance System Types

export interface ReviewQualityReport {
  id: string;
  review_id: string;
  
  // Automated metrics
  automated_metrics: {
    completeness: number;
    timeliness: number;
    depth: number;
    specificity: number;
  };
  
  // NLP/AI analysis
  nlp_analysis: {
    constructiveness_score: number;
    sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
    clarity: number;
    bias_indicators: string[];
    professionalism: number;
  };
  
  // Consistency metrics
  consistency_metrics: {
    recommendation_alignment: number;
    internal_consistency: number;
    cross_reviewer_variance?: number;
  };
  
  // Manual feedback
  editor_rating?: number;
  editor_notes?: string;
  editor_reviewed_at?: string;
  editor_reviewed_by?: string;
  
  author_rating?: number;
  author_feedback?: string;
  author_feedback_at?: string;
  
  // System flags
  flags: QualityFlag[];
  quality_score?: number;
  
  status: QualityReportStatus;
  analysis_completed_at?: string;
  
  created_at: string;
  updated_at: string;
}

export type QualityFlag = 
  | 'bias_suspected'
  | 'unprofessional_tone'
  | 'incomplete_review'
  | 'inconsistent_recommendation'
  | 'low_constructiveness'
  | 'excellent_quality'
  | 'needs_improvement'
  | 'ethical_concern';

export type QualityReportStatus = 
  | 'pending_analysis'
  | 'analyzing'
  | 'analysis_complete'
  | 'pending_editor_review'
  | 'editor_reviewed'
  | 'flagged_for_review';

export interface QualityMetricConfig {
  id: string;
  metric_name: string;
  metric_type: 'automated' | 'nlp' | 'manual';
  
  excellent_threshold: number;
  good_threshold: number;
  acceptable_threshold: number;
  poor_threshold: number;
  
  weight: number;
  enabled: boolean;
  requires_human_review: boolean;
  
  ai_model?: string;
  ai_parameters?: Record<string, any>;
  
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface AIFeedbackLog {
  id: string;
  review_id: string;
  analysis_type: 'quality' | 'bias_detection' | 'consistency' | 'suggestions';
  
  ai_provider?: 'openai' | 'anthropic' | 'local';
  ai_model?: string;
  prompt?: string;
  response?: any;
  
  analysis_results?: any;
  confidence_score?: number;
  processing_time_ms?: number;
  
  status: 'processing' | 'completed' | 'failed';
  error_message?: string;
  
  created_at: string;
}

export interface ReviewConsistencyScore {
  id: string;
  manuscript_id: string;
  
  overall_consistency?: number;
  recommendation_variance?: number;
  score_variance?: number;
  
  reviewer_agreement_matrix?: Record<string, Record<string, number>>;
  divergent_areas: string[];
  consensus_areas: string[];
  
  inter_rater_reliability?: number;
  cohens_kappa?: number;
  
  calculated_at: string;
  updated_at: string;
}

export interface ReviewerQualityProfile {
  id: string;
  reviewer_id: string;
  
  average_quality_score?: number;
  total_reviews: number;
  high_quality_reviews: number;
  low_quality_reviews: number;
  
  quality_trend?: 'improving' | 'stable' | 'declining';
  last_30_days_avg?: number;
  last_90_days_avg?: number;
  
  average_completeness?: number;
  average_constructiveness?: number;
  average_timeliness?: number;
  average_consistency?: number;
  
  identified_weaknesses: string[];
  recommended_training: TrainingRecommendation[];
  mentor_assigned?: string;
  
  quality_badges: QualityBadge[];
  excellence_count: number;
  
  created_at: string;
  updated_at: string;
}

export interface TrainingRecommendation {
  type: 'video' | 'article' | 'workshop' | 'mentorship';
  title: string;
  description: string;
  url?: string;
  duration?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface QualityBadge {
  type: 'consistency_champion' | 'thorough_reviewer' | 'constructive_feedback' | 'timely_reviewer' | 'quality_excellence';
  earned_at: string;
  description: string;
}

export interface QualityImprovementTask {
  id: string;
  reviewer_id: string;
  review_id?: string;
  
  task_type: 'training' | 'mentorship' | 'practice' | 'feedback_review';
  task_status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  
  title: string;
  description?: string;
  learning_objectives: string[];
  resources: TaskResource[];
  
  assigned_at: string;
  started_at?: string;
  completed_at?: string;
  completion_score?: number;
  
  reviewer_feedback?: string;
  mentor_feedback?: string;
  
  created_at: string;
  updated_at: string;
}

export interface TaskResource {
  type: 'link' | 'document' | 'video';
  title: string;
  url: string;
  duration?: string;
}

export interface ReviewAssistanceSession {
  id: string;
  review_id: string;
  reviewer_id: string;
  
  session_start: string;
  session_end?: string;
  total_suggestions: number;
  accepted_suggestions: number;
  
  completeness_checks: AssistanceSuggestion[];
  tone_adjustments: AssistanceSuggestion[];
  clarity_improvements: AssistanceSuggestion[];
  bias_warnings: BiasWarning[];
  
  user_feedback_positive?: boolean;
  user_feedback_text?: string;
  assistance_level: 'minimal' | 'standard' | 'comprehensive';
  
  created_at: string;
}

export interface AssistanceSuggestion {
  type: 'completeness' | 'tone' | 'clarity' | 'specificity';
  original_text: string;
  suggested_text: string;
  reason: string;
  accepted: boolean;
  timestamp: string;
}

export interface BiasWarning {
  type: 'gender' | 'racial' | 'institutional' | 'geographic' | 'career_stage';
  detected_text: string;
  suggestion: string;
  severity: 'low' | 'medium' | 'high';
  addressed: boolean;
}

export interface QualityAnalysisJob {
  id: string;
  review_id: string;
  job_type: 'full_analysis' | 'quick_check' | 'consistency_analysis';
  
  status: 'queued' | 'processing' | 'completed' | 'failed';
  priority: number;
  retry_count: number;
  max_retries: number;
  
  queued_at: string;
  started_at?: string;
  completed_at?: string;
  processing_time_ms?: number;
  
  result?: any;
  error_message?: string;
  error_details?: any;
  
  scheduled_for?: string;
  
  created_at: string;
  updated_at: string;
}

// Quality Analysis Request/Response Types
export interface QualityAnalysisRequest {
  review_id: string;
  analysis_type: 'full' | 'quick' | 'consistency';
  priority?: number;
  include_ai_analysis?: boolean;
  include_consistency_check?: boolean;
}

export interface QualityAnalysisResponse {
  report_id: string;
  review_id: string;
  quality_score: number;
  status: QualityReportStatus;
  metrics: {
    automated: ReviewQualityReport['automated_metrics'];
    nlp?: ReviewQualityReport['nlp_analysis'];
    consistency?: ReviewQualityReport['consistency_metrics'];
  };
  flags: QualityFlag[];
  recommendations?: string[];
}

// Dashboard Analytics Types
export interface QualityDashboardData {
  overview: {
    total_reviews: number;
    average_quality: number;
    reviews_flagged: number;
    pending_editor_review: number;
  };
  
  trends: {
    date: string;
    average_quality: number;
    review_count: number;
  }[];
  
  metrics_breakdown: {
    metric: string;
    average_score: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  
  top_reviewers: {
    reviewer_id: string;
    name: string;
    average_quality: number;
    total_reviews: number;
    badges: QualityBadge[];
  }[];
  
  flagged_reviews: {
    review_id: string;
    manuscript_title: string;
    reviewer_name: string;
    flags: QualityFlag[];
    quality_score: number;
    submitted_at: string;
  }[];
}

// Real-time Assistance Types
export interface AssistanceRequest {
  review_id: string;
  section: 'summary' | 'strengths' | 'weaknesses' | 'detailed_comments' | 'recommendation';
  current_text: string;
  assistance_type: 'completeness' | 'tone' | 'clarity' | 'bias_check' | 'all';
}

export interface AssistanceResponse {
  suggestions: AssistanceSuggestion[];
  warnings: BiasWarning[];
  completeness_score: number;
  estimated_quality_impact: number;
}

// Quality Threshold Configuration
export interface QualityThresholds {
  auto_flag_threshold: number;
  require_editor_review_threshold: number;
  excellence_threshold: number;
  training_trigger_threshold: number;
  consistency_variance_threshold: number;
}

// Notification Types
export interface QualityNotification {
  type: 'quality_report_ready' | 'review_flagged' | 'training_assigned' | 'excellence_achieved';
  recipient_id: string;
  review_id?: string;
  manuscript_id?: string;
  message: string;
  action_url?: string;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}