-- Review Quality Assurance System Tables
-- Implements comprehensive quality monitoring, AI analysis, and feedback system

-- Store comprehensive quality analysis for each review
CREATE TABLE review_quality_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL UNIQUE REFERENCES reviews(id) ON DELETE CASCADE,
    
    -- Automated metrics calculated by the system
    automated_metrics JSONB DEFAULT '{}', -- { "completeness": 1.0, "timeliness": 0.8, "depth": 350, "specificity": 0.9 }
    
    -- NLP/AI-derived metrics
    nlp_analysis JSONB DEFAULT '{}', -- { "constructiveness_score": 0.75, "sentiment": "positive", "clarity": 0.85, "bias_indicators": [] }
    
    -- Consistency analysis
    consistency_metrics JSONB DEFAULT '{}', -- { "recommendation_alignment": 0.9, "internal_consistency": 0.85, "cross_reviewer_variance": 0.2 }
    
    -- Manual feedback from editors
    editor_rating INTEGER CHECK (editor_rating >= 1 AND editor_rating <= 5),
    editor_notes TEXT,
    editor_reviewed_at TIMESTAMP WITH TIME ZONE,
    editor_reviewed_by UUID REFERENCES users(id),
    
    -- Author feedback on review quality
    author_rating INTEGER CHECK (author_rating >= 1 AND author_rating <= 5),
    author_feedback TEXT,
    author_feedback_at TIMESTAMP WITH TIME ZONE,
    
    -- System flags and alerts
    flags JSONB DEFAULT '[]', -- ["bias_suspected", "unprofessional_tone", "incomplete_review"]
    quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 1), -- Overall quality score 0-1
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending_analysis',
    analysis_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Quality metrics configuration and thresholds
CREATE TABLE quality_metrics_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(100) NOT NULL UNIQUE,
    metric_type VARCHAR(50) NOT NULL, -- 'automated', 'nlp', 'manual'
    
    -- Thresholds for quality levels
    excellent_threshold DECIMAL(3,2),
    good_threshold DECIMAL(3,2),
    acceptable_threshold DECIMAL(3,2),
    poor_threshold DECIMAL(3,2),
    
    -- Configuration
    weight DECIMAL(3,2) DEFAULT 1.0, -- Weight in overall quality score
    enabled BOOLEAN DEFAULT true,
    requires_human_review BOOLEAN DEFAULT false,
    
    -- AI model configuration
    ai_model VARCHAR(100),
    ai_parameters JSONB DEFAULT '{}',
    
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI feedback and analysis logs for auditing
CREATE TABLE ai_feedback_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    analysis_type VARCHAR(100) NOT NULL, -- 'quality', 'bias_detection', 'consistency', 'suggestions'
    
    -- AI interaction details
    ai_provider VARCHAR(50), -- 'openai', 'anthropic', 'local'
    ai_model VARCHAR(100),
    prompt TEXT,
    response JSONB,
    
    -- Analysis results
    analysis_results JSONB,
    confidence_score DECIMAL(3,2),
    processing_time_ms INTEGER,
    
    -- Status and errors
    status VARCHAR(50) DEFAULT 'completed',
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cross-reviewer consistency tracking
CREATE TABLE review_consistency_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manuscript_id UUID NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
    
    -- Consistency metrics across all reviews for this manuscript
    overall_consistency DECIMAL(3,2), -- 0-1 score
    recommendation_variance DECIMAL(3,2), -- Variance in recommendations
    score_variance DECIMAL(3,2), -- Variance in scores
    
    -- Detailed analysis
    reviewer_agreement_matrix JSONB, -- Pairwise agreement scores
    divergent_areas JSONB DEFAULT '[]', -- Areas where reviewers disagreed
    consensus_areas JSONB DEFAULT '[]', -- Areas of strong agreement
    
    -- Statistical measures
    inter_rater_reliability DECIMAL(3,2),
    cohens_kappa DECIMAL(3,2),
    
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reviewer quality profiles and development tracking
CREATE TABLE reviewer_quality_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Aggregate quality metrics
    average_quality_score DECIMAL(3,2),
    total_reviews INTEGER DEFAULT 0,
    high_quality_reviews INTEGER DEFAULT 0,
    low_quality_reviews INTEGER DEFAULT 0,
    
    -- Performance trends
    quality_trend VARCHAR(20), -- 'improving', 'stable', 'declining'
    last_30_days_avg DECIMAL(3,2),
    last_90_days_avg DECIMAL(3,2),
    
    -- Specific metrics
    average_completeness DECIMAL(3,2),
    average_constructiveness DECIMAL(3,2),
    average_timeliness DECIMAL(3,2),
    average_consistency DECIMAL(3,2),
    
    -- Development needs
    identified_weaknesses JSONB DEFAULT '[]',
    recommended_training JSONB DEFAULT '[]',
    mentor_assigned UUID REFERENCES users(id),
    
    -- Recognition
    quality_badges JSONB DEFAULT '[]',
    excellence_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Quality improvement suggestions and training
