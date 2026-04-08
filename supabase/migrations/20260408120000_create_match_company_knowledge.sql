-- Create a unique RAG RPC for the website chatbot.
-- This avoids the overloaded match_knowledge_base function and only queries the active company KB.

CREATE OR REPLACE FUNCTION public.match_company_knowledge(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.30,
  match_count int DEFAULT 4
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
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.content,
    kb.metadata,
    kb.source_type,
    kb.category,
    kb.question,
    kb.answer,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_base kb
  WHERE kb.embedding IS NOT NULL
    AND 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.match_company_knowledge(vector, float, int) TO authenticated, service_role;
