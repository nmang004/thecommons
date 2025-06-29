-- =============================================
-- Analytics Infrastructure for Academic Publishing
-- =============================================

-- Create analytics schema for better organization
CREATE SCHEMA IF NOT EXISTS analytics;

-- ====================
-- Academic Analytics Tables
-- ====================

-- Manuscript analytics
CREATE TABLE IF NOT EXISTS analytics.manuscript_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  manuscript_id UUID REFERENCES manuscripts(id) ON DELETE CASCADE NOT NULL,
  event_type VARCHAR(50) NOT NULL, -- 'view', 'download', 'citation', 'share', 'submission', 'decision'
  event_data JSONB,
  user_id UUID REFERENCES profiles(id), -- NULL for anonymous events
  session_id VARCHAR(255),
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  country_code VARCHAR(2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- User engagement analytics
CREATE TABLE IF NOT EXISTS analytics.user_engagement (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_id VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL, -- 'login', 'logout', 'page_view', 'form_submit', 'search', 'file_upload'
  resource_type VARCHAR(50), -- 'manuscript', 'article', 'profile', 'review'
  resource_id UUID,
  duration_seconds INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Editorial workflow analytics
CREATE TABLE IF NOT EXISTS analytics.editorial_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  manuscript_id UUID REFERENCES manuscripts(id) ON DELETE CASCADE NOT NULL,
  editor_id UUID REFERENCES profiles(id),
  workflow_stage VARCHAR(50) NOT NULL,
  status_from VARCHAR(50),
  status_to VARCHAR(50) NOT NULL,
  duration_days INTEGER,
  decision_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Review process analytics
CREATE TABLE IF NOT EXISTS analytics.review_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  review_assignment_id UUID REFERENCES review_assignments(id) ON DELETE CASCADE NOT NULL,
  manuscript_id UUID REFERENCES manuscripts(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) NOT NULL,
  event_type VARCHAR(50) NOT NULL, -- 'invited', 'accepted', 'declined', 'started', 'submitted', 'late'
  turnaround_days INTEGER,
  quality_score INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Financial analytics
CREATE TABLE IF NOT EXISTS analytics.financial_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  manuscript_id UUID REFERENCES manuscripts(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- 'apc_payment', 'refund', 'waiver'
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_method VARCHAR(50),
  processing_fee_cents INTEGER,
  status VARCHAR(50) NOT NULL,
  country_code VARCHAR(2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Content performance analytics
CREATE TABLE IF NOT EXISTS analytics.content_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content_id UUID NOT NULL, -- manuscript or article ID
  content_type VARCHAR(50) NOT NULL, -- 'manuscript', 'published_article'
  field_of_study VARCHAR(100),
  subfield VARCHAR(100),
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  citation_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  engagement_score NUMERIC(10,4),
  geographic_distribution JSONB, -- Country-wise distribution
  traffic_sources JSONB, -- Referrer analysis
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Search analytics
CREATE TABLE IF NOT EXISTS analytics.search_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  search_query TEXT NOT NULL,
  search_type VARCHAR(50) NOT NULL, -- 'basic', 'advanced', 'field_specific'
  filters_applied JSONB,
  results_count INTEGER,
  results_clicked INTEGER DEFAULT 0,
  user_id UUID REFERENCES profiles(id),
  session_id VARCHAR(255),
  search_duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- System health analytics
CREATE TABLE IF NOT EXISTS analytics.system_health (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  metric_type VARCHAR(50) NOT NULL, -- 'uptime', 'response_time', 'error_rate', 'throughput'
  metric_value NUMERIC NOT NULL,
  endpoint VARCHAR(255),
  service_name VARCHAR(100),
  status_code INTEGER,
  additional_data JSONB,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ====================
-- Indexes for Performance
-- ====================

-- Manuscript analytics indexes
CREATE INDEX IF NOT EXISTS idx_manuscript_analytics_manuscript_id ON analytics.manuscript_analytics(manuscript_id);
CREATE INDEX IF NOT EXISTS idx_manuscript_analytics_event_type ON analytics.manuscript_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_manuscript_analytics_created_at ON analytics.manuscript_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_manuscript_analytics_user_id ON analytics.manuscript_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_manuscript_analytics_composite ON analytics.manuscript_analytics(manuscript_id, event_type, created_at DESC);

-- User engagement indexes
CREATE INDEX IF NOT EXISTS idx_user_engagement_user_id ON analytics.user_engagement(user_id);
CREATE INDEX IF NOT EXISTS idx_user_engagement_action ON analytics.user_engagement(action);
CREATE INDEX IF NOT EXISTS idx_user_engagement_created_at ON analytics.user_engagement(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_engagement_session ON analytics.user_engagement(session_id);

-- Editorial analytics indexes
CREATE INDEX IF NOT EXISTS idx_editorial_analytics_manuscript_id ON analytics.editorial_analytics(manuscript_id);
CREATE INDEX IF NOT EXISTS idx_editorial_analytics_editor_id ON analytics.editorial_analytics(editor_id);
CREATE INDEX IF NOT EXISTS idx_editorial_analytics_stage ON analytics.editorial_analytics(workflow_stage);
CREATE INDEX IF NOT EXISTS idx_editorial_analytics_created_at ON analytics.editorial_analytics(created_at DESC);

-- Review analytics indexes
CREATE INDEX IF NOT EXISTS idx_review_analytics_assignment_id ON analytics.review_analytics(review_assignment_id);
CREATE INDEX IF NOT EXISTS idx_review_analytics_reviewer_id ON analytics.review_analytics(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_review_analytics_event_type ON analytics.review_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_review_analytics_created_at ON analytics.review_analytics(created_at DESC);

-- Financial analytics indexes
CREATE INDEX IF NOT EXISTS idx_financial_analytics_payment_id ON analytics.financial_analytics(payment_id);
CREATE INDEX IF NOT EXISTS idx_financial_analytics_type ON analytics.financial_analytics(transaction_type);
CREATE INDEX IF NOT EXISTS idx_financial_analytics_created_at ON analytics.financial_analytics(created_at DESC);

-- Content analytics indexes
CREATE INDEX IF NOT EXISTS idx_content_analytics_content_id ON analytics.content_analytics(content_id);
CREATE INDEX IF NOT EXISTS idx_content_analytics_type ON analytics.content_analytics(content_type);
CREATE INDEX IF NOT EXISTS idx_content_analytics_field ON analytics.content_analytics(field_of_study);
CREATE INDEX IF NOT EXISTS idx_content_analytics_updated ON analytics.content_analytics(last_updated DESC);

-- Search analytics indexes
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON analytics.search_analytics USING gin(to_tsvector('english', search_query));
CREATE INDEX IF NOT EXISTS idx_search_analytics_type ON analytics.search_analytics(search_type);
CREATE INDEX IF NOT EXISTS idx_search_analytics_user_id ON analytics.search_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_search_analytics_created_at ON analytics.search_analytics(created_at DESC);

-- System health indexes
CREATE INDEX IF NOT EXISTS idx_system_health_type ON analytics.system_health(metric_type);
CREATE INDEX IF NOT EXISTS idx_system_health_service ON analytics.system_health(service_name);
CREATE INDEX IF NOT EXISTS idx_system_health_recorded_at ON analytics.system_health(recorded_at DESC);

-- ====================
-- Materialized Views for Dashboards
-- ====================

-- Executive dashboard view
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.executive_dashboard AS
SELECT 
  'manuscripts' as metric_category,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as monthly_count,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as weekly_count,
  COUNT(*) FILTER (WHERE status = 'published') as published_count,
  ROUND(COUNT(*) FILTER (WHERE status = 'published') * 100.0 / NULLIF(COUNT(*), 0), 2) as success_rate
FROM manuscripts
UNION ALL
SELECT 
  'users' as metric_category,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as monthly_count,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as weekly_count,
  COUNT(*) FILTER (WHERE role = 'author') as published_count, -- authors as "active" count
  ROUND(COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') * 100.0 / NULLIF(COUNT(*), 0), 2) as success_rate
FROM profiles
UNION ALL
SELECT 
  'reviews' as metric_category,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE submitted_at >= NOW() - INTERVAL '30 days') as monthly_count,
  COUNT(*) FILTER (WHERE submitted_at >= NOW() - INTERVAL '7 days') as weekly_count,
  COUNT(*) FILTER (WHERE recommendation = 'accept') as published_count,
  ROUND(AVG(EXTRACT(EPOCH FROM (submitted_at - ra.invited_at)) / 86400), 2) as success_rate -- avg turnaround days
FROM reviews r
JOIN review_assignments ra ON r.reviewer_id = ra.reviewer_id AND r.manuscript_id = ra.manuscript_id;

-- Editorial performance dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.editorial_performance AS
SELECT 
  DATE_TRUNC('week', m.created_at) as week_start,
  COUNT(*) as submissions_received,
  COUNT(*) FILTER (WHERE m.status = 'published') as manuscripts_published,
  COUNT(*) FILTER (WHERE m.editor_id IS NOT NULL) as manuscripts_assigned,
  ROUND(AVG(EXTRACT(EPOCH FROM (m.published_at - m.submitted_at)) / 86400), 1) as avg_time_to_publication,
  COUNT(DISTINCT m.editor_id) as active_editors,
  ROUND(AVG(EXTRACT(EPOCH FROM (r.submitted_at - ra.invited_at)) / 86400), 1) as avg_review_turnaround
FROM manuscripts m
LEFT JOIN reviews r ON m.id = r.manuscript_id
LEFT JOIN review_assignments ra ON r.reviewer_id = ra.reviewer_id AND r.manuscript_id = ra.manuscript_id
WHERE m.created_at >= NOW() - INTERVAL '6 months'
GROUP BY DATE_TRUNC('week', m.created_at)
ORDER BY week_start DESC;

-- Content performance dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.content_performance AS
SELECT 
  m.field_of_study,
  COUNT(*) as total_articles,
  COUNT(*) FILTER (WHERE m.status = 'published') as published_articles,
  SUM(m.view_count) as total_views,
  SUM(m.download_count) as total_downloads,
  SUM(m.citation_count) as total_citations,
  ROUND(AVG(m.view_count), 0) as avg_views_per_article,
  ROUND(AVG(m.download_count), 0) as avg_downloads_per_article,
  ROUND(AVG(m.citation_count), 1) as avg_citations_per_article
FROM manuscripts m
WHERE m.published_at IS NOT NULL
GROUP BY m.field_of_study
ORDER BY total_views DESC;

-- Review quality dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.review_quality AS
SELECT 
  r.reviewer_id,
  p.full_name as reviewer_name,
  COUNT(*) as total_reviews,
  ROUND(AVG(r.review_quality_score), 2) as avg_quality_score,
  ROUND(AVG(r.confidence_level), 2) as avg_confidence,
  ROUND(AVG(r.time_spent_hours), 2) as avg_time_spent,
  ROUND(AVG(EXTRACT(EPOCH FROM (r.submitted_at - ra.invited_at)) / 86400), 1) as avg_turnaround_days,
  COUNT(*) FILTER (WHERE r.recommendation = 'accept') as accept_count,
  COUNT(*) FILTER (WHERE r.recommendation = 'reject') as reject_count,
  ROUND(COUNT(*) FILTER (WHERE r.recommendation = 'accept') * 100.0 / COUNT(*), 1) as acceptance_rate
FROM reviews r
JOIN profiles p ON r.reviewer_id = p.id
JOIN review_assignments ra ON r.reviewer_id = ra.reviewer_id AND r.manuscript_id = ra.manuscript_id
WHERE r.submitted_at >= NOW() - INTERVAL '6 months'
GROUP BY r.reviewer_id, p.full_name
HAVING COUNT(*) >= 3 -- Only reviewers with 3+ reviews
ORDER BY avg_quality_score DESC;

-- Financial performance dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.financial_performance AS
SELECT 
  DATE_TRUNC('month', p.created_at) as month_start,
  COUNT(*) as total_transactions,
  SUM(p.amount) / 100.0 as total_revenue_usd,
  COUNT(*) FILTER (WHERE p.status = 'succeeded') as successful_payments,
  COUNT(*) FILTER (WHERE p.status = 'failed') as failed_payments,
  ROUND(COUNT(*) FILTER (WHERE p.status = 'succeeded') * 100.0 / COUNT(*), 2) as success_rate,
  ROUND(AVG(p.amount) / 100.0, 2) as avg_transaction_value
FROM payments p
WHERE p.created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', p.created_at)
ORDER BY month_start DESC;

-- ====================
-- Analytical Functions
-- ====================

-- Function to track manuscript events
CREATE OR REPLACE FUNCTION analytics.track_manuscript_event(
  p_manuscript_id UUID,
  p_event_type VARCHAR(50),
  p_event_data JSONB DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_session_id VARCHAR(255) DEFAULT NULL,
  p_page_url TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_country_code VARCHAR(2) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO analytics.manuscript_analytics (
    manuscript_id, event_type, event_data, user_id, session_id,
    page_url, referrer, user_agent, ip_address, country_code
  )
  VALUES (
    p_manuscript_id, p_event_type, p_event_data, p_user_id, p_session_id,
    p_page_url, p_referrer, p_user_agent, p_ip_address, p_country_code
  )
  RETURNING id INTO event_id;
  
  -- Update content analytics aggregates
  INSERT INTO analytics.content_analytics (
    content_id, content_type, field_of_study, subfield,
    view_count, download_count, citation_count, share_count
  )
  SELECT 
    m.id,
    CASE WHEN m.status = 'published' THEN 'published_article' ELSE 'manuscript' END,
    m.field_of_study,
    m.subfield,
    CASE WHEN p_event_type = 'view' THEN 1 ELSE 0 END,
    CASE WHEN p_event_type = 'download' THEN 1 ELSE 0 END,
    CASE WHEN p_event_type = 'citation' THEN 1 ELSE 0 END,
    CASE WHEN p_event_type = 'share' THEN 1 ELSE 0 END
  FROM manuscripts m
  WHERE m.id = p_manuscript_id
  ON CONFLICT (content_id) DO UPDATE SET
    view_count = analytics.content_analytics.view_count + 
      CASE WHEN p_event_type = 'view' THEN 1 ELSE 0 END,
    download_count = analytics.content_analytics.download_count + 
      CASE WHEN p_event_type = 'download' THEN 1 ELSE 0 END,
    citation_count = analytics.content_analytics.citation_count + 
      CASE WHEN p_event_type = 'citation' THEN 1 ELSE 0 END,
    share_count = analytics.content_analytics.share_count + 
      CASE WHEN p_event_type = 'share' THEN 1 ELSE 0 END,
    last_updated = NOW();
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh all dashboard views
CREATE OR REPLACE FUNCTION analytics.refresh_dashboards()
RETURNS TEXT AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.executive_dashboard;
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.editorial_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.content_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.review_quality;
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.financial_performance;
  REFRESH MATERIALIZED VIEW performance_dashboard;
  REFRESH MATERIALIZED VIEW web_vitals_dashboard;
  
  RETURN 'All dashboard views refreshed successfully';
END;
$$ LANGUAGE plpgsql;

-- Function to get manuscript funnel analytics
CREATE OR REPLACE FUNCTION analytics.get_manuscript_funnel(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  stage VARCHAR(50),
  count BIGINT,
  conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH funnel_data AS (
    SELECT 
      'submissions' as stage, COUNT(*) as stage_count
    FROM manuscripts 
    WHERE submitted_at >= NOW() - INTERVAL '1 day' * days_back
    
    UNION ALL
    
    SELECT 
      'with_editor' as stage, COUNT(*) as stage_count
    FROM manuscripts 
    WHERE submitted_at >= NOW() - INTERVAL '1 day' * days_back
      AND status IN ('with_editor', 'under_review', 'revisions_requested', 'accepted', 'rejected', 'published')
    
    UNION ALL
    
    SELECT 
      'under_review' as stage, COUNT(*) as stage_count
    FROM manuscripts 
    WHERE submitted_at >= NOW() - INTERVAL '1 day' * days_back
      AND status IN ('under_review', 'revisions_requested', 'accepted', 'rejected', 'published')
    
    UNION ALL
    
    SELECT 
      'decision_made' as stage, COUNT(*) as stage_count
    FROM manuscripts 
    WHERE submitted_at >= NOW() - INTERVAL '1 day' * days_back
      AND status IN ('accepted', 'rejected', 'published')
    
    UNION ALL
    
    SELECT 
      'published' as stage, COUNT(*) as stage_count
    FROM manuscripts 
    WHERE submitted_at >= NOW() - INTERVAL '1 day' * days_back
      AND status = 'published'
  ),
  total_submissions AS (
    SELECT stage_count as total FROM funnel_data WHERE stage = 'submissions'
  )
  SELECT 
    fd.stage::VARCHAR(50),
    fd.stage_count,
    ROUND(fd.stage_count * 100.0 / ts.total, 2)
  FROM funnel_data fd, total_submissions ts
  ORDER BY 
    CASE fd.stage 
      WHEN 'submissions' THEN 1
      WHEN 'with_editor' THEN 2
      WHEN 'under_review' THEN 3
      WHEN 'decision_made' THEN 4
      WHEN 'published' THEN 5
    END;
END;
$$ LANGUAGE plpgsql;

-- ====================
-- Row Level Security
-- ====================

-- Enable RLS on analytics tables
ALTER TABLE analytics.manuscript_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.user_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.editorial_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.review_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.financial_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.content_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.system_health ENABLE ROW LEVEL SECURITY;

-- Analytics policies (Admin and Editor access)
CREATE POLICY "Admins can view all analytics" ON analytics.manuscript_analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Editors can view assigned manuscript analytics" ON analytics.manuscript_analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('editor', 'admin'))
    OR
    EXISTS (SELECT 1 FROM manuscripts WHERE id = manuscript_analytics.manuscript_id AND editor_id = auth.uid())
  );

CREATE POLICY "Authors can view their manuscript analytics" ON analytics.manuscript_analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM manuscripts WHERE id = manuscript_analytics.manuscript_id AND author_id = auth.uid())
  );

-- Grant permissions
GRANT USAGE ON SCHEMA analytics TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA analytics TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA analytics TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA analytics TO authenticated;

-- Create indexes for unique constraints on content analytics
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_analytics_unique_content ON analytics.content_analytics(content_id);