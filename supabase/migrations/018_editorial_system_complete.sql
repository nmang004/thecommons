-- Complete Editorial System Implementation
-- This migration adds the missing tables for full editorial workflow support

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- EDITORIAL ASSIGNMENTS TABLE
-- ============================================
-- Tracks the relationship between editors and manuscripts
CREATE TABLE IF NOT EXISTS editorial_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  manuscript_id UUID NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
  editor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  assigned_by UUID REFERENCES profiles(id),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'reassigned', 'declined')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  workload_score INTEGER DEFAULT 1 CHECK (workload_score > 0),
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  reassigned_to UUID REFERENCES profiles(id),
  reassigned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for fast lookups
CREATE INDEX idx_editorial_assignments_manuscript_id ON editorial_assignments(manuscript_id);
CREATE INDEX idx_editorial_assignments_editor_id ON editorial_assignments(editor_id);
CREATE INDEX idx_editorial_assignments_status ON editorial_assignments(status);
CREATE INDEX idx_editorial_assignments_priority ON editorial_assignments(priority);
CREATE INDEX idx_editorial_assignments_assigned_at ON editorial_assignments(assigned_at DESC);
CREATE INDEX idx_editorial_assignments_composite ON editorial_assignments(editor_id, status, priority);

-- Prevent duplicate active assignments
CREATE UNIQUE INDEX idx_editorial_assignments_unique_active 
  ON editorial_assignments(manuscript_id, editor_id) 
  WHERE status = 'active';

