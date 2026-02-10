-- Ensure GA4 tables have all columns used by the sync function

ALTER TABLE public.ga4_analytics_daily
  ADD COLUMN IF NOT EXISTS new_users INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS engaged_sessions INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS events_count INTEGER DEFAULT 0;

ALTER TABLE public.ga4_page_analytics
  ADD COLUMN IF NOT EXISTS entrances INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exits INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unique_views INTEGER DEFAULT 0;

ALTER TABLE public.ga4_traffic_sources
  ADD COLUMN IF NOT EXISTS new_users INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS engaged_sessions INTEGER DEFAULT 0;
