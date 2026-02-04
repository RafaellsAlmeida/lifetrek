-- GA4 Analytics Daily Snapshots
-- Stores aggregated daily metrics from Google Analytics 4

CREATE TABLE IF NOT EXISTS ga4_analytics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL UNIQUE,
  total_users int DEFAULT 0,
  new_users int DEFAULT 0,
  sessions int DEFAULT 0,
  engaged_sessions int DEFAULT 0,
  avg_session_duration_seconds float DEFAULT 0,
  engagement_rate float DEFAULT 0,
  bounce_rate float DEFAULT 0,
  page_views int DEFAULT 0,
  events_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Index for efficient date range queries
CREATE INDEX idx_ga4_daily_date ON ga4_analytics_daily(snapshot_date DESC);

-- Enable RLS
ALTER TABLE ga4_analytics_daily ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated users can view
CREATE POLICY "Authenticated users can view ga4 analytics" ON ga4_analytics_daily
  FOR SELECT TO authenticated USING (true);

-- Policy: Service role can insert/update
CREATE POLICY "Service role can manage ga4 analytics" ON ga4_analytics_daily
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE ga4_analytics_daily IS 'Daily aggregated metrics from Google Analytics 4';
