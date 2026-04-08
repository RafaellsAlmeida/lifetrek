ALTER TABLE public.engineering_drawing_sessions
ADD COLUMN IF NOT EXISTS normalized_document JSONB;
