-- Additional analytics functions

-- Function to increment manuscript counts atomically
CREATE OR REPLACE FUNCTION increment_manuscript_count(
  manuscript_id UUID,
  count_field TEXT
)
RETURNS void AS $$
BEGIN
  IF count_field = 'view_count' THEN
    UPDATE manuscripts 
    SET view_count = view_count + 1, updated_at = NOW()
    WHERE id = manuscript_id;
  ELSIF count_field = 'download_count' THEN
    UPDATE manuscripts 
    SET download_count = download_count + 1, updated_at = NOW()
    WHERE id = manuscript_id;
  ELSIF count_field = 'citation_count' THEN
    UPDATE manuscripts 
    SET citation_count = citation_count + 1, updated_at = NOW()
    WHERE id = manuscript_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get real-time dashboard metrics
CREATE OR REPLACE FUNCTION get_realtime_metrics()
RETURNS TABLE(
  metric_name TEXT,
  metric_value NUMERIC,
  change_24h NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'active_users_24h'::TEXT as metric_name,
    COUNT(DISTINCT ue.user_id)::NUMERIC as metric_value,
    (COUNT(DISTINCT ue.user_id) - 
     COUNT(DISTINCT ue2.user_id))::NUMERIC as change_24h
  FROM analytics.user_engagement ue
  CROSS JOIN LATERAL (
    SELECT DISTINCT user_id 
    FROM analytics.user_engagement ue2
    WHERE ue2.created_at >= NOW() - INTERVAL '48 hours'
      AND ue2.created_at < NOW() - INTERVAL '24 hours'
  ) ue2
  WHERE ue.created_at >= NOW() - INTERVAL '24 hours'
  
  UNION ALL
  
  SELECT 
    'manuscript_views_24h'::TEXT as metric_name,
    COUNT(*)::NUMERIC as metric_value,
    (COUNT(*) - 
     (SELECT COUNT(*) FROM analytics.manuscript_analytics ma2 
      WHERE ma2.event_type = 'view' 
        AND ma2.created_at >= NOW() - INTERVAL '48 hours'
        AND ma2.created_at < NOW() - INTERVAL '24 hours'))::NUMERIC as change_24h
  FROM analytics.manuscript_analytics ma
  WHERE ma.event_type = 'view' 
    AND ma.created_at >= NOW() - INTERVAL '24 hours'
  
  UNION ALL
  
  SELECT 
    'submissions_24h'::TEXT as metric_name,
    COUNT(*)::NUMERIC as metric_value,
    (COUNT(*) - 
     (SELECT COUNT(*) FROM manuscripts m2 
      WHERE m2.submitted_at >= NOW() - INTERVAL '48 hours'
        AND m2.submitted_at < NOW() - INTERVAL '24 hours'))::NUMERIC as change_24h
  FROM manuscripts m
  WHERE m.submitted_at >= NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Function to get geographic analytics
CREATE OR REPLACE FUNCTION get_geographic_analytics(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  country_code TEXT,
  total_events BIGINT,
  unique_users BIGINT,
  views BIGINT,
  downloads BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ma.country_code::TEXT,
    COUNT(*)::BIGINT as total_events,
    COUNT(DISTINCT ma.user_id)::BIGINT as unique_users,
    COUNT(*) FILTER (WHERE ma.event_type = 'view')::BIGINT as views,
    COUNT(*) FILTER (WHERE ma.event_type = 'download')::BIGINT as downloads
  FROM analytics.manuscript_analytics ma
  WHERE ma.country_code IS NOT NULL
    AND ma.created_at >= NOW() - INTERVAL '1 day' * days_back
  GROUP BY ma.country_code
  ORDER BY total_events DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get content analytics by field
CREATE OR REPLACE FUNCTION get_field_analytics(time_period TEXT DEFAULT '30d')
RETURNS TABLE(
  field_of_study TEXT,
  manuscripts_count BIGINT,
  published_count BIGINT,
  total_views BIGINT,
  total_downloads BIGINT,
  avg_time_to_publication NUMERIC
) AS $$
DECLARE
  days_back INTEGER;
BEGIN
  days_back := CASE 
    WHEN time_period = '7d' THEN 7
    WHEN time_period = '30d' THEN 30
    WHEN time_period = '90d' THEN 90
    WHEN time_period = '1y' THEN 365
    ELSE 30
  END;

  RETURN QUERY
  SELECT 
    m.field_of_study::TEXT,
    COUNT(*)::BIGINT as manuscripts_count,
    COUNT(*) FILTER (WHERE m.status = 'published')::BIGINT as published_count,
    COALESCE(SUM(m.view_count), 0)::BIGINT as total_views,
    COALESCE(SUM(m.download_count), 0)::BIGINT as total_downloads,
    AVG(EXTRACT(EPOCH FROM (m.published_at - m.submitted_at)) / 86400)::NUMERIC as avg_time_to_publication
  FROM manuscripts m
  WHERE m.created_at >= NOW() - INTERVAL '1 day' * days_back
  GROUP BY m.field_of_study
  ORDER BY manuscripts_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get reviewer performance analytics
CREATE OR REPLACE FUNCTION get_reviewer_analytics(reviewer_id UUID DEFAULT NULL)
RETURNS TABLE(
  reviewer_id UUID,
  reviewer_name TEXT,
  total_assignments BIGINT,
  completed_reviews BIGINT,
  avg_turnaround_days NUMERIC,
  avg_quality_score NUMERIC,
  acceptance_rate NUMERIC,
  current_workload BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as reviewer_id,
    p.full_name::TEXT as reviewer_name,
    COUNT(ra.id)::BIGINT as total_assignments,
    COUNT(r.id)::BIGINT as completed_reviews,
    AVG(EXTRACT(EPOCH FROM (r.submitted_at - ra.invited_at)) / 86400)::NUMERIC as avg_turnaround_days,
    AVG(r.review_quality_score)::NUMERIC as avg_quality_score,
    (COUNT(*) FILTER (WHERE r.recommendation = 'accept') * 100.0 / NULLIF(COUNT(r.id), 0))::NUMERIC as acceptance_rate,
    COUNT(ra2.id)::BIGINT as current_workload
  FROM profiles p
  LEFT JOIN review_assignments ra ON p.id = ra.reviewer_id
  LEFT JOIN reviews r ON ra.id = r.reviewer_id AND ra.manuscript_id = r.manuscript_id
  LEFT JOIN review_assignments ra2 ON p.id = ra2.reviewer_id AND ra2.status IN ('invited', 'accepted')
  WHERE p.role = 'reviewer'
    AND (get_reviewer_analytics.reviewer_id IS NULL OR p.id = get_reviewer_analytics.reviewer_id)
    AND ra.invited_at >= NOW() - INTERVAL '6 months'
  GROUP BY p.id, p.full_name
  HAVING COUNT(ra.id) > 0
  ORDER BY completed_reviews DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get editorial efficiency metrics
CREATE OR REPLACE FUNCTION get_editorial_efficiency()
RETURNS TABLE(
  editor_id UUID,
  editor_name TEXT,
  manuscripts_handled BIGINT,
  avg_decision_time_days NUMERIC,
  acceptance_rate NUMERIC,
  current_workload BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as editor_id,
    p.full_name::TEXT as editor_name,
    COUNT(m.id)::BIGINT as manuscripts_handled,
    AVG(EXTRACT(EPOCH FROM (ed.created_at - m.submitted_at)) / 86400)::NUMERIC as avg_decision_time_days,
    (COUNT(*) FILTER (WHERE m.status = 'published') * 100.0 / NULLIF(COUNT(m.id), 0))::NUMERIC as acceptance_rate,
    COUNT(m2.id)::BIGINT as current_workload
  FROM profiles p
  LEFT JOIN manuscripts m ON p.id = m.editor_id
  LEFT JOIN editorial_decisions ed ON m.id = ed.manuscript_id
  LEFT JOIN manuscripts m2 ON p.id = m2.editor_id AND m2.status IN ('with_editor', 'under_review')
  WHERE p.role = 'editor'
    AND m.submitted_at >= NOW() - INTERVAL '6 months'
  GROUP BY p.id, p.full_name
  HAVING COUNT(m.id) > 0
  ORDER BY manuscripts_handled DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to track system health metrics
CREATE OR REPLACE FUNCTION track_system_health(
  metric_type_param VARCHAR(50),
  metric_value_param NUMERIC,
  endpoint_param VARCHAR(255) DEFAULT NULL,
  service_name_param VARCHAR(100) DEFAULT NULL,
  status_code_param INTEGER DEFAULT NULL,
  additional_data_param JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  health_id UUID;
BEGIN
  INSERT INTO analytics.system_health (
    metric_type, metric_value, endpoint, service_name, 
    status_code, additional_data
  )
  VALUES (
    metric_type_param, metric_value_param, endpoint_param, 
    service_name_param, status_code_param, additional_data_param
  )
  RETURNING id INTO health_id;
  
  RETURN health_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION increment_manuscript_count(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_realtime_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_geographic_analytics(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_field_analytics(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_reviewer_analytics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_editorial_efficiency() TO authenticated;
GRANT EXECUTE ON FUNCTION track_system_health(VARCHAR(50), NUMERIC, VARCHAR(255), VARCHAR(100), INTEGER, JSONB) TO authenticated;