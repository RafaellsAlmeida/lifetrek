-- Stakeholder Email Approval System — DB Schema
-- Story 6.1: stakeholder_review_batches, stakeholder_review_tokens, stakeholder_review_items
-- Also extends status CHECK constraints on content tables

-- =====================================================
-- 1) stakeholder_review_batches
-- =====================================================

CREATE TABLE IF NOT EXISTS public.stakeholder_review_batches (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by   UUID        REFERENCES auth.users(id),
  notes        TEXT,
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()) + INTERVAL '7 days',
  status       TEXT        NOT NULL DEFAULT 'sent'
                           CHECK (status IN ('sent', 'completed', 'expired')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_stakeholder_review_batches_status
  ON public.stakeholder_review_batches (status);
CREATE INDEX IF NOT EXISTS idx_stakeholder_review_batches_created_by
  ON public.stakeholder_review_batches (created_by);

ALTER TABLE public.stakeholder_review_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage review batches"
  ON public.stakeholder_review_batches
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage review batches"
  ON public.stakeholder_review_batches
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 2) stakeholder_review_tokens
-- =====================================================

CREATE TABLE IF NOT EXISTS public.stakeholder_review_tokens (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id       UUID        NOT NULL REFERENCES public.stakeholder_review_batches(id) ON DELETE CASCADE,
  reviewer_email TEXT        NOT NULL,
  token          UUID        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  expires_at     TIMESTAMPTZ NOT NULL,
  last_used_at   TIMESTAMPTZ
);

-- Primary lookup index — used on every review-action request
CREATE INDEX IF NOT EXISTS idx_stakeholder_review_tokens_token
  ON public.stakeholder_review_tokens (token);
CREATE INDEX IF NOT EXISTS idx_stakeholder_review_tokens_batch_id
  ON public.stakeholder_review_tokens (batch_id);

ALTER TABLE public.stakeholder_review_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage review tokens"
  ON public.stakeholder_review_tokens
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage review tokens"
  ON public.stakeholder_review_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 3) stakeholder_review_items
-- =====================================================

CREATE TABLE IF NOT EXISTS public.stakeholder_review_items (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id           UUID        NOT NULL REFERENCES public.stakeholder_review_batches(id) ON DELETE CASCADE,
  content_type       TEXT        NOT NULL
                                 CHECK (content_type IN ('linkedin_carousel', 'instagram_post', 'blog_post')),
  content_id         UUID        NOT NULL,
  status             TEXT        NOT NULL DEFAULT 'pending'
                                 CHECK (status IN ('pending', 'approved', 'rejected', 'edit_suggested')),
  reviewed_by_email  TEXT,
  reviewer_comment   TEXT,
  -- copy_edits schema by type:
  -- carousels/instagram: {"caption":"...","slides":[{"index":0,"headline":"...","body":"..."}]}
  -- blog_posts:          {"title":"...","excerpt":"..."}
  copy_edits         JSONB,
  reviewed_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_stakeholder_review_items_batch_content
  ON public.stakeholder_review_items (batch_id, content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_stakeholder_review_items_content_id
  ON public.stakeholder_review_items (content_id);
CREATE INDEX IF NOT EXISTS idx_stakeholder_review_items_status
  ON public.stakeholder_review_items (status);

ALTER TABLE public.stakeholder_review_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage review items"
  ON public.stakeholder_review_items
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage review items"
  ON public.stakeholder_review_items
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 4) Extend status CHECK constraints on content tables
-- =====================================================
-- Add stakeholder_review_pending, stakeholder_approved, stakeholder_rejected
-- while preserving all existing allowed values.

ALTER TABLE IF EXISTS public.linkedin_carousels
  DROP CONSTRAINT IF EXISTS linkedin_carousels_status_check;
ALTER TABLE public.linkedin_carousels
  ADD CONSTRAINT linkedin_carousels_status_check
  CHECK (status IN (
    'draft', 'pending_approval', 'approved', 'rejected',
    'published', 'scheduled', 'archived',
    'stakeholder_review_pending', 'stakeholder_approved', 'stakeholder_rejected'
  ));

ALTER TABLE IF EXISTS public.instagram_posts
  DROP CONSTRAINT IF EXISTS instagram_posts_status_check;
ALTER TABLE public.instagram_posts
  ADD CONSTRAINT instagram_posts_status_check
  CHECK (status IN (
    'draft', 'pending_approval', 'approved', 'rejected',
    'published', 'scheduled', 'archived',
    'stakeholder_review_pending', 'stakeholder_approved', 'stakeholder_rejected'
  ));

ALTER TABLE IF EXISTS public.blog_posts
  DROP CONSTRAINT IF EXISTS blog_posts_status_check;
ALTER TABLE public.blog_posts
  ADD CONSTRAINT blog_posts_status_check
  CHECK (status IN (
    'draft', 'pending_review', 'approved', 'rejected',
    'published', 'scheduled', 'archived',
    'stakeholder_review_pending', 'stakeholder_approved', 'stakeholder_rejected'
  ));
