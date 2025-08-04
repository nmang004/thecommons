-- Reviewer Profile Enhancements
-- Migration 013: Enhanced reviewer tracking and performance metrics

-- Add enhanced reviewer profile fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_review_load INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avg_review_quality_score DECIMAL(3,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS response_rate DECIMAL(3,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specializations JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS collaboration_history JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_fields TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'available'; -- available, busy, unavailable
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS max_concurrent_reviews INTEGER DEFAULT 3;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS review_preferences JSONB; -- notification preferences, review types, etc.

-- Create reviewer performance tracking table
CREATE TABLE reviewer_performance_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  invitations_received INTEGER DEFAULT 0,
  invitations_accepted INTEGER DEFAULT 0,
  reviews_completed INTEGER DEFAULT 0,
  reviews_completed_on_time INTEGER DEFAULT 0,
  avg_review_time_days DECIMAL(5,2),
  avg_quality_score DECIMAL(3,2),
  total_review_time_hours DECIMAL(8,2),
  reliability_score DECIMAL(3,2), -- calculated score 0-1
  expertise_alignment_score DECIMAL(3,2), -- how well matched assignments were
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  UNIQUE(reviewer_id, period_start, period_end)
);

-- Create indexes for performance
CREATE INDEX idx_reviewer_performance_reviewer ON reviewer_performance_metrics(reviewer_id);
CREATE INDEX idx_reviewer_performance_period ON reviewer_performance_metrics(period_start, period_end);

-- Create reviewer availability schedule table
CREATE TABLE reviewer_availability (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  available_from DATE NOT NULL,
  available_until DATE,
  max_reviews INTEGER DEFAULT 2,
  preferred_fields TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_reviewer_availability_reviewer ON reviewer_availability(reviewer_id);
CREATE INDEX idx_reviewer_availability_dates ON reviewer_availability(available_from, available_until);

-- Create reviewer expertise validation table
CREATE TABLE reviewer_expertise_validation (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,  
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  expertise_area TEXT NOT NULL,
  validation_type TEXT NOT NULL, -- 'publication', 'citation', 'institutional', 'self_declared'
  evidence JSONB, -- supporting evidence like publication IDs, degrees, etc.
  confidence_score DECIMAL(3,2) DEFAULT 0.5,
  validated_by UUID REFERENCES profiles(id),
  validated_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending', -- pending, validated, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_expertise_validation_reviewer ON reviewer_expertise_validation(reviewer_id);
CREATE INDEX idx_expertise_validation_area ON reviewer_expertise_validation(expertise_area);

-- Add review quality scoring to reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS editor_quality_rating INTEGER CHECK (editor_quality_rating >= 1 AND editor_quality_rating <= 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS author_helpfulness_rating INTEGER CHECK (author_helpfulness_rating >= 1 AND author_helpfulness_rating <= 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS timeliness_score DECIMAL(3,2); -- calculated based on submission vs due date
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS thoroughness_score DECIMAL(3,2); -- calculated based on review length, detail, etc.

-- Function to calculate current review load for a reviewer
CREATE OR REPLACE FUNCTION calculate_current_review_load(reviewer_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM review_assignments ra
    WHERE ra.reviewer_id = reviewer_id_param
      AND ra.status IN ('invited', 'accepted')
      AND ra.due_date >= CURRENT_DATE
  );
END;
$$ LANGUAGE plpgsql;

-- Function to calculate reviewer response rate
CREATE OR REPLACE FUNCTION calculate_response_rate(reviewer_id_param UUID, months_back INTEGER DEFAULT 12)
RETURNS DECIMAL(3,2) AS $$
DECLARE
  total_invites INTEGER;
  responses INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_invites
  FROM review_assignments
  WHERE reviewer_id = reviewer_id_param
    AND invited_at >= CURRENT_DATE - INTERVAL '1 month' * months_back;
    
  SELECT COUNT(*) INTO responses  
  FROM review_assignments
  WHERE reviewer_id = reviewer_id_param
    AND responded_at IS NOT NULL
    AND invited_at >= CURRENT_DATE - INTERVAL '1 month' * months_back;
    
  IF total_invites = 0 THEN
    RETURN NULL;
  END IF;
  
  RETURN ROUND(responses::decimal / total_invites::decimal, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate average review quality score
CREATE OR REPLACE FUNCTION calculate_avg_quality_score(reviewer_id_param UUID, months_back INTEGER DEFAULT 12)
RETURNS DECIMAL(3,2) AS $$
DECLARE
  avg_score DECIMAL(3,2);
BEGIN
  SELECT AVG(
    COALESCE(editor_quality_rating, 0) * 0.6 + 
    COALESCE(author_helpfulness_rating, 0) * 0.2 +
    COALESCE(timeliness_score, 0) * 0.1 +
    COALESCE(thoroughness_score, 0) * 0.1
  ) INTO avg_score
  FROM reviews r
  JOIN review_assignments ra ON r.manuscript_id = ra.manuscript_id AND r.reviewer_id = ra.reviewer_id
  WHERE r.reviewer_id = reviewer_id_param
    AND r.submitted_at >= CURRENT_DATE - INTERVAL '1 month' * months_back;
    
  RETURN ROUND(avg_score, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to update reviewer performance metrics
CREATE OR REPLACE FUNCTION update_reviewer_performance_metrics()
RETURNS void AS $$
DECLARE
  reviewer_record RECORD;
  start_date DATE;
  end_date DATE;
BEGIN
  -- Calculate for the previous month
  start_date := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month');
  end_date := DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day';
  
  FOR reviewer_record IN 
    SELECT DISTINCT reviewer_id 
    FROM review_assignments 
    WHERE invited_at >= start_date AND invited_at <= end_date
  LOOP
    INSERT INTO reviewer_performance_metrics (
      reviewer_id,
      period_start,
      period_end,
      invitations_received,
      invitations_accepted,
      reviews_completed,
      reviews_completed_on_time,
      avg_review_time_days,
      avg_quality_score,
      reliability_score
    )
    SELECT 
      reviewer_record.reviewer_id,
      start_date,
      end_date,
      COUNT(*) as invitations_received,
      COUNT(*) FILTER (WHERE status IN ('accepted', 'completed')) as invitations_accepted,
      COUNT(*) FILTER (WHERE status = 'completed') as reviews_completed,
      COUNT(*) FILTER (WHERE status = 'completed' AND completed_at <= due_date) as reviews_completed_on_time,
      AVG(EXTRACT(epoch FROM (completed_at - invited_at))/86400) FILTER (WHERE completed_at IS NOT NULL) as avg_review_time_days,
      calculate_avg_quality_score(reviewer_record.reviewer_id, 1) as avg_quality_score,
      CASE 
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND(
          (COUNT(*) FILTER (WHERE status IN ('accepted', 'completed'))::decimal / COUNT(*)::decimal) * 0.6 +
          (COUNT(*) FILTER (WHERE status = 'completed' AND completed_at <= due_date)::decimal / GREATEST(COUNT(*) FILTER (WHERE status = 'completed'), 1)::decimal) * 0.4,
          2
        )
      END as reliability_score
    FROM review_assignments
    WHERE reviewer_id = reviewer_record.reviewer_id
      AND invited_at >= start_date 
      AND invited_at <= end_date
    ON CONFLICT (reviewer_id, period_start, period_end) 
    DO UPDATE SET
      invitations_received = EXCLUDED.invitations_received,
      invitations_accepted = EXCLUDED.invitations_accepted,
      reviews_completed = EXCLUDED.reviews_completed,
      reviews_completed_on_time = EXCLUDED.reviews_completed_on_time,
      avg_review_time_days = EXCLUDED.avg_review_time_days,
      avg_quality_score = EXCLUDED.avg_quality_score,
      reliability_score = EXCLUDED.reliability_score,
      updated_at = TIMEZONE('utc', NOW());
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update current review load
CREATE OR REPLACE FUNCTION update_reviewer_load()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the reviewer's current load
  UPDATE profiles 
  SET current_review_load = calculate_current_review_load(NEW.reviewer_id)
  WHERE id = NEW.reviewer_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reviewer_load_trigger
  AFTER INSERT OR UPDATE OR DELETE ON review_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_reviewer_load();

-- Function to get reviewer recommendations with enhanced scoring
CREATE OR REPLACE FUNCTION get_enhanced_reviewer_recommendations(
  manuscript_id_param UUID,
  field_param TEXT,
  limit_param INTEGER DEFAULT 20
) RETURNS TABLE (
  reviewer_id UUID,
  full_name TEXT,
  email TEXT,
  affiliation TEXT,
  expertise TEXT[],
  h_index INTEGER,
  total_publications INTEGER,
  current_review_load INTEGER,
  avg_review_quality_score DECIMAL(3,2),
  response_rate DECIMAL(3,2),
  availability_score INTEGER,
  expertise_match_score INTEGER,
  overall_recommendation_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as reviewer_id,
    p.full_name,
    p.email,
    p.affiliation,
    p.expertise,
    p.h_index,
    p.total_publications,
    p.current_review_load,
    calculate_avg_quality_score(p.id) as avg_review_quality_score,
    calculate_response_rate(p.id) as response_rate,
    CASE 
      WHEN p.current_review_load = 0 THEN 100
      WHEN p.current_review_load = 1 THEN 80
      WHEN p.current_review_load = 2 THEN 60
      WHEN p.current_review_load >= 3 THEN 30
      ELSE 50
    END as availability_score,
    CASE 
      WHEN p.expertise && ARRAY[field_param] OR 
           EXISTS(SELECT 1 FROM unnest(p.expertise) AS exp WHERE exp ILIKE '%' || field_param || '%') THEN 90
      WHEN p.preferred_fields && ARRAY[field_param] THEN 70
      ELSE 30
    END as expertise_match_score,
    -- Overall recommendation score calculation
    (
      CASE 
        WHEN p.expertise && ARRAY[field_param] THEN 90
        WHEN p.preferred_fields && ARRAY[field_param] THEN 70
        ELSE 30
      END * 0.4 +
      CASE 
        WHEN p.current_review_load = 0 THEN 100
        WHEN p.current_review_load = 1 THEN 80
        WHEN p.current_review_load = 2 THEN 60
        ELSE 30
      END * 0.3 +
      COALESCE(p.h_index * 2, 20) * 0.2 +
      (COALESCE(calculate_response_rate(p.id), 0.5) * 100) * 0.1
    )::INTEGER as overall_recommendation_score
  FROM profiles p
  WHERE p.role = 'reviewer'
    AND p.availability_status = 'available'
    AND p.current_review_load < COALESCE(p.max_concurrent_reviews, 3)
  ORDER BY overall_recommendation_score DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_reviewer_performance_metrics_updated_at BEFORE UPDATE ON reviewer_performance_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviewer_availability_updated_at BEFORE UPDATE ON reviewer_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Initialize current review loads for existing reviewers
UPDATE profiles 
SET current_review_load = calculate_current_review_load(id)
WHERE role = 'reviewer';