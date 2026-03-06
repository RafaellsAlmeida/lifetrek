import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
    strategistAgent,
    strategistPlansAgent,
    copywriterAgent,
    designerAgent,
    brandAnalystAgent,
    compositorAgent
} from "./agents.ts";
import { CarouselParams, CarouselResult } from "./types.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL_VERSIONS = {
    strategist: "gemini-2.0-flash",
    copywriter: "gemini-2.0-flash",
    designer: "gemini-2.0-flash-exp",
    reviewer: "gemini-2.0-flash"
};

function normalizePlatform(input: unknown): "linkedin" | "instagram" {
    if (input === "instagram") return "instagram";
    return "linkedin";
}

function normalizeProofPoints(input: unknown): string[] {
    if (Array.isArray(input)) return input.filter(Boolean) as string[];
    if (typeof input === "string") {
        return input.split(";").map(s => s.trim()).filter(Boolean);
    }
    return [];
}

function buildParams(inputData: any): CarouselParams {
    return {
        topic: inputData.topic,
        platform: normalizePlatform(inputData.platform),
        targetAudience: inputData.targetAudience || "Decision Makers",
        painPoint: inputData.painPoint,
        desiredOutcome: inputData.desiredOutcome,
        proofPoints: normalizeProofPoints(inputData.proofPoints),
        ctaAction: inputData.ctaAction,
        profileType: inputData.profileType || "company",
        format: inputData.format || "carousel",
        researchLevel: inputData.researchLevel || "light",
        style_mode: inputData.style_mode || "hybrid-composite",
        selectedEquipment: Array.isArray(inputData.selectedEquipment)
            ? inputData.selectedEquipment.filter(Boolean)
            : [],
        referenceImage: typeof inputData.referenceImage === "string"
            ? inputData.referenceImage
            : ""
    };
}

function toCarouselPayload(params: CarouselParams, copy: any, images: any[] = []) {
    const slidesWithImages = (copy.slides || []).map((slide: any, idx: number) => ({
        ...slide,
        imageUrl: images[idx]?.image_url || slide.imageUrl || ""
    }));

    return {
        topic: copy.topic || params.topic,
        platform: params.platform || "linkedin",
        targetAudience: params.targetAudience,
        slides: slidesWithImages,
        caption: copy.caption || "",
        format: params.format
    };
}

