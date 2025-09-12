-- Migration: Add ORCID Integration Support
-- Description: Add ORCID-related fields and tables for researcher identity verification and data synchronization
-- Created: 2024-09-12

-- Add ORCID-related columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS orcid_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS orcid_auth_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS orcid_refresh_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS orcid_scope TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS orcid_connected_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS orcid_last_sync TIMESTAMP WITH TIME ZONE;

-- Add comments to document the new columns
COMMENT ON COLUMN profiles.orcid_verified IS 'Whether the ORCID iD has been verified through OAuth';
COMMENT ON COLUMN profiles.orcid_auth_token IS 'Encrypted ORCID access token for API calls';
COMMENT ON COLUMN profiles.orcid_refresh_token IS 'Encrypted ORCID refresh token for token renewal';
COMMENT ON COLUMN profiles.orcid_scope IS 'Granted ORCID API scopes (comma-separated)';
COMMENT ON COLUMN profiles.orcid_connected_at IS 'Timestamp when ORCID was first connected';
COMMENT ON COLUMN profiles.orcid_last_sync IS 'Timestamp of last successful ORCID data sync';

-- Create ORCID sync history table to track data synchronization
CREATE TABLE IF NOT EXISTS orcid_sync_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('profile', 'publications', 'affiliations', 'education', 'works')),
  items_synced INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('success', 'failure', 'partial', 'skipped')),
  error_message TEXT,
  error_code TEXT,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  metadata JSONB,
  api_version TEXT DEFAULT '3.0'
);

-- Add comments for the sync history table
COMMENT ON TABLE orcid_sync_history IS 'Tracks ORCID data synchronization events and results';
COMMENT ON COLUMN orcid_sync_history.sync_type IS 'Type of data being synchronized';
COMMENT ON COLUMN orcid_sync_history.items_synced IS 'Number of items successfully processed';
COMMENT ON COLUMN orcid_sync_history.status IS 'Overall status of the sync operation';
COMMENT ON COLUMN orcid_sync_history.error_message IS 'Human-readable error description if sync failed';
COMMENT ON COLUMN orcid_sync_history.error_code IS 'Machine-readable error code for debugging';
COMMENT ON COLUMN orcid_sync_history.metadata IS 'Additional sync details in JSON format';
COMMENT ON COLUMN orcid_sync_history.api_version IS 'ORCID API version used for the sync';

-- Create ORCID API rate limiting table for tracking usage
CREATE TABLE IF NOT EXISTS orcid_api_usage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE')),
  requests_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  window_size_minutes INTEGER DEFAULT 60,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  client_ip INET,
  status_code INTEGER,
  response_time_ms INTEGER
);

-- Add comment for rate limiting table
COMMENT ON TABLE orcid_api_usage IS 'Tracks ORCID API usage for rate limiting and monitoring';

-- Create ORCID publication imports table to avoid duplicate imports
CREATE TABLE IF NOT EXISTS orcid_publication_imports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  orcid_put_code TEXT NOT NULL,
  title TEXT NOT NULL,
  doi TEXT,
  journal TEXT,
  publication_date DATE,
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  manuscript_id UUID REFERENCES manuscripts(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'imported' CHECK (status IN ('imported', 'matched', 'ignored', 'error')),
  
  -- Ensure we don't import the same publication twice for a user
  UNIQUE(user_id, orcid_put_code)
);

-- Add comment for publication imports table
COMMENT ON TABLE orcid_publication_imports IS 'Tracks publications imported from ORCID to prevent duplicates';
COMMENT ON COLUMN orcid_publication_imports.orcid_put_code IS 'ORCID put-code for the work (unique within user ORCID record)';
COMMENT ON COLUMN orcid_publication_imports.manuscript_id IS 'Reference to local manuscript if matched';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_orcid ON profiles(orcid) WHERE orcid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_orcid_verified ON profiles(orcid_verified) WHERE orcid_verified = true;
CREATE INDEX IF NOT EXISTS idx_profiles_orcid_connected_at ON profiles(orcid_connected_at);

CREATE INDEX IF NOT EXISTS idx_orcid_sync_history_user_id ON orcid_sync_history(user_id);
CREATE INDEX IF NOT EXISTS idx_orcid_sync_history_synced_at ON orcid_sync_history(synced_at);
CREATE INDEX IF NOT EXISTS idx_orcid_sync_history_sync_type ON orcid_sync_history(sync_type);
CREATE INDEX IF NOT EXISTS idx_orcid_sync_history_status ON orcid_sync_history(status);

CREATE INDEX IF NOT EXISTS idx_orcid_api_usage_window_start ON orcid_api_usage(window_start);
CREATE INDEX IF NOT EXISTS idx_orcid_api_usage_endpoint_method ON orcid_api_usage(endpoint, method);
CREATE INDEX IF NOT EXISTS idx_orcid_api_usage_user_id ON orcid_api_usage(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orcid_publication_imports_user_id ON orcid_publication_imports(user_id);
CREATE INDEX IF NOT EXISTS idx_orcid_publication_imports_imported_at ON orcid_publication_imports(imported_at);
CREATE INDEX IF NOT EXISTS idx_orcid_publication_imports_doi ON orcid_publication_imports(doi) WHERE doi IS NOT NULL;

-- Enable Row Level Security for new tables
ALTER TABLE orcid_sync_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcid_api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcid_publication_imports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orcid_sync_history
CREATE POLICY "Users can view their own ORCID sync history" 
  ON orcid_sync_history FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert ORCID sync records" 
  ON orcid_sync_history FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for orcid_api_usage (admin only for monitoring)
CREATE POLICY "Admins can view ORCID API usage" 
  ON orcid_api_usage FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ));

