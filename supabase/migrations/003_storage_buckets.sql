-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'manuscripts', 
    'manuscripts', 
    false,
    52428800, -- 50MB limit
    ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
  ),
  (
    'published-articles', 
    'published-articles', 
    true,
    52428800, -- 50MB limit
    ARRAY['application/pdf']
  ),
  (
    'profile-avatars', 
    'profile-avatars', 
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'journal-assets', 
    'journal-assets', 
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  );

-- Storage policies for manuscripts bucket
CREATE POLICY "Authors can upload manuscript files" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'manuscripts' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Authors can view their manuscript files" 
  ON storage.objects FOR SELECT 
  USING (
    bucket_id = 'manuscripts' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Authors can update their manuscript files" 
  ON storage.objects FOR UPDATE 
  USING (
    bucket_id = 'manuscripts' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Authors can delete their manuscript files" 
  ON storage.objects FOR DELETE 
  USING (
    bucket_id = 'manuscripts' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policies for published-articles bucket
CREATE POLICY "Anyone can view published articles" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'published-articles');

CREATE POLICY "System can upload published articles" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'published-articles' 
    AND auth.role() = 'authenticated'
  );

-- Storage policies for profile-avatars bucket
CREATE POLICY "Users can upload their avatar" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'profile-avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Anyone can view avatars" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'profile-avatars');

CREATE POLICY "Users can update their avatar" 
  ON storage.objects FOR UPDATE 
  USING (
    bucket_id = 'profile-avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their avatar" 
  ON storage.objects FOR DELETE 
  USING (
    bucket_id = 'profile-avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policies for journal-assets bucket
CREATE POLICY "Anyone can view journal assets" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'journal-assets');

CREATE POLICY "Admins can manage journal assets" 
  ON storage.objects FOR ALL 
  USING (
    bucket_id = 'journal-assets' 
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );