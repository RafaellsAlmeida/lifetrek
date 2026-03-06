-- Content Engine 2026 Foundation
-- Stories: 1.1, 1.2, 1.3

-- =====================================================
-- 1) content_ideas (ideation persistence)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.content_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  icp_segment TEXT NOT NULL DEFAULT 'general',
  platform TEXT NOT NULL DEFAULT 'linkedin' CHECK (platform IN ('linkedin', 'instagram', 'blog', 'multi')),
  objective TEXT,
  pain_point TEXT,
  desired_outcome TEXT,
  source_references JSONB NOT NULL DEFAULT '[]'::jsonb,
  strategy JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_content_ideas_created_at
  ON public.content_ideas (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_ideas_platform
  ON public.content_ideas (platform);
CREATE INDEX IF NOT EXISTS idx_content_ideas_created_by
  ON public.content_ideas (created_by);

ALTER TABLE public.content_ideas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'content_ideas'
      AND policyname = 'Admins can manage content ideas'
  ) THEN
    CREATE POLICY "Admins can manage content ideas"
      ON public.content_ideas
      FOR ALL
      TO authenticated
      USING (has_role(auth.uid(), 'admin'))
      WITH CHECK (has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'content_ideas'
      AND policyname = 'Service role can manage content ideas'
  ) THEN
    CREATE POLICY "Service role can manage content ideas"
      ON public.content_ideas
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- =====================================================
-- 2) linkedin_analytics (normalized CSV persistence)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.linkedin_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_period TEXT NOT NULL, -- YYYY-MM
  posted_at DATE NOT NULL,
  post_url TEXT NOT NULL,
  post_id TEXT,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  reactions INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  engagement_rate NUMERIC(8,4),
  ctr NUMERIC(8,4),
  source_file_name TEXT,
  source_row_hash TEXT NOT NULL UNIQUE,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  ingested_by UUID REFERENCES auth.users(id),
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_linkedin_analytics_uploaded_period
  ON public.linkedin_analytics (uploaded_period);
CREATE INDEX IF NOT EXISTS idx_linkedin_analytics_posted_at
  ON public.linkedin_analytics (posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_linkedin_analytics_post_id
  ON public.linkedin_analytics (post_id);

ALTER TABLE public.linkedin_analytics ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'linkedin_analytics'
      AND policyname = 'Admins can view linkedin analytics normalized'
  ) THEN
    CREATE POLICY "Admins can view linkedin analytics normalized"
      ON public.linkedin_analytics
      FOR SELECT
      TO authenticated
      USING (has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'linkedin_analytics'
      AND policyname = 'Service role can manage linkedin analytics normalized'
  ) THEN
    CREATE POLICY "Service role can manage linkedin analytics normalized"
      ON public.linkedin_analytics
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- =====================================================
-- 3) blog_posts hero/status alignment helpers
-- =====================================================

ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT;

UPDATE public.blog_posts
SET hero_image_url = COALESCE(hero_image_url, featured_image)
WHERE hero_image_url IS NULL;

CREATE OR REPLACE FUNCTION public.sync_blog_hero_featured()
RETURNS TRIGGER AS $$
BEGIN
  NEW.hero_image_url := COALESCE(NEW.hero_image_url, NEW.featured_image);
  NEW.featured_image := COALESCE(NEW.featured_image, NEW.hero_image_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_blog_hero_featured ON public.blog_posts;
CREATE TRIGGER trg_sync_blog_hero_featured
  BEFORE INSERT OR UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_blog_hero_featured();

CREATE OR REPLACE VIEW public.blog_posts_hero_backfill_candidates AS
SELECT
  id,
  title,
  status,
  created_at,
  updated_at
FROM public.blog_posts
WHERE COALESCE(hero_image_url, featured_image) IS NULL;

