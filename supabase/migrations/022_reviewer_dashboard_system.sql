-- Reviewer Dashboard & Management System
-- Migration 022: Complete reviewer dashboard infrastructure

-- Add reviewer_settings column to profiles for workload management
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reviewer_settings JSONB DEFAULT '{
  "monthlyCapacity": 3,
  "preferredDeadlines": 21,
  "blackoutDates": [],
  "autoDeclineRules": [],
  "workloadPreferences": {
    "maxConcurrentReviews": 3,
    "preferredFields": [],
    "availabilityStatus": "available",
    "notificationPreferences": {
      "emailReminders": true,
      "deadlineWarnings": true,
      "achievementNotifications": true
    }
  }
}'::jsonb;

-- Create reviewer_analytics table for pre-computed dashboard metrics
CREATE TABLE IF NOT EXISTS reviewer_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Core metrics
    total_reviews_completed INTEGER DEFAULT 0,
    total_invitations_received INTEGER DEFAULT 0,
    total_invitations_accepted INTEGER DEFAULT 0,
    
    -- Performance metrics
    average_review_time_days DECIMAL(5,2) DEFAULT 0,
    acceptance_rate DECIMAL(3,2) DEFAULT 0,
    average_quality_score DECIMAL(3,2) DEFAULT 0,
    on_time_completion_rate DECIMAL(3,2) DEFAULT 0,
    response_rate DECIMAL(3,2) DEFAULT 0,
    
    -- Recognition metrics
    total_badges_earned INTEGER DEFAULT 0,
    quality_badge_count INTEGER DEFAULT 0,
    timeliness_badge_count INTEGER DEFAULT 0,
    volume_badge_count INTEGER DEFAULT 0,
    
    -- Time periods for trending
    current_month_reviews INTEGER DEFAULT 0,
    last_month_reviews INTEGER DEFAULT 0,
    current_year_reviews INTEGER DEFAULT 0,
    
    -- Metadata
    last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(reviewer_id)
);

-- Create badges table for achievement system
CREATE TABLE IF NOT EXISTS badges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('volume', 'quality', 'timeliness', 'expertise', 'service', 'special')),
    
    -- Badge appearance
    icon_url VARCHAR(255),
    color VARCHAR(7) DEFAULT '#3b82f6', -- hex color
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    
    -- Achievement criteria stored as JSONB for flexibility
    criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Badge metadata
    is_active BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profile_badges junction table
CREATE TABLE IF NOT EXISTS profile_badges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
    
    -- Achievement details
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    awarded_for JSONB, -- Context about what earned this badge
    progress_data JSONB, -- Any progress tracking data
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(profile_id, badge_id)
);