-- ============================================
-- EDITORIAL WORKLOAD TABLE
-- ============================================
-- Denormalized table for high-performance workload calculations
CREATE TABLE IF NOT EXISTS editorial_workload (
  editor_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  active_manuscripts INTEGER DEFAULT 0 CHECK (active_manuscripts >= 0),
  capacity_limit INTEGER DEFAULT 10 CHECK (capacity_limit > 0),
  current_workload_score INTEGER DEFAULT 0 CHECK (current_workload_score >= 0),
  average_decision_time INTERVAL,
  last_assignment TIMESTAMP WITH TIME ZONE,
  last_completed TIMESTAMP WITH TIME ZONE,
  availability_status VARCHAR(50) DEFAULT 'available' 
    CHECK (availability_status IN ('available', 'busy', 'unavailable', 'on_leave')),
  specializations TEXT[],
  performance_score DECIMAL(3,2) CHECK (performance_score >= 0 AND performance_score <= 5),
  total_manuscripts_handled INTEGER DEFAULT 0,
  manuscripts_this_month INTEGER DEFAULT 0,
  manuscripts_this_week INTEGER DEFAULT 0,
  average_turnaround_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for workload queries
CREATE INDEX idx_editorial_workload_availability ON editorial_workload(availability_status);
CREATE INDEX idx_editorial_workload_capacity ON editorial_workload(active_manuscripts, capacity_limit);
CREATE INDEX idx_editorial_workload_performance ON editorial_workload(performance_score DESC);

-- ============================================
-- DECISION TEMPLATES TABLE (Extended)
-- ============================================
-- This extends the existing editorial_templates with more specific fields
CREATE TABLE IF NOT EXISTS decision_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  decision_type VARCHAR(50) NOT NULL 
    CHECK (decision_type IN ('accept', 'reject', 'major_revision', 'minor_revision', 'desk_reject')),
  subject_template TEXT,
  body_template TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  placeholders TEXT[] DEFAULT ARRAY['{{author_name}}', '{{manuscript_title}}', '{{editor_name}}', '{{submission_date}}'],
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for template queries
CREATE INDEX idx_decision_templates_decision_type ON decision_templates(decision_type);
CREATE INDEX idx_decision_templates_is_default ON decision_templates(is_default) WHERE is_default = TRUE;
CREATE INDEX idx_decision_templates_is_active ON decision_templates(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_decision_templates_created_by ON decision_templates(created_by);

-- Ensure only one default template per decision type
CREATE UNIQUE INDEX idx_decision_templates_unique_default 
  ON decision_templates(decision_type) 
  WHERE is_default = TRUE;

-- ============================================
-- REVIEWER INVITATIONS TABLE (Enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS reviewer_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  manuscript_id UUID NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  invited_by UUID NOT NULL REFERENCES profiles(id),
  invitation_status VARCHAR(50) DEFAULT 'pending'
    CHECK (invitation_status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  custom_message TEXT,
  review_deadline DATE,
  response_deadline DATE,
  responded_at TIMESTAMP WITH TIME ZONE,
  reminder_count INTEGER DEFAULT 0,
  last_reminder_sent TIMESTAMP WITH TIME ZONE,
  decline_reason TEXT,
  suggested_alternative UUID REFERENCES profiles(id),
  invitation_token UUID DEFAULT uuid_generate_v4() UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for invitation queries
CREATE INDEX idx_reviewer_invitations_manuscript_id ON reviewer_invitations(manuscript_id);
CREATE INDEX idx_reviewer_invitations_reviewer_id ON reviewer_invitations(reviewer_id);
CREATE INDEX idx_reviewer_invitations_status ON reviewer_invitations(invitation_status);
CREATE INDEX idx_reviewer_invitations_deadline ON reviewer_invitations(review_deadline);
CREATE INDEX idx_reviewer_invitations_token ON reviewer_invitations(invitation_token);

-- Prevent duplicate pending invitations
CREATE UNIQUE INDEX idx_reviewer_invitations_unique_pending 
  ON reviewer_invitations(manuscript_id, reviewer_id) 
  WHERE invitation_status = 'pending';

-- ============================================
-- EDITORIAL ANALYTICS CACHE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS editorial_analytics_cache (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  metric_type VARCHAR(100) NOT NULL,
  metric_data JSONB NOT NULL,
  date_range_start DATE,
  date_range_end DATE,
  filters JSONB DEFAULT '{}',
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for analytics cache
CREATE INDEX idx_editorial_analytics_cache_type ON editorial_analytics_cache(metric_type);
CREATE INDEX idx_editorial_analytics_cache_dates ON editorial_analytics_cache(date_range_start, date_range_end);
CREATE INDEX idx_editorial_analytics_cache_expires ON editorial_analytics_cache(expires_at);

-- ============================================
-- TRIGGER FUNCTIONS
-- ============================================

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to new tables
CREATE TRIGGER update_editorial_assignments_updated_at
    BEFORE UPDATE ON editorial_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_editorial_workload_updated_at
    BEFORE UPDATE ON editorial_workload
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_decision_templates_updated_at
    BEFORE UPDATE ON decision_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviewer_invitations_updated_at
    BEFORE UPDATE ON reviewer_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- WORKLOAD CALCULATION FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION calculate_editor_workload(p_editor_id UUID)
RETURNS TABLE (
  active_count INTEGER,
  workload_score INTEGER,
  capacity_remaining INTEGER,
  is_available BOOLEAN
) AS $$
DECLARE
  v_active_count INTEGER;
  v_workload_score INTEGER;
  v_capacity_limit INTEGER;
BEGIN
  -- Get active manuscript count and workload score
  SELECT 
    COUNT(*),
    COALESCE(SUM(workload_score), 0)
  INTO v_active_count, v_workload_score
  FROM editorial_assignments
  WHERE editor_id = p_editor_id
    AND status = 'active';

  -- Get capacity limit
  SELECT capacity_limit
  INTO v_capacity_limit
  FROM editorial_workload
  WHERE editor_id = p_editor_id;

  -- Default capacity if not set
  IF v_capacity_limit IS NULL THEN
    v_capacity_limit := 10;
  END IF;

  RETURN QUERY
  SELECT 
    v_active_count,
    v_workload_score,
    v_capacity_limit - v_workload_score,
    v_workload_score < v_capacity_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- AUTO-UPDATE WORKLOAD TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_editor_workload()
RETURNS TRIGGER AS $$
BEGIN
  -- Update workload when assignment changes
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status != OLD.status) THEN
    -- Ensure workload record exists
    INSERT INTO editorial_workload (editor_id)
    VALUES (NEW.editor_id)
    ON CONFLICT (editor_id) DO NOTHING;

    -- Update workload metrics
    UPDATE editorial_workload
    SET 
      active_manuscripts = (
        SELECT COUNT(*)
        FROM editorial_assignments
        WHERE editor_id = NEW.editor_id
          AND status = 'active'
      ),
      current_workload_score = (
        SELECT COALESCE(SUM(workload_score), 0)
        FROM editorial_assignments
        WHERE editor_id = NEW.editor_id
          AND status = 'active'
      ),
      last_assignment = CASE 
        WHEN NEW.status = 'active' THEN TIMEZONE('utc', NOW())
        ELSE last_assignment
      END,
      last_completed = CASE 
        WHEN NEW.status = 'completed' THEN TIMEZONE('utc', NOW())
        ELSE last_completed
      END,
      manuscripts_this_month = (
        SELECT COUNT(*)
        FROM editorial_assignments
        WHERE editor_id = NEW.editor_id
          AND assigned_at >= date_trunc('month', CURRENT_DATE)
      ),
      manuscripts_this_week = (
        SELECT COUNT(*)
        FROM editorial_assignments
        WHERE editor_id = NEW.editor_id
          AND assigned_at >= date_trunc('week', CURRENT_DATE)
      )
    WHERE editor_id = NEW.editor_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_editor_workload
    AFTER INSERT OR UPDATE ON editorial_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_editor_workload();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE editorial_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE editorial_workload ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewer_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE editorial_analytics_cache ENABLE ROW LEVEL SECURITY;

-- Editorial Assignments Policies
CREATE POLICY "Editors can view all assignments"
  ON editorial_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('editor', 'admin')
    )
  );

CREATE POLICY "Editors can create assignments"
  ON editorial_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('editor', 'admin')
    )
  );

