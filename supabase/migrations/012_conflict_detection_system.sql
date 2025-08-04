-- Enhanced Conflict of Interest Detection System
-- Migration 012: COI Detection Infrastructure

-- Create conflict types enum
CREATE TYPE conflict_type AS ENUM (
  'institutional_current',
  'institutional_recent', 
  'coauthorship_recent',
  'coauthorship_frequent',
  'advisor_advisee',
  'family_personal',
  'financial_competing',
  'financial_collaboration',
  'editorial_relationship',
  'custom'
);

-- Create conflict severity enum  
CREATE TYPE conflict_severity AS ENUM ('low', 'medium', 'high', 'blocking');

-- Reviewer conflicts table - persistent conflict records
CREATE TABLE reviewer_conflicts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  conflicted_with_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  conflict_type conflict_type NOT NULL,
  severity conflict_severity NOT NULL,
  description TEXT,
  evidence JSONB, -- Store supporting data like publication IDs, dates, etc.
  detected_automatically BOOLEAN DEFAULT FALSE,
  reported_by UUID REFERENCES profiles(id), -- Who reported/detected this conflict
  status TEXT DEFAULT 'active', -- active, resolved, disputed
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  valid_until TIMESTAMP WITH TIME ZONE, -- For time-limited conflicts
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Prevent duplicate conflicts
  UNIQUE(reviewer_id, conflicted_with_id, conflict_type)
);

-- Institutional affiliations history - track affiliation changes for COI detection
CREATE TABLE institutional_affiliations_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  institution_name TEXT NOT NULL,
  department TEXT,
  position_title TEXT,
  start_date DATE,
  end_date DATE, -- NULL means current
  is_primary BOOLEAN DEFAULT TRUE,
  source TEXT, -- 'manual', 'orcid', 'crossref', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Collaboration networks - track academic relationships
CREATE TABLE collaboration_networks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  person_a_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  person_b_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  relationship_type TEXT NOT NULL, -- 'coauthor', 'advisor-advisee', 'collaborator'
  collaboration_count INTEGER DEFAULT 1,
  first_collaboration_date DATE,
  last_collaboration_date DATE,
  publications JSONB, -- Array of publication identifiers/DOIs
  confidence_score DECIMAL(3,2) DEFAULT 1.0, -- 0.0 to 1.0
  source TEXT, -- How this relationship was detected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Prevent duplicate relationships (ensure person_a_id < person_b_id)
  CHECK (person_a_id < person_b_id),
  UNIQUE(person_a_id, person_b_id, relationship_type)
);

-- COI detection rules configuration
CREATE TABLE coi_detection_rules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  rule_name TEXT NOT NULL UNIQUE,
  rule_type conflict_type NOT NULL,
  severity conflict_severity NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  parameters JSONB NOT NULL, -- Rule-specific configuration
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for performance
CREATE INDEX idx_reviewer_conflicts_reviewer ON reviewer_conflicts(reviewer_id);
CREATE INDEX idx_reviewer_conflicts_conflicted_with ON reviewer_conflicts(conflicted_with_id);
CREATE INDEX idx_reviewer_conflicts_type ON reviewer_conflicts(conflict_type);
CREATE INDEX idx_reviewer_conflicts_status ON reviewer_conflicts(status);

CREATE INDEX idx_affiliations_profile ON institutional_affiliations_history(profile_id);
CREATE INDEX idx_affiliations_institution ON institutional_affiliations_history(institution_name);
CREATE INDEX idx_affiliations_dates ON institutional_affiliations_history(start_date, end_date);

CREATE INDEX idx_collaborations_person_a ON collaboration_networks(person_a_id);
CREATE INDEX idx_collaborations_person_b ON collaboration_networks(person_b_id);
CREATE INDEX idx_collaborations_type ON collaboration_networks(relationship_type);
CREATE INDEX idx_collaborations_dates ON collaboration_networks(last_collaboration_date);

-- Insert default COI detection rules
INSERT INTO coi_detection_rules (rule_name, rule_type, severity, parameters, description) VALUES
('Same Current Institution', 'institutional_current', 'high', 
 '{"lookback_years": 0, "include_departments": true}', 
 'Flag reviewers from the same current institution as authors'),

('Recent Institution Overlap', 'institutional_recent', 'medium',
 '{"lookback_years": 3, "overlap_months": 6}',
 'Flag reviewers who shared an institution with authors in the last 3 years'),