-- Create reviewer_workload_history for tracking workload changes
CREATE TABLE IF NOT EXISTS reviewer_workload_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Workload snapshot
    date DATE NOT NULL,
    active_reviews INTEGER DEFAULT 0,
    pending_invitations INTEGER DEFAULT 0,
    monthly_capacity INTEGER DEFAULT 3,
    workload_percentage DECIMAL(5,2) DEFAULT 0, -- calculated as active/capacity * 100
    
    -- Status
    availability_status VARCHAR(20) DEFAULT 'available',
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(reviewer_id, date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviewer_analytics_reviewer ON reviewer_analytics(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviewer_analytics_last_calculated ON reviewer_analytics(last_calculated_at);

CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);
CREATE INDEX IF NOT EXISTS idx_badges_active ON badges(is_active, is_public);
CREATE INDEX IF NOT EXISTS idx_badges_sort ON badges(sort_order, category);

CREATE INDEX IF NOT EXISTS idx_profile_badges_profile ON profile_badges(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_badges_badge ON profile_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_profile_badges_awarded ON profile_badges(awarded_at);

CREATE INDEX IF NOT EXISTS idx_workload_history_reviewer ON reviewer_workload_history(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_workload_history_date ON reviewer_workload_history(date DESC);

-- Function to calculate comprehensive reviewer analytics
CREATE OR REPLACE FUNCTION calculate_reviewer_dashboard_analytics(reviewer_id_param UUID)
RETURNS JSONB AS $$
DECLARE
    analytics_result JSONB;
    total_invitations INTEGER;
    total_accepted INTEGER;
    total_completed INTEGER;
    avg_time_days DECIMAL;
    quality_score DECIMAL;
    on_time_count INTEGER;
    current_month_count INTEGER;
    last_month_count INTEGER;
    current_year_count INTEGER;
    badge_count INTEGER;
BEGIN
    -- Get invitation stats
    SELECT 
        COUNT(*) INTO total_invitations
    FROM review_assignments 
    WHERE reviewer_id = reviewer_id_param;
    
    SELECT 
        COUNT(*) INTO total_accepted
    FROM review_assignments 
    WHERE reviewer_id = reviewer_id_param 
        AND status IN ('accepted', 'completed');
    
    -- Get review completion stats
    SELECT 
        COUNT(*),
        AVG(EXTRACT(epoch FROM (submitted_at - ra.invited_at))/86400),
        COUNT(*) FILTER (WHERE r.submitted_at <= ra.due_date)
    INTO total_completed, avg_time_days, on_time_count
    FROM reviews r
    JOIN review_assignments ra ON r.manuscript_id = ra.manuscript_id 
        AND r.reviewer_id = ra.reviewer_id
    WHERE r.reviewer_id = reviewer_id_param;
    
    -- Get quality score (weighted average of available scores)
    SELECT AVG(
        COALESCE(editor_quality_rating, 3) * 0.6 + 
        COALESCE(author_helpfulness_rating, 3) * 0.2 +
        COALESCE(timeliness_score * 5, 3) * 0.1 +
        COALESCE(thoroughness_score * 5, 3) * 0.1
    ) INTO quality_score
    FROM reviews r
    WHERE r.reviewer_id = reviewer_id_param
        AND r.submitted_at >= CURRENT_DATE - INTERVAL '12 months';
    
    -- Get time-based stats
    SELECT COUNT(*) INTO current_month_count
    FROM reviews
    WHERE reviewer_id = reviewer_id_param
        AND submitted_at >= DATE_TRUNC('month', CURRENT_DATE);
        
    SELECT COUNT(*) INTO last_month_count
    FROM reviews
    WHERE reviewer_id = reviewer_id_param
        AND submitted_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND submitted_at < DATE_TRUNC('month', CURRENT_DATE);
        
    SELECT COUNT(*) INTO current_year_count
    FROM reviews
    WHERE reviewer_id = reviewer_id_param
        AND submitted_at >= DATE_TRUNC('year', CURRENT_DATE);
    
    -- Get badge count
    SELECT COUNT(*) INTO badge_count
    FROM profile_badges
    WHERE profile_id = reviewer_id_param;
    
    -- Construct analytics JSON
    analytics_result := jsonb_build_object(
        'totalReviews', COALESCE(total_completed, 0),
        'totalInvitations', COALESCE(total_invitations, 0),
        'totalAccepted', COALESCE(total_accepted, 0),
        'averageReviewTime', COALESCE(avg_time_days, 0),
        'acceptanceRate', CASE 
            WHEN COALESCE(total_invitations, 0) > 0 
            THEN ROUND(COALESCE(total_accepted, 0)::decimal / total_invitations, 3)
            ELSE 0 
        END,
        'qualityScore', COALESCE(ROUND(quality_score, 2), 0),
        'timeliness', CASE 
            WHEN COALESCE(total_completed, 0) > 0 
            THEN ROUND(COALESCE(on_time_count, 0)::decimal / total_completed, 3)
            ELSE 0 
        END,
        'currentMonthReviews', COALESCE(current_month_count, 0),
        'lastMonthReviews', COALESCE(last_month_count, 0),
        'currentYearReviews', COALESCE(current_year_count, 0),
        'totalBadges', COALESCE(badge_count, 0)
    );
    
    RETURN analytics_result;
END;
$$ LANGUAGE plpgsql;

-- Function to update or create reviewer analytics
CREATE OR REPLACE FUNCTION update_reviewer_analytics(reviewer_id_param UUID)
RETURNS void AS $$
DECLARE
    analytics_data JSONB;
BEGIN
    -- Calculate analytics
    analytics_data := calculate_reviewer_dashboard_analytics(reviewer_id_param);
    
    -- Insert or update analytics record
    INSERT INTO reviewer_analytics (
        reviewer_id,
        total_reviews_completed,
        total_invitations_received,
        total_invitations_accepted,
        average_review_time_days,
        acceptance_rate,
        average_quality_score,
        on_time_completion_rate,
        current_month_reviews,
        last_month_reviews,
        current_year_reviews,
        total_badges_earned,
        last_calculated_at,
        updated_at
    )
    VALUES (
        reviewer_id_param,
        (analytics_data->>'totalReviews')::integer,
        (analytics_data->>'totalInvitations')::integer,
        (analytics_data->>'totalAccepted')::integer,
        (analytics_data->>'averageReviewTime')::decimal,
        (analytics_data->>'acceptanceRate')::decimal,
        (analytics_data->>'qualityScore')::decimal,
        (analytics_data->>'timeliness')::decimal,
        (analytics_data->>'currentMonthReviews')::integer,
        (analytics_data->>'lastMonthReviews')::integer,
        (analytics_data->>'currentYearReviews')::integer,
        (analytics_data->>'totalBadges')::integer,
        NOW(),
        NOW()
    )
    ON CONFLICT (reviewer_id) 
    DO UPDATE SET
        total_reviews_completed = EXCLUDED.total_reviews_completed,
        total_invitations_received = EXCLUDED.total_invitations_received,
        total_invitations_accepted = EXCLUDED.total_invitations_accepted,
        average_review_time_days = EXCLUDED.average_review_time_days,
        acceptance_rate = EXCLUDED.acceptance_rate,
        average_quality_score = EXCLUDED.average_quality_score,
        on_time_completion_rate = EXCLUDED.on_time_completion_rate,
        current_month_reviews = EXCLUDED.current_month_reviews,
        last_month_reviews = EXCLUDED.last_month_reviews,
        current_year_reviews = EXCLUDED.current_year_reviews,
        total_badges_earned = EXCLUDED.total_badges_earned,
        last_calculated_at = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to check and award badges
CREATE OR REPLACE FUNCTION check_and_award_badges(reviewer_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    badge_record RECORD;
    analytics_data JSONB;
    badges_awarded INTEGER := 0;
    criteria_met BOOLEAN;
BEGIN
    -- Get current analytics
    analytics_data := calculate_reviewer_dashboard_analytics(reviewer_id_param);
    
    -- Loop through all active badges
    FOR badge_record IN 
        SELECT * FROM badges WHERE is_active = TRUE 
    LOOP
        criteria_met := FALSE;
        
        -- Check different badge criteria based on type
        CASE badge_record.category
            WHEN 'volume' THEN
                -- Volume badges based on review count
                IF badge_record.criteria ? 'minReviews' THEN
                    criteria_met := (analytics_data->>'totalReviews')::integer >= 
                                  (badge_record.criteria->>'minReviews')::integer;
                END IF;
                
            WHEN 'quality' THEN
                -- Quality badges based on quality score and review count
                IF badge_record.criteria ? 'minQualityScore' AND badge_record.criteria ? 'minReviews' THEN
                    criteria_met := (analytics_data->>'qualityScore')::decimal >= 
                                  (badge_record.criteria->>'minQualityScore')::decimal
                                  AND (analytics_data->>'totalReviews')::integer >= 
                                  (badge_record.criteria->>'minReviews')::integer;
                END IF;
                
            WHEN 'timeliness' THEN
                -- Timeliness badges based on on-time completion rate
                IF badge_record.criteria ? 'minTimelinessRate' AND badge_record.criteria ? 'minReviews' THEN
                    criteria_met := (analytics_data->>'timeliness')::decimal >= 
                                  (badge_record.criteria->>'minTimelinessRate')::decimal
                                  AND (analytics_data->>'totalReviews')::integer >= 
                                  (badge_record.criteria->>'minReviews')::integer;
                END IF;
                
            WHEN 'service' THEN
                -- Service badges based on acceptance rate and participation
                IF badge_record.criteria ? 'minAcceptanceRate' AND badge_record.criteria ? 'minInvitations' THEN
                    criteria_met := (analytics_data->>'acceptanceRate')::decimal >= 
                                  (badge_record.criteria->>'minAcceptanceRate')::decimal
                                  AND (analytics_data->>'totalInvitations')::integer >= 
                                  (badge_record.criteria->>'minInvitations')::integer;
                END IF;
        END CASE;
        
        -- Award badge if criteria met and not already awarded
        IF criteria_met THEN
            INSERT INTO profile_badges (profile_id, badge_id, awarded_for)
            VALUES (
                reviewer_id_param, 
                badge_record.id,
                analytics_data
            )
            ON CONFLICT (profile_id, badge_id) DO NOTHING;
            
            -- Check if this was a new badge award
            IF FOUND THEN
                badges_awarded := badges_awarded + 1;
            END IF;
        END IF;
    END LOOP;
    
    RETURN badges_awarded;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update analytics when reviews are completed
CREATE OR REPLACE FUNCTION trigger_update_reviewer_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update analytics for the reviewer
    PERFORM update_reviewer_analytics(NEW.reviewer_id);
    
    -- Check for new badge achievements
    PERFORM check_and_award_badges(NEW.reviewer_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on reviews table
DROP TRIGGER IF EXISTS update_reviewer_analytics_on_review ON reviews;
CREATE TRIGGER update_reviewer_analytics_on_review
    AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_reviewer_analytics();

-- Trigger function for workload tracking
CREATE OR REPLACE FUNCTION update_reviewer_workload_history()
RETURNS TRIGGER AS $$
DECLARE
    active_count INTEGER;
    pending_count INTEGER;
    capacity INTEGER;
    workload_pct DECIMAL;
BEGIN
    -- Calculate current workload
    SELECT COUNT(*) INTO active_count
    FROM review_assignments
    WHERE reviewer_id = NEW.reviewer_id
        AND status = 'accepted'
        AND due_date >= CURRENT_DATE;
        
    SELECT COUNT(*) INTO pending_count
    FROM review_assignments
    WHERE reviewer_id = NEW.reviewer_id
        AND status = 'invited'
        AND due_date >= CURRENT_DATE;
    
    -- Get capacity from reviewer settings
    SELECT 
        COALESCE((reviewer_settings->'monthlyCapacity')::integer, 3) INTO capacity
    FROM profiles 
    WHERE id = NEW.reviewer_id;
    
    workload_pct := CASE 
        WHEN capacity > 0 THEN ROUND((active_count::decimal / capacity) * 100, 2)
        ELSE 0 
    END;
    
    -- Insert or update daily workload record
    INSERT INTO reviewer_workload_history (
        reviewer_id,
        date,
        active_reviews,
        pending_invitations,
        monthly_capacity,
        workload_percentage
    )
    VALUES (
        NEW.reviewer_id,
        CURRENT_DATE,
        active_count,
        pending_count,
        capacity,
        workload_pct
    )
    ON CONFLICT (reviewer_id, date)
    DO UPDATE SET
        active_reviews = EXCLUDED.active_reviews,
        pending_invitations = EXCLUDED.pending_invitations,
        monthly_capacity = EXCLUDED.monthly_capacity,
        workload_percentage = EXCLUDED.workload_percentage;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on review_assignments
DROP TRIGGER IF EXISTS update_workload_history_trigger ON review_assignments;
CREATE TRIGGER update_workload_history_trigger
    AFTER INSERT OR UPDATE OR DELETE ON review_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_reviewer_workload_history();

-- Enable RLS on new tables
ALTER TABLE reviewer_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewer_workload_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviewer_analytics
CREATE POLICY "reviewer_analytics_own_data" ON reviewer_analytics
    FOR ALL USING (reviewer_id = auth.uid());

-- RLS Policies for badges (readable by all authenticated users)
CREATE POLICY "badges_read_all" ON badges
    FOR SELECT USING (is_public = TRUE OR auth.role() = 'authenticated');

-- RLS Policies for profile_badges
CREATE POLICY "profile_badges_own_badges" ON profile_badges
    FOR ALL USING (profile_id = auth.uid());

-- Allow others to see badges awarded to public profiles
CREATE POLICY "profile_badges_view_public" ON profile_badges
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = profile_badges.profile_id 
            AND role = 'reviewer'
        )
    );

-- RLS Policies for reviewer_workload_history
CREATE POLICY "workload_history_own_data" ON reviewer_workload_history
    FOR ALL USING (reviewer_id = auth.uid());

-- Admins and editors can view workload for assignment decisions
CREATE POLICY "workload_history_admin_view" ON reviewer_workload_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'editor')
        )
    );

