-- Enhanced Editorial Decisions System
-- This migration enhances the editorial_decisions table with advanced components and workflow support

-- Add new columns to editorial_decisions table
ALTER TABLE editorial_decisions 
ADD COLUMN components JSONB,
ADD COLUMN template_id UUID,
ADD COLUMN template_version INTEGER,
ADD COLUMN actions JSONB,
ADD COLUMN draft_data JSONB,
ADD COLUMN version INTEGER DEFAULT 1,
ADD COLUMN is_draft BOOLEAN DEFAULT FALSE,
ADD COLUMN submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());

-- Add index for better query performance
CREATE INDEX idx_editorial_decisions_template_id ON editorial_decisions(template_id);
CREATE INDEX idx_editorial_decisions_manuscript_version ON editorial_decisions(manuscript_id, version);
CREATE INDEX idx_editorial_decisions_is_draft ON editorial_decisions(is_draft);
CREATE INDEX idx_editorial_decisions_submitted_at ON editorial_decisions(submitted_at);

-- Add constraints
ALTER TABLE editorial_decisions 
ADD CONSTRAINT chk_version_positive CHECK (version > 0);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_editorial_decisions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_editorial_decisions_updated_at
    BEFORE UPDATE ON editorial_decisions
    FOR EACH ROW
    EXECUTE FUNCTION update_editorial_decisions_updated_at();

-- Add comments for documentation
COMMENT ON COLUMN editorial_decisions.components IS 'Structured decision components including editor summary, author letter, reviewer comments, etc.';
COMMENT ON COLUMN editorial_decisions.template_id IS 'Reference to the template used for this decision';
COMMENT ON COLUMN editorial_decisions.template_version IS 'Version of the template used';
COMMENT ON COLUMN editorial_decisions.actions IS 'Post-decision actions configuration';
COMMENT ON COLUMN editorial_decisions.draft_data IS 'Temporary data for decision drafts';
COMMENT ON COLUMN editorial_decisions.version IS 'Version number for decision versioning';
COMMENT ON COLUMN editorial_decisions.is_draft IS 'Whether this decision is still a draft';
COMMENT ON COLUMN editorial_decisions.submitted_at IS 'When the final decision was submitted (not draft)';