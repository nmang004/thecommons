-- Advanced Invitation Templates and Tracking System
-- Migration 014: Invitation management and analytics

-- Create invitation templates table
CREATE TABLE invitation_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'standard', -- standard, urgent, resubmission, special_issue
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  variables JSONB, -- Available template variables and descriptions
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  is_system_template BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create invitation tracking table
CREATE TABLE invitation_tracking (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  assignment_id UUID REFERENCES review_assignments(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES invitation_templates(id),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  sent_by UUID REFERENCES profiles(id) NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  delivery_status TEXT DEFAULT 'sent', -- sent, delivered, bounced, failed
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  response_type TEXT, -- accepted, declined, no_response
  reminder_count INTEGER DEFAULT 0,
  last_reminder_at TIMESTAMP WITH TIME ZONE,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  metadata JSONB, -- tracking data, custom fields, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create invitation reminders table
CREATE TABLE invitation_reminders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invitation_id UUID REFERENCES invitation_tracking(id) ON DELETE CASCADE NOT NULL,
  reminder_type TEXT NOT NULL, -- first_reminder, second_reminder, final_reminder
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  template_id UUID REFERENCES invitation_templates(id),
  status TEXT DEFAULT 'pending', -- pending, sent, cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create invitation analytics aggregation table
CREATE TABLE invitation_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  template_id UUID REFERENCES invitation_templates(id),
  field_of_study TEXT,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_accepted INTEGER DEFAULT 0,
  total_declined INTEGER DEFAULT 0,
  avg_response_time_hours DECIMAL(8,2),
  acceptance_rate DECIMAL(5,4),
  open_rate DECIMAL(5,4),
  click_rate DECIMAL(5,4),
  bounce_rate DECIMAL(5,4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  UNIQUE(period_start, period_end, template_id, field_of_study)
);

-- Create indexes for performance
CREATE INDEX idx_invitation_templates_category ON invitation_templates(category);
CREATE INDEX idx_invitation_templates_active ON invitation_templates(is_active);

CREATE INDEX idx_invitation_tracking_assignment ON invitation_tracking(assignment_id);
CREATE INDEX idx_invitation_tracking_template ON invitation_tracking(template_id);
CREATE INDEX idx_invitation_tracking_sent_at ON invitation_tracking(sent_at);
CREATE INDEX idx_invitation_tracking_status ON invitation_tracking(delivery_status);
CREATE INDEX idx_invitation_tracking_response ON invitation_tracking(response_type);

CREATE INDEX idx_invitation_reminders_scheduled ON invitation_reminders(scheduled_for);
CREATE INDEX idx_invitation_reminders_status ON invitation_reminders(status);

CREATE INDEX idx_invitation_analytics_period ON invitation_analytics(period_start, period_end);
CREATE INDEX idx_invitation_analytics_template ON invitation_analytics(template_id);

-- Insert default system templates
INSERT INTO invitation_templates (id, name, category, subject_template, body_template, variables, is_system_template, created_at) VALUES
(
  'standard-001',
  'Standard Review Request',
  'standard',
  'Invitation to Review: {{manuscript_title}}',
  'Dear {{reviewer_name}},

I hope this message finds you well. I am writing to invite you to serve as a reviewer for a manuscript submitted to {{journal_name}}.

**Manuscript Details:**
- Title: {{manuscript_title}}
- Field: {{field_of_study}}
- Abstract: {{abstract_preview}}
- Submission ID: {{submission_number}}

**Review Timeline:**
- Due Date: {{due_date}}
- Expected Time Commitment: {{estimated_hours}} hours

Your expertise in {{reviewer_expertise}} makes you an ideal candidate to evaluate this work. The review process is {{review_type}}, and your identity will remain confidential to the authors.

Please confirm your availability by {{response_deadline}} through your reviewer dashboard or by clicking the links below:

[Accept Review] {{accept_link}}
[Decline Review] {{decline_link}}

If you have any questions about the manuscript or the review process, please don''t hesitate to contact me.

Thank you for considering this request and for your continued contribution to scholarly publishing.

Best regards,
{{editor_name}}
{{editor_title}}
{{journal_name}}

---
{{custom_message}}',
  '{
    "reviewer_name": "Reviewer''s full name",
    "manuscript_title": "Title of the manuscript",
    "journal_name": "Journal name",
    "field_of_study": "Primary field of study",
    "abstract_preview": "First 200 characters of abstract",
    "submission_number": "Manuscript submission number",
    "due_date": "Review due date",
    "estimated_hours": "Estimated time for review",
    "reviewer_expertise": "Relevant expertise areas",
    "review_type": "Review type (double-blind, single-blind, etc.)",
    "response_deadline": "Deadline for accepting/declining",
    "accept_link": "Link to accept review",
    "decline_link": "Link to decline review",
    "editor_name": "Editor''s name",
    "editor_title": "Editor''s title",
    "custom_message": "Additional custom message"
  }',
  TRUE,
  NOW()
),
(
  'urgent-001',
  'Urgent Review Request',
  'urgent',
  'URGENT: Review Invitation - {{manuscript_title}}',
  'Dear {{reviewer_name}},

I hope you are well. I am reaching out with an urgent request for your expertise as a reviewer.

**Manuscript Details:**
- Title: {{manuscript_title}}
- Field: {{field_of_study}}
- **Due Date: {{due_date}}** (expedited timeline)
- Reason for urgency: {{urgency_reason}}

Due to the time-sensitive nature of this manuscript and its potential impact in {{field_of_study}}, we are working with an accelerated review timeline.

Your specialized knowledge in {{reviewer_expertise}} is particularly valuable for this evaluation. The review should take approximately {{estimated_hours}} hours.

**Expedited Process:**
- Manuscript available immediately upon acceptance
- Direct contact with editor for any questions
- Priority support for technical issues

If you are available to complete this review by {{due_date}}, please confirm as soon as possible:

[Accept Urgent Review] {{accept_link}}
[Decline Review] {{decline_link}}

If you cannot accommodate this timeline, please let us know immediately so we can arrange alternative reviewers.

Thank you for your understanding and support.

Best regards,
{{editor_name}}
{{editor_title}}
{{journal_name}}

---
{{custom_message}}',
  '{
    "reviewer_name": "Reviewer''s full name",
    "manuscript_title": "Title of the manuscript",
    "field_of_study": "Primary field of study",
    "due_date": "Review due date",
    "urgency_reason": "Reason for urgent review",
    "reviewer_expertise": "Relevant expertise areas",
    "estimated_hours": "Estimated time for review",
    "accept_link": "Link to accept review",
    "decline_link": "Link to decline review",
    "editor_name": "Editor''s name",
    "editor_title": "Editor''s title",
    "journal_name": "Journal name",
    "custom_message": "Additional custom message"
  }',
  TRUE,
  NOW()
),
(
  'reminder-001',
  'Review Invitation Reminder',
  'reminder',
  'Reminder: Review Invitation - {{manuscript_title}}',
  'Dear {{reviewer_name}},

I hope this message finds you well. This is a friendly reminder about the review invitation we sent on {{original_invitation_date}} for the manuscript "{{manuscript_title}}".

**Manuscript Details:**
- Title: {{manuscript_title}}
- Field: {{field_of_study}}
- Due Date: {{due_date}} ({{days_remaining}} days remaining)

We understand that you may be busy, but we would greatly appreciate your response at your earliest convenience. Your expertise in {{reviewer_expertise}} would be invaluable for this manuscript.

**Quick Response Options:**
[Accept Review] {{accept_link}}
[Decline Review] {{decline_link}}
[Request Extension] {{extension_link}}

If you need more information about the manuscript or have any questions, please feel free to contact me directly.

Thank you for your time and consideration.

Best regards,
{{editor_name}}
{{editor_title}}
{{journal_name}}',
  '{
    "reviewer_name": "Reviewer''s full name",
    "manuscript_title": "Title of the manuscript",
    "original_invitation_date": "Date of original invitation",
    "field_of_study": "Primary field of study",
    "due_date": "Review due date",
    "days_remaining": "Days remaining until due date",
    "reviewer_expertise": "Relevant expertise areas",
    "accept_link": "Link to accept review",
    "decline_link": "Link to decline review",
    "extension_link": "Link to request extension",
    "editor_name": "Editor''s name",
    "editor_title": "Editor''s title",
    "journal_name": "Journal name"
  }',
  TRUE,
  NOW()
);

