-- Create GA4 analytics tables to store synced data from Google Analytics
CREATE TABLE public.ga4_analytics_daily (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date DATE NOT NULL,
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  sessions INTEGER DEFAULT 0,
  engaged_sessions INTEGER DEFAULT 0,
  avg_session_duration_seconds NUMERIC DEFAULT 0,
  engagement_rate NUMERIC DEFAULT 0,
  bounce_rate NUMERIC DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(snapshot_date)
);

CREATE TABLE public.ga4_page_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date DATE NOT NULL,
  page_path TEXT NOT NULL,
  page_title TEXT,
  page_views INTEGER DEFAULT 0,
  avg_time_on_page_seconds NUMERIC DEFAULT 0,
  bounce_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(snapshot_date, page_path)
);

CREATE TABLE public.ga4_traffic_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date DATE NOT NULL,
  source TEXT NOT NULL,
  medium TEXT,
  sessions INTEGER DEFAULT 0,
  users INTEGER DEFAULT 0,
  engagement_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(snapshot_date, source, medium)
);

-- Add pillar and image_url columns to content_templates if missing
ALTER TABLE public.content_templates 
  ADD COLUMN IF NOT EXISTS pillar TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Enable RLS
ALTER TABLE public.ga4_analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga4_page_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga4_traffic_sources ENABLE ROW LEVEL SECURITY;

-- Admin read policies
CREATE POLICY "Admins can view GA4 daily analytics"
  ON public.ga4_analytics_daily
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view GA4 page analytics"
  ON public.ga4_page_analytics
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view GA4 traffic sources"
  ON public.ga4_traffic_sources
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));