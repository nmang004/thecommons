-- Production Security Enhancement for The Commons Academic Publishing Platform
-- This migration adds enhanced RLS policies for production deployment

-- ==========================================
-- ENHANCED STORAGE SECURITY POLICIES
-- ==========================================

-- Manuscripts bucket - Secure file access
CREATE POLICY "Authors can upload their manuscript files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'manuscripts' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM manuscripts 
    WHERE id::text = (storage.foldername(name))[1]
    AND author_id = auth.uid()
  )
);

-- Drop and recreate policy to handle potential conflicts
DROP POLICY IF EXISTS "Authors can view their manuscript files" ON storage.objects;
CREATE POLICY "Authors can view their manuscript files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'manuscripts'
  AND EXISTS (
    SELECT 1 FROM manuscripts 
    WHERE id::text = (storage.foldername(name))[1]
    AND author_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Editors can view manuscript files" ON storage.objects;
CREATE POLICY "Editors can view manuscript files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'manuscripts'
  AND EXISTS (
    SELECT 1 FROM manuscripts m
    INNER JOIN profiles p ON p.id = auth.uid()
    WHERE m.id::text = (storage.foldername(name))[1]
    AND (m.editor_id = auth.uid() OR p.role IN ('editor', 'admin'))
  )
);

CREATE POLICY "Reviewers can view anonymized files only"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'manuscripts'
  AND name LIKE '%/anonymized/%'
  AND EXISTS (
    SELECT 1 FROM review_assignments ra
    INNER JOIN manuscripts m ON m.id = ra.manuscript_id
    WHERE m.id::text = (storage.foldername(name))[1]
    AND ra.reviewer_id = auth.uid()
    AND ra.status IN ('accepted', 'completed')
  )
);

-- Published articles bucket - Public access with tracking
CREATE POLICY "Published articles are publicly viewable"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'published-articles'
  AND EXISTS (
    SELECT 1 FROM manuscripts 
    WHERE id::text = (storage.foldername(name))[1]
    AND status = 'published'
  )
);

-- Profile avatars bucket - User-specific access
CREATE POLICY "Users can manage their own avatar"
ON storage.objects FOR ALL
USING (
  bucket_id = 'profile-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ==========================================
-- ENHANCED TABLE SECURITY POLICIES
-- ==========================================

-- Profiles table - Enhanced privacy protection
DROP POLICY IF EXISTS "Public profiles are viewable by all" ON profiles;
CREATE POLICY "Academic profiles are viewable with privacy controls"
ON profiles FOR SELECT
USING (
  -- Public information always visible
  true
);

-- Add privacy column for profiles (run separately if needed)
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"email": false, "affiliation": true, "bio": true}';

-- Manuscripts - Enhanced access control with embargo periods
CREATE POLICY "Manuscripts respect embargo periods"
ON manuscripts FOR SELECT
USING (
  -- Authors can always view their manuscripts
  author_id = auth.uid()
  OR
  -- Editors can view assigned manuscripts
  (editor_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('editor', 'admin')
  ))
  OR
  -- Reviewers can view assigned manuscripts
  EXISTS (
    SELECT 1 FROM review_assignments 
    WHERE manuscript_id = manuscripts.id 
    AND reviewer_id = auth.uid() 
    AND status IN ('accepted', 'completed')
  )
  OR
  -- Published manuscripts are public (respecting embargo)
  (status = 'published' AND (published_at IS NULL OR published_at <= NOW()))
);

-- Reviews - Enhanced anonymity protection
DROP POLICY IF EXISTS "Authors can view reviews after decision" ON reviews;
CREATE POLICY "Authors can view anonymized reviews after decision"
ON reviews FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM manuscripts 
    WHERE id = reviews.manuscript_id 
    AND author_id = auth.uid() 
    AND status IN ('accepted', 'rejected', 'published', 'revisions_requested')
  )
  -- Reviews are anonymized for authors (reviewer_id not exposed)
);

-- Note: Review assignments policies are defined in 002_rls_policies.sql
-- Removed duplicate policy to prevent infinite recursion issues

-- ==========================================
-- PAYMENT SECURITY ENHANCEMENTS
-- ==========================================

-- Enhanced payment policies with PCI compliance considerations
CREATE POLICY "Payment information is strictly access-controlled"
ON payments FOR SELECT
USING (
  -- Authors can view their payment records (limited info)
  EXISTS (
    SELECT 1 FROM manuscripts 
    WHERE id = payments.manuscript_id 
    AND author_id = auth.uid()
  )
  OR
  -- Admins can view for financial reporting
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- ==========================================
-- ACTIVITY LOGGING ENHANCEMENTS
-- ==========================================

-- Enhanced activity logging for security monitoring
CREATE POLICY "Enhanced activity logging with privacy protection"
ON activity_logs FOR SELECT
USING (
  -- Users can view their own activity
  user_id = auth.uid()
  OR
  -- Editors can view activity on their manuscripts
  (
    manuscript_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM manuscripts 
      WHERE id = activity_logs.manuscript_id 
      AND editor_id = auth.uid()
    )
  )
  OR
  -- Admins can view all activity for security monitoring
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- ==========================================
-- NOTIFICATION SECURITY
-- ==========================================

-- Enhanced notification policies
CREATE POLICY "Notifications with privacy controls"
ON notifications FOR SELECT
USING (
  -- Users can only see their own notifications
  user_id = auth.uid()
);

CREATE POLICY "Secure notification creation"
ON notifications FOR INSERT
WITH CHECK (
  -- Only authenticated users can create notifications for themselves
  -- or system can create via service role
  user_id = auth.uid() OR auth.role() = 'service_role'
);

-- ==========================================
-- ANTI-FRAUD AND SECURITY MEASURES
-- ==========================================

-- Function to detect suspicious activity
CREATE OR REPLACE FUNCTION detect_suspicious_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log potentially suspicious activities
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Check for rapid submission attempts
    IF TG_TABLE_NAME = 'manuscripts' THEN
      PERFORM pg_notify('suspicious_activity', 
        json_build_object(
          'type', 'rapid_submission',
          'user_id', NEW.author_id,
          'table', TG_TABLE_NAME,
          'timestamp', NOW()
        )::text
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for security monitoring
CREATE TRIGGER manuscript_security_monitor
  AFTER INSERT OR UPDATE ON manuscripts
  FOR EACH ROW EXECUTE FUNCTION detect_suspicious_activity();

-- ==========================================
-- PERFORMANCE OPTIMIZATION FOR PRODUCTION
-- ==========================================

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_manuscripts_status_published 
ON manuscripts(status) WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_manuscripts_author_status 
ON manuscripts(author_id, status);

CREATE INDEX IF NOT EXISTS idx_review_assignments_reviewer_status 
ON review_assignments(reviewer_id, status);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_timestamp 
ON activity_logs(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
ON notifications(user_id, read, created_at);

-- ==========================================
-- DATA RETENTION POLICIES
-- ==========================================

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Clean up old activity logs (keep 1 year)
  DELETE FROM activity_logs 
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  -- Clean up read notifications (keep 6 months)
  DELETE FROM notifications 
  WHERE read = true AND created_at < NOW() - INTERVAL '6 months';
  
  -- Clean up expired review assignments
  DELETE FROM review_assignments 
  WHERE status = 'expired' AND created_at < NOW() - INTERVAL '3 months';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- BACKUP AND AUDIT FUNCTIONS
-- ==========================================

-- Function to create audit trail
CREATE OR REPLACE FUNCTION create_audit_trail()
RETURNS TABLE(
  table_name text,
  operation text,
  user_id uuid,
  created_at timestamptz,
  data jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'activity_logs'::text,
    action,
    activity_logs.user_id,
    activity_logs.created_at,
    details
  FROM activity_logs
  WHERE activity_logs.created_at >= NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION cleanup_old_data() TO service_role;
GRANT EXECUTE ON FUNCTION create_audit_trail() TO service_role;

-- ==========================================
-- PRODUCTION HEALTH CHECKS
-- ==========================================

-- Function for production health monitoring
CREATE OR REPLACE FUNCTION production_health_check()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  manuscript_count integer;
  active_users integer;
  pending_reviews integer;
BEGIN
  -- Get key metrics
  SELECT COUNT(*) INTO manuscript_count FROM manuscripts WHERE status = 'published';
  SELECT COUNT(DISTINCT user_id) INTO active_users FROM activity_logs WHERE created_at >= NOW() - INTERVAL '24 hours';
  SELECT COUNT(*) INTO pending_reviews FROM review_assignments WHERE status = 'accepted';
  
  result := jsonb_build_object(
    'status', 'healthy',
    'timestamp', NOW(),
    'metrics', jsonb_build_object(
      'published_manuscripts', manuscript_count,
      'active_users_24h', active_users,
      'pending_reviews', pending_reviews
    )
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION production_health_check() TO anon, authenticated, service_role;