-- Function to render template with variables
CREATE OR REPLACE FUNCTION render_invitation_template(
  template_id_param UUID,
  variables_param JSONB
) RETURNS TABLE (
  rendered_subject TEXT,
  rendered_body TEXT
) AS $$
DECLARE
  template_record RECORD;
  rendered_subject_text TEXT;
  rendered_body_text TEXT;
  var_key TEXT;
  var_value TEXT;
BEGIN
  -- Get the template
  SELECT subject_template, body_template INTO template_record
  FROM invitation_templates
  WHERE id = template_id_param AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found or inactive: %', template_id_param;
  END IF;
  
  -- Start with template text
  rendered_subject_text := template_record.subject_template;
  rendered_body_text := template_record.body_template;
  
  -- Replace variables
  FOR var_key, var_value IN SELECT key, value FROM jsonb_each_text(variables_param)
  LOOP
    rendered_subject_text := REPLACE(rendered_subject_text, '{{' || var_key || '}}', COALESCE(var_value, ''));
    rendered_body_text := REPLACE(rendered_body_text, '{{' || var_key || '}}', COALESCE(var_value, ''));
  END LOOP;
  
  -- Clean up any remaining placeholders
  rendered_subject_text := REGEXP_REPLACE(rendered_subject_text, '\{\{[^}]+\}\}', '', 'g');
  rendered_body_text := REGEXP_REPLACE(rendered_body_text, '\{\{[^}]+\}\}', '', 'g');
  
  RETURN QUERY SELECT rendered_subject_text, rendered_body_text;
