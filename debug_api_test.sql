-- Debug API Test for The Commons
-- Simple queries to test what's working and what's not

-- ==========================================
-- BASIC CONNECTIVITY TESTS
-- ==========================================

-- Test 1: Simple manuscript query (should work if RLS is fixed)
SELECT COUNT(*) as total_manuscripts FROM manuscripts;

-- Test 2: Published manuscripts only
SELECT COUNT(*) as published_manuscripts FROM manuscripts WHERE status = 'published';

-- Test 3: Simple manuscript details
SELECT 
  id, 
  title, 
  status,
  author_id,
  created_at
FROM manuscripts 
WHERE status = 'published'
LIMIT 3;

-- Test 4: Profile query
SELECT COUNT(*) as total_profiles FROM profiles;

-- Test 5: Simple join (what the API is trying to do)
SELECT 
  m.id,
  m.title,
  m.status,
  p.full_name
FROM manuscripts m
LEFT JOIN profiles p ON m.author_id = p.id
WHERE m.status = 'published'
LIMIT 3;

-- ==========================================
-- POTENTIAL ISSUE DIAGNOSTICS
-- ==========================================

-- Check if there are any policies causing issues
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('manuscripts', 'profiles', 'manuscript_coauthors', 'review_assignments')
ORDER BY tablename, policyname;

-- Check if RLS is enabled on tables
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('manuscripts', 'profiles', 'manuscript_coauthors', 'review_assignments');

-- Check if there are any foreign key constraint issues
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table
FROM pg_constraint 
WHERE conrelid::regclass::text IN ('manuscripts', 'profiles', 'manuscript_coauthors', 'review_assignments')
ORDER BY table_name;