-- Insert initial badge definitions
INSERT INTO badges (name, description, category, icon_url, color, rarity, criteria, sort_order) VALUES
-- Volume Badges
('First Steps', 'Complete your first review', 'volume', '/badges/first-steps.svg', '#10b981', 'common', '{"minReviews": 1}', 1),
('Getting Started', 'Complete 5 reviews', 'volume', '/badges/getting-started.svg', '#10b981', 'common', '{"minReviews": 5}', 2),
('Reviewer', 'Complete 10 reviews', 'volume', '/badges/reviewer.svg', '#3b82f6', 'uncommon', '{"minReviews": 10}', 3),
('Experienced Reviewer', 'Complete 25 reviews', 'volume', '/badges/experienced.svg', '#3b82f6', 'uncommon', '{"minReviews": 25}', 4),
('Expert Reviewer', 'Complete 50 reviews', 'volume', '/badges/expert.svg', '#8b5cf6', 'rare', '{"minReviews": 50}', 5),
('Veteran Reviewer', 'Complete 100 reviews', 'volume', '/badges/veteran.svg', '#f59e0b', 'epic', '{"minReviews": 100}', 6),
('Master Reviewer', 'Complete 250 reviews', 'volume', '/badges/master.svg', '#ef4444', 'legendary', '{"minReviews": 250}', 7),

