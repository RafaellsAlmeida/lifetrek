import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { strategistAgent, copywriterAgent, designerAgent, brandAnalystAgent, compositorAgent } from "./agents.ts";
import { CarouselParams, CarouselResult } from "./types.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const inputData = await req.json();
        const {
            topic,
            targetAudience = "Decision Makers",
            painPoint,
            desiredOutcome,
            proofPoints = [],
            ctaAction,
            profileType = "company",
            format = "carousel",
            researchLevel = "light",
            style_mode = "ai-native" // Default to old behavior if not specified, or "hybrid-composite" if user prefers
        } = inputData;

        if (!topic) {
            throw new Error("Topic is required");
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const params: CarouselParams = {
            topic,
            targetAudience,
            painPoint,
            desiredOutcome,
            proofPoints,
            ctaAction,
            profileType,
            format,
            researchLevel,
            style_mode
        };

        // Multi-Agent Pipeline Execution
        // 1. Strategy
        const strategy = await strategistAgent(params, supabase);

        // 2. Copywriting
        const copy = await copywriterAgent(params, strategy);

        // 3. Design 
        const rawImages = await designerAgent(supabase, params, copy);

        // 3.5. Composition (Text Overlay & Branding) - Only if style_mode is 'hybrid-composite'
        let images = rawImages;
        if (params.style_mode === 'hybrid-composite') {
            images = await compositorAgent(copy, rawImages);
        }

        // 4. Brand Analysis
        const review = await brandAnalystAgent(copy, images);

        // Save to database
        const { data: savedCarousel, error: dbError } = await supabase
            .from("linkedin_carousels")
            .insert({
                topic: topic,
                status: review.overall_score >= 70 ? 'pending_approval' : 'draft',
                slides: copy.slides,
                image_urls: images.map(img => img.image_url),
                caption: copy.caption,
                quality_score: review.overall_score,
                generation_metadata: {
                    review,
                    strategy,
                    params
                }
            })
            .select()
            .single();

        if (dbError) {
            console.error("Error saving carousel:", dbError);
        }

        const result: CarouselResult = {
            success: true,
            carousel: copy,
            images: images,
            quality_score: review.overall_score,
            metadata: {
                total_time_ms: 0, // Simplified metrics for now
                strategy_time_ms: 0,
                copywriting_time_ms: 0,
                design_time_ms: 0,
                review_time_ms: 0,
                assets_used_count: images.filter(i => i.asset_source === 'real').length,
                assets_generated_count: images.filter(i => i.asset_source === 'ai-generated').length,
                regeneration_count: 0,
                model_versions: {
                    strategist: "gemini-2.0-flash",
                    copywriter: "gemini-2.0-flash",
                    designer: "flux-schnell",
                    reviewer: "gemini-2.0-flash"
                }
            }
        };

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error: any) {
        console.error("Pipeline Error:", error);
        return new Response(JSON.stringify({ error: error.message, success: false }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