CREATE POLICY "Editors can update their assignments"
  ON editorial_assignments FOR UPDATE
  USING (
    editor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Editorial Workload Policies
CREATE POLICY "Editors can view all workloads"
  ON editorial_workload FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('editor', 'admin')
    )
  );

CREATE POLICY "System can manage workload"
  ON editorial_workload FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('editor', 'admin')
    )
  );

-- Decision Templates Policies
CREATE POLICY "All editors can view templates"
  ON decision_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('editor', 'admin')
    )
  );

CREATE POLICY "Editors can create templates"
  ON decision_templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('editor', 'admin')
    )
  );

CREATE POLICY "Template creators can update their templates"
  ON decision_templates FOR UPDATE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Reviewer Invitations Policies
CREATE POLICY "Editors can view invitations"
  ON reviewer_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('editor', 'admin', 'reviewer')
    )
  );

CREATE POLICY "Editors can create invitations"
  ON reviewer_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('editor', 'admin')
    )
  );

CREATE POLICY "Editors can update invitations"
  ON reviewer_invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('editor', 'admin')
    )
  );

-- Analytics Cache Policies
CREATE POLICY "Editors can view analytics"
  ON editorial_analytics_cache FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('editor', 'admin')
    )
  );

CREATE POLICY "System can manage analytics cache"
  ON editorial_analytics_cache FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ============================================
-- INSERT DEFAULT DECISION TEMPLATES
-- ============================================
INSERT INTO decision_templates (
  name, 
  decision_type, 
  subject_template,
  body_template, 
  variables,
  is_default
) VALUES 
(
  'Standard Acceptance',
  'accept',
  'Manuscript Accepted: {{manuscript_title}}',
  'Dear {{author_name}},

I am pleased to inform you that your manuscript "{{manuscript_title}}" (ID: {{submission_id}}) has been accepted for publication in our journal.

The reviewers and editorial board found your work to be a valuable contribution to the field. Your manuscript will now proceed to the production stage.

Next Steps:
1. You will receive copyediting queries within 2-3 weeks
2. Page proofs will be sent for your review
3. Expected publication date: {{publication_date}}

Congratulations on this achievement!

Best regards,
{{editor_name}}
{{editor_title}}',
  '{"author_name": "", "manuscript_title": "", "submission_id": "", "publication_date": "", "editor_name": "", "editor_title": ""}',
  true
),
(
  'Major Revision Request',
  'major_revision',
  'Major Revisions Required: {{manuscript_title}}',
  'Dear {{author_name}},

Thank you for submitting your manuscript "{{manuscript_title}}" to our journal. After careful peer review, we have determined that your manuscript requires major revisions before it can be considered for publication.

The reviewers have identified several areas that need substantial improvement:

{{revision_points}}

Please address all reviewer comments in detail and provide a point-by-point response letter with your revised submission.

Deadline for resubmission: {{deadline_date}} ({{days_given}} days from today)

If you need an extension, please contact us before the deadline.

Best regards,
{{editor_name}}
{{editor_title}}',
  '{"author_name": "", "manuscript_title": "", "revision_points": "", "deadline_date": "", "days_given": "60", "editor_name": "", "editor_title": ""}',
  true
),
(
  'Standard Rejection',
  'reject',
  'Editorial Decision: {{manuscript_title}}',
  'Dear {{author_name}},

Thank you for submitting your manuscript "{{manuscript_title}}" to our journal. After careful consideration and peer review, I regret to inform you that we are unable to accept your manuscript for publication.

The decision was based on the following factors:
{{rejection_reasons}}

While your manuscript is not suitable for our journal at this time, we encourage you to consider the reviewers'' feedback for future submissions to other venues.

We appreciate your interest in our journal and wish you success with your future research.

Best regards,
{{editor_name}}
{{editor_title}}',
  '{"author_name": "", "manuscript_title": "", "rejection_reasons": "", "editor_name": "", "editor_title": ""}',
  true
);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE editorial_assignments IS 'Tracks editor-manuscript assignments with workload and priority management';
COMMENT ON TABLE editorial_workload IS 'Denormalized workload metrics for efficient editor capacity management';
COMMENT ON TABLE decision_templates IS 'Reusable templates for editorial decision communications';
COMMENT ON TABLE reviewer_invitations IS 'Manages reviewer invitation workflow and tracking';
COMMENT ON TABLE editorial_analytics_cache IS 'Cached analytics data for dashboard performance';

COMMENT ON FUNCTION calculate_editor_workload IS 'Calculates real-time workload metrics for an editor';
COMMENT ON FUNCTION update_editor_workload IS 'Automatically updates workload metrics when assignments change';