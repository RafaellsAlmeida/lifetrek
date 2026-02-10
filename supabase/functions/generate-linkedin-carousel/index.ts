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
        targetAudience: inputData.targetAudience || "Decision Makers",
        painPoint: inputData.painPoint,
        desiredOutcome: inputData.desiredOutcome,
        proofPoints: normalizeProofPoints(inputData.proofPoints),
        ctaAction: inputData.ctaAction,
        profileType: inputData.profileType || "company",
        format: inputData.format || "carousel",
        researchLevel: inputData.researchLevel || "light",
        style_mode: inputData.style_mode || "ai-native"
    };
}

function toCarouselPayload(params: CarouselParams, copy: any, images: any[] = []) {
    const slidesWithImages = (copy.slides || []).map((slide: any, idx: number) => ({
        ...slide,
        imageUrl: images[idx]?.image_url || slide.imageUrl || ""
    }));

    return {
        topic: copy.topic || params.topic,
        targetAudience: params.targetAudience,
        slides: slidesWithImages,
        caption: copy.caption || "",
        format: params.format
    };
}

async function generateCarouselOnce(
    params: CarouselParams,
    supabase: ReturnType<typeof createClient>,
    send?: (event: string, data: Record<string, unknown>) => void
) {
    const strategyStart = Date.now();
    send?.("step", { step: "strategist", status: "in_progress", message: "Definindo estratégia..." });

    const strategy = await strategistAgent(params, supabase);
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
    const review = await brandAnalystAgent(copy, images);
    send?.("analyst_result", { fullOutput: review });
    send?.("step", { step: "analyst", status: "completed", message: "Revisão concluída" });

    const slidesWithImages = (copy.slides || []).map((slide: any, idx: number) => ({
        ...slide,
        imageUrl: images[idx]?.image_url || slide.imageUrl || ""
    }));

    const { error: dbError } = await supabase
        .from("linkedin_carousels")
        .insert({
            topic: params.topic,
            status: review.overall_score >= 70 ? "pending_approval" : "draft",
            slides: slidesWithImages,
            image_urls: images.map((img: any) => img.image_url),
            caption: copy.caption,
            quality_score: review.overall_score,
            generation_metadata: {
                review,
                strategy,
                params
            }
        });

    if (dbError) {
        console.error("Error saving carousel:", dbError);
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
            assets_generated_count: images.filter((i: any) => i.asset_source === "ai-generated").length,
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

                                const { result, slidesWithImages } = await generateCarouselOnce(variantParams, supabase, send);
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
            const { result, slidesWithImages } = await generateCarouselOnce(variantParams, supabase);
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
