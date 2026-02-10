-- Add campaign tracking fields to linkedin_carousels
ALTER TABLE public.linkedin_carousels
ADD COLUMN IF NOT EXISTS campaign_id text,
ADD COLUMN IF NOT EXISTS utm_campaign text;

CREATE INDEX IF NOT EXISTS idx_linkedin_carousels_campaign_id
ON public.linkedin_carousels (campaign_id);

-- Add campaign tracking fields to analytics_events
ALTER TABLE public.analytics_events
ADD COLUMN IF NOT EXISTS campaign_id text,
ADD COLUMN IF NOT EXISTS utm_campaign text,
ADD COLUMN IF NOT EXISTS utm_source text,
ADD COLUMN IF NOT EXISTS utm_medium text;

CREATE INDEX IF NOT EXISTS idx_analytics_events_campaign
ON public.analytics_events (campaign_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_utm_campaign
ON public.analytics_events (utm_campaign);
