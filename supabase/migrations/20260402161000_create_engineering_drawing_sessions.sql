INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'engineering-drawings',
  'engineering-drawings',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.engineering_drawing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  title TEXT NOT NULL DEFAULT 'Novo desenho técnico',
  status TEXT NOT NULL DEFAULT 'draft',
  unit TEXT NOT NULL DEFAULT 'mm',
  notes TEXT,
  source_image_path TEXT,
  source_image_name TEXT,
  raw_extraction JSONB,
  normalized_spec JSONB,
  review_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  validation_report JSONB,
  drawing_svg TEXT,
  render_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  exports JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users (id),
  reviewed_by UUID REFERENCES auth.users (id)
);

CREATE INDEX IF NOT EXISTS idx_engineering_drawing_sessions_created_at
  ON public.engineering_drawing_sessions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_engineering_drawing_sessions_status
  ON public.engineering_drawing_sessions (status);

CREATE INDEX IF NOT EXISTS idx_engineering_drawing_sessions_created_by
  ON public.engineering_drawing_sessions (created_by);

DROP TRIGGER IF EXISTS update_engineering_drawing_sessions_updated_at
  ON public.engineering_drawing_sessions;

CREATE TRIGGER update_engineering_drawing_sessions_updated_at
  BEFORE UPDATE ON public.engineering_drawing_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contact_leads_updated_at();

ALTER TABLE public.engineering_drawing_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage engineering drawing sessions"
  ON public.engineering_drawing_sessions;

CREATE POLICY "Admins manage engineering drawing sessions"
  ON public.engineering_drawing_sessions
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can view engineering drawings bucket"
  ON storage.objects;

CREATE POLICY "Admins can view engineering drawings bucket"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'engineering-drawings'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );

DROP POLICY IF EXISTS "Admins can upload engineering drawings bucket"
  ON storage.objects;

CREATE POLICY "Admins can upload engineering drawings bucket"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'engineering-drawings'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );

DROP POLICY IF EXISTS "Admins can update engineering drawings bucket"
  ON storage.objects;

CREATE POLICY "Admins can update engineering drawings bucket"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'engineering-drawings'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    bucket_id = 'engineering-drawings'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );

DROP POLICY IF EXISTS "Admins can delete engineering drawings bucket"
  ON storage.objects;

CREATE POLICY "Admins can delete engineering drawings bucket"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'engineering-drawings'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );
