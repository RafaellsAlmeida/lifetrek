-- GA4 Page-level Analytics
-- Stores daily metrics per page path

CREATE TABLE IF NOT EXISTS ga4_page_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL,
  page_path text NOT NULL,
  page_title text,
  page_views int DEFAULT 0,
  unique_views int DEFAULT 0,
  avg_time_on_page_seconds float DEFAULT 0,
  entrances int DEFAULT 0,
  exits int DEFAULT 0,
  bounce_rate float DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(snapshot_date, page_path)
);

-- Indexes for efficient queries
CREATE INDEX idx_ga4_page_date ON ga4_page_analytics(snapshot_date DESC);
CREATE INDEX idx_ga4_page_path ON ga4_page_analytics(page_path);

-- Enable RLS
ALTER TABLE ga4_page_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view page analytics" ON ga4_page_analytics
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role can manage page analytics" ON ga4_page_analytics
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE ga4_page_analytics IS 'Daily page-level metrics from GA4';
