-- User Feedback System for The Commons
-- This migration creates the infrastructure for collecting and managing user feedback

-- Create feedback types and statuses
CREATE TYPE feedback_type AS ENUM ('bug', 'feature', 'improvement', 'general', 'academic');
CREATE TYPE feedback_category AS ENUM ('submission', 'review', 'editorial', 'ui_ux', 'performance', 'other');
CREATE TYPE feedback_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE feedback_status AS ENUM ('open', 'in_progress', 'resolved', 'closed', 'duplicate');

-- User feedback table
CREATE TABLE user_feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type feedback_type NOT NULL,
  category feedback_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity feedback_severity DEFAULT 'medium',
  status feedback_status DEFAULT 'open',
  assigned_to TEXT, -- Team assignment (technical_team, editorial_team, etc.)
  metadata JSONB DEFAULT '{}', -- Flexible field for additional data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT
);

-- Feedback responses/comments table
CREATE TABLE feedback_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  feedback_id UUID REFERENCES user_feedback(id) ON DELETE CASCADE NOT NULL,
  responder_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  response_text TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE, -- Internal team notes vs public responses
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Feedback attachments table (for screenshots, files, etc.)
CREATE TABLE feedback_attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  feedback_id UUID REFERENCES user_feedback(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Community feedback voting table (for feature requests, etc.)
CREATE TABLE feedback_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  feedback_id UUID REFERENCES user_feedback(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  vote_type TEXT CHECK (vote_type IN ('upvote', 'downvote')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(feedback_id, user_id)
);

-- Beta user invitations table
CREATE TABLE beta_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  institution TEXT,
  field_of_study TEXT,
  role TEXT,
  invitation_code TEXT UNIQUE NOT NULL,
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  accepted_at TIMESTAMP WITH TIME ZONE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS on all feedback tables
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_feedback
CREATE POLICY "Users can submit feedback"
ON user_feedback FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' OR auth.role() = 'anon'
);

CREATE POLICY "Users can view their own feedback"
ON user_feedback FOR SELECT
USING (
  user_id = auth.uid() OR 
  auth.role() = 'anon' OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'editor')
  )
);

CREATE POLICY "Admins and editors can manage all feedback"
ON user_feedback FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'editor')
  )
);

-- RLS Policies for feedback_responses
CREATE POLICY "Users can view responses to their feedback"
ON feedback_responses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_feedback 
    WHERE id = feedback_responses.feedback_id 
    AND user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'editor')
  )
);

CREATE POLICY "Admins and editors can create responses"
ON feedback_responses FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'editor')
  )
);

-- RLS Policies for feedback_votes
CREATE POLICY "Users can vote on public feedback"
ON feedback_votes FOR ALL
USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM user_feedback 
    WHERE id = feedback_votes.feedback_id 
    AND type IN ('feature', 'improvement')
  )
);

-- RLS Policies for beta_invitations
CREATE POLICY "Public can view beta invitation by code"
ON beta_invitations FOR SELECT
USING (true);

CREATE POLICY "Admins can manage beta invitations"
ON beta_invitations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Indexes for performance
CREATE INDEX idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX idx_user_feedback_status ON user_feedback(status);
CREATE INDEX idx_user_feedback_type_category ON user_feedback(type, category);
CREATE INDEX idx_user_feedback_severity ON user_feedback(severity);
CREATE INDEX idx_user_feedback_created_at ON user_feedback(created_at);
CREATE INDEX idx_feedback_responses_feedback_id ON feedback_responses(feedback_id);
CREATE INDEX idx_feedback_votes_feedback_id ON feedback_votes(feedback_id);
CREATE INDEX idx_beta_invitations_code ON beta_invitations(invitation_code);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update timestamp trigger
CREATE TRIGGER update_user_feedback_updated_at 
  BEFORE UPDATE ON user_feedback 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get feedback statistics
CREATE OR REPLACE FUNCTION get_feedback_stats(days_back INTEGER DEFAULT 30)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  start_date timestamp;
BEGIN
  start_date := NOW() - (days_back || ' days')::interval;
  
  SELECT jsonb_build_object(
    'total_feedback', COUNT(*),
    'by_type', jsonb_object_agg(type, type_count),
    'by_status', jsonb_object_agg(status, status_count),
    'by_severity', jsonb_object_agg(severity, severity_count),
    'resolved_count', SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END),
    'avg_resolution_time_hours', AVG(
      CASE 
        WHEN resolved_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600 
        ELSE NULL 
      END
    )
  ) INTO result
  FROM (
    SELECT 
      type,
      status,
      severity,
      resolved_at,
      created_at,
      COUNT(*) OVER (PARTITION BY type) as type_count,
      COUNT(*) OVER (PARTITION BY status) as status_count,
      COUNT(*) OVER (PARTITION BY severity) as severity_count
    FROM user_feedback
    WHERE created_at >= start_date
  ) stats;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-assign feedback based on category
