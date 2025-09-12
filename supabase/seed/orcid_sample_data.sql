-- ORCID Sample Data for The Commons Development
-- This file contains sample data for testing ORCID integration
-- Run after the ORCID integration migration (020_add_orcid_integration.sql)

-- First, let's create some sample profiles with ORCID integration
-- Note: These should be inserted after base profiles exist

-- Update existing profiles with ORCID data
-- Dr. Sarah Chen - Quantum Computing Researcher (Full ORCID integration)
UPDATE profiles SET 
  orcid = '0000-0002-1825-0097',
  orcid_verified = true,
  orcid_connected_at = '2024-01-15T10:30:00Z',
  orcid_last_sync = '2024-09-12T09:15:00Z',
  orcid_scope = '/authenticate,/read-limited',
  h_index = 12,
  total_publications = 15,
  bio = 'Quantum computing researcher at Stanford University with focus on machine learning applications in quantum systems. ORCID verified.',
  website_url = 'https://profiles.stanford.edu/sarah-chen'
WHERE email = 'sarah.chen@stanford.edu';

-- Dr. James Wilson - Biomedical Engineer (Basic ORCID integration)
UPDATE profiles SET 
  orcid = '0000-0001-5109-3700',
  orcid_verified = true,
  orcid_connected_at = '2024-02-20T14:45:00Z',
  orcid_last_sync = '2024-09-10T16:20:00Z',
  orcid_scope = '/authenticate',
  h_index = 7,
  total_publications = 8,
  bio = 'Biomedical engineer specializing in medical devices and biomaterials research. MIT faculty member.',
  website_url = 'https://be.mit.edu/directory/james-wilson'
WHERE email = 'james.wilson@mit.edu';

-- Dr. Maria Rodriguez - Climate Scientist (Full profile with extensive data)
UPDATE profiles SET 
  orcid = '0000-0003-1415-9269',
  orcid_verified = true,
  orcid_connected_at = '2024-03-10T11:00:00Z',
  orcid_last_sync = '2024-09-11T13:30:00Z',
  orcid_scope = '/authenticate,/read-limited,/person/update',
  h_index = 18,
  total_publications = 22,
  bio = 'Climate scientist at NOAA focusing on atmospheric modeling and climate change research. Lead researcher on multiple international climate projects.',
  website_url = 'https://www.noaa.gov/staff/maria-rodriguez'
WHERE email = 'maria.rodriguez@noaa.gov';

-- Insert additional test users with ORCID if they don't exist
INSERT INTO profiles (id, full_name, email, affiliation, orcid, orcid_verified, orcid_connected_at, orcid_last_sync, orcid_scope, role, expertise, bio, h_index, total_publications)
VALUES
  -- Dr. Alex Kim - Computer Science (Minimal ORCID data)
  (
    uuid_generate_v4(),
    'Dr. Alex Kim',
    'alex.kim@berkeley.edu',
    'UC Berkeley',
    '0000-0002-7183-4567',
    true,
    '2024-04-05T09:20:00Z',
    '2024-09-01T14:10:00Z',
    '/authenticate',
    'author',
    ARRAY['Computer Science', 'Artificial Intelligence', 'Natural Language Processing'],
    'Computer scientist focusing on natural language processing and AI ethics.',
    5,
    6
  ),
  
  -- Dr. Emily Johnson - Neuroscientist (Multiple works)
  (
    uuid_generate_v4(),
    'Dr. Emily Johnson',
    'emily.johnson@harvard.edu',
    'Harvard Medical School',
    '0000-0001-8271-5555',
    true,
    '2024-05-12T16:45:00Z',
    '2024-09-08T11:30:00Z',
    '/authenticate,/read-limited',
    'reviewer',
    ARRAY['Neuroscience', 'Cognitive Science', 'Brain Imaging'],
    'Neuroscientist specializing in cognitive neuroscience and brain imaging technologies.',
    14,
    25
  ),
  
  -- Dr. David Thompson - Physics (Recent graduate)
  (
    uuid_generate_v4(),
    'Dr. David Thompson',
    'david.thompson@caltech.edu',
    'Caltech',
    '0000-0003-9876-5432',
    true,
    '2024-06-20T13:15:00Z',
    '2024-09-05T10:45:00Z',
    '/authenticate',
    'author',
    ARRAY['Theoretical Physics', 'Quantum Mechanics', 'Particle Physics'],
    'Theoretical physicist with focus on quantum field theory and particle physics.',
    3,
    4
  )
ON CONFLICT (email) DO UPDATE SET
  orcid = EXCLUDED.orcid,
  orcid_verified = EXCLUDED.orcid_verified,
  orcid_connected_at = EXCLUDED.orcid_connected_at,
  orcid_last_sync = EXCLUDED.orcid_last_sync,
  orcid_scope = EXCLUDED.orcid_scope,
  h_index = EXCLUDED.h_index,
  total_publications = EXCLUDED.total_publications,
  bio = EXCLUDED.bio;

-- Add ORCID data to existing co-authors in manuscript_coauthors table
-- This simulates co-authors who have provided their ORCID iDs
UPDATE manuscript_coauthors SET 
  orcid = '0000-0002-7183-4567'
WHERE name ILIKE '%Alex Kim%' AND email ILIKE '%berkeley%';

UPDATE manuscript_coauthors SET 
  orcid = '0000-0001-8271-5555'
WHERE name ILIKE '%Emily Johnson%' AND email ILIKE '%harvard%';

UPDATE manuscript_coauthors SET 
  orcid = '0000-0003-9876-5432'
WHERE name ILIKE '%David Thompson%' AND email ILIKE '%caltech%';

-- Insert sample ORCID sync history to show realistic usage patterns
INSERT INTO orcid_sync_history (user_id, sync_type, items_synced, status, synced_at, metadata, api_version)
SELECT 
  p.id,
  sync_data.sync_type,
  sync_data.items_synced,
  sync_data.status,
  sync_data.synced_at,
  sync_data.metadata::jsonb,
  '3.0'
FROM profiles p
CROSS JOIN (
  VALUES
    -- Dr. Sarah Chen sync history
    ('profile', 1, 'success', '2024-09-12T09:15:00Z'::timestamptz, '{"fields_updated": ["bio", "affiliation", "website_url"]}'),
    ('publications', 5, 'success', '2024-09-12T09:20:00Z'::timestamptz, '{"new_publications": 2, "updated_publications": 3}'),
    ('affiliations', 2, 'success', '2024-09-12T09:25:00Z'::timestamptz, '{"affiliations_added": 1, "affiliations_updated": 1}'),
    
    -- Dr. James Wilson sync history  
    ('profile', 1, 'success', '2024-09-10T16:20:00Z'::timestamptz, '{"fields_updated": ["bio", "h_index"]}'),
    ('publications', 3, 'partial', '2024-09-10T16:25:00Z'::timestamptz, '{"new_publications": 2, "failed_publications": 1, "error": "DOI validation failed"}'),
    
    -- Dr. Maria Rodriguez sync history
    ('profile', 1, 'success', '2024-09-11T13:30:00Z'::timestamptz, '{"fields_updated": ["bio", "website_url", "total_publications"]}'),
    ('publications', 8, 'success', '2024-09-11T13:35:00Z'::timestamptz, '{"new_publications": 3, "updated_publications": 5}'),
    ('affiliations', 3, 'success', '2024-09-11T13:40:00Z'::timestamptz, '{"affiliations_added": 1, "affiliations_updated": 2}'),
    ('education', 2, 'success', '2024-09-11T13:45:00Z'::timestamptz, '{"education_records_added": 2}')
) AS sync_data(sync_type, items_synced, status, synced_at, metadata)
WHERE p.orcid IN ('0000-0002-1825-0097', '0000-0001-5109-3700', '0000-0003-1415-9269');

-- Insert sample publication imports from ORCID
INSERT INTO orcid_publication_imports (user_id, orcid_put_code, title, doi, journal, publication_date, imported_at, status)
SELECT 
  p.id,
  import_data.put_code,
  import_data.title,
  import_data.doi,
  import_data.journal,
  import_data.pub_date::date,
  import_data.imported_at::timestamptz,
  import_data.status
