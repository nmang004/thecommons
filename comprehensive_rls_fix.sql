-- Comprehensive RLS Policy Fix for The Commons
-- This script removes all conflicting policies and creates clean, non-recursive ones

-- ==========================================
-- DISABLE RLS TEMPORARILY FOR DEBUGGING
-- ==========================================
-- You can uncomment these lines to test without RLS first
-- ALTER TABLE manuscripts DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE manuscript_coauthors DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE review_assignments DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- CLEAN SLATE: DROP ALL POLICIES
-- ==========================================

-- Drop all manuscript policies
DROP POLICY IF EXISTS "Authors can view their own manuscripts" ON manuscripts;
DROP POLICY IF EXISTS "Authors can create manuscripts" ON manuscripts;
DROP POLICY IF EXISTS "Authors can update their draft manuscripts" ON manuscripts;
DROP POLICY IF EXISTS "Editors can view assigned manuscripts" ON manuscripts;
DROP POLICY IF EXISTS "Editors can update manuscript status" ON manuscripts;
DROP POLICY IF EXISTS "Reviewers can view assigned manuscripts" ON manuscripts;
DROP POLICY IF EXISTS "Published manuscripts are public" ON manuscripts;
DROP POLICY IF EXISTS "Manuscripts respect embargo periods" ON manuscripts;
DROP POLICY IF EXISTS "Authors can view anonymized reviews after decision" ON manuscripts;

-- Drop all profile policies
DROP POLICY IF EXISTS "Public profiles are viewable by all" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Academic profiles are viewable with privacy controls" ON profiles;

-- Drop all manuscript_coauthors policies
DROP POLICY IF EXISTS "Authors can manage their manuscript coauthors" ON manuscript_coauthors;
DROP POLICY IF EXISTS "Coauthors are publicly viewable for published manuscripts" ON manuscript_coauthors;

-- Drop all review_assignments policies
DROP POLICY IF EXISTS "Editors can manage review assignments" ON review_assignments;
DROP POLICY IF EXISTS "Reviewers can view and update their assignments" ON review_assignments;
DROP POLICY IF EXISTS "Reviewers can update their assignment status" ON review_assignments;
DROP POLICY IF EXISTS "Review assignments maintain double-blind anonymity" ON review_assignments;
DROP POLICY IF EXISTS "Reviewers can view their own assignments" ON review_assignments;
DROP POLICY IF EXISTS "Admins can manage all review assignments" ON review_assignments;

-- ==========================================
-- CREATE SIMPLE, NON-RECURSIVE POLICIES
-- ==========================================

-- ==========================================
-- PROFILES POLICIES (FOUNDATION)
-- ==========================================
CREATE POLICY "profiles_public_read"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "profiles_own_write"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_own_update"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ==========================================
-- MANUSCRIPTS POLICIES (CORE CONTENT)
-- ==========================================

-- Authors can view their own manuscripts
CREATE POLICY "manuscripts_author_read"
ON manuscripts FOR SELECT
USING (author_id = auth.uid());

-- Published manuscripts are publicly readable
CREATE POLICY "manuscripts_public_read"
ON manuscripts FOR SELECT
USING (status = 'published');

-- Authors can create manuscripts
CREATE POLICY "manuscripts_author_create"
ON manuscripts FOR INSERT
WITH CHECK (author_id = auth.uid());

-- Authors can update their draft manuscripts
CREATE POLICY "manuscripts_author_update"
ON manuscripts FOR UPDATE
USING (author_id = auth.uid() AND status = 'draft')
WITH CHECK (author_id = auth.uid());

-- Editors can view and update manuscripts (simple role check)
CREATE POLICY "manuscripts_editor_manage"
ON manuscripts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('editor', 'admin')
  )
);

-- ==========================================
-- MANUSCRIPT COAUTHORS POLICIES
-- ==========================================

-- Coauthors are publicly viewable for published manuscripts
CREATE POLICY "coauthors_public_read"
ON manuscript_coauthors FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM manuscripts
    WHERE id = manuscript_coauthors.manuscript_id
    AND status = 'published'
  )
);

-- Authors can manage coauthors for their manuscripts
CREATE POLICY "coauthors_author_manage"
ON manuscript_coauthors FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM manuscripts
    WHERE id = manuscript_coauthors.manuscript_id
    AND author_id = auth.uid()
  )
);

-- ==========================================
-- REVIEW ASSIGNMENTS POLICIES (SIMPLIFIED)
-- ==========================================

-- Reviewers can view their own assignments
CREATE POLICY "review_assignments_reviewer_read"
ON review_assignments FOR SELECT
USING (reviewer_id = auth.uid());

-- Reviewers can update their assignment status
CREATE POLICY "review_assignments_reviewer_update"
ON review_assignments FOR UPDATE
USING (reviewer_id = auth.uid())
WITH CHECK (reviewer_id = auth.uid());

-- Editors/Admins can manage all review assignments
CREATE POLICY "review_assignments_editor_manage"
ON review_assignments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('editor', 'admin')
  )
);

-- ==========================================
-- GRANT NECESSARY PERMISSIONS
-- ==========================================

-- Grant usage on auth schema for RLS policies
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;

-- Ensure authenticated users can read profiles
GRANT SELECT ON profiles TO authenticated;
GRANT SELECT ON manuscripts TO authenticated;
GRANT SELECT ON manuscript_coauthors TO authenticated;

-- ==========================================
-- VERIFY POLICIES ARE WORKING
-- ==========================================

-- Test query to verify policies work
-- This should return published manuscripts
SELECT 
  m.id, 
  m.title, 
  m.status,
  p.full_name as author_name
FROM manuscripts m
JOIN profiles p ON m.author_id = p.id
WHERE m.status = 'published'
LIMIT 5;