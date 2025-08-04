-- Editorial Templates System
-- This migration creates the editorial_templates table and related functionality

-- Create editorial_templates table
CREATE TABLE editorial_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('accept', 'minor_revision', 'major_revision', 'reject', 'desk_reject')),
  decision_type manuscript_status NOT NULL,
  template_content JSONB NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  usage_count INTEGER DEFAULT 0,
  tags TEXT[],
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX idx_editorial_templates_category ON editorial_templates(category);
CREATE INDEX idx_editorial_templates_decision_type ON editorial_templates(decision_type);
CREATE INDEX idx_editorial_templates_created_by ON editorial_templates(created_by);
CREATE INDEX idx_editorial_templates_is_public ON editorial_templates(is_public);
CREATE INDEX idx_editorial_templates_tags ON editorial_templates USING GIN(tags);
CREATE INDEX idx_editorial_templates_usage_count ON editorial_templates(usage_count DESC);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_editorial_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_editorial_templates_updated_at
    BEFORE UPDATE ON editorial_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_editorial_templates_updated_at();

-- Add foreign key constraint for template_id in editorial_decisions
ALTER TABLE editorial_decisions 
ADD CONSTRAINT fk_editorial_decisions_template 
FOREIGN KEY (template_id) REFERENCES editorial_templates(id) ON DELETE SET NULL;

-- Insert default templates
INSERT INTO editorial_templates (name, category, decision_type, template_content, is_public, created_by, description) VALUES 
(
  'Standard Acceptance',
  'accept',
  'accepted',
  '{
    "sections": [
      {
        "id": "greeting",
        "type": "text",
        "content": "Dear {{author_name}},",
        "required": true,
        "order": 1
      },
      {
        "id": "decision",
        "type": "text", 
        "content": "I am pleased to inform you that your manuscript \"{{manuscript_title}}\" has been accepted for publication in our journal.",
        "required": true,
        "order": 2
      },
      {
        "id": "review_summary",
        "type": "review_summary",
        "content": "The reviewers found your work to be of high quality and a valuable contribution to the field.",
        "required": false,
        "order": 3
      },
      {
        "id": "next_steps",
        "type": "next_steps",
        "content": "Your manuscript will now proceed to the production stage. You will receive further instructions regarding copyediting and proofs in due course.",
        "required": true,
        "order": 4
      },
      {
        "id": "closing",
        "type": "text",
        "content": "Congratulations on this achievement.\n\nBest regards,\n{{editor_name}}\nEditor-in-Chief",
        "required": true,
        "order": 5
      }
    ],
    "variables": ["author_name", "manuscript_title", "editor_name"],
    "defaultActions": {
      "notifyAuthor": true,
      "notifyReviewers": true,
      "schedulePublication": true,
      "generateDOI": true,
      "sendToProduction": true
    }
  }',
  true,
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
  'Standard template for accepting manuscripts without revisions'
),
(
  'Major Revisions Required',
  'major_revision',
  'revisions_requested',
  '{
    "sections": [
      {
        "id": "greeting",
        "type": "text",
        "content": "Dear {{author_name}},",
        "required": true,
        "order": 1
      },
      {
        "id": "decision",
        "type": "text",
        "content": "Thank you for submitting your manuscript \"{{manuscript_title}}\" to our journal. After careful consideration and peer review, I am writing to inform you that your manuscript requires major revisions before it can be considered for publication.",
        "required": true,
        "order": 2
      },
      {
        "id": "review_summary",
        "type": "review_summary", 
        "content": "The reviewers have identified several important issues that need to be addressed:",
        "required": true,
        "order": 3
      },
      {
        "id": "conditions",
        "type": "conditions",
        "content": "Please carefully consider all comments and provide a detailed response to each point.",
        "required": true,
        "order": 4
      },
      {
        "id": "deadline",
        "type": "text",
        "content": "Revised manuscripts should be submitted within 60 days.",
        "required": true,
        "order": 5
      },
      {
        "id": "closing",
        "type": "text",
        "content": "I look forward to receiving your revised submission.\n\nBest regards,\n{{editor_name}}",
        "required": true,
        "order": 6
      }
    ],
    "variables": ["author_name", "manuscript_title", "editor_name"],
    "defaultActions": {
      "notifyAuthor": true,
      "notifyReviewers": false,
      "daysUntilFollowUp": 45
    }
  }',
  true,
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
  'Template for requesting major revisions from authors'
),
(
  'Standard Rejection',
  'reject',
  'rejected',
  '{
    "sections": [
      {
        "id": "greeting",
        "type": "text",
        "content": "Dear {{author_name}},",
        "required": true,
        "order": 1
      },
      {
        "id": "decision",
        "type": "text",
        "content": "Thank you for submitting your manuscript \"{{manuscript_title}}\" to our journal. After careful consideration and peer review, I regret to inform you that we cannot accept your manuscript for publication in our journal.",
        "required": true,
        "order": 2
      },
      {
        "id": "review_summary",
        "type": "review_summary",
        "content": "The reviewers'' comments are provided below for your consideration:",
        "required": true,
        "order": 3
      },
      {
        "id": "encouragement",
        "type": "text",
        "content": "While your work was not suitable for our journal, the reviewers' feedback may be helpful if you decide to submit to another publication.",
        "required": false,
        "order": 4
      },
      {
        "id": "closing",
        "type": "text",
        "content": "Thank you for considering our journal for your research.\n\nBest regards,\n{{editor_name}}",
        "required": true,
        "order": 5
      }
    ],
    "variables": ["author_name", "manuscript_title", "editor_name"],
    "defaultActions": {
      "notifyAuthor": true,
      "notifyReviewers": true
    }
  }',
  true,
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
  'Standard template for rejecting manuscripts'
);

-- Enable Row Level Security
ALTER TABLE editorial_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for editorial_templates
CREATE POLICY "Public templates are viewable by all authenticated users"
  ON editorial_templates FOR SELECT
  USING (auth.role() = 'authenticated' AND is_public = true);

CREATE POLICY "Users can view their own templates"
  ON editorial_templates FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Editors and admins can view all templates"
  ON editorial_templates FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('editor', 'admin')
  ));

CREATE POLICY "Editors and admins can create templates"
  ON editorial_templates FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('editor', 'admin')
  ));

CREATE POLICY "Users can update their own templates"
  ON editorial_templates FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can update any template"
  ON editorial_templates FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ));

CREATE POLICY "Users can delete their own templates"
  ON editorial_templates FOR DELETE
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can delete any template"
  ON editorial_templates FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ));

-- Add comments for documentation
COMMENT ON TABLE editorial_templates IS 'Templates for editorial decision letters with structured content and automation';
COMMENT ON COLUMN editorial_templates.template_content IS 'Structured template content with sections, variables, and default actions';
COMMENT ON COLUMN editorial_templates.category IS 'Template category for organization and filtering';
COMMENT ON COLUMN editorial_templates.decision_type IS 'The manuscript status this template is designed for';
COMMENT ON COLUMN editorial_templates.usage_count IS 'Number of times this template has been used';
COMMENT ON COLUMN editorial_templates.tags IS 'Tags for template categorization and search';
COMMENT ON COLUMN editorial_templates.is_public IS 'Whether this template is available to all editors or just the creator';