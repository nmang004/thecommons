-- Additional tables for complete invitation system
-- Migration 020: Complete invitation and notification system

-- Create notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Create suggested_reviewers table for alternative reviewer suggestions
CREATE TABLE IF NOT EXISTS suggested_reviewers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  manuscript_id UUID NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
  suggested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  reviewer_email TEXT NOT NULL,
  reviewer_affiliation TEXT,
  expertise_areas TEXT,
  suggestion_reason TEXT,
  contacted BOOLEAN DEFAULT FALSE,
  contacted_at TIMESTAMP WITH TIME ZONE,
  response_received BOOLEAN DEFAULT FALSE,
  response_at TIMESTAMP WITH TIME ZONE,
  suggested_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for suggested_reviewers
CREATE INDEX idx_suggested_reviewers_manuscript_id ON suggested_reviewers(manuscript_id);
CREATE INDEX idx_suggested_reviewers_suggested_by ON suggested_reviewers(suggested_by);
CREATE INDEX idx_suggested_reviewers_email ON suggested_reviewers(reviewer_email);

-- Create manuscript_activity_log table for tracking activities
CREATE TABLE IF NOT EXISTS manuscript_activity_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  manuscript_id UUID NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for activity log
CREATE INDEX idx_manuscript_activity_log_manuscript_id ON manuscript_activity_log(manuscript_id);
CREATE INDEX idx_manuscript_activity_log_user_id ON manuscript_activity_log(user_id);
CREATE INDEX idx_manuscript_activity_log_activity_type ON manuscript_activity_log(activity_type);
CREATE INDEX idx_manuscript_activity_log_created_at ON manuscript_activity_log(created_at);

-- Enhance reviewer_invitations table with additional fields needed by the system
ALTER TABLE reviewer_invitations 
ADD COLUMN IF NOT EXISTS response_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS template_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS conflict_warnings TEXT[],
ADD COLUMN IF NOT EXISTS staggered BOOLEAN DEFAULT FALSE;

-- Enhance review_assignments table with invitation-related fields
ALTER TABLE review_assignments
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS expertise_rating INTEGER CHECK (expertise_rating >= 1 AND expertise_rating <= 5),
ADD COLUMN IF NOT EXISTS has_conflict BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS conflict_details JSONB;

-- Create indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_reviewer_invitations_template_id ON reviewer_invitations(template_id);
CREATE INDEX IF NOT EXISTS idx_reviewer_invitations_priority ON reviewer_invitations(priority);
CREATE INDEX IF NOT EXISTS idx_review_assignments_invited_at ON review_assignments(invited_at);
CREATE INDEX IF NOT EXISTS idx_review_assignments_accepted_at ON review_assignments(accepted_at);

-- Function to automatically mark notifications as read after 30 days
CREATE OR REPLACE FUNCTION auto_mark_old_notifications_read()
RETURNS void AS $$
BEGIN
  UPDATE notifications 
  SET is_read = TRUE, read_at = NOW()
  WHERE is_read = FALSE 
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old activity logs (keep 1 year)
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM manuscript_activity_log
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get reviewer workload for invitation balancing
CREATE OR REPLACE FUNCTION get_reviewer_workload(reviewer_id_param UUID)
RETURNS TABLE (
  current_invitations INTEGER,
  pending_reviews INTEGER,
  completed_last_month INTEGER,
  avg_response_time_days DECIMAL(5,2),
  workload_score INTEGER
) AS $$
DECLARE
  workload_score_calc INTEGER;
BEGIN
  -- Get current workload metrics
  SELECT 
    COUNT(*) FILTER (WHERE ri.invitation_status = 'pending') as current_invitations,
    COUNT(*) FILTER (WHERE ra.status IN ('accepted', 'in_progress')) as pending_reviews,
    COUNT(*) FILTER (WHERE r.submitted_at >= NOW() - INTERVAL '30 days' AND r.submitted_at IS NOT NULL) as completed_last_month,
    AVG(EXTRACT(epoch FROM (ri.responded_at - ri.created_at))/86400) FILTER (WHERE ri.responded_at IS NOT NULL) as avg_response_time_days
  INTO current_invitations, pending_reviews, completed_last_month, avg_response_time_days
  FROM profiles p
  LEFT JOIN reviewer_invitations ri ON p.id = ri.reviewer_id
  LEFT JOIN review_assignments ra ON p.id = ra.reviewer_id AND ra.status IN ('accepted', 'in_progress')  
  LEFT JOIN reviews r ON p.id = r.reviewer_id
  WHERE p.id = reviewer_id_param;

  -- Calculate workload score (0-100, lower is better availability)
  workload_score_calc := LEAST(100, 
    COALESCE(current_invitations, 0) * 15 + 
    COALESCE(pending_reviews, 0) * 25 +
    GREATEST(0, 3 - COALESCE(completed_last_month, 0)) * 10 +
    CASE 
      WHEN avg_response_time_days > 7 THEN 20
      WHEN avg_response_time_days > 3 THEN 10  
      ELSE 0 
    END
  );

  workload_score := workload_score_calc;
  
  RETURN QUERY
  SELECT current_invitations, pending_reviews, completed_last_month, 
         ROUND(avg_response_time_days, 2), workload_score;
