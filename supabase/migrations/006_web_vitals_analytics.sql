-- Create table for storing Web Vitals metrics
CREATE TABLE IF NOT EXISTS web_vitals_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  metric_name VARCHAR(50) NOT NULL,
  metric_value NUMERIC NOT NULL,
  rating VARCHAR(20) CHECK (rating IN ('good', 'needs-improvement', 'poor')),
  delta NUMERIC,
  metric_id VARCHAR(255),
  navigation_type VARCHAR(50),
  page_url TEXT NOT NULL,
  user_agent TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_web_vitals_metric_name ON web_vitals_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_web_vitals_recorded_at ON web_vitals_metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_web_vitals_page_url ON web_vitals_metrics(page_url);
CREATE INDEX IF NOT EXISTS idx_web_vitals_rating ON web_vitals_metrics(rating);
CREATE INDEX IF NOT EXISTS idx_web_vitals_created_at ON web_vitals_metrics(created_at DESC);

-- Composite index for analytics queries
CREATE INDEX IF NOT EXISTS idx_web_vitals_analytics ON web_vitals_metrics(metric_name, recorded_at DESC, rating);

-- Create table for error tracking
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  error_type VARCHAR(100) NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  page_url TEXT NOT NULL,
  user_agent TEXT,
  user_id UUID REFERENCES profiles(id),
  session_id VARCHAR(255),
  additional_data JSONB,
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for error logs
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_page_url ON error_logs(page_url);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);

-- Create table for performance monitoring
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  metric_type VARCHAR(50) NOT NULL, -- 'page_load', 'api_response', 'database_query', etc.
  metric_name VARCHAR(100) NOT NULL,
  duration_ms NUMERIC NOT NULL,
  page_url TEXT,
  api_endpoint TEXT,
  query_name TEXT,
  user_id UUID REFERENCES profiles(id),
  additional_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for performance metrics
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_duration ON performance_metrics(duration_ms);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);

-- Composite indexes for analytics
CREATE INDEX IF NOT EXISTS idx_performance_analytics ON performance_metrics(metric_type, metric_name, created_at DESC);

-- Create materialized view for performance dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS performance_dashboard AS
SELECT 
  metric_type,
  metric_name,
  COUNT(*) as sample_count,
  AVG(duration_ms) as avg_duration,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms) as median_duration,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration,
  MIN(duration_ms) as min_duration,
  MAX(duration_ms) as max_duration,
  DATE_TRUNC('hour', created_at) as hour_bucket
FROM performance_metrics
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY metric_type, metric_name, DATE_TRUNC('hour', created_at)
ORDER BY hour_bucket DESC;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_performance_dashboard_composite ON performance_dashboard(metric_type, metric_name, hour_bucket);

-- Create function to refresh performance dashboard
CREATE OR REPLACE FUNCTION refresh_performance_dashboard()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY performance_dashboard;
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for web vitals dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS web_vitals_dashboard AS
SELECT 
  metric_name,
  COUNT(*) as sample_count,
  AVG(metric_value) as avg_value,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY metric_value) as median_value,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY metric_value) as p75_value,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY metric_value) as p95_value,
  COUNT(*) FILTER (WHERE rating = 'good') as good_count,
  COUNT(*) FILTER (WHERE rating = 'needs-improvement') as needs_improvement_count,
  COUNT(*) FILTER (WHERE rating = 'poor') as poor_count,
  ROUND(COUNT(*) FILTER (WHERE rating = 'good') * 100.0 / COUNT(*), 2) as good_percentage,
  DATE_TRUNC('hour', recorded_at) as hour_bucket
FROM web_vitals_metrics
WHERE recorded_at >= NOW() - INTERVAL '24 hours'
GROUP BY metric_name, DATE_TRUNC('hour', recorded_at)
ORDER BY hour_bucket DESC;

-- Create index on web vitals dashboard
CREATE INDEX IF NOT EXISTS idx_web_vitals_dashboard_composite ON web_vitals_dashboard(metric_name, hour_bucket);

-- Create function to clean up old analytics data
CREATE OR REPLACE FUNCTION cleanup_old_analytics_data(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
  cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
  cutoff_date := NOW() - INTERVAL '1 day' * days_to_keep;
  
  -- Clean up old web vitals data
  DELETE FROM web_vitals_metrics WHERE created_at < cutoff_date;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Clean up old performance metrics
  DELETE FROM performance_metrics WHERE created_at < cutoff_date;
  
  -- Clean up resolved error logs older than 30 days
  DELETE FROM error_logs 
  WHERE resolved = true AND created_at < NOW() - INTERVAL '30 days';
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get performance summary
CREATE OR REPLACE FUNCTION get_performance_summary(hours_back INTEGER DEFAULT 24)
RETURNS TABLE(
  metric_type TEXT,
  avg_duration NUMERIC,
  p95_duration NUMERIC,
  sample_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pm.metric_type::TEXT,
    AVG(pm.duration_ms) as avg_duration,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY pm.duration_ms) as p95_duration,
    COUNT(*) as sample_count
  FROM performance_metrics pm
  WHERE pm.created_at >= NOW() - INTERVAL '1 hour' * hours_back
  GROUP BY pm.metric_type
  ORDER BY avg_duration DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get core web vitals summary
CREATE OR REPLACE FUNCTION get_web_vitals_summary(hours_back INTEGER DEFAULT 24)
RETURNS TABLE(
  metric_name TEXT,
  avg_value NUMERIC,
  p75_value NUMERIC,
  good_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wv.metric_name::TEXT,
    AVG(wv.metric_value) as avg_value,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY wv.metric_value) as p75_value,
    ROUND(COUNT(*) FILTER (WHERE wv.rating = 'good') * 100.0 / COUNT(*), 2) as good_percentage
  FROM web_vitals_metrics wv
  WHERE wv.recorded_at >= NOW() - INTERVAL '1 hour' * hours_back
    AND wv.metric_name IN ('LCP', 'FID', 'CLS')
  GROUP BY wv.metric_name
  ORDER BY 
    CASE wv.metric_name 
      WHEN 'LCP' THEN 1 
      WHEN 'FID' THEN 2 
      WHEN 'CLS' THEN 3 
      ELSE 4 
    END;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for performance monitoring
GRANT SELECT, INSERT ON web_vitals_metrics TO authenticated;
GRANT SELECT, INSERT ON error_logs TO authenticated;
GRANT SELECT, INSERT ON performance_metrics TO authenticated;
GRANT SELECT ON performance_dashboard TO authenticated;
GRANT SELECT ON web_vitals_dashboard TO authenticated;