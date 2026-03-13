import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { executeWithCostTracking } from "../_shared/costTracking.ts";

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
            let embedResponse: any;
            try {
                embedResponse = await executeWithCostTracking(
                    supabase,
                    {
                        userId: null,
                        operation: "content.generate-style-embeddings.template-embedding",
                        service: "gemini",
                        model: "text-embedding-004",
                        metadata: {
                            template_id: template.id,
                            template_name: template.template_name,
                            style_type: template.style_type,
                            output_dimensionality: 768,
                        },
                    },
                    async () => {
                        const response = await fetch(
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

                        if (!response.ok) {
                            const errText = await response.text();
                            throw new Error(`Embedding API Error (${response.status}): ${errText}`);
                        }

                        return await response.json();
                    },
                );
            } catch (error) {
                console.error(`[EMBED] Failed for ${template.template_name}:`, error);
                continue;
            }

            const embedData = embedResponse;
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
            JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
    }
});
