-- Upgrade asset_embeddings to support Gemini Embedding 2 (multimodal)
-- Using 768 dimensions via MRL (Matryoshka Representation Learning) for efficiency
-- Gemini Embedding 2 natively supports 3072d but 768d via MRL retains ~95% quality

-- Add new column for Gemini Embedding 2 vectors
ALTER TABLE asset_embeddings ADD COLUMN IF NOT EXISTS embedding_v2 vector(768);

-- Add HNSW index for fast similarity search on new embeddings
CREATE INDEX IF NOT EXISTS idx_asset_embeddings_embedding_v2
  ON asset_embeddings
  USING hnsw (embedding_v2 vector_cosine_ops);

-- Track which embedding model was used
ALTER TABLE asset_embeddings ADD COLUMN IF NOT EXISTS embedding_model text DEFAULT 'openai/text-embedding-3-small';

-- Updated RPC function for semantic retrieval using Gemini Embedding 2
CREATE OR REPLACE FUNCTION match_asset_candidates_v2(
  query_embedding vector(768),
  categories text[] DEFAULT NULL,
  match_threshold float DEFAULT 0.40,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  asset_id uuid,
  asset_url text,
  category text,
  tags text[],
  search_text text,
  quality_score numeric,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ae.id,
    ae.asset_id,
    ae.asset_url,
    ae.category,
    ae.tags,
    ae.search_text,
    ae.quality_score,
    1 - (ae.embedding_v2 <=> query_embedding) AS similarity
  FROM asset_embeddings ae
  WHERE ae.active = true
    AND ae.embedding_v2 IS NOT NULL
    AND (categories IS NULL OR ae.category = ANY(categories))
    AND 1 - (ae.embedding_v2 <=> query_embedding) > match_threshold
  ORDER BY ae.embedding_v2 <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION match_asset_candidates_v2(vector, text[], float, int) TO authenticated, service_role;
