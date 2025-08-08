-- Enhanced Review Submission Interface Schema
-- This migration adds comprehensive review capabilities including drafts, annotations, and templates

-- Review drafts table for auto-saving work in progress
CREATE TABLE IF NOT EXISTS review_drafts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    manuscript_id UUID REFERENCES manuscripts(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    assignment_id UUID REFERENCES review_assignments(id) ON DELETE CASCADE,
    
    -- Review form data stored as JSONB for flexibility
    form_data JSONB DEFAULT '{}'::jsonb,
    
    -- Progress tracking
    completion_percentage DECIMAL(3,1) DEFAULT 0.0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    time_spent_minutes INTEGER DEFAULT 0,
    sections_completed TEXT[] DEFAULT '{}',
    
    -- Auto-save metadata
    last_saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one draft per reviewer per manuscript
    UNIQUE(manuscript_id, reviewer_id)
);

-- Review annotations for PDF inline commenting
CREATE TABLE IF NOT EXISTS review_annotations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    draft_id UUID REFERENCES review_drafts(id) ON DELETE CASCADE,
    
    -- Annotation data
    annotation_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    annotation_type VARCHAR(50) DEFAULT 'comment' CHECK (annotation_type IN ('comment', 'highlight', 'drawing', 'sticky_note')),
    
    -- Position and content
    page_number INTEGER NOT NULL,
    position JSONB, -- { x, y, width, height }
    highlighted_text TEXT,
    comment_text TEXT,
    
    -- Categorization
    category VARCHAR(50) CHECK (category IN ('major', 'minor', 'suggestion', 'positive', 'question')),
    is_resolved BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Either belongs to a review or a draft, not both
    CONSTRAINT annotation_belongs_to_review_or_draft CHECK (
        (review_id IS NOT NULL AND draft_id IS NULL) OR 
        (review_id IS NULL AND draft_id IS NOT NULL)
    )
);

-- Review templates for field-specific rubrics
CREATE TABLE IF NOT EXISTS review_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    field_of_study VARCHAR(100),
    
    -- Template structure
    template_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Template metadata
    is_public BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    usage_count INTEGER DEFAULT 0,
    
    -- Version control
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhance existing reviews table with structured data
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS form_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES review_templates(id) ON DELETE SET NULL;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS draft_id UUID REFERENCES review_drafts(id) ON DELETE SET NULL;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_collaborative BOOLEAN DEFAULT FALSE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS co_reviewers UUID[] DEFAULT '{}';

-- Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_review_drafts_manuscript_reviewer ON review_drafts(manuscript_id, reviewer_id);
CREATE INDEX IF NOT EXISTS idx_review_drafts_assignment ON review_drafts(assignment_id);
CREATE INDEX IF NOT EXISTS idx_review_drafts_last_saved ON review_drafts(last_saved_at);

CREATE INDEX IF NOT EXISTS idx_review_annotations_review ON review_annotations(review_id);
CREATE INDEX IF NOT EXISTS idx_review_annotations_draft ON review_annotations(draft_id);
CREATE INDEX IF NOT EXISTS idx_review_annotations_page ON review_annotations(page_number);
CREATE INDEX IF NOT EXISTS idx_review_annotations_type ON review_annotations(annotation_type);

CREATE INDEX IF NOT EXISTS idx_review_templates_field ON review_templates(field_of_study);
CREATE INDEX IF NOT EXISTS idx_review_templates_public ON review_templates(is_public, is_active);
CREATE INDEX IF NOT EXISTS idx_review_templates_created_by ON review_templates(created_by);

CREATE INDEX IF NOT EXISTS idx_reviews_template ON reviews(template_id);
CREATE INDEX IF NOT EXISTS idx_reviews_collaborative ON reviews(is_collaborative);

-- Update function for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_review_annotations_updated_at ON review_annotations;
CREATE TRIGGER update_review_annotations_updated_at
    BEFORE UPDATE ON review_annotations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_review_templates_updated_at ON review_templates;
CREATE TRIGGER update_review_templates_updated_at
    BEFORE UPDATE ON review_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate review draft completion percentage
CREATE OR REPLACE FUNCTION calculate_review_completion(draft_data JSONB)
RETURNS DECIMAL AS $$
DECLARE
    total_sections INTEGER := 5; -- summary, qualityAssessment, detailedComments, technicalReview, confidentialComments
    completed_sections INTEGER := 0;
