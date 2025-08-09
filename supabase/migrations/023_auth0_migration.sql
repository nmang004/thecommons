-- Auth0 Migration: Add auth0_id column and update constraints
-- This migration prepares the database for Auth0 integration

-- Add auth0_id column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth0_id TEXT;

-- Create unique index on auth0_id (allowing nulls for gradual migration)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_auth0_id ON profiles(auth0_id) WHERE auth0_id IS NOT NULL;

-- Update the profiles table structure to accommodate Auth0 users
-- Make the id column more flexible for Auth0 user IDs
ALTER TABLE profiles ALTER COLUMN id TYPE TEXT;

-- Add a function to sync Auth0 users with profiles
CREATE OR REPLACE FUNCTION sync_auth0_user(
  p_auth0_id TEXT,
  p_email TEXT,
  p_full_name TEXT,
  p_avatar_url TEXT DEFAULT NULL,
  p_role user_role DEFAULT 'author'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  existing_user profiles%ROWTYPE;
BEGIN
  -- Check if user already exists by auth0_id
  SELECT * INTO existing_user FROM profiles WHERE auth0_id = p_auth0_id;
  
  IF FOUND THEN
    -- Update existing user
    UPDATE profiles 
    SET 
      full_name = p_full_name,
      avatar_url = COALESCE(p_avatar_url, avatar_url),
      updated_at = NOW()
    WHERE auth0_id = p_auth0_id
    RETURNING id::UUID INTO user_id;
    
    RETURN user_id;
  END IF;
  
  -- Check if user exists by email (migration scenario)
  SELECT * INTO existing_user FROM profiles WHERE email = p_email AND auth0_id IS NULL;
  
  IF FOUND THEN
    -- This is a migration - update existing user with auth0_id
    UPDATE profiles 
    SET 
      auth0_id = p_auth0_id,
      full_name = p_full_name,
      avatar_url = COALESCE(p_avatar_url, avatar_url),
      updated_at = NOW()
    WHERE id = existing_user.id
    RETURNING id::UUID INTO user_id;
    
    RETURN user_id;
  END IF;
  
  -- Create new user
  user_id := gen_random_uuid();
  
  INSERT INTO profiles (
    id,
    auth0_id,
    email,
    full_name,
    avatar_url,
    role,
    created_at,
    updated_at
  ) VALUES (
    user_id::TEXT,
    p_auth0_id,
    p_email,
    p_full_name,
    p_avatar_url,
    p_role,
    NOW(),
    NOW()
  );
  
  RETURN user_id;
END;
$$;

-- Update RLS policies to work with both Supabase auth and Auth0
-- First, create a helper function to get current user ID from either system
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    -- Try Auth0 ID first (from JWT custom claim)
    current_setting('request.jwt.claims', true)::json->>'https://thecommons.org/user_id',
    -- Fall back to Supabase auth
    auth.uid()::TEXT
  );
$$;

-- Update existing RLS policies to use the new helper function
-- This is a gradual approach that supports both authentication systems

-- Profiles table policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (
    id = get_current_user_id() OR 
    auth0_id = (current_setting('request.jwt.claims', true)::json->>'sub')
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (
    id = get_current_user_id() OR 
    auth0_id = (current_setting('request.jwt.claims', true)::json->>'sub')
  );

-- Add comment for migration tracking
COMMENT ON COLUMN profiles.auth0_id IS 'Auth0 user identifier for authentication migration';

-- Create index for better performance on auth0_id lookups
CREATE INDEX IF NOT EXISTS idx_profiles_auth0_id_lookup ON profiles(auth0_id) WHERE auth0_id IS NOT NULL;

-- Create a view for easier user identification across both systems
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
  id,
  auth0_id,
  email,
  full_name,
  role,
  CASE 
    WHEN auth0_id IS NOT NULL THEN 'auth0'
    ELSE 'supabase'
  END as auth_provider,
  created_at,
  updated_at
FROM profiles;

-- Grant appropriate permissions
GRANT SELECT ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO anon;