END;
$$ LANGUAGE plpgsql;

-- Function to schedule automatic reminders
CREATE OR REPLACE FUNCTION schedule_invitation_reminders(
  invitation_id_param UUID,
  initial_due_date DATE
) RETURNS void AS $$
DECLARE
  reminder_schedule INTEGER[] := ARRAY[7, 3, 1]; -- Days before due date
  reminder_types TEXT[] := ARRAY['first_reminder', 'second_reminder', 'final_reminder'];
  i INTEGER;
BEGIN
  FOR i IN 1..array_length(reminder_schedule, 1)
  LOOP
    INSERT INTO invitation_reminders (
      invitation_id,
      reminder_type,
      scheduled_for,
      template_id
    ) VALUES (
      invitation_id_param,
      reminder_types[i],
      (initial_due_date - INTERVAL '1 day' * reminder_schedule[i])::timestamp with time zone,
      'reminder-001'::uuid
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate invitation analytics
CREATE OR REPLACE FUNCTION calculate_invitation_analytics(
  start_date_param DATE,
  end_date_param DATE
) RETURNS void AS $$
DECLARE
  template_record RECORD;
  field_record RECORD;
BEGIN
  -- Calculate analytics for each template and field combination
  FOR template_record IN 
    SELECT DISTINCT template_id FROM invitation_tracking 
    WHERE sent_at >= start_date_param AND sent_at <= end_date_param
  LOOP
    FOR field_record IN
      SELECT DISTINCT m.field_of_study
      FROM invitation_tracking it
      JOIN review_assignments ra ON it.assignment_id = ra.id
      JOIN manuscripts m ON ra.manuscript_id = m.id
      WHERE it.template_id = template_record.template_id
        AND it.sent_at >= start_date_param 
        AND it.sent_at <= end_date_param
    LOOP
      INSERT INTO invitation_analytics (
        period_start,
        period_end,
        template_id,
        field_of_study,
        total_sent,
        total_delivered,
        total_opened,
        total_clicked,
        total_accepted,
        total_declined,
        avg_response_time_hours,
        acceptance_rate,
        open_rate,
        click_rate,
        bounce_rate
      )
      SELECT 
        start_date_param,
        end_date_param,
        template_record.template_id,
        field_record.field_of_study,
        COUNT(*) as total_sent,
        COUNT(*) FILTER (WHERE delivery_status = 'delivered') as total_delivered,
        COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as total_opened,
        COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) as total_clicked,
        COUNT(*) FILTER (WHERE response_type = 'accepted') as total_accepted,
        COUNT(*) FILTER (WHERE response_type = 'declined') as total_declined,
        AVG(EXTRACT(epoch FROM (responded_at - sent_at))/3600) FILTER (WHERE responded_at IS NOT NULL) as avg_response_time_hours,
        CASE WHEN COUNT(*) > 0 THEN 
          COUNT(*) FILTER (WHERE response_type = 'accepted')::decimal / COUNT(*)::decimal 
        ELSE 0 END as acceptance_rate,
        CASE WHEN COUNT(*) FILTER (WHERE delivery_status = 'delivered') > 0 THEN
          COUNT(*) FILTER (WHERE opened_at IS NOT NULL)::decimal / COUNT(*) FILTER (WHERE delivery_status = 'delivered')::decimal
        ELSE 0 END as open_rate,
        CASE WHEN COUNT(*) FILTER (WHERE opened_at IS NOT NULL) > 0 THEN
          COUNT(*) FILTER (WHERE clicked_at IS NOT NULL)::decimal / COUNT(*) FILTER (WHERE opened_at IS NOT NULL)::decimal
        ELSE 0 END as click_rate,
        CASE WHEN COUNT(*) > 0 THEN
          COUNT(*) FILTER (WHERE delivery_status = 'bounced')::decimal / COUNT(*)::decimal
        ELSE 0 END as bounce_rate
      FROM invitation_tracking it
      JOIN review_assignments ra ON it.assignment_id = ra.id
      JOIN manuscripts m ON ra.manuscript_id = m.id
      WHERE it.template_id = template_record.template_id
        AND m.field_of_study = field_record.field_of_study
        AND it.sent_at >= start_date_param 
        AND it.sent_at <= end_date_param
      ON CONFLICT (period_start, period_end, template_id, field_of_study)
      DO UPDATE SET
        total_sent = EXCLUDED.total_sent,
        total_delivered = EXCLUDED.total_delivered,
        total_opened = EXCLUDED.total_opened,
        total_clicked = EXCLUDED.total_clicked,
        total_accepted = EXCLUDED.total_accepted,
        total_declined = EXCLUDED.total_declined,
        avg_response_time_hours = EXCLUDED.avg_response_time_hours,
        acceptance_rate = EXCLUDED.acceptance_rate,
        open_rate = EXCLUDED.open_rate,
        click_rate = EXCLUDED.click_rate,
        bounce_rate = EXCLUDED.bounce_rate,
        updated_at = TIMEZONE('utc', NOW());
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_invitation_templates_updated_at BEFORE UPDATE ON invitation_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invitation_analytics_updated_at BEFORE UPDATE ON invitation_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update template usage count
CREATE OR REPLACE FUNCTION update_template_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE invitation_templates 
  SET usage_count = usage_count + 1 
  WHERE id = NEW.template_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_template_usage_trigger
  AFTER INSERT ON invitation_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_template_usage_count();