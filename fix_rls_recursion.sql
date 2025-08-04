-- Fix for infinite recursion in review_assignments RLS policies
-- This script removes duplicate policies and ensures clean policy state

-- Drop all existing policies on review_assignments to start clean
DROP POLICY IF EXISTS "Review assignments maintain double-blind anonymity" ON review_assignments;
DROP POLICY IF EXISTS "Editors can manage review assignments" ON review_assignments;
DROP POLICY IF EXISTS "Reviewers can view and update their assignments" ON review_assignments;
DROP POLICY IF EXISTS "Reviewers can update their assignment status" ON review_assignments;

-- Recreate clean, non-conflicting policies for review_assignments
CREATE POLICY "Reviewers can view their own assignments"
ON review_assignments FOR SELECT
USING (reviewer_id = auth.uid());

CREATE POLICY "Reviewers can update their assignment status"
ON review_assignments FOR UPDATE
USING (reviewer_id = auth.uid())
WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Editors can manage review assignments"
ON review_assignments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM manuscripts m
    WHERE m.id = review_assignments.manuscript_id
    AND (
      m.editor_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('editor', 'admin')
      )
    )
  )
);

-- For admins to have full access
CREATE POLICY "Admins can manage all review assignments"
ON review_assignments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);