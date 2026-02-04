-- Expand analytics_events to support more event types
-- and add better indexing for analytics queries

-- First, drop the constraint to allow more event types
ALTER TABLE public.analytics_events 
DROP CONSTRAINT IF EXISTS analytics_events_event_type_check;

-- Add new constraint with expanded event types
ALTER TABLE public.analytics_events
ADD CONSTRAINT analytics_events_event_type_check 
CHECK (event_type IN (
  -- Original types
  'chatbot_interaction',
  'form_submission', 
  'lead_magnet_usage',
  'consultation_scheduled',
  -- New website behavior types
  'resource_view',
  'resource_read',
  'resource_download',
  'page_scroll_depth',
  'calculator_started',
  'calculator_completed',
  'outbound_click',
  'cta_click',
  'video_play',
  'video_complete',
  -- Chatbot specific
  'chatbot_opened',
  'chatbot_message_sent',
  'chatbot_lead_captured',
  -- Form specific  
  'form_started',
  'form_field_interaction',
  'form_abandoned'
));

-- Add session_id column for grouping events by visitor session
ALTER TABLE public.analytics_events 
ADD COLUMN IF NOT EXISTS session_id text;

-- Add page_path for context
ALTER TABLE public.analytics_events 
ADD COLUMN IF NOT EXISTS page_path text;

-- Add referrer for attribution
ALTER TABLE public.analytics_events 
ADD COLUMN IF NOT EXISTS referrer text;

-- Add user_agent for device info
ALTER TABLE public.analytics_events 
ADD COLUMN IF NOT EXISTS user_agent text;

-- Create index for session queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_session 
ON public.analytics_events(session_id);

-- Create index for page path queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_page 
ON public.analytics_events(page_path);

-- Create index for date range queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_date 
ON public.analytics_events(date(created_at));

-- Create materialized view for daily aggregates (for fast dashboard queries)
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_daily_summary AS
SELECT 
  date(created_at) as event_date,
  event_type,
  count(*) as event_count,
  count(DISTINCT session_id) as unique_sessions,
  count(DISTINCT company_email) FILTER (WHERE company_email IS NOT NULL) as unique_leads
FROM public.analytics_events
GROUP BY date(created_at), event_type;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_summary_date_type 
ON analytics_daily_summary(event_date, event_type);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_analytics_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_daily_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
