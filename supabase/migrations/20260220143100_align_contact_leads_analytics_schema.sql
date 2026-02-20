ALTER TABLE public.contact_leads
  ADD COLUMN IF NOT EXISTS technical_requirements text,
  ADD COLUMN IF NOT EXISTS annual_volume text;

ALTER TABLE public.analytics_events
  ADD COLUMN IF NOT EXISTS campaign_id text;