FROM profiles p
CROSS JOIN (
  VALUES
    -- Publications for Dr. Sarah Chen
    ('12345', 'Quantum Machine Learning: Bridging Classical and Quantum Computing', '10.1038/s41534-023-00723-0', 'Nature Quantum Information', '2023-06-15', '2024-09-12T09:22:00Z', 'imported'),
    ('12346', 'Variational Quantum Algorithms for Optimization', '10.1103/PhysRevA.107.042401', 'Physical Review A', '2023-04-10', '2024-09-12T09:23:00Z', 'imported'),
    ('12347', 'Error Correction in Near-term Quantum Devices', '10.1109/TQCE.2023.3275421', 'IEEE Trans. Quantum Engineering', '2023-08-22', '2024-09-12T09:24:00Z', 'imported'),
    
    -- Publications for Dr. James Wilson  
    ('67890', 'Novel Biomaterials for Cardiac Stent Applications', '10.1016/j.biomaterials.2023.121456', 'Biomaterials', '2023-03-15', '2024-09-10T16:27:00Z', 'imported'),
    ('67891', 'Biocompatibility Assessment of 3D Printed Medical Devices', '10.1002/jbm.a.37345', 'Journal of Biomedical Materials Research Part A', '2023-01-20', '2024-09-10T16:28:00Z', 'imported'),
    
    -- Publications for Dr. Maria Rodriguez
    ('11111', 'Climate Model Predictions for Arctic Ice Loss', '10.1038/s41558-023-01652-4', 'Nature Climate Change', '2023-05-10', '2024-09-11T13:37:00Z', 'imported'),
    ('11112', 'Impact of Atmospheric Aerosols on Global Temperature Trends', '10.1029/2023GL103456', 'Geophysical Research Letters', '2023-07-25', '2024-09-11T13:38:00Z', 'imported'),
    ('11113', 'Machine Learning Approaches to Weather Prediction', '10.1175/WAF-D-23-0045.1', 'Weather and Forecasting', '2023-09-30', '2024-09-11T13:39:00Z', 'imported')
) AS import_data(put_code, title, doi, journal, pub_date, imported_at, status)
WHERE (p.orcid = '0000-0002-1825-0097' AND import_data.put_code IN ('12345', '12346', '12347'))
   OR (p.orcid = '0000-0001-5109-3700' AND import_data.put_code IN ('67890', '67891'))
   OR (p.orcid = '0000-0003-1415-9269' AND import_data.put_code IN ('11111', '11112', '11113'));

-- Insert sample API usage data for monitoring
INSERT INTO orcid_api_usage (endpoint, method, requests_count, window_start, window_size_minutes, user_id, status_code, response_time_ms)
SELECT 
  usage_data.endpoint,
  usage_data.method,
  usage_data.requests_count,
  usage_data.window_start::timestamptz,
  60,
  p.id,
  usage_data.status_code,
  usage_data.response_time_ms
FROM profiles p
CROSS JOIN (
  VALUES
    -- Recent API usage patterns
    ('/oauth/token', 'POST', 1, '2024-09-12T09:14:00Z', 200, 245),
    ('/{orcid}/person', 'GET', 1, '2024-09-12T09:15:00Z', 200, 156),
    ('/{orcid}/works', 'GET', 1, '2024-09-12T09:20:00Z', 200, 423),
    ('/{orcid}/employments', 'GET', 1, '2024-09-12T09:25:00Z', 200, 189),
    
    ('/oauth/token', 'POST', 1, '2024-09-10T16:19:00Z', 200, 198),
    ('/{orcid}/person', 'GET', 1, '2024-09-10T16:20:00Z', 200, 134),
    ('/{orcid}/works', 'GET', 1, '2024-09-10T16:25:00Z', 429, 89), -- Rate limited
    
    ('/oauth/token', 'POST', 1, '2024-09-11T13:29:00Z', 200, 178),
    ('/{orcid}/person', 'GET', 1, '2024-09-11T13:30:00Z', 200, 142),
    ('/{orcid}/works', 'GET', 1, '2024-09-11T13:35:00Z', 200, 567),
    ('/{orcid}/employments', 'GET', 1, '2024-09-11T13:40:00Z', 200, 203),
    ('/{orcid}/educations', 'GET', 1, '2024-09-11T13:45:00Z', 200, 198)
) AS usage_data(endpoint, method, requests_count, window_start, status_code, response_time_ms)
WHERE p.orcid IN ('0000-0002-1825-0097', '0000-0001-5109-3700', '0000-0003-1415-9269')
LIMIT 50; -- Limit to avoid too much test data

-- Create some sample users without ORCID for testing connection flow
INSERT INTO profiles (id, full_name, email, affiliation, role, expertise, bio, h_index, total_publications)
VALUES
  -- Test user for connecting ORCID
  (
    uuid_generate_v4(),
    'Dr. Lisa Wang',
    'lisa.wang@test.edu',
    'Test University',
    'author',
    ARRAY['Materials Science', 'Nanotechnology'],
    'Materials scientist interested in nanomaterials. No ORCID connected yet.',
    0,
    0
  ),
  
  -- Another test user
  (
    uuid_generate_v4(),
    'Dr. Michael Brown',
    'michael.brown@test.org',
    'Research Institute',
    'reviewer',
    ARRAY['Chemistry', 'Biochemistry'],
    'Biochemistry researcher. Planning to connect ORCID soon.',
    0,
    0
  )
