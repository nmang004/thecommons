-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing types if they exist (for clean migrations)
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS manuscript_status CASCADE;
DROP TYPE IF EXISTS file_type CASCADE;
DROP TYPE IF EXISTS review_recommendation CASCADE;
DROP TYPE IF EXISTS assignment_status CASCADE;

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('author', 'editor', 'reviewer', 'admin');

CREATE TYPE manuscript_status AS ENUM (
  'draft', 
  'submitted', 
  'with_editor', 
  'under_review', 
  'revisions_requested', 
  'accepted', 
  'rejected', 
  'published'
);

CREATE TYPE file_type AS ENUM (
  'manuscript_main', 
  'manuscript_anonymized', 
  'figure', 
  'supplementary', 
  'revision', 
  'cover_letter'
);

CREATE TYPE review_recommendation AS ENUM (
  'accept', 
  'minor_revisions', 
  'major_revisions', 
  'reject'
);

CREATE TYPE assignment_status AS ENUM (
  'invited', 
  'accepted', 
  'declined', 
  'completed', 
  'expired'
);

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  affiliation TEXT,
  orcid TEXT,
  role user_role DEFAULT 'author',
  expertise TEXT[],
  bio TEXT,
  avatar_url TEXT,
  h_index INTEGER,
  total_publications INTEGER DEFAULT 0,
  linkedin_url TEXT,
  twitter_handle TEXT,
  website_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Manuscripts table
CREATE TABLE manuscripts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  abstract TEXT NOT NULL,
  keywords TEXT[],
  field_of_study TEXT NOT NULL,
  subfield TEXT,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  corresponding_author_id UUID REFERENCES profiles(id),
  editor_id UUID REFERENCES profiles(id),
  status manuscript_status DEFAULT 'draft',
  submission_number TEXT UNIQUE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  doi TEXT UNIQUE,
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  citation_count INTEGER DEFAULT 0,
  cover_letter TEXT,
  suggested_reviewers JSONB,
  excluded_reviewers JSONB,
  funding_statement TEXT,
  conflict_of_interest TEXT,
  data_availability TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index for faster searches
CREATE INDEX idx_manuscripts_status ON manuscripts(status);
CREATE INDEX idx_manuscripts_author ON manuscripts(author_id);
CREATE INDEX idx_manuscripts_editor ON manuscripts(editor_id);
CREATE INDEX idx_manuscripts_field ON manuscripts(field_of_study);
CREATE INDEX idx_manuscripts_published_at ON manuscripts(published_at DESC);

-- Manuscript files table
CREATE TABLE manuscript_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  manuscript_id UUID REFERENCES manuscripts(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type file_type NOT NULL,
  mime_type TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  uploaded_by UUID REFERENCES profiles(id) NOT NULL
);

CREATE INDEX idx_manuscript_files_manuscript ON manuscript_files(manuscript_id);
CREATE INDEX idx_manuscript_files_type ON manuscript_files(file_type);

-- Co-authors table
CREATE TABLE manuscript_coauthors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  manuscript_id UUID REFERENCES manuscripts(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  affiliation TEXT,
  orcid TEXT,
  author_order INTEGER NOT NULL,
  is_corresponding BOOLEAN DEFAULT FALSE,
  contribution_statement TEXT
);

CREATE INDEX idx_coauthors_manuscript ON manuscript_coauthors(manuscript_id);

-- Reviews table
CREATE TABLE reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  manuscript_id UUID REFERENCES manuscripts(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) NOT NULL,
  recommendation review_recommendation NOT NULL,
  summary TEXT NOT NULL,
  major_comments TEXT NOT NULL,
  minor_comments TEXT,
  comments_for_editor TEXT,
  review_quality_score INTEGER CHECK (review_quality_score >= 1 AND review_quality_score <= 5),
  confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
  time_spent_hours DECIMAL(4,2),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  round INTEGER DEFAULT 1
);

CREATE INDEX idx_reviews_manuscript ON reviews(manuscript_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);

-- Review assignments table
CREATE TABLE review_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  manuscript_id UUID REFERENCES manuscripts(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) NOT NULL,
  assigned_by UUID REFERENCES profiles(id) NOT NULL,
  status assignment_status DEFAULT 'invited',
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  responded_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  due_date DATE NOT NULL,
  reminder_count INTEGER DEFAULT 0,
  last_reminder_at TIMESTAMP WITH TIME ZONE,
  decline_reason TEXT,
  UNIQUE(manuscript_id, reviewer_id)
);

CREATE INDEX idx_assignments_manuscript ON review_assignments(manuscript_id);
CREATE INDEX idx_assignments_reviewer ON review_assignments(reviewer_id);
CREATE INDEX idx_assignments_status ON review_assignments(status);

-- Payments table
CREATE TABLE payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  manuscript_id UUID REFERENCES manuscripts(id) ON DELETE CASCADE NOT NULL,
  stripe_charge_id TEXT UNIQUE NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL,
  receipt_url TEXT,
  invoice_url TEXT,
  billing_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_payments_manuscript ON payments(manuscript_id);
CREATE INDEX idx_payments_stripe_intent ON payments(stripe_payment_intent_id);

-- Editorial decisions table
CREATE TABLE editorial_decisions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  manuscript_id UUID REFERENCES manuscripts(id) ON DELETE CASCADE NOT NULL,
  editor_id UUID REFERENCES profiles(id) NOT NULL,
  decision manuscript_status NOT NULL,
  decision_letter TEXT NOT NULL,
  internal_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_decisions_manuscript ON editorial_decisions(manuscript_id);

-- Activity log table
CREATE TABLE activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  manuscript_id UUID REFERENCES manuscripts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_activity_manuscript ON activity_logs(manuscript_id);
CREATE INDEX idx_activity_user ON activity_logs(user_id);
CREATE INDEX idx_activity_created ON activity_logs(created_at DESC);

-- Notifications table
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Fields of study table
CREATE TABLE fields_of_study (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES fields_of_study(id),
  description TEXT,
  icon TEXT,
  color TEXT,
  manuscript_count INTEGER DEFAULT 0
);

CREATE INDEX idx_fields_parent ON fields_of_study(parent_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manuscripts_updated_at BEFORE UPDATE ON manuscripts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();