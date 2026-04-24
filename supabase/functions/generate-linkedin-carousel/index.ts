import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
    strategistAgent,
    strategistPlansAgent,
    copywriterAgent,
    designerAgent,
    brandAnalystAgent,
    compositorAgent
} from "./agents.ts";
import { CarouselParams, CarouselResult } from "./types.ts";
import type { Database } from "../../../src/integrations/supabase/types.ts";

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

type ContentIdeasInsert = Database["public"]["Tables"]["content_ideas"]["Insert"];
type ServiceSupabaseClient = SupabaseClient<Database>;
type AgentCostContext = {
    supabase: ServiceSupabaseClient;
    userId: string | null;
    operation: string;
    metadata: Record<string, unknown>;
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

/**
 * Upload base64 images to Supabase Storage and replace image_url with public URLs.
 */
async function uploadImagesToStorage(
    supabase: ServiceSupabaseClient,
    images: any[],
    carouselId: string,
): Promise<any[]> {
    const uploaded = [];
    for (const img of images) {
        if (!img.image_url || !img.image_url.startsWith("data:")) {
            uploaded.push(img);
            continue;
        }

        try {
            // Extract base64 data
            const matches = img.image_url.match(/^data:([^;]+);base64,(.+)$/s);
            if (!matches) {
                uploaded.push(img);
                continue;
            }
            const mimeType = matches[1];
            const base64Data = matches[2];
            const ext = mimeType.includes("png") ? "png" : "jpg";
            const fileName = `carousel-${carouselId}-s${img.slide_index}-${Date.now()}.${ext}`;

            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let j = 0; j < binaryString.length; j++) {
                bytes[j] = binaryString.charCodeAt(j);
            }

            const { error } = await supabase.storage
                .from("content_assets")
                .upload(`generated/${fileName}`, bytes, {
                    contentType: mimeType,
                    upsert: false,
                });

            if (error) {
                console.error(`Upload failed for slide ${img.slide_index}:`, error.message);
                uploaded.push(img);
                continue;
            }

            const { data: urlData } = supabase.storage
                .from("content_assets")
                .getPublicUrl(`generated/${fileName}`);

            uploaded.push({
                ...img,
                image_url: urlData.publicUrl,
            });
            console.log(`📤 Uploaded slide ${img.slide_index}: ${urlData.publicUrl}`);
        } catch (e) {
            console.error(`Upload error for slide ${img.slide_index}:`, e);
            uploaded.push(img);
        }
    }
    return uploaded;
}

