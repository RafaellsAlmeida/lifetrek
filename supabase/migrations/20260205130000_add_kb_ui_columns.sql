-- Migration to add structured columns to knowledge_base table
-- This aligns the database with the UI expectations in KnowledgeBaseCore.tsx

ALTER TABLE public.knowledge_base
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS question TEXT,
  ADD COLUMN IF NOT EXISTS answer TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Update existing records if possible (guess category from metadata)
UPDATE public.knowledge_base
SET 
  category = metadata->>'category',
  question = COALESCE(metadata->>'title', LEFT(content, 100))
WHERE category IS NULL;

-- Enable RLS for these columns (they inherit from table)
-- But we ensure the search function includes them if needed.

-- Optional: Update match_knowledge_base to return these columns
CREATE OR REPLACE FUNCTION match_knowledge_base(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  source_type text,
  category text,
  question text,
  answer text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    knowledge_base.id,
    knowledge_base.content,
    knowledge_base.metadata,
    knowledge_base.source_type,
    knowledge_base.category,
    knowledge_base.question,
    knowledge_base.answer,
    1 - (knowledge_base.embedding <=> query_embedding) as similarity
  FROM knowledge_base
  WHERE 1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
  ORDER BY knowledge_base.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