END;
$$ LANGUAGE plpgsql;

-- Function to get invitation success rate for a template
CREATE OR REPLACE FUNCTION get_template_success_rate(template_id_param TEXT, days_back INTEGER DEFAULT 90)
RETURNS TABLE (
  total_sent INTEGER,
  accepted INTEGER,
  declined INTEGER,
  no_response INTEGER,
  acceptance_rate DECIMAL(5,4),
  response_rate DECIMAL(5,4),
  avg_response_time_hours DECIMAL(8,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_sent,
    COUNT(*) FILTER (WHERE ri.invitation_status = 'accepted')::INTEGER as accepted,
    COUNT(*) FILTER (WHERE ri.invitation_status = 'declined')::INTEGER as declined,
    COUNT(*) FILTER (WHERE ri.invitation_status = 'pending')::INTEGER as no_response,
    CASE WHEN COUNT(*) > 0 THEN 
      ROUND(COUNT(*) FILTER (WHERE ri.invitation_status = 'accepted')::decimal / COUNT(*)::decimal, 4)
    ELSE 0 END as acceptance_rate,
    CASE WHEN COUNT(*) > 0 THEN
      ROUND((COUNT(*) FILTER (WHERE ri.invitation_status IN ('accepted', 'declined')))::decimal / COUNT(*)::decimal, 4)
    ELSE 0 END as response_rate,
    ROUND(AVG(EXTRACT(epoch FROM (ri.responded_at - ri.created_at))/3600) FILTER (WHERE ri.responded_at IS NOT NULL), 2) as avg_response_time_hours
  FROM reviewer_invitations ri
  WHERE ri.template_id = template_id_param
    AND ri.created_at >= NOW() - INTERVAL '1 day' * days_back;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update manuscript activity when invitations are created
CREATE OR REPLACE FUNCTION log_invitation_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO manuscript_activity_log (
    manuscript_id,
    user_id,
    activity_type,
    details,
    created_at
  ) VALUES (
    NEW.manuscript_id,
    NEW.invited_by,
    'reviewer_invitation_sent',
    jsonb_build_object(
      'reviewer_id', NEW.reviewer_id,
      'invitation_status', NEW.invitation_status,
      'template_id', NEW.template_id,
      'priority', NEW.priority
    ),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_invitation_activity_trigger
  AFTER INSERT ON reviewer_invitations
  FOR EACH ROW
  EXECUTE FUNCTION log_invitation_activity();

-- Trigger to log invitation status changes
CREATE OR REPLACE FUNCTION log_invitation_response()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log when status changes from pending to accepted/declined
  IF OLD.invitation_status = 'pending' AND NEW.invitation_status IN ('accepted', 'declined') THEN
    INSERT INTO manuscript_activity_log (
      manuscript_id,
      user_id,
      activity_type,
      details,
      created_at
    ) VALUES (
      NEW.manuscript_id,
      NEW.reviewer_id,
      'reviewer_invitation_' || NEW.invitation_status,
      jsonb_build_object(
        'invitation_id', NEW.id,
        'response_time_hours', EXTRACT(epoch FROM (NEW.responded_at - NEW.created_at))/3600,
        'decline_reason', NEW.decline_reason,
        'expertise_rating', (NEW.response_metadata->>'expertiseRating')::integer
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_invitation_response_trigger
  AFTER UPDATE ON reviewer_invitations
  FOR EACH ROW
  EXECUTE FUNCTION log_invitation_response();

-- Create updated_at triggers for new tables
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default notification cleanup job (if job scheduler exists)
-- This would typically be handled by a cron job or scheduled task

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON suggested_reviewers TO authenticated;
GRANT SELECT, INSERT ON manuscript_activity_log TO authenticated;

-- RLS policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for suggested_reviewers
ALTER TABLE suggested_reviewers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Editors can view suggested reviewers for their manuscripts" ON suggested_reviewers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM manuscripts m 
      WHERE m.id = manuscript_id 
      AND m.assigned_editor = auth.uid()
    ) OR
    suggested_by = auth.uid()
  );

CREATE POLICY "Users can suggest reviewers" ON suggested_reviewers
  FOR INSERT WITH CHECK (suggested_by = auth.uid());

-- RLS policies for activity log
ALTER TABLE manuscript_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activity for manuscripts they have access to" ON manuscript_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM manuscripts m 
      WHERE m.id = manuscript_id 
      AND (m.assigned_editor = auth.uid() OR m.author_id = auth.uid())
    ) OR
    user_id = auth.uid()
  );

CREATE POLICY "System can insert activity logs" ON manuscript_activity_log
  FOR INSERT WITH CHECK (true);