CREATE TABLE quality_improvement_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,
    
    task_type VARCHAR(50) NOT NULL, -- 'training', 'mentorship', 'practice', 'feedback_review'
    task_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'skipped'
    
    -- Task details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    learning_objectives JSONB DEFAULT '[]',
    resources JSONB DEFAULT '[]', -- Links to training materials
    
    -- Progress tracking
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    completion_score DECIMAL(3,2),
    
    -- Feedback
    reviewer_feedback TEXT,
    mentor_feedback TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Real-time review assistance sessions
CREATE TABLE review_assistance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session tracking
    session_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP WITH TIME ZONE,
    total_suggestions INTEGER DEFAULT 0,
    accepted_suggestions INTEGER DEFAULT 0,
    
    -- AI assistance provided
    completeness_checks JSONB DEFAULT '[]',
    tone_adjustments JSONB DEFAULT '[]',
    clarity_improvements JSONB DEFAULT '[]',
    bias_warnings JSONB DEFAULT '[]',
    
    -- User interaction
    user_feedback_positive BOOLEAN,
    user_feedback_text TEXT,
    assistance_level VARCHAR(20) DEFAULT 'standard', -- 'minimal', 'standard', 'comprehensive'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Background job queue for quality analysis
CREATE TABLE quality_analysis_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL, -- 'full_analysis', 'quick_check', 'consistency_analysis'
    
    -- Job status
    status VARCHAR(50) DEFAULT 'queued', -- 'queued', 'processing', 'completed', 'failed'
    priority INTEGER DEFAULT 5, -- 1-10, higher is more urgent
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Processing details
    queued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    processing_time_ms INTEGER,
    
    -- Results and errors
    result JSONB,
    error_message TEXT,
    error_details JSONB,
    
    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_quality_reports_review_id ON review_quality_reports(review_id);
CREATE INDEX idx_quality_reports_status ON review_quality_reports(status);
CREATE INDEX idx_quality_reports_quality_score ON review_quality_reports(quality_score);
CREATE INDEX idx_quality_reports_created_at ON review_quality_reports(created_at DESC);

CREATE INDEX idx_ai_logs_review_id ON ai_feedback_logs(review_id);
CREATE INDEX idx_ai_logs_analysis_type ON ai_feedback_logs(analysis_type);
CREATE INDEX idx_ai_logs_created_at ON ai_feedback_logs(created_at DESC);

CREATE INDEX idx_consistency_manuscript_id ON review_consistency_scores(manuscript_id);
CREATE INDEX idx_consistency_calculated_at ON review_consistency_scores(calculated_at DESC);

CREATE INDEX idx_reviewer_profiles_reviewer_id ON reviewer_quality_profiles(reviewer_id);
CREATE INDEX idx_reviewer_profiles_quality_score ON reviewer_quality_profiles(average_quality_score);

CREATE INDEX idx_improvement_tasks_reviewer_id ON quality_improvement_tasks(reviewer_id);
CREATE INDEX idx_improvement_tasks_status ON quality_improvement_tasks(task_status);