BEGIN
    -- Check summary section
    IF draft_data ? 'summary' AND 
       draft_data->'summary'->>'recommendation' IS NOT NULL AND
       draft_data->'summary'->>'confidence' IS NOT NULL THEN
        completed_sections := completed_sections + 1;
    END IF;
    
    -- Check quality assessment section
    IF draft_data ? 'qualityAssessment' AND 
       jsonb_array_length(jsonb_object_keys(draft_data->'qualityAssessment')) >= 5 THEN
        completed_sections := completed_sections + 1;
    END IF;
    
    -- Check detailed comments section
    IF draft_data ? 'detailedComments' AND
       (draft_data->'detailedComments'->>'majorIssues' IS NOT NULL OR
        draft_data->'detailedComments'->>'minorIssues' IS NOT NULL) THEN
        completed_sections := completed_sections + 1;
    END IF;
    
    -- Technical review is optional, but if present, count it
    IF draft_data ? 'technicalReview' THEN
        completed_sections := completed_sections + 1;
    END IF;
    
    -- Confidential comments are optional
    IF draft_data ? 'confidentialComments' THEN
        completed_sections := completed_sections + 1;
    END IF;
    
    RETURN ROUND((completed_sections::DECIMAL / total_sections::DECIMAL) * 100, 1);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update completion percentage on draft save
CREATE OR REPLACE FUNCTION update_draft_completion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.completion_percentage := calculate_review_completion(NEW.form_data);
    NEW.last_saved_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_review_draft_completion ON review_drafts;
CREATE TRIGGER update_review_draft_completion
    BEFORE UPDATE ON review_drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_draft_completion();

-- RLS Policies for new tables
ALTER TABLE review_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_templates ENABLE ROW LEVEL SECURITY;

-- Review drafts: Only the assigned reviewer can access their draft
CREATE POLICY "review_drafts_reviewer_access" ON review_drafts
    FOR ALL USING (reviewer_id = auth.uid());

-- Review annotations: Access based on review ownership or draft ownership
CREATE POLICY "review_annotations_access" ON review_annotations
    FOR ALL USING (
        -- If attached to a review, check if user is the reviewer
        (review_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM reviews WHERE reviews.id = review_annotations.review_id AND reviews.reviewer_id = auth.uid()
        )) OR
        -- If attached to a draft, check if user owns the draft
        (draft_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM review_drafts WHERE review_drafts.id = review_annotations.draft_id AND review_drafts.reviewer_id = auth.uid()
        ))
    );

-- Review templates: Public templates accessible to all, private templates only to creator
CREATE POLICY "review_templates_access" ON review_templates
    FOR SELECT USING (
        is_public = TRUE OR 
        created_by = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor'))
    );

CREATE POLICY "review_templates_create" ON review_templates
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "review_templates_update" ON review_templates
    FOR UPDATE USING (
        created_by = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor'))
    );

-- Grant necessary permissions
GRANT ALL ON review_drafts TO authenticated;
GRANT ALL ON review_annotations TO authenticated;
GRANT ALL ON review_templates TO authenticated;

-- Add some default review templates
INSERT INTO review_templates (name, description, field_of_study, template_data, is_public, created_by) VALUES
(
    'General Research Article Template',
    'Standard template for general research articles across disciplines',
    'General',
    '{
        "sections": {
            "qualityAssessment": {
                "originality": {"weight": 20, "description": "How novel is this research?"},
                "significance": {"weight": 25, "description": "What is the impact and importance?"},
                "methodology": {"weight": 20, "description": "Are the methods appropriate and rigorous?"},
                "clarity": {"weight": 20, "description": "Is the writing clear and well-organized?"},
                "references": {"weight": 15, "description": "Is the literature review comprehensive?"}
            },
            "technicalReview": {
                "dataAvailability": {"required": true},
                "reproducibility": {"required": false},
                "statistics": {"required": false}
            }
        },
        "scoringScale": {
            "min": 1,
            "max": 5,
            "labels": ["Poor", "Fair", "Good", "Very Good", "Excellent"]
        }
    }',
    TRUE,
    NULL
),
(
    'Computational Research Template', 
    'Template for papers involving significant computational work',
    'Computer Science',
    '{
        "sections": {
            "qualityAssessment": {
                "originality": {"weight": 15, "description": "Novelty of approach/algorithm"},
                "significance": {"weight": 20, "description": "Potential impact on field"},
                "methodology": {"weight": 25, "description": "Technical soundness"},
                "clarity": {"weight": 15, "description": "Clarity of presentation"},
                "references": {"weight": 10, "description": "Literature coverage"},
                "reproducibility": {"weight": 15, "description": "Code and data availability"}
            },
            "technicalReview": {
                "codeAvailability": {"required": true},
                "dataAvailability": {"required": true},
                "reproducibility": {"required": true},
                "performance": {"required": true}
            }
        }
    }',
    TRUE,
    NULL
);