CREATE OR REPLACE FUNCTION auto_assign_feedback()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-assign based on category
  NEW.assigned_to := CASE NEW.category
    WHEN 'submission' THEN 'technical_team'
    WHEN 'review' THEN 'editorial_team'
    WHEN 'editorial' THEN 'editorial_team'
    WHEN 'ui_ux' THEN 'design_team'
    WHEN 'performance' THEN 'technical_team'
    ELSE 'general_team'
  END;
  
  -- Auto-escalate critical and high severity issues
  IF NEW.severity IN ('critical', 'high') THEN
    -- Insert notification for immediate attention
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT 
      p.id,
      'urgent_feedback',
      'Urgent Feedback: ' || NEW.title,
      'A ' || NEW.severity || ' severity ' || NEW.type || ' has been submitted.',
      jsonb_build_object(
        'feedback_id', NEW.id,
        'severity', NEW.severity,
        'category', NEW.category
      )
    FROM profiles p
    WHERE p.role = 'admin';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-assignment
CREATE TRIGGER auto_assign_feedback_trigger
  BEFORE INSERT ON user_feedback
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_feedback();

-- Function to generate beta invitation codes
CREATE OR REPLACE FUNCTION generate_beta_invitation(
  p_email TEXT,
  p_institution TEXT DEFAULT NULL,
  p_field_of_study TEXT DEFAULT NULL,
  p_invited_by UUID DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  invitation_code TEXT;
BEGIN
  -- Generate unique invitation code
  invitation_code := 'BETA-' || upper(substring(md5(random()::text), 1, 8));
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM beta_invitations WHERE invitation_code = invitation_code) LOOP
    invitation_code := 'BETA-' || upper(substring(md5(random()::text), 1, 8));
  END LOOP;
  
  INSERT INTO beta_invitations (
    email,
    institution,
    field_of_study,
    invitation_code,
    invited_by
  ) VALUES (
    p_email,
    p_institution,
    p_field_of_study,
    invitation_code,
    p_invited_by
  );
  
  RETURN invitation_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_feedback_stats(INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION generate_beta_invitation(TEXT, TEXT, TEXT, UUID) TO authenticated, service_role;

-- Sample beta invitations for academic institutions
INSERT INTO beta_invitations (email, institution, field_of_study, invitation_code)
VALUES 
  ('editor@mit.edu', 'Massachusetts Institute of Technology', 'Computer Science', 'BETA-MIT-CS01'),
  ('research@stanford.edu', 'Stanford University', 'Medicine', 'BETA-STAN-MED01'),
  ('admin@harvard.edu', 'Harvard University', 'Biology', 'BETA-HARV-BIO01'),
  ('publisher@oxford.ac.uk', 'University of Oxford', 'Literature', 'BETA-OX-LIT01'),
  ('research@caltech.edu', 'California Institute of Technology', 'Physics', 'BETA-TECH-PHY01');

-- Create view for feedback analytics dashboard
CREATE VIEW feedback_analytics AS
SELECT 
  f.id,
  f.type,
  f.category,
  f.severity,
  f.status,
  f.created_at,
  f.resolved_at,
  f.assigned_to,
  p.full_name as user_name,
  p.affiliation as user_affiliation,
  CASE 
    WHEN f.resolved_at IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (f.resolved_at - f.created_at)) / 3600 
    ELSE NULL 
  END as resolution_time_hours,
  (
    SELECT COUNT(*) 
    FROM feedback_votes fv 
    WHERE fv.feedback_id = f.id AND fv.vote_type = 'upvote'
  ) as upvotes,
  (
    SELECT COUNT(*) 
    FROM feedback_responses fr 
    WHERE fr.feedback_id = f.id AND NOT fr.is_internal
  ) as public_responses
FROM user_feedback f
LEFT JOIN profiles p ON f.user_id = p.id;

-- Grant access to view
GRANT SELECT ON feedback_analytics TO authenticated, service_role;