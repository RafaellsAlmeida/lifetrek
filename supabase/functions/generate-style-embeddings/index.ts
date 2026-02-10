import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const geminiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_AI_API_KEY");

        if (!geminiKey) {
            throw new Error("GEMINI_API_KEY not configured");
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get all style embeddings without vectors
        const { data: templates, error } = await supabase
            .from("style_embeddings")
            .select("*")
            .is("embedding", null);

        if (error) throw error;

        console.log(`[EMBED] Found ${templates?.length || 0} templates without embeddings`);

        const results = [];

        for (const template of templates || []) {
            // Build text for embedding
            const textToEmbed = [
                template.template_name,
                template.style_type,
                template.description,
                template.prompt_used
            ].filter(Boolean).join(". ");

            console.log(`[EMBED] Generating embedding for: ${template.template_name}`);

            // Use Gemini embedding API
            const embedResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiKey}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        model: "models/text-embedding-004",
                        content: { parts: [{ text: textToEmbed }] },
                        outputDimensionality: 768
                    })
                }
            );

            if (!embedResponse.ok) {
                const errText = await embedResponse.text();
                console.error(`[EMBED] Failed for ${template.template_name}: ${errText}`);
                continue;
            }

            const embedData = await embedResponse.json();
            const embedding = embedData.embedding?.values;

            if (!embedding || embedding.length !== 768) {
                console.error(`[EMBED] Invalid embedding for ${template.template_name}`);
                continue;
            }

            // Update the style_embeddings record
            const { error: updateError } = await supabase
                .from("style_embeddings")
                .update({ embedding: embedding })
                .eq("id", template.id);

            if (updateError) {
                console.error(`[EMBED] Update failed for ${template.template_name}: ${updateError.message}`);
            } else {
                console.log(`[EMBED] ✅ Updated embedding for: ${template.template_name}`);
                results.push({ id: template.id, name: template.template_name, success: true });
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                processed: results.length,
                results
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("[EMBED] Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
    }
});