function extractHashtags(text: string): string[] {
    if (!text) return [];
    const matches = text.match(/#[\p{L}\p{N}_]+/gu) || [];
    return Array.from(new Set(matches)).slice(0, 12);
}

async function persistContentIdea(
    supabase: ServiceSupabaseClient,
    params: CarouselParams,
    strategy: any
) {
    try {
        const payload: ContentIdeasInsert = {
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

async function resolveTrackingUserId(
    req: Request,
    supabase: ServiceSupabaseClient,
): Promise<string | null> {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !/^Bearer\s+/i.test(authHeader)) {
        return null;
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return null;

    try {
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser(token);
        if (error) {
            console.warn("[generate-linkedin-carousel] auth lookup warning:", error.message);
            return null;
        }
        return user?.id || null;
    } catch (error) {
        console.warn("[generate-linkedin-carousel] auth lookup failed:", error);
        return null;
    }
}

function buildAgentCostContext(
    supabase: ServiceSupabaseClient,
    userId: string | null,
    params: CarouselParams,
    mode: string,
): AgentCostContext {
    return {
        supabase,
        userId,
        operation: "",
        metadata: {
            topic: params.topic,
            platform: params.platform || "linkedin",
            format: params.format || "carousel",
            research_level: params.researchLevel || "light",
            style_mode: params.style_mode || "hybrid-composite",
            mode,
        },
    };
}

async function generateCarouselOnce(
    params: CarouselParams,
    supabase: ServiceSupabaseClient,
    userId: string | null,
    mode: string,
    send?: (event: string, data: Record<string, unknown>) => void,
    persistIdea: boolean = true
) {
    const strategyStart = Date.now();
    const costContext = buildAgentCostContext(supabase, userId, params, mode);
    send?.("step", { step: "strategist", status: "in_progress", message: "Definindo estratégia..." });

    const strategy = await strategistAgent(params, supabase, costContext);
    if (persistIdea) {
        await persistContentIdea(supabase, params, strategy);
    }
    send?.("strategist_result", { fullOutput: strategy });
    send?.("step", { step: "strategist", status: "completed", message: "Estratégia pronta" });

    const copyStart = Date.now();
    send?.("agent_status", { agent: "copywriter", status: "in_progress", message: "Escrevendo o conteúdo..." });
    const copy = await copywriterAgent(params, strategy, costContext);
    send?.("copywriter_result", { fullOutput: copy });

    const designStart = Date.now();
    send?.("step", { step: "images", status: "in_progress", message: "Gerando imagens..." });
    const rawImages = await designerAgent(supabase, params, copy, costContext);

    let images = rawImages;
    if (params.style_mode === "hybrid-composite") {
        images = await compositorAgent(copy, rawImages);
    }

    // Upload base64 images to Supabase Storage
    const carouselId = crypto.randomUUID().slice(0, 8);
    send?.("step", { step: "upload", status: "in_progress", message: "Fazendo upload das imagens..." });
    images = await uploadImagesToStorage(supabase, images, carouselId);
    send?.("image_progress", { completed: 1, total: 1 });
    send?.("step", { step: "images", status: "completed", message: "Imagens finalizadas" });

    const reviewStart = Date.now();
    send?.("step", { step: "analyst", status: "in_progress", message: "Revisando alinhamento de marca..." });
    const review = await brandAnalystAgent(copy, images, params.platform || "linkedin", costContext);
    send?.("analyst_result", { fullOutput: review });
    send?.("step", { step: "analyst", status: "completed", message: "Revisão concluída" });

    const slidesWithImages = (copy.slides || []).map((slide: any, idx: number) => ({
        ...slide,
        imageUrl: images[idx]?.image_url || slide.imageUrl || ""
    }));

    const platform = params.platform || "linkedin";
    const imageUrls = images.map((img: any) => img.image_url).filter(Boolean);
    const status = review.overall_score >= 70 ? "approved" : "draft";

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
    supabase: ServiceSupabaseClient,
    userId: string | null,
    mode: string,
    count: number
) {
    const costContext = buildAgentCostContext(supabase, userId, params, mode);
    const strategies = await strategistPlansAgent(params, supabase, count, costContext);
    const options = [] as any[];

    for (const strategy of strategies) {
        const planParams = {
            ...params,
            topic: strategy.topic || params.topic
        };
        const planCostContext = buildAgentCostContext(supabase, userId, planParams, mode);
        const copy = await copywriterAgent(planParams, strategy, planCostContext);
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
        const supabase = createClient<Database>(supabaseUrl, supabaseKey);

        const params = buildParams(inputData);
        const trackingUserId = await resolveTrackingUserId(req, supabase);
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
                                const planOptions = await generatePlanOptions(params, supabase, trackingUserId, mode, numberOfCarousels || 3);
                                send("step", { step: "strategist", status: "completed", message: "Opções prontas" });
                                send("complete", { carousels: planOptions });
                                controller.close();
                                return;
                            }

                            const carousels = [] as any[];
                            const strategies = numberOfCarousels > 1
                                ? await strategistPlansAgent(
                                    params,
                                    supabase,
                                    numberOfCarousels,
                                    buildAgentCostContext(supabase, trackingUserId, params, mode),
                                )
                                : [];

                            for (let i = 0; i < numberOfCarousels; i += 1) {
                                const variantParams = {
                                    ...params,
                                    topic: strategies[i]?.topic || params.topic
                                };

                                const { result, slidesWithImages } = await generateCarouselOnce(
                                    variantParams,
                                    supabase,
                                    trackingUserId,
                                    mode,
                                    send,
                                    persistIdea,
                                );
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
            const planOptions = await generatePlanOptions(params, supabase, trackingUserId, mode, numberOfCarousels || 3);
            return new Response(JSON.stringify({ success: true, carousels: planOptions }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const carousels = [] as any[];
        const strategies = numberOfCarousels > 1
            ? await strategistPlansAgent(
                params,
                supabase,
                numberOfCarousels,
                buildAgentCostContext(supabase, trackingUserId, params, mode),
            )
            : [];

        for (let i = 0; i < numberOfCarousels; i += 1) {
            const variantParams = {
                ...params,
                topic: strategies[i]?.topic || params.topic
            };
            const { result, slidesWithImages } = await generateCarouselOnce(
                variantParams,
                supabase,
                trackingUserId,
                mode,
                undefined,
                persistIdea,
            );
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
