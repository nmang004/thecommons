-- Reviewer Applications System Migration
-- This migration creates the reviewer application system for Auth0-integrated platform

-- Create reviewer applications table
CREATE TABLE IF NOT EXISTS reviewer_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    auth0_user_id TEXT NOT NULL, -- Auth0 user ID for direct reference
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
    
    -- Application data
    expertise_areas TEXT[] NOT NULL DEFAULT '{}',
    motivation TEXT NOT NULL,
    cv_url TEXT,
    additional_info TEXT DEFAULT '',
    preferred_review_frequency VARCHAR(20) DEFAULT 'moderate' CHECK (preferred_review_frequency IN ('light', 'moderate', 'heavy')),
    areas_of_interest TEXT[] DEFAULT '{}',
    language_preferences TEXT[] DEFAULT ARRAY['English'],
    
    -- References (stored as JSONB)
    references JSONB NOT NULL DEFAULT '[]',
    
    -- Application tracking
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES profiles(id),
    rejection_reason TEXT,
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviewer_applications_user_id ON reviewer_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_reviewer_applications_auth0_user_id ON reviewer_applications(auth0_user_id);
CREATE INDEX IF NOT EXISTS idx_reviewer_applications_status ON reviewer_applications(status);
CREATE INDEX IF NOT EXISTS idx_reviewer_applications_applied_at ON reviewer_applications(applied_at);

-- Create storage bucket for reviewer documents (CVs, etc.)
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'reviewer-documents',
        'reviewer-documents',
        true,
        10485760, -- 10MB limit
        ARRAY['application/pdf']
    ) ON CONFLICT (id) DO NOTHING;
END $$;

-- RLS policies for reviewer applications
ALTER TABLE reviewer_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users can view own applications" ON reviewer_applications
    FOR SELECT USING (auth0_user_id = auth.jwt() ->> 'sub');

-- Users can insert their own applications
CREATE POLICY "Users can create applications" ON reviewer_applications
    FOR INSERT WITH CHECK (auth0_user_id = auth.jwt() ->> 'sub');

-- Users can update their own pending applications
CREATE POLICY "Users can update own pending applications" ON reviewer_applications
    FOR UPDATE USING (
        auth0_user_id = auth.jwt() ->> 'sub' 
        AND status = 'pending'
    );

-- Editors and admins can view all applications
CREATE POLICY "Editors can view all applications" ON reviewer_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE auth0_id = auth.jwt() ->> 'sub' 
            AND role IN ('editor', 'admin')
        )
    );

-- Editors and admins can update application status
CREATE POLICY "Editors can update applications" ON reviewer_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE auth0_id = auth.jwt() ->> 'sub' 
            AND role IN ('editor', 'admin')
        )
    );

-- Storage policies for reviewer documents
CREATE POLICY "Users can upload own documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'reviewer-documents'
        AND name LIKE 'cv_' || (auth.jwt() ->> 'sub') || '_%'
    );

CREATE POLICY "Users can view own documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'reviewer-documents'
        AND (
            name LIKE 'cv_' || (auth.jwt() ->> 'sub') || '_%'
            OR EXISTS (
                SELECT 1 FROM profiles 
                WHERE auth0_id = auth.jwt() ->> 'sub' 
                AND role IN ('editor', 'admin')
            )
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_reviewer_applications_updated_at
    BEFORE UPDATE ON reviewer_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to get pending applications count (for admin dashboard)
CREATE OR REPLACE FUNCTION get_pending_applications_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER 
        FROM reviewer_applications 
        WHERE status = 'pending'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get application statistics
CREATE OR REPLACE FUNCTION get_application_statistics()
RETURNS TABLE(
    total_applications BIGINT,
    pending_applications BIGINT,
    approved_applications BIGINT,
    rejected_applications BIGINT,
    avg_review_time_days NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_applications,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_applications,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_applications,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_applications,
        AVG(
            CASE 
                WHEN reviewed_at IS NOT NULL AND applied_at IS NOT NULL 
                THEN EXTRACT(EPOCH FROM (reviewed_at - applied_at)) / 86400.0 
                ELSE NULL 
            END
        ) as avg_review_time_days
    FROM reviewer_applications;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for application summary (for admin use)
CREATE OR REPLACE VIEW reviewer_applications_summary AS
SELECT 
    ra.id,
    ra.status,
    ra.applied_at,
    ra.reviewed_at,
    p.full_name as applicant_name,
    p.email as applicant_email,
    p.affiliation,
    ra.expertise_areas,
    ra.preferred_review_frequency,
    reviewer.full_name as reviewed_by_name,
    CASE 
        WHEN ra.reviewed_at IS NOT NULL AND ra.applied_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (ra.reviewed_at - ra.applied_at)) / 86400.0 
        ELSE NULL 
    END as review_time_days
FROM reviewer_applications ra
JOIN profiles p ON ra.user_id = p.id
LEFT JOIN profiles reviewer ON ra.reviewed_by = reviewer.id
ORDER BY ra.applied_at DESC;

-- Grant permissions
GRANT SELECT ON reviewer_applications_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_applications_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_application_statistics() TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE reviewer_applications IS 'Stores reviewer applications with Auth0 integration';
COMMENT ON COLUMN reviewer_applications.auth0_user_id IS 'Auth0 user ID for direct Auth0 integration';
COMMENT ON COLUMN reviewer_applications.references IS 'Professional references stored as JSONB array';
COMMENT ON COLUMN reviewer_applications.expertise_areas IS 'Array of expertise areas selected by applicant';
COMMENT ON VIEW reviewer_applications_summary IS 'Summary view of applications for admin dashboard';