function extractHashtags(text: string): string[] {
    if (!text) return [];
    const matches = text.match(/#[\p{L}\p{N}_]+/gu) || [];
    return Array.from(new Set(matches)).slice(0, 12);
}

async function persistContentIdea(
    supabase: ReturnType<typeof createClient>,
    params: CarouselParams,
    strategy: any
) {
    try {
        const payload = {
            topic: params.topic,
            icp_segment: params.targetAudience || "general",
            platform: params.platform || "linkedin",
            objective: params.ctaAction || null,
            pain_point: params.painPoint || null,
            desired_outcome: params.desiredOutcome || null,
            source_references: [],
            strategy,
            metadata: {
                profile_type: params.profileType || "company",
                format: params.format || "carousel",
                research_level: params.researchLevel || "light",
            },
        };

        const { error } = await supabase.from("content_ideas").insert(payload);
        if (error) {
            console.warn("[generate-linkedin-carousel] content_ideas insert warning:", error.message);
        }
    } catch (error) {
        console.warn("[generate-linkedin-carousel] content_ideas persistence warning:", error);
    }
}

async function generateCarouselOnce(
    params: CarouselParams,
    supabase: ReturnType<typeof createClient>,
    send?: (event: string, data: Record<string, unknown>) => void,
    persistIdea: boolean = true
) {
    const strategyStart = Date.now();
    send?.("step", { step: "strategist", status: "in_progress", message: "Definindo estratégia..." });

    const strategy = await strategistAgent(params, supabase);
    if (persistIdea) {
        await persistContentIdea(supabase, params, strategy);
    }
    send?.("strategist_result", { fullOutput: strategy });
    send?.("step", { step: "strategist", status: "completed", message: "Estratégia pronta" });

    const copyStart = Date.now();
    send?.("agent_status", { agent: "copywriter", status: "in_progress", message: "Escrevendo o conteúdo..." });
    const copy = await copywriterAgent(params, strategy);
    send?.("copywriter_result", { fullOutput: copy });

    const designStart = Date.now();
    send?.("step", { step: "images", status: "in_progress", message: "Gerando imagens..." });
    const rawImages = await designerAgent(supabase, params, copy);

    let images = rawImages;
    if (params.style_mode === "hybrid-composite") {
        images = await compositorAgent(copy, rawImages);
    }

    send?.("image_progress", { completed: 1, total: 1 });
    send?.("step", { step: "images", status: "completed", message: "Imagens finalizadas" });

    const reviewStart = Date.now();
    send?.("step", { step: "analyst", status: "in_progress", message: "Revisando alinhamento de marca..." });
    const review = await brandAnalystAgent(copy, images, params.platform || "linkedin");
    send?.("analyst_result", { fullOutput: review });
    send?.("step", { step: "analyst", status: "completed", message: "Revisão concluída" });

    const slidesWithImages = (copy.slides || []).map((slide: any, idx: number) => ({
        ...slide,
        imageUrl: images[idx]?.image_url || slide.imageUrl || ""
    }));

    const platform = params.platform || "linkedin";
    const imageUrls = images.map((img: any) => img.image_url).filter(Boolean);
    const status = review.overall_score >= 70 ? "pending_approval" : "draft";

    const tableName = platform === "instagram" ? "instagram_posts" : "linkedin_carousels";
    const basePayload = {
        topic: params.topic,
        status,
        slides: slidesWithImages,
        image_urls: imageUrls,
        caption: copy.caption,
        quality_score: review.overall_score,
        generation_metadata: {
            review,
            strategy,
            params
        }
    };

    const payload = platform === "instagram"
        ? {
            ...basePayload,
            image_url: imageUrls[0] || null,
            hashtags: extractHashtags(copy.caption || ""),
            post_type: params.format === "single-image" ? "feed" : "carousel",
            target_audience: params.targetAudience || null,
            pain_point: params.painPoint || null,
            desired_outcome: params.desiredOutcome || null,
        }
        : {
            ...basePayload,
            target_audience: params.targetAudience || null,
            pain_point: params.painPoint || null,
            desired_outcome: params.desiredOutcome || null,
            proof_points: (params.proofPoints || []).join("; "),
            cta_action: params.ctaAction || null,
        };

    const { error: dbError } = await supabase
        .from(tableName as any)
        .insert(payload as any);

    if (dbError) {
        console.error(`Error saving ${platform} carousel:`, dbError);
    }

    const result: CarouselResult = {
        success: true,
        carousel: copy,
        images,
        quality_score: review.overall_score,
        metadata: {
            total_time_ms: Date.now() - strategyStart,
            strategy_time_ms: Date.now() - strategyStart,
            copywriting_time_ms: Date.now() - copyStart,
            design_time_ms: Date.now() - designStart,
            review_time_ms: Date.now() - reviewStart,
            assets_used_count: images.filter((i: any) => i.asset_source === "real").length,
            assets_generated_count: images.filter((i: any) => i.asset_source === "ai-generated" || i.asset_source === "ai").length,
            regeneration_count: 0,
            model_versions: MODEL_VERSIONS
        }
    };

    return { result, slidesWithImages, review };
}

async function generatePlanOptions(
    params: CarouselParams,
    supabase: ReturnType<typeof createClient>,
    count: number
) {
    const strategies = await strategistPlansAgent(params, supabase, count);
    const options = [] as any[];

    for (const strategy of strategies) {
        const planParams = {
            ...params,
            topic: strategy.topic || params.topic
        };
        const copy = await copywriterAgent(planParams, strategy);
        options.push(toCarouselPayload(planParams, copy));
    }

    return options;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const inputData = await req.json();
        const { stream = false, mode = "generate" } = inputData || {};

        if (!inputData?.topic) {
            throw new Error("Topic is required");
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const params = buildParams(inputData);
        const numberOfCarousels = Math.max(1, Number(inputData.numberOfCarousels || 1));
        const persistIdea = inputData?.persistIdea !== false;

        if (stream) {
            const encoder = new TextEncoder();
            const eventStream = new ReadableStream({
                start(controller) {
                    const send = (event: string, data: Record<string, unknown>) => {
                        controller.enqueue(
                            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
                        );
                    };

                    (async () => {
                        try {
                            if (mode === "plan") {
                                send("step", { step: "strategist", status: "in_progress", message: "Gerando opções de estratégia..." });
                                const planOptions = await generatePlanOptions(params, supabase, numberOfCarousels || 3);
                                send("step", { step: "strategist", status: "completed", message: "Opções prontas" });
                                send("complete", { carousels: planOptions });
                                controller.close();
                                return;
                            }

                            const carousels = [] as any[];
                            const strategies = numberOfCarousels > 1
                                ? await strategistPlansAgent(params, supabase, numberOfCarousels)
                                : [];

                            for (let i = 0; i < numberOfCarousels; i += 1) {
                                const variantParams = {
                                    ...params,
                                    topic: strategies[i]?.topic || params.topic
                                };

                                const { result, slidesWithImages } = await generateCarouselOnce(variantParams, supabase, send, persistIdea);
                                carousels.push({
                                    ...toCarouselPayload(variantParams, result.carousel, result.images),
                                    slides: slidesWithImages
                                });

                                send("image_progress", { completed: i + 1, total: numberOfCarousels });
                            }

                            send("complete", { carousels });
                            controller.close();
                        } catch (error: any) {
                            send("error", { error: error.message || "Pipeline Error" });
                            controller.close();
                        }
                    })();
                }
            });

            return new Response(eventStream, {
                headers: {
                    ...corsHeaders,
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive"
                }
            });
        }

        if (mode === "plan") {
            const planOptions = await generatePlanOptions(params, supabase, numberOfCarousels || 3);
            return new Response(JSON.stringify({ success: true, carousels: planOptions }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const carousels = [] as any[];
        const strategies = numberOfCarousels > 1
            ? await strategistPlansAgent(params, supabase, numberOfCarousels)
            : [];

        for (let i = 0; i < numberOfCarousels; i += 1) {
            const variantParams = {
                ...params,
                topic: strategies[i]?.topic || params.topic
            };
            const { result, slidesWithImages } = await generateCarouselOnce(variantParams, supabase, undefined, persistIdea);
            carousels.push({
                ...toCarouselPayload(variantParams, result.carousel, result.images),
                slides: slidesWithImages
            });
        }

        return new Response(JSON.stringify({ success: true, carousels }), {
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
