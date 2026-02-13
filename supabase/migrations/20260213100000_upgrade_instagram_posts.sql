-- Upgrade instagram_posts table to support AI Design Agency pipeline
-- Adds columns for carousel slides, quality tracking, embeddings, and image storage
-- Date: 2026-02-13

-- 1. Add slides JSONB for carousel content (mirrors linkedin_carousels.slides)
ALTER TABLE public.instagram_posts
  ADD COLUMN IF NOT EXISTS slides JSONB,
  ADD COLUMN IF NOT EXISTS quality_score NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS generation_metadata JSONB,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS image_urls TEXT[];

-- 2. Fix post_type constraint to include 'carousel'
DO $$
BEGIN
  ALTER TABLE public.instagram_posts DROP CONSTRAINT IF EXISTS instagram_posts_post_type_check;
  ALTER TABLE public.instagram_posts
    ADD CONSTRAINT instagram_posts_post_type_check
    CHECK (post_type IN ('feed', 'story', 'reel', 'carousel'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 3. Add vector embedding for RAG similarity search
ALTER TABLE public.instagram_posts
  ADD COLUMN IF NOT EXISTS content_embedding vector(768);

CREATE INDEX IF NOT EXISTS idx_instagram_posts_content_embedding
  ON public.instagram_posts
  USING hnsw (content_embedding vector_cosine_ops);

-- 4. Add metrics columns (matching linkedin_carousels)
ALTER TABLE public.instagram_posts
  ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shares INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS engagement_rate NUMERIC DEFAULT 0;

-- 5. Function to search for similar successful Instagram posts
CREATE OR REPLACE FUNCTION match_successful_instagram_posts(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 3
)
RETURNS TABLE (
  id uuid,
  topic text,
  slides jsonb,
  caption text,
  post_type text,
  quality_score numeric,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ip.id,
    ip.topic,
    ip.slides,
    ip.caption,
    ip.post_type,
    ip.quality_score,
    1 - (ip.content_embedding <=> query_embedding) as similarity
  FROM instagram_posts ip
  WHERE ip.content_embedding IS NOT NULL
    AND ip.quality_score >= 70
    AND ip.status IN ('approved', 'published')
    AND 1 - (ip.content_embedding <=> query_embedding) > match_threshold
  ORDER BY ip.content_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION match_successful_instagram_posts TO authenticated;
GRANT EXECUTE ON FUNCTION match_successful_instagram_posts TO service_role;
