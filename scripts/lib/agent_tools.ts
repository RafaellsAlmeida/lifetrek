/**
 * Shared RAG utilities for CLI content pipelines.
 * Extracted from supabase/functions/generate-linkedin-carousel/agent_tools.ts
 * for reuse across terminal scripts.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

// ─── Embeddings ─────────────────────────────────────────────────────────────

export async function generateEmbedding(
  input: string,
  dimensions: number = 768
): Promise<number[] | null> {
  try {
    const openRouterKey = Deno.env.get("OPEN_ROUTER_API") || Deno.env.get("OPEN_ROUTER_API_KEY");
    if (!openRouterKey) {
      console.warn("   Embedding: No API key, skipping");
      return null;
    }

    const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openRouterKey}`,
      },
      body: JSON.stringify({
        model: "openai/text-embedding-3-small",
        input,
        dimensions,
      }),
    });

    if (!response.ok) {
      console.error("   Embedding API error:", await response.text());
      return null;
    }

    const data = await response.json();
    let embedding = data.data?.[0]?.embedding;

    if (embedding && embedding.length > dimensions) {
      embedding = embedding.slice(0, dimensions);
    } else if (embedding && embedding.length < dimensions) {
      embedding = [...embedding, ...new Array(dimensions - embedding.length).fill(0)];
    }

    return embedding || null;
  } catch (error) {
    console.error("   Embedding generation error:", error);
    return null;
  }
}

// ─── Similar Carousels ──────────────────────────────────────────────────────

export async function searchSimilarCarousels(
  supabase: SupabaseClient,
  queryEmbedding: number[],
  matchThreshold: number = 0.5,
  matchCount: number = 3
): Promise<any[]> {
  try {
    const { data, error } = await supabase.rpc("match_successful_carousels", {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
    });

    if (error) {
      console.error("   Similar carousel search error:", error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("   Similar carousel search error:", error);
    return [];
  }
}

// ─── Knowledge Base ─────────────────────────────────────────────────────────

export async function searchKnowledgeBase(
  supabase: SupabaseClient,
  query: string,
  matchThreshold: number = 0.5,
  matchCount: number = 3
): Promise<any[]> {
  try {
    const queryEmbedding = await generateEmbedding(query, 768);
    if (!queryEmbedding) return [];

    const { data, error } = await supabase.rpc("match_knowledge_base", {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
    });

    if (error) {
      console.error("   KB search error:", error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("   KB search error:", error);
    return [];
  }
}

// ─── Similar Instagram Posts ────────────────────────────────────────────────

export async function searchSimilarInstagramPosts(
  supabase: SupabaseClient,
  queryEmbedding: number[],
  matchThreshold: number = 0.5,
  matchCount: number = 3
): Promise<any[]> {
  try {
    const { data, error } = await supabase.rpc("match_successful_instagram_posts", {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
    });

    if (error) {
      console.error("   Similar Instagram post search error:", error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("   Similar Instagram post search error:", error);
    return [];
  }
}

// ─── Deep Research (Perplexity) ─────────────────────────────────────────────

export async function deepResearch(
  query: string,
  maxTimeMs: number = 15000,
  platform: "linkedin" | "instagram" = "linkedin"
): Promise<string | null> {
  try {
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) {
      console.warn("   Research: No PERPLEXITY_API_KEY, skipping");
      return null;
    }

    const platformContext = platform === "instagram"
      ? `a B2B Instagram post (visual-first, 1080x1080 carousel or feed) about medical device manufacturing`
      : `a B2B LinkedIn carousel about medical device manufacturing`;

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-reasoning",
        messages: [{
          role: "user",
          content: `Research this topic for ${platformContext}. Provide: 1) Latest industry trends/statistics (${new Date().getFullYear()}), 2) Key pain points for OEM decision makers, 3) Technical facts and regulatory updates. Keep it concise (3-4 key points). Topic: ${query}`,
        }],
        max_tokens: 500,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(maxTimeMs),
    });

    if (!response.ok) {
      console.warn(`   Research API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error: any) {
    if (error.name === "TimeoutError") {
      console.warn(`   Research timeout after ${maxTimeMs}ms`);
    } else {
      console.error("   Research error:", error);
    }
    return null;
  }
}