-- Quality Badges
('Quality Focused', 'Maintain 4.0+ quality score over 10 reviews', 'quality', '/badges/quality.svg', '#10b981', 'uncommon', '{"minQualityScore": 4.0, "minReviews": 10}', 10),
('Excellence', 'Maintain 4.5+ quality score over 20 reviews', 'quality', '/badges/excellence.svg', '#3b82f6', 'rare', '{"minQualityScore": 4.5, "minReviews": 20}', 11),
('Exceptional Quality', 'Maintain 4.8+ quality score over 30 reviews', 'quality', '/badges/exceptional.svg', '#8b5cf6', 'epic', '{"minQualityScore": 4.8, "minReviews": 30}', 12),

-- Timeliness Badges  
('Punctual', 'Complete 90%+ of reviews on time (10+ reviews)', 'timeliness', '/badges/punctual.svg', '#10b981', 'uncommon', '{"minTimelinessRate": 0.9, "minReviews": 10}', 20),
('Always On Time', 'Complete 95%+ of reviews on time (20+ reviews)', 'timeliness', '/badges/on-time.svg', '#3b82f6', 'rare', '{"minTimelinessRate": 0.95, "minReviews": 20}', 21),
('Time Master', 'Complete 98%+ of reviews on time (50+ reviews)', 'timeliness', '/badges/time-master.svg', '#8b5cf6', 'epic', '{"minTimelinessRate": 0.98, "minReviews": 50}', 22),