ON CONFLICT (email) DO NOTHING;

-- Insert some test scenarios for error handling
INSERT INTO orcid_sync_history (user_id, sync_type, items_synced, status, error_message, error_code, synced_at, metadata, api_version)
SELECT 
  p.id,
  'publications',
  0,
  'failure',
  'API rate limit exceeded. Please try again later.',
  'RATE_LIMIT_EXCEEDED',
  '2024-09-09T15:30:00Z',
  '{"retry_after_seconds": 60, "endpoint": "/works", "attempts": 3}'::jsonb,
  '3.0'
FROM profiles p
WHERE p.orcid = '0000-0001-5109-3700';

-- Another error scenario
INSERT INTO orcid_sync_history (user_id, sync_type, items_synced, status, error_message, error_code, synced_at, metadata, api_version)
SELECT 
  p.id,
  'profile',
  0,
  'failure',
  'Invalid access token. Token may have expired.',
  'INVALID_TOKEN',
  '2024-09-08T10:15:00Z',
  '{"token_expired": true, "refresh_needed": true}'::jsonb,
  '3.0'
FROM profiles p
WHERE p.orcid = '0000-0002-7183-4567'
LIMIT 1;

-- Verify the sample data was inserted correctly
DO $$
DECLARE
  orcid_users_count INTEGER;
  sync_records_count INTEGER;
  import_records_count INTEGER;
BEGIN
  -- Count ORCID verified users
  SELECT COUNT(*) INTO orcid_users_count
  FROM profiles
  WHERE orcid_verified = true AND orcid IS NOT NULL;
  
  -- Count sync history records
  SELECT COUNT(*) INTO sync_records_count
  FROM orcid_sync_history;
  
  -- Count import records
  SELECT COUNT(*) INTO import_records_count
  FROM orcid_publication_imports;
  
  RAISE NOTICE 'ORCID Sample Data Summary:';
  RAISE NOTICE '- ORCID verified users: %', orcid_users_count;
  RAISE NOTICE '- Sync history records: %', sync_records_count;
  RAISE NOTICE '- Publication import records: %', import_records_count;
  
  IF orcid_users_count < 3 THEN
    RAISE WARNING 'Expected at least 3 ORCID verified users, found %', orcid_users_count;
  END IF;
  
  RAISE NOTICE 'ORCID sample data setup completed successfully!';
END $$;

-- Create a helpful view for development to see all ORCID test data
CREATE OR REPLACE VIEW dev_orcid_test_users AS
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.orcid,
  p.orcid_verified,
  p.orcid_connected_at,
  p.orcid_last_sync,
  p.orcid_scope,
  p.h_index,
  p.total_publications,
  COUNT(osh.id) as sync_count,
  COUNT(opi.id) as imported_publications_count
FROM profiles p
LEFT JOIN orcid_sync_history osh ON p.id = osh.user_id
LEFT JOIN orcid_publication_imports opi ON p.id = opi.user_id
WHERE p.orcid IS NOT NULL
GROUP BY p.id, p.full_name, p.email, p.orcid, p.orcid_verified, 
         p.orcid_connected_at, p.orcid_last_sync, p.orcid_scope, 
         p.h_index, p.total_publications
ORDER BY p.orcid_connected_at DESC;

-- Grant access to the development view
GRANT SELECT ON dev_orcid_test_users TO authenticated;

COMMENT ON VIEW dev_orcid_test_users IS 'Development view showing all users with ORCID integration for testing';

-- Final verification query to show what was created
SELECT 
  'Sample data summary' as description,
  (SELECT COUNT(*) FROM profiles WHERE orcid IS NOT NULL) as total_orcid_users,
  (SELECT COUNT(*) FROM profiles WHERE orcid_verified = true) as verified_orcid_users,
  (SELECT COUNT(*) FROM orcid_sync_history) as sync_history_records,
  (SELECT COUNT(*) FROM orcid_publication_imports) as publication_imports,
  (SELECT COUNT(*) FROM orcid_api_usage) as api_usage_records;