CREATE INDEX idx_assistance_sessions_review_id ON review_assistance_sessions(review_id);
CREATE INDEX idx_assistance_sessions_reviewer_id ON review_assistance_sessions(reviewer_id);

CREATE INDEX idx_analysis_jobs_status ON quality_analysis_jobs(status);
CREATE INDEX idx_analysis_jobs_priority ON quality_analysis_jobs(priority DESC);
CREATE INDEX idx_analysis_jobs_scheduled ON quality_analysis_jobs(scheduled_for);

-- Insert default quality metrics configuration
INSERT INTO quality_metrics_config (metric_name, metric_type, excellent_threshold, good_threshold, acceptable_threshold, poor_threshold, weight, description) VALUES
('completeness', 'automated', 0.95, 0.85, 0.70, 0.50, 1.0, 'Measures if all required review sections are filled'),
('timeliness', 'automated', 1.0, 0.90, 0.75, 0.50, 0.8, 'Review submitted relative to deadline'),
('depth', 'automated', 0.90, 0.75, 0.60, 0.40, 0.9, 'Word count and detail level of review'),
('constructiveness', 'nlp', 0.85, 0.70, 0.55, 0.40, 1.2, 'Positive and actionable feedback ratio'),
('clarity', 'nlp', 0.85, 0.70, 0.55, 0.40, 1.0, 'Readability and structure of review'),
('consistency', 'nlp', 0.90, 0.75, 0.60, 0.45, 1.1, 'Alignment between comments and recommendation'),
('professionalism', 'nlp', 0.95, 0.85, 0.70, 0.50, 1.0, 'Professional tone and language use'),
('bias_free', 'nlp', 0.95, 0.85, 0.70, 0.50, 1.3, 'Absence of biased language or assumptions'),
('specificity', 'nlp', 0.85, 0.70, 0.55, 0.40, 0.9, 'Specific examples and actionable suggestions');

-- Function to calculate overall quality score
CREATE OR REPLACE FUNCTION calculate_review_quality_score(report_id UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    total_weight DECIMAL(10,2) := 0;
    weighted_sum DECIMAL(10,2) := 0;
    metric RECORD;
    metric_value DECIMAL(3,2);
    quality_report RECORD;
BEGIN
    -- Get the quality report
    SELECT * INTO quality_report FROM review_quality_reports WHERE id = report_id;
    
    IF quality_report IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Calculate weighted average of all enabled metrics
    FOR metric IN SELECT * FROM quality_metrics_config WHERE enabled = true LOOP
        -- Extract metric value based on type
        IF metric.metric_type = 'automated' THEN
            metric_value := (quality_report.automated_metrics->>(metric.metric_name))::DECIMAL(3,2);
        ELSIF metric.metric_type = 'nlp' THEN
            metric_value := (quality_report.nlp_analysis->>(metric.metric_name))::DECIMAL(3,2);
        ELSE
            CONTINUE;
        END IF;
        
        IF metric_value IS NOT NULL THEN
            weighted_sum := weighted_sum + (metric_value * metric.weight);
            total_weight := total_weight + metric.weight;
        END IF;
    END LOOP;
    
    IF total_weight > 0 THEN
        RETURN ROUND(weighted_sum / total_weight, 2);
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update quality score when metrics change
CREATE OR REPLACE FUNCTION update_quality_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.quality_score := calculate_review_quality_score(NEW.id);
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_quality_score
    BEFORE UPDATE OF automated_metrics, nlp_analysis, consistency_metrics
    ON review_quality_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_quality_score();

-- Function to update reviewer profile after quality report
CREATE OR REPLACE FUNCTION update_reviewer_profile()
RETURNS TRIGGER AS $$
DECLARE
    reviewer_user_id UUID;
    avg_score DECIMAL(3,2);
    total_count INTEGER;
    high_count INTEGER;
    low_count INTEGER;
BEGIN
    -- Get reviewer ID from the review
    SELECT reviewer_id INTO reviewer_user_id 
    FROM reviews 
    WHERE id = NEW.review_id;
    
    IF reviewer_user_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Calculate aggregates
    SELECT 
        AVG(rqr.quality_score),
        COUNT(*),
        COUNT(*) FILTER (WHERE rqr.quality_score >= 0.85),
        COUNT(*) FILTER (WHERE rqr.quality_score < 0.60)
    INTO avg_score, total_count, high_count, low_count
    FROM review_quality_reports rqr
    JOIN reviews r ON rqr.review_id = r.id
    WHERE r.reviewer_id = reviewer_user_id
    AND rqr.quality_score IS NOT NULL;
    
    -- Update or insert reviewer profile
    INSERT INTO reviewer_quality_profiles (
        reviewer_id,
        average_quality_score,
        total_reviews,
        high_quality_reviews,
        low_quality_reviews,
        updated_at
    ) VALUES (
        reviewer_user_id,
        avg_score,
        total_count,
        high_count,
        low_count,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (reviewer_id) DO UPDATE SET
        average_quality_score = EXCLUDED.average_quality_score,
        total_reviews = EXCLUDED.total_reviews,
        high_quality_reviews = EXCLUDED.high_quality_reviews,
        low_quality_reviews = EXCLUDED.low_quality_reviews,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reviewer_profile
    AFTER INSERT OR UPDATE OF quality_score
    ON review_quality_reports
    FOR EACH ROW
    WHEN (NEW.quality_score IS NOT NULL)
    EXECUTE FUNCTION update_reviewer_profile();

-- RLS Policies
ALTER TABLE review_quality_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_metrics_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_consistency_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewer_quality_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_improvement_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_assistance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_analysis_jobs ENABLE ROW LEVEL SECURITY;

-- Quality reports: viewable by editors, handling editors, and the reviewer
CREATE POLICY "Editors can view all quality reports" ON review_quality_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('editor', 'admin')
        )
    );

CREATE POLICY "Reviewers can view their own quality reports" ON review_quality_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM reviews 
            WHERE reviews.id = review_quality_reports.review_id 
            AND reviews.reviewer_id = auth.uid()
        )
    );

-- Editors can update quality reports
CREATE POLICY "Editors can update quality reports" ON review_quality_reports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('editor', 'admin')
        )
    );

-- Quality metrics config: viewable by all, editable by admins
CREATE POLICY "All users can view quality metrics config" ON quality_metrics_config
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage quality metrics config" ON quality_metrics_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- AI logs: viewable by editors and admins
CREATE POLICY "Editors can view AI logs" ON ai_feedback_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('editor', 'admin')
        )
    );

-- Consistency scores: viewable by editors and handling editors
CREATE POLICY "Editors can view consistency scores" ON review_consistency_scores
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('editor', 'admin')
        )
    );

-- Reviewer profiles: viewable by the reviewer and editors
CREATE POLICY "Users can view their own quality profile" ON reviewer_quality_profiles
    FOR SELECT USING (reviewer_id = auth.uid());

CREATE POLICY "Editors can view all quality profiles" ON reviewer_quality_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('editor', 'admin')
        )
    );

-- Improvement tasks: viewable and updatable by the assigned reviewer
CREATE POLICY "Users can view their improvement tasks" ON quality_improvement_tasks
    FOR SELECT USING (reviewer_id = auth.uid());

CREATE POLICY "Users can update their improvement tasks" ON quality_improvement_tasks
    FOR UPDATE USING (reviewer_id = auth.uid());

CREATE POLICY "Editors can manage improvement tasks" ON quality_improvement_tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('editor', 'admin')
        )
    );

-- Assistance sessions: viewable by the reviewer
CREATE POLICY "Users can view their assistance sessions" ON review_assistance_sessions
    FOR SELECT USING (reviewer_id = auth.uid());

-- Analysis jobs: viewable by editors
CREATE POLICY "Editors can view analysis jobs" ON quality_analysis_jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('editor', 'admin')
        )
    );