-- Smart asset selection foundation
-- Creates a dedicated asset_embeddings index table and semantic retrieval RPC.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.asset_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid,
  asset_url text NOT NULL UNIQUE,
  category text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  search_text text,
  embedding vector(1536),
  quality_score numeric NOT NULL DEFAULT 0.75,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asset_embeddings_category ON public.asset_embeddings(category);
CREATE INDEX IF NOT EXISTS idx_asset_embeddings_active ON public.asset_embeddings(active);
CREATE INDEX IF NOT EXISTS idx_asset_embeddings_embedding
  ON public.asset_embeddings
  USING hnsw (embedding vector_cosine_ops);

CREATE OR REPLACE FUNCTION public.set_asset_embeddings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_asset_embeddings_updated_at ON public.asset_embeddings;
CREATE TRIGGER trg_asset_embeddings_updated_at
BEFORE UPDATE ON public.asset_embeddings
FOR EACH ROW
EXECUTE FUNCTION public.set_asset_embeddings_updated_at();

-- Backfill from product_catalog so semantic retrieval has initial rows.
INSERT INTO public.asset_embeddings (
  asset_id,
  asset_url,
  category,
  tags,
  search_text,
  quality_score,
  active
)
SELECT
  pc.id,
  pc.image_url,
  COALESCE(pc.category, 'asset') AS category,
  COALESCE(
    CASE
      WHEN jsonb_typeof(pc.metadata->'tags') = 'array' THEN ARRAY(
        SELECT jsonb_array_elements_text(pc.metadata->'tags')
      )
      ELSE '{}'::text[]
    END,
    '{}'::text[]
  ) AS tags,
  trim(concat_ws(' ', pc.name, pc.description, pc.metadata->>'alt_text')) AS search_text,
  COALESCE((pc.metadata->>'quality_score')::numeric, 0.75) AS quality_score,
  true
FROM public.product_catalog pc
WHERE pc.image_url IS NOT NULL
ON CONFLICT (asset_url)
DO UPDATE SET
  asset_id = EXCLUDED.asset_id,
  category = EXCLUDED.category,
  tags = EXCLUDED.tags,
  search_text = EXCLUDED.search_text,
  quality_score = EXCLUDED.quality_score,
  active = EXCLUDED.active,
  updated_at = now();

CREATE OR REPLACE FUNCTION public.match_asset_candidates(
  query_embedding vector(1536),
  categories text[] DEFAULT NULL,
  match_threshold float DEFAULT 0.50,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  asset_id uuid,
  asset_url text,
  category text,
  tags text[],
  search_text text,
  quality_score numeric,
  similarity float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ae.asset_id,
    ae.asset_url,
    ae.category,
    ae.tags,
    ae.search_text,
    ae.quality_score,
    1 - (ae.embedding <=> query_embedding) AS similarity
  FROM public.asset_embeddings ae
  WHERE ae.active = true
    AND ae.embedding IS NOT NULL
    AND (
      categories IS NULL
      OR array_length(categories, 1) IS NULL
      OR ae.category = ANY(categories)
    )
    AND 1 - (ae.embedding <=> query_embedding) >= match_threshold
  ORDER BY ae.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

GRANT SELECT ON public.asset_embeddings TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.match_asset_candidates(vector, text[], float, int) TO authenticated, service_role;