('Recent Co-authorship', 'coauthorship_recent', 'blocking',
 '{"lookback_years": 5, "min_publications": 1}',
 'Block reviewers who co-authored with authors in the last 5 years'),

('Frequent Collaboration', 'coauthorship_frequent', 'high',
 '{"lookback_years": 10, "min_publications": 3}',
 'Flag reviewers with 3+ co-authorships with authors in last 10 years'),

('Advisor-Advisee Relationship', 'advisor_advisee', 'blocking',
 '{"permanent": true}',
 'Block reviewer-author advisor-advisee relationships (permanent)'),

('Financial Competing Interests', 'financial_competing', 'medium',
 '{"lookback_years": 2}',
 'Flag potential financial conflicts of interest');

-- Add COI tracking fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coi_declarations JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coi_last_updated TIMESTAMP WITH TIME ZONE;

-- Add COI check tracking to review assignments
ALTER TABLE review_assignments ADD COLUMN IF NOT EXISTS coi_checked_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE review_assignments ADD COLUMN IF NOT EXISTS coi_flags JSONB;
ALTER TABLE review_assignments ADD COLUMN IF NOT EXISTS coi_override_reason TEXT;
ALTER TABLE review_assignments ADD COLUMN IF NOT EXISTS coi_approved_by UUID REFERENCES profiles(id);

-- Create updated_at trigger for new tables
CREATE TRIGGER update_reviewer_conflicts_updated_at BEFORE UPDATE ON reviewer_conflicts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collaboration_networks_updated_at BEFORE UPDATE ON collaboration_networks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coi_detection_rules_updated_at BEFORE UPDATE ON coi_detection_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to detect institutional conflicts
CREATE OR REPLACE FUNCTION detect_institutional_conflicts(
  reviewer_id_param UUID,
  author_ids_param UUID[]
) RETURNS TABLE (
  author_id UUID,
  conflict_type conflict_type,
  severity conflict_severity,
  description TEXT,
  evidence JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH reviewer_affiliations AS (
    SELECT 
      institution_name,
      department,
      start_date,
      end_date
    FROM institutional_affiliations_history
    WHERE profile_id = reviewer_id_param
      AND (end_date IS NULL OR end_date >= CURRENT_DATE - INTERVAL '3 years')
  ),
  author_affiliations AS (
    SELECT 
      iah.profile_id as author_id,
      iah.institution_name,
      iah.department,
      iah.start_date,
      iah.end_date
    FROM institutional_affiliations_history iah
    WHERE iah.profile_id = ANY(author_ids_param)
      AND (iah.end_date IS NULL OR iah.end_date >= CURRENT_DATE - INTERVAL '3 years')
  )
  SELECT 
    aa.author_id,
    CASE 
      WHEN ra.end_date IS NULL AND aa.end_date IS NULL THEN 'institutional_current'::conflict_type
      ELSE 'institutional_recent'::conflict_type
    END,
    CASE
      WHEN ra.end_date IS NULL AND aa.end_date IS NULL AND ra.institution_name = aa.institution_name THEN 'high'::conflict_severity
      WHEN ra.institution_name = aa.institution_name THEN 'medium'::conflict_severity
      ELSE 'low'::conflict_severity
    END,
    CASE
      WHEN ra.end_date IS NULL AND aa.end_date IS NULL THEN 
        'Current institutional affiliation: ' || ra.institution_name
      ELSE 
        'Recent institutional overlap: ' || ra.institution_name
    END,
    jsonb_build_object(
      'reviewer_institution', ra.institution_name,
      'author_institution', aa.institution_name,
      'reviewer_department', ra.department,
      'author_department', aa.department,
      'overlap_type', CASE WHEN ra.end_date IS NULL AND aa.end_date IS NULL THEN 'current' ELSE 'recent' END
    )
  FROM reviewer_affiliations ra
  JOIN author_affiliations aa ON ra.institution_name ILIKE aa.institution_name;
END;
$$ LANGUAGE plpgsql;

-- Function to detect collaboration conflicts
CREATE OR REPLACE FUNCTION detect_collaboration_conflicts(
  reviewer_id_param UUID,
  author_ids_param UUID[]
) RETURNS TABLE (
  author_id UUID,
  conflict_type conflict_type,
  severity conflict_severity,
  description TEXT,
  evidence JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN cn.person_a_id = reviewer_id_param THEN cn.person_b_id
      ELSE cn.person_a_id
    END as author_id,
    CASE
      WHEN cn.last_collaboration_date >= CURRENT_DATE - INTERVAL '5 years' THEN 'coauthorship_recent'::conflict_type
      WHEN cn.collaboration_count >= 3 THEN 'coauthorship_frequent'::conflict_type
      ELSE 'coauthorship_recent'::conflict_type
    END,
    CASE
      WHEN cn.last_collaboration_date >= CURRENT_DATE - INTERVAL '2 years' THEN 'blocking'::conflict_severity
      WHEN cn.last_collaboration_date >= CURRENT_DATE - INTERVAL '5 years' THEN 'high'::conflict_severity
      WHEN cn.collaboration_count >= 5 THEN 'high'::conflict_severity
      ELSE 'medium'::conflict_severity
    END,
    'Co-authorship history: ' || cn.collaboration_count || ' publications, last in ' || EXTRACT(YEAR FROM cn.last_collaboration_date),
    jsonb_build_object(
      'collaboration_count', cn.collaboration_count,
      'first_collaboration', cn.first_collaboration_date,
      'last_collaboration', cn.last_collaboration_date,
      'relationship_type', cn.relationship_type,
      'confidence_score', cn.confidence_score
    )
  FROM collaboration_networks cn
  WHERE (
    (cn.person_a_id = reviewer_id_param AND cn.person_b_id = ANY(author_ids_param))
    OR 
    (cn.person_b_id = reviewer_id_param AND cn.person_a_id = ANY(author_ids_param))
  )
  AND cn.last_collaboration_date >= CURRENT_DATE - INTERVAL '10 years';
END;
$$ LANGUAGE plpgsql;

-- Comprehensive COI check function
CREATE OR REPLACE FUNCTION check_reviewer_conflicts(
  reviewer_id_param UUID,
  manuscript_id_param UUID
) RETURNS TABLE (
  conflict_id UUID,
  author_id UUID,
  author_name TEXT,
  conflict_type conflict_type,
  severity conflict_severity,
  description TEXT,
  evidence JSONB,
  is_blocking BOOLEAN
) AS $$
DECLARE
  author_ids_array UUID[];
BEGIN
  -- Get all authors for the manuscript
  SELECT ARRAY(
    SELECT DISTINCT unnest(ARRAY[m.author_id, m.corresponding_author_id] || 
           COALESCE(ARRAY_AGG(mca.profile_id), ARRAY[]::UUID[]))
    FROM manuscripts m
    LEFT JOIN manuscript_coauthors mca ON m.id = mca.manuscript_id
    LEFT JOIN profiles p ON mca.email = p.email
    WHERE m.id = manuscript_id_param
  ) INTO author_ids_array;

  -- Return all detected conflicts
  RETURN QUERY
  WITH all_conflicts AS (
    -- Institutional conflicts
    SELECT 
      gen_random_uuid() as conflict_id,
      ic.author_id,
      ic.conflict_type,
      ic.severity,
      ic.description,
      ic.evidence
    FROM detect_institutional_conflicts(reviewer_id_param, author_ids_array) ic
    
    UNION ALL
    
    -- Collaboration conflicts  
    SELECT 
      gen_random_uuid() as conflict_id,
      cc.author_id,
      cc.conflict_type,
      cc.severity,
      cc.description,
      cc.evidence
    FROM detect_collaboration_conflicts(reviewer_id_param, author_ids_array) cc
    
    UNION ALL
    
    -- Existing manual conflicts
    SELECT 
      rc.id as conflict_id,
      rc.conflicted_with_id as author_id,
      rc.conflict_type,
      rc.severity,
      rc.description,
      rc.evidence
    FROM reviewer_conflicts rc
    WHERE rc.reviewer_id = reviewer_id_param 
      AND rc.conflicted_with_id = ANY(author_ids_array)
      AND rc.status = 'active'
      AND (rc.valid_until IS NULL OR rc.valid_until > CURRENT_TIMESTAMP)
  )
  SELECT 
    ac.conflict_id,
    ac.author_id,
    p.full_name as author_name,
    ac.conflict_type,
    ac.severity,
    ac.description,
    ac.evidence,
    ac.severity = 'blocking'::conflict_severity as is_blocking
  FROM all_conflicts ac
  LEFT JOIN profiles p ON ac.author_id = p.id
  ORDER BY 
    CASE ac.severity 
      WHEN 'blocking' THEN 1
      WHEN 'high' THEN 2  
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
    END,
    ac.conflict_type;
END;
$$ LANGUAGE plpgsql;