-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE manuscripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE manuscript_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE manuscript_coauthors ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE editorial_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields_of_study ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by all" 
  ON profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Manuscripts policies
CREATE POLICY "Authors can view their own manuscripts" 
  ON manuscripts FOR SELECT 
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can create manuscripts" 
  ON manuscripts FOR INSERT 
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their draft manuscripts" 
  ON manuscripts FOR UPDATE 
  USING (auth.uid() = author_id AND status = 'draft')
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Editors can view assigned manuscripts" 
  ON manuscripts FOR SELECT 
  USING (
    auth.uid() = editor_id 
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('editor', 'admin')
    )
  );

CREATE POLICY "Editors can update assigned manuscripts" 
  ON manuscripts FOR UPDATE 
  USING (
    auth.uid() = editor_id 
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('editor', 'admin')
    )
  );

CREATE POLICY "Reviewers can view assigned manuscripts" 
  ON manuscripts FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM review_assignments 
      WHERE manuscript_id = manuscripts.id 
      AND reviewer_id = auth.uid() 
      AND status IN ('accepted', 'completed')
    )
  );

CREATE POLICY "Published manuscripts are public" 
  ON manuscripts FOR SELECT 
  USING (status = 'published');

-- Manuscript files policies
CREATE POLICY "Authors can view their manuscript files" 
  ON manuscript_files FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM manuscripts 
      WHERE id = manuscript_files.manuscript_id 
      AND author_id = auth.uid()
    )
  );

CREATE POLICY "Authors can upload manuscript files" 
  ON manuscript_files FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM manuscripts 
      WHERE id = manuscript_files.manuscript_id 
      AND author_id = auth.uid()
    )
  );

CREATE POLICY "Editors can view manuscript files" 
  ON manuscript_files FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM manuscripts 
      WHERE id = manuscript_files.manuscript_id 
      AND (
        editor_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('editor', 'admin')
        )
      )
    )
  );

CREATE POLICY "Reviewers can view anonymized manuscript files" 
  ON manuscript_files FOR SELECT 
  USING (
    file_type = 'manuscript_anonymized' 
    AND EXISTS (
      SELECT 1 FROM review_assignments 
      WHERE manuscript_id = manuscript_files.manuscript_id 
      AND reviewer_id = auth.uid() 
      AND status IN ('accepted', 'completed')
    )
  );

CREATE POLICY "Public can view published manuscript files" 
  ON manuscript_files FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM manuscripts 
      WHERE id = manuscript_files.manuscript_id 
      AND status = 'published'
    )
  );

-- Co-authors policies
CREATE POLICY "Authors can manage co-authors" 
  ON manuscript_coauthors FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM manuscripts 
      WHERE id = manuscript_coauthors.manuscript_id 
      AND author_id = auth.uid()
    )
  );

CREATE POLICY "Co-authors are visible to editors and reviewers" 
  ON manuscript_coauthors FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM manuscripts 
      WHERE id = manuscript_coauthors.manuscript_id 
      AND (
        editor_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('editor', 'admin')
        )
        OR EXISTS (
          SELECT 1 FROM review_assignments 
          WHERE manuscript_id = manuscripts.id 
          AND reviewer_id = auth.uid() 
          AND status IN ('accepted', 'completed')
        )
      )
    )
  );

-- Reviews policies
CREATE POLICY "Reviewers can manage their own reviews" 
  ON reviews FOR ALL 
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Editors can view all reviews for assigned manuscripts" 
  ON reviews FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM manuscripts 
      WHERE id = reviews.manuscript_id 
      AND (
        editor_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('editor', 'admin')
        )
      )
    )
  );

CREATE POLICY "Authors can view reviews after decision" 
  ON reviews FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM manuscripts 
      WHERE id = reviews.manuscript_id 
      AND author_id = auth.uid() 
      AND status IN ('accepted', 'rejected', 'published', 'revisions_requested')
    )
  );

-- Review assignments policies
CREATE POLICY "Editors can manage review assignments" 
  ON review_assignments FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM manuscripts 
      WHERE id = review_assignments.manuscript_id 
      AND (
        editor_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('editor', 'admin')
        )
      )
    )
  );

CREATE POLICY "Reviewers can view and update their assignments" 
  ON review_assignments FOR SELECT 
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can update their assignment status" 
  ON review_assignments FOR UPDATE 
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

-- Payments policies
CREATE POLICY "Authors can view their payments" 
  ON payments FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM manuscripts 
      WHERE id = payments.manuscript_id 
      AND author_id = auth.uid()
    )
  );

CREATE POLICY "System can insert payments" 
  ON payments FOR INSERT 
  WITH CHECK (true); -- Will be restricted via service role key

-- Editorial decisions policies
CREATE POLICY "Editors can create decisions" 
  ON editorial_decisions FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM manuscripts 
      WHERE id = editorial_decisions.manuscript_id 
      AND (
        editor_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('editor', 'admin')
        )
      )
    )
  );

CREATE POLICY "Authors can view decisions on their manuscripts" 
  ON editorial_decisions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM manuscripts 
      WHERE id = editorial_decisions.manuscript_id 
      AND author_id = auth.uid()
    )
  );

CREATE POLICY "Editors can view all decisions" 
  ON editorial_decisions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('editor', 'admin')
    )
  );

-- Activity logs policies
CREATE POLICY "Users can view their own activity" 
  ON activity_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Editors can view all activity" 
  ON activity_logs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('editor', 'admin')
    )
  );

CREATE POLICY "System can insert activity logs" 
  ON activity_logs FOR INSERT 
  WITH CHECK (true); -- Will be controlled at application level

-- Notifications policies
CREATE POLICY "Users can view their own notifications" 
  ON notifications FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
  ON notifications FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" 
  ON notifications FOR INSERT 
  WITH CHECK (true); -- Will be controlled at application level

-- Fields of study policies
CREATE POLICY "Fields of study are public" 
  ON fields_of_study FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can manage fields of study" 
  ON fields_of_study FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );