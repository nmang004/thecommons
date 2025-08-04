-- Database function for transactional editorial decision processing
-- This ensures atomicity of all decision-related database operations

CREATE OR REPLACE FUNCTION process_editorial_decision(
  p_manuscript_id UUID,
  p_editor_id UUID,
  p_decision manuscript_status,
  p_components JSONB,
  p_actions JSONB,
  p_template_id UUID DEFAULT NULL,
  p_template_version INTEGER DEFAULT NULL,
  p_is_draft BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_decision_id UUID;
  v_old_status manuscript_status;
  v_manuscript_exists BOOLEAN;
  v_editor_authorized BOOLEAN;
  v_result JSONB;
BEGIN
  -- Validate inputs
  IF p_manuscript_id IS NULL OR p_editor_id IS NULL OR p_decision IS NULL THEN
    RAISE EXCEPTION 'Missing required parameters';
  END IF;

  -- Check if manuscript exists and get current status
  SELECT status INTO v_old_status
  FROM manuscripts 
  WHERE id = p_manuscript_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Manuscript not found';
  END IF;

  -- Verify editor authorization
  SELECT EXISTS(
    SELECT 1 FROM profiles 
    WHERE id = p_editor_id 
    AND role IN ('editor', 'admin')
  ) INTO v_editor_authorized;

  IF NOT v_editor_authorized THEN
    RAISE EXCEPTION 'User not authorized to make editorial decisions';
  END IF;

  -- Begin transaction
  BEGIN
    -- Create the editorial decision record
    INSERT INTO editorial_decisions (
      manuscript_id,
      editor_id,
      decision,
      decision_letter,
      internal_notes,
      components,
      actions,
      template_id,
      template_version,
      is_draft,
      submitted_at,
      version
    ) VALUES (
      p_manuscript_id,
      p_editor_id,
      p_decision,
      COALESCE(p_components->>'authorLetter', ''),
      p_components->>'internalNotes',
      p_components,
      p_actions,
      p_template_id,
      p_template_version,
      p_is_draft,
      CASE WHEN p_is_draft THEN NULL ELSE NOW() END,
      1
    )
    RETURNING id INTO v_decision_id;

    -- Update manuscript status only if not a draft
    IF NOT p_is_draft THEN
      UPDATE manuscripts 
      SET 
        status = p_decision,
        editor_id = p_editor_id,
        updated_at = NOW(),
        accepted_at = CASE WHEN p_decision = 'accepted' THEN NOW() ELSE accepted_at END
      WHERE id = p_manuscript_id;

      -- Update template usage count if template was used
      IF p_template_id IS NOT NULL THEN
        UPDATE editorial_templates 
        SET usage_count = usage_count + 1
        WHERE id = p_template_id;
      END IF;

      -- Update review assignments status based on decision
      IF p_decision IN ('accepted', 'rejected') THEN
        UPDATE review_assignments 
        SET status = 'completed'
        WHERE manuscript_id = p_manuscript_id 
        AND status IN ('accepted', 'invited');
      END IF;

      -- Create activity log entry
      INSERT INTO activity_logs (
        manuscript_id,
        user_id,
        action,
        details
      ) VALUES (
        p_manuscript_id,
        p_editor_id,
        'editorial_decision_submitted',
        jsonb_build_object(
          'decision', p_decision,
          'decision_id', v_decision_id,
          'previous_status', v_old_status,
          'template_id', p_template_id
        )
      );

    ELSE
      -- For drafts, just log the save action
      INSERT INTO activity_logs (
        manuscript_id,
        user_id,
        action,
        details
      ) VALUES (
        p_manuscript_id,
        p_editor_id,
        'editorial_decision_draft_saved',
        jsonb_build_object(
          'decision', p_decision,
          'decision_id', v_decision_id,
          'template_id', p_template_id
        )
      );
    END IF;

    -- Prepare result
    v_result := jsonb_build_object(
      'success', true,
      'decision_id', v_decision_id,
      'manuscript_id', p_manuscript_id,
      'old_status', v_old_status,
      'new_status', CASE WHEN p_is_draft THEN v_old_status ELSE p_decision END,
      'is_draft', p_is_draft
    );

    RETURN v_result;

  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback will happen automatically
      RAISE EXCEPTION 'Transaction failed: %', SQLERRM;
  END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION process_editorial_decision TO authenticated;

-- Create function to get decision variables for templates
CREATE OR REPLACE FUNCTION get_decision_variables(
  p_manuscript_id UUID,
  p_editor_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_manuscript RECORD;
  v_editor RECORD;
  v_reviews JSONB;
  v_result JSONB;
BEGIN
  -- Get manuscript details
  SELECT 
    m.*,
    p.full_name as author_name,
    p.email as author_email,
    p.affiliation as author_affiliation
  INTO v_manuscript
  FROM manuscripts m
  JOIN profiles p ON m.author_id = p.id
  WHERE m.id = p_manuscript_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Manuscript not found';
  END IF;

  -- Get editor details
  SELECT full_name, email, affiliation
  INTO v_editor
  FROM profiles
  WHERE id = p_editor_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Editor not found';
  END IF;

  -- Get review summary
  SELECT jsonb_agg(
    jsonb_build_object(
      'reviewer_name', COALESCE(p.full_name, 'Anonymous Reviewer'),
      'recommendation', r.recommendation,
      'confidence', r.confidence_level,
      'summary', r.summary,
      'major_comments', r.major_comments,
      'minor_comments', r.minor_comments,
      'comments_for_editor', r.comments_for_editor
    )
  ) INTO v_reviews
  FROM reviews r
  LEFT JOIN profiles p ON r.reviewer_id = p.id
  WHERE r.manuscript_id = p_manuscript_id;

  -- Build result object
  v_result := jsonb_build_object(
    'manuscript_title', v_manuscript.title,
    'manuscript_abstract', v_manuscript.abstract,
    'manuscript_keywords', v_manuscript.keywords,
    'manuscript_field', v_manuscript.field_of_study,
    'manuscript_subfield', v_manuscript.subfield,
    'submission_date', to_char(v_manuscript.submitted_at, 'Month DD, YYYY'),
    'submission_number', v_manuscript.submission_number,
    'author_name', v_manuscript.author_name,
    'author_email', v_manuscript.author_email,
    'author_affiliation', v_manuscript.author_affiliation,
    'editor_name', v_editor.full_name,
    'editor_email', v_editor.email,
    'editor_affiliation', v_editor.affiliation,
    'current_date', to_char(NOW(), 'Month DD, YYYY'),
    'review_count', COALESCE(jsonb_array_length(v_reviews), 0),
    'reviews', COALESCE(v_reviews, '[]'::jsonb)
  );

  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_decision_variables TO authenticated;

-- Add comments
COMMENT ON FUNCTION process_editorial_decision IS 'Transactionally processes editorial decisions with all related database updates';
COMMENT ON FUNCTION get_decision_variables IS 'Gets all available variables for decision letter templates';