CREATE POLICY "System can insert ORCID API usage records" 
  ON orcid_api_usage FOR INSERT 
  WITH CHECK (true); -- Allow system to insert usage tracking

-- RLS Policies for orcid_publication_imports
CREATE POLICY "Users can view their own ORCID publication imports" 
  ON orcid_publication_imports FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ORCID publication imports" 
  ON orcid_publication_imports FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ORCID publication imports" 
  ON orcid_publication_imports FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create a function to clean up old API usage records (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_orcid_api_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete API usage records older than 7 days
  DELETE FROM orcid_api_usage 
  WHERE window_start < (NOW() - INTERVAL '7 days');
END;
$$;

-- Add comment for cleanup function
COMMENT ON FUNCTION cleanup_old_orcid_api_usage IS 'Removes old ORCID API usage records to prevent table bloat';

-- Create a function to get ORCID sync statistics for a user
CREATE OR REPLACE FUNCTION get_user_orcid_sync_stats(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Check if the requesting user can access this data
  IF auth.uid() != target_user_id AND NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'editor')
  ) THEN
    RETURN '{"error": "Access denied"}'::JSON;
  END IF;

  SELECT json_build_object(
    'total_syncs', COUNT(*),
    'successful_syncs', COUNT(*) FILTER (WHERE status = 'success'),
    'failed_syncs', COUNT(*) FILTER (WHERE status = 'failure'),
    'last_sync', MAX(synced_at),
    'sync_types', json_agg(DISTINCT sync_type),
    'sync_history', json_agg(
      json_build_object(
        'sync_type', sync_type,
        'status', status,
        'items_synced', items_synced,
        'synced_at', synced_at,
        'error_message', error_message
      )
      ORDER BY synced_at DESC
      LIMIT 10
    )
  ) INTO result
  FROM orcid_sync_history
  WHERE user_id = target_user_id;
  
  RETURN result;
END;
$$;

-- Add comment for stats function
COMMENT ON FUNCTION get_user_orcid_sync_stats IS 'Returns ORCID synchronization statistics for a user';

-- Create a function to validate ORCID iD format
CREATE OR REPLACE FUNCTION validate_orcid_format(orcid_input TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- ORCID format: 0000-0000-0000-000X (where X can be 0-9 or X)
  RETURN orcid_input ~ '^0000-[0-9]{4}-[0-9]{4}-[0-9]{3}[0-9X]$';
END;
$$;

-- Add comment for validation function
COMMENT ON FUNCTION validate_orcid_format IS 'Validates ORCID iD format using regex pattern';

-- Add constraint to ensure ORCID format is valid when provided
ALTER TABLE profiles 
ADD CONSTRAINT check_orcid_format 
CHECK (orcid IS NULL OR validate_orcid_format(orcid));

-- Add constraint to ensure ORCID format is valid in co-authors table
ALTER TABLE manuscript_coauthors 
ADD CONSTRAINT check_coauthor_orcid_format 
CHECK (orcid IS NULL OR validate_orcid_format(orcid));

-- Create a view for ORCID-verified users (useful for reporting)
CREATE OR REPLACE VIEW orcid_verified_users AS
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.orcid,
  p.affiliation,
  p.orcid_connected_at,
  p.orcid_last_sync,
  p.h_index,
  p.total_publications,
  (
    SELECT COUNT(*) 
    FROM orcid_sync_history osh 
    WHERE osh.user_id = p.id 
    AND osh.status = 'success'
  ) as successful_syncs,
  (
    SELECT MAX(osh.synced_at) 
    FROM orcid_sync_history osh 
    WHERE osh.user_id = p.id
  ) as last_activity
FROM profiles p
WHERE p.orcid_verified = true
  AND p.orcid IS NOT NULL;

-- Add comment for the view
COMMENT ON VIEW orcid_verified_users IS 'View of all users with verified ORCID integration and their sync statistics';

-- Grant appropriate permissions
GRANT SELECT ON orcid_verified_users TO authenticated;

-- Insert initial sync types for reference (these are the valid sync_type values)
INSERT INTO public.enum_docs (table_name, column_name, enum_value, description) VALUES
('orcid_sync_history', 'sync_type', 'profile', 'Synchronization of basic profile information (name, bio, etc.)'),
('orcid_sync_history', 'sync_type', 'publications', 'Synchronization of publication/works data'),
('orcid_sync_history', 'sync_type', 'affiliations', 'Synchronization of employment and organizational affiliations'),
('orcid_sync_history', 'sync_type', 'education', 'Synchronization of education history'),
('orcid_sync_history', 'sync_type', 'works', 'Synchronization of scholarly works (alias for publications)')
ON CONFLICT (table_name, column_name, enum_value) DO NOTHING;

-- Create table for enum documentation if it doesn't exist
CREATE TABLE IF NOT EXISTS public.enum_docs (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  column_name TEXT NOT NULL,
  enum_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(table_name, column_name, enum_value)
);

-- Final verification: Check that all new tables were created successfully
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('orcid_sync_history', 'orcid_api_usage', 'orcid_publication_imports');
  
  IF table_count < 3 THEN
    RAISE EXCEPTION 'ORCID integration tables were not created successfully';
  END IF;
  
  RAISE NOTICE 'ORCID integration migration completed successfully. Created % tables.', table_count;
END $$;