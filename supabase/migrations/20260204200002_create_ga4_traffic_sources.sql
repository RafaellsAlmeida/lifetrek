-- GA4 Traffic Sources
-- Stores daily metrics by traffic source/medium

CREATE TABLE IF NOT EXISTS ga4_traffic_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL,
  source text NOT NULL,
  medium text,
  campaign text,
  sessions int DEFAULT 0,
  users int DEFAULT 0,
  new_users int DEFAULT 0,
  engaged_sessions int DEFAULT 0,
  engagement_rate float DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(snapshot_date, source, COALESCE(medium, ''), COALESCE(campaign, ''))
);

-- Indexes
CREATE INDEX idx_ga4_traffic_date ON ga4_traffic_sources(snapshot_date DESC);
CREATE INDEX idx_ga4_traffic_source ON ga4_traffic_sources(source);

-- Enable RLS
ALTER TABLE ga4_traffic_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view traffic sources" ON ga4_traffic_sources
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role can manage traffic sources" ON ga4_traffic_sources
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE ga4_traffic_sources IS 'Daily traffic source breakdown from GA4';