-- Service Badges
('Helpful Reviewer', 'Accept 80%+ of invitations (20+ invitations)', 'service', '/badges/helpful.svg', '#10b981', 'uncommon', '{"minAcceptanceRate": 0.8, "minInvitations": 20}', 30),
('Dedicated Reviewer', 'Accept 85%+ of invitations (50+ invitations)', 'service', '/badges/dedicated.svg', '#3b82f6', 'rare', '{"minAcceptanceRate": 0.85, "minInvitations": 50}', 31),
('Community Champion', 'Accept 90%+ of invitations (100+ invitations)', 'service', '/badges/champion.svg', '#8b5cf6', 'epic', '{"minAcceptanceRate": 0.9, "minInvitations": 100}', 32)

ON CONFLICT (name) DO NOTHING;

-- Create triggers for updated_at columns
CREATE TRIGGER update_reviewer_analytics_updated_at BEFORE UPDATE ON reviewer_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_badges_updated_at BEFORE UPDATE ON badges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Initialize analytics for existing reviewers
INSERT INTO reviewer_analytics (reviewer_id)
SELECT id FROM profiles WHERE role = 'reviewer'
ON CONFLICT (reviewer_id) DO NOTHING;

-- Update analytics for all existing reviewers
DO $$
DECLARE
    reviewer_record RECORD;
BEGIN
    FOR reviewer_record IN SELECT id FROM profiles WHERE role = 'reviewer' LOOP
        PERFORM update_reviewer_analytics(reviewer_record.id);
        PERFORM check_and_award_badges(reviewer_record.id);
    END LOOP;
END $$;

-- Grant permissions
GRANT ALL ON reviewer_analytics TO authenticated;
GRANT ALL ON badges TO authenticated;
GRANT ALL ON profile_badges TO authenticated;
GRANT ALL ON reviewer_workload_history TO authenticated;

-- Create a view for easy dashboard queries
CREATE OR REPLACE VIEW reviewer_dashboard_view AS
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.affiliation,
    p.expertise,
    p.reviewer_settings,
    ra.total_reviews_completed,
    ra.total_invitations_received,
    ra.average_review_time_days,
    ra.acceptance_rate,
    ra.average_quality_score,
    ra.on_time_completion_rate,
    ra.current_month_reviews,
    ra.last_month_reviews,
    ra.total_badges_earned,
    ra.last_calculated_at,
    COALESCE(wh.active_reviews, 0) as current_active_reviews,
    COALESCE(wh.pending_invitations, 0) as current_pending_invitations,
    COALESCE(wh.workload_percentage, 0) as current_workload_percentage
FROM profiles p
LEFT JOIN reviewer_analytics ra ON p.id = ra.reviewer_id
LEFT JOIN reviewer_workload_history wh ON p.id = wh.reviewer_id 
    AND wh.date = CURRENT_DATE
WHERE p.role = 'reviewer';

-- Grant access to the view
GRANT SELECT ON reviewer_dashboard_view TO authenticated;