import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { content, source_type, metadata } = await req.json();

    if (!content) {
      throw new Error("Content is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openRouterKey = Deno.env.get("OPEN_ROUTER_API") || Deno.env.get("OPEN_ROUTER_API_KEY");

    if (!openRouterKey) {
      throw new Error("OPEN_ROUTER_API or OPEN_ROUTER_API_KEY is missing");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Generate Embedding using OpenAI 3-small (cost-effective)
    // We truncate/ensure it's 768d to match the table schema (vector(768))
    console.log(`Generating embedding for content: ${content.substring(0, 50)}...`);
    
    const embedResponse = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openRouterKey}`,
      },
      body: JSON.stringify({
        model: "openai/text-embedding-3-small",
        input: content,
      })
    });

    if (!embedResponse.ok) {
      const errorText = await embedResponse.text();
      console.error("OpenRouter Error:", errorText);
      throw new Error(`OpenRouter Embedding API error: ${errorText}`);
    }

    const embedData = await embedResponse.json();
    let embedding = embedData.data?.[0]?.embedding;

    if (!embedding || !Array.isArray(embedding)) {
      throw new Error("Invalid embedding response from OpenRouter");
    }

    // Handle dimension mismatch (table expects 768, text-embedding-3-small defaults to 1536)
    if (embedding.length > 768) {
      console.log(`Truncating embedding from ${embedding.length} to 768 dimensions`);
      embedding = embedding.slice(0, 768);
    } else if (embedding.length < 768) {
      console.warn(`Embedding dimension mismatch: expected 768, got ${embedding.length}. Padding with zeros.`);
      embedding = [...embedding, ...new Array(768 - embedding.length).fill(0)];
    }

    // 2. Insert into knowledge_base table
    const { data, error } = await supabase
      .from("knowledge_base")
      .insert({
        id: crypto.randomUUID(),
        content: content,
        category: source_type === "post_examples" ? "Exemplos" : (metadata?.category || "General"),
        question: source_type === "post_examples" ? `Exemplo de Post: ${content.substring(0, 50)}...` : (metadata?.question || null),
        answer: content,
        source_type: source_type || "manual",
        source_id: metadata?.source_id || "web_ingest",
        metadata: {
          ...metadata,
          ingested_at: new Date().toISOString(),
          model: "text-embedding-3-small"
        },
        embedding: embedding,
        tags: metadata?.tags || []
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase Error:", error);
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Ingestion Error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage, status: 500 }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
