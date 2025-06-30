-- Phase 7: Performance & Optimization Database Indexes
-- Additional indexes for performance-critical queries
-- NOTE: Remove CONCURRENTLY for migrations - run in transaction block

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_manuscripts_status_field ON manuscripts(status, field_of_study);
CREATE INDEX IF NOT EXISTS idx_manuscripts_status_created ON manuscripts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_manuscripts_author_status ON manuscripts(author_id, status);
CREATE INDEX IF NOT EXISTS idx_manuscripts_editor_status ON manuscripts(editor_id, status) WHERE editor_id IS NOT NULL;

-- Text search indexes for academic content
-- Note: Removing tsvector indexes due to immutability constraints in migrations
-- These can be added manually later if needed for full-text search
-- CREATE INDEX IF NOT EXISTS idx_manuscripts_title_search ON manuscripts USING gin(to_tsvector(title));
-- CREATE INDEX IF NOT EXISTS idx_manuscripts_abstract_search ON manuscripts USING gin(to_tsvector(abstract));
CREATE INDEX IF NOT EXISTS idx_manuscripts_keywords_search ON manuscripts USING gin(keywords);

-- Partial indexes for published articles (most queried)
CREATE INDEX IF NOT EXISTS idx_manuscripts_published_only ON manuscripts(published_at DESC, view_count DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_manuscripts_popular ON manuscripts(view_count DESC, citation_count DESC) WHERE status = 'published';

-- Indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_review_assignments_reviewer_status ON review_assignments(reviewer_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_review_assignments_due_pending ON review_assignments(due_date ASC) WHERE status IN ('invited', 'accepted');

-- Indexes for statistical queries
CREATE INDEX IF NOT EXISTS idx_manuscripts_field_published ON manuscripts(field_of_study, published_at) WHERE status = 'published';
-- Remove date_trunc index due to immutability issues - use created_at directly instead
CREATE INDEX IF NOT EXISTS idx_manuscripts_created_date ON manuscripts(created_at);

-- Indexes for activity and audit queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_created ON activity_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE read = false;

-- Materialized view for homepage statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS homepage_stats AS
SELECT 
  COUNT(*) FILTER (WHERE status = 'published') as published_count,
  COUNT(*) FILTER (WHERE status = 'under_review') as under_review_count,
  COUNT(DISTINCT field_of_study) as fields_count,
  COUNT(DISTINCT author_id) as authors_count,
  COALESCE(SUM(view_count), 0) as total_views,
  COALESCE(SUM(download_count), 0) as total_downloads
FROM manuscripts
WHERE created_at >= NOW() - INTERVAL '30 days' OR status = 'published';

-- Index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_homepage_stats_singleton ON homepage_stats((1));

-- Function to refresh homepage stats
CREATE OR REPLACE FUNCTION refresh_homepage_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW homepage_stats;
END;
$$ LANGUAGE plpgsql;

-- Function to get trending articles (cached computation)
CREATE OR REPLACE FUNCTION get_trending_articles(limit_count integer DEFAULT 10)
RETURNS TABLE(
  id UUID,
  title TEXT,
  abstract TEXT,
  field_of_study TEXT,
  author_name TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER,
  trending_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.title,
    m.abstract,
    m.field_of_study,
    p.full_name as author_name,
    m.published_at,
    m.view_count,
    -- Trending score: views in last 7 days weighted by recency
    (m.view_count * EXP(-EXTRACT(EPOCH FROM (NOW() - m.published_at)) / 86400.0 / 7.0))::NUMERIC as trending_score
  FROM manuscripts m
  JOIN profiles p ON m.author_id = p.id
  WHERE m.status = 'published'
    AND m.published_at >= NOW() - INTERVAL '30 days'
  ORDER BY trending_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function for optimized manuscript search
CREATE OR REPLACE FUNCTION search_manuscripts(
  search_query TEXT DEFAULT '',
  field_filter TEXT DEFAULT '',
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  abstract TEXT,
  field_of_study TEXT,
  author_name TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER,
  search_rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.title,
    m.abstract,
    m.field_of_study,
    p.full_name as author_name,
    m.published_at,
    m.view_count,
    CASE 
      WHEN search_query = '' THEN 1.0::REAL
      ELSE ts_rank(
        to_tsvector(m.title || ' ' || m.abstract), 
        plainto_tsquery(search_query)
      )
    END as search_rank
  FROM manuscripts m
  JOIN profiles p ON m.author_id = p.id
  WHERE m.status = 'published'
    AND (search_query = '' OR (
      to_tsvector(m.title || ' ' || m.abstract) @@ plainto_tsquery(search_query)
    ))
    AND (field_filter = '' OR m.field_of_study = field_filter)
  ORDER BY search_rank DESC, m.published_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Optimize JSON queries for manuscript metadata
CREATE INDEX IF NOT EXISTS idx_manuscripts_suggested_reviewers ON manuscripts USING gin(suggested_reviewers);
CREATE INDEX IF NOT EXISTS idx_payments_billing_details ON payments USING gin(billing_details);

-- Performance monitoring table
CREATE TABLE IF NOT EXISTS query_performance_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  query_name TEXT NOT NULL,
  execution_time_ms NUMERIC NOT NULL,
  rows_affected INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_query_performance_name_time ON query_performance_log(query_name, created_at DESC);

-- Function to log query performance
CREATE OR REPLACE FUNCTION log_query_performance(
  p_query_name TEXT,
  p_execution_time_ms NUMERIC,
  p_rows_affected INTEGER DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO query_performance_log (query_name, execution_time_ms, rows_affected)
  VALUES (p_query_name, p_execution_time_ms, p_rows_affected);
END;
$$ LANGUAGE plpgsql;

-- Create a cleanup function for old logs
CREATE OR REPLACE FUNCTION cleanup_old_performance_logs(days_to_keep INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM query_performance_log 
  WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Analyze tables for query planner optimization
ANALYZE manuscripts;
ANALYZE profiles;
ANALYZE reviews;
ANALYZE review_assignments;
ANALYZE manuscript_files;
ANALYZE activity_logs;
ANALYZE notifications;

-- Note: Removed pg_stat_user_tables update - system views are not directly updatable