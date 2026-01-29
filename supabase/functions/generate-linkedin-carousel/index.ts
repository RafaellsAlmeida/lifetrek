// BUNDLED LANGGRAPH CONTENT ORCHESTRATOR
// Copy this ENTIRE content into the Supabase Edge Function Editor

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { StateGraph, END } from "npm:@langchain/langgraph@^0.0.12";
import { ChatOpenAI } from "npm:@langchain/openai@^0.0.14";
import { HumanMessage, SystemMessage, BaseMessage } from "npm:@langchain/core@^0.1.30/messages";

// --- TYPES (from types.ts) ---

export interface CarouselParams {
    topic: string;
    targetAudience: string;
    painPoint?: string;
    desiredOutcome?: string;
    proofPoints?: string[];
    ctaAction?: string;
    profileType?: 'company' | 'salesperson';
    style?: 'visual' | 'text-heavy';
    researchLevel?: 'none' | 'light' | 'deep';
}

export interface SlideContent {
    type: 'hook' | 'content' | 'cta';
    headline: string;
    body: string;
    visual_description?: string;
}

export interface CarouselStrategy {
    hook: string;
    narrative_arc: string;
    slide_count: number;
    key_messages: string[];
}

export interface CarouselCopy {
    topic: string;
    caption: string;
    slides: SlideContent[];
}

export interface GeneratedImage {
    slide_index: number;
    image_url: string;
    asset_source: 'real' | 'ai-generated' | 'text-only';
    asset_url?: string;
}

export interface QualityReview {
    overall_score: number;
    feedback: string;
    needs_regeneration: boolean;
    issues?: string[];
    strengths?: string[];
}

export interface AgentMetrics {
    strategy_time_ms: number;
    copywriting_time_ms: number;
    design_time_ms: number;
    review_time_ms: number;
    total_time_ms: number;
    assets_used_count: number;
    assets_generated_count: number;
    regeneration_count: number;
    research_time_ms?: number;
    research_queries_count?: number;
    model_versions: {
        strategist: string;
        copywriter: string;
        designer: string;
        reviewer: string;
    };
}

// --- AGENT TOOLS (from agent_tools.ts) ---

export async function generateCarouselEmbedding(
    topic: string,
    slides: any[]
): Promise<number[] | null> {
    console.warn("⚠️ Embedding generation disabled to remove Google dependencies.");
    return null;
}

export async function searchSimilarCarousels(
    supabase: SupabaseClient,
    queryEmbedding: number[],
    matchThreshold: number = 0.75,
    matchCount: number = 3
): Promise<any[]> {
    try {
        console.log(`🔍 Searching for similar successful carousels (threshold: ${matchThreshold})...`);

        const { data, error } = await supabase.rpc('match_successful_carousels', {
            query_embedding: JSON.stringify(queryEmbedding),
            match_threshold: matchThreshold,
            match_count: matchCount
        });

        if (error) {
            console.error("❌ Similar carousel search error:", error);
            return [];
        }

        if (data && data.length > 0) {
            return data;
        } else {
            return [];
        }

    } catch (error) {
        console.error("❌ Similar carousel search error:", error);
        return [];
    }
}

export async function searchCompanyAssets(
    supabase: SupabaseClient,
    query: string,
    category?: 'product' | 'facility' | 'team'
): Promise<{ url: string; source: string } | null> {
    try {
        console.log(`🔍 RAG: Searching for assets matching "${query}"...`);

        // 1. Search products table
        const { data: products, error: productError } = await supabase
            .from('product_catalog')
            .select('image_url, name, description')
            .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
            .limit(3);

        if (!productError && products && products.length > 0) {
            const bestMatch = products[0];
            return {
                url: bestMatch.image_url,
                source: `product:${bestMatch.name}`
            };
        }

        // 2. Search storage buckets
        if (!category || category === 'facility') {
            const { data: facilityFiles, error: storageError } = await supabase.storage
                .from('assets')
                .list('facility', {
                    limit: 10,
                    sortBy: { column: 'created_at', order: 'desc' }
                });

            if (!storageError && facilityFiles && facilityFiles.length > 0) {
                const matchingFile = facilityFiles.find(file =>
                    file.name.toLowerCase().includes(query.toLowerCase())
                );

                if (matchingFile) {
                    const { data } = supabase.storage
                        .from('assets')
                        .getPublicUrl(`facility/${matchingFile.name}`);

                    return {
                        url: data.publicUrl,
                        source: `facility:${matchingFile.name}`
                    };
                }
            }
        }

        return null;
    } catch (error) {
        console.error('❌ RAG: Asset search error:', error);
        return null;
    }
}

export function getBrandGuidelines(profileType: 'company' | 'salesperson' = 'company') {
    const isCompany = profileType === 'company';
    return {
        companyName: 'Lifetrek Medical',
        // ... Simplified for conciseness in bundle, full object preserved if needed but this is enough for prompt context
        tone: isCompany
            ? 'Professional, authoritative, technically precise, confident, quality-focused'
            : 'Approachable, expert, consultative, partnership-oriented, solutions-focused',
        visualStyle: 'Clean, modern B2B aesthetic with medical manufacturing focus.',
    };
}

export function extractJSON(text: string): any {
    try {
        return JSON.parse(text);
    } catch {
        const match = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (match) {
            return JSON.parse(match[1]);
        }
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error('No valid JSON found in response');
    }
}

// --- MAIN LOGIC (from index.ts) ---

interface AgentState {
    params: CarouselParams;
    messages: BaseMessage[];
    strategy?: CarouselStrategy;
    copy?: CarouselCopy;
    images?: GeneratedImage[];
    review?: QualityReview;
    final_result?: any;
    error?: string;
}

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
            format = "carousel",
            profileType = "company",
            researchLevel = "light"
        } = inputData;

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const openRouterKey = Deno.env.get("OPEN_ROUTER_API") || Deno.env.get("OPEN_ROUTER_API_KEY");

        if (!openRouterKey) throw new Error("OPEN_ROUTER_API key is missing");

        const supabase = createClient(supabaseUrl, supabaseKey);

        const model = new ChatOpenAI({
            modelName: "google/gemini-2.0-flash-001",
            temperature: 0.7,
            configuration: {
                baseURL: "https://openrouter.ai/api/v1",
                apiKey: openRouterKey,
                defaultHeaders: { "HTTP-Referer": "https://lifetrek.app", "X-Title": "Lifetrek App" }
            }
        });

        // NODE 1: STRATEGIST
        const strategistNode = async (state: AgentState): Promise<Partial<AgentState>> => {
            console.log("🎯 Strategist Node");
            const { params } = state;
            const brand = getBrandGuidelines(params.profileType);

            const systemPrompt = `You are a LinkedIn content strategist for ${brand.companyName}.
      Task: Plan a LinkedIn carousel about "${params.topic}".
      Target Audience: ${params.targetAudience}
      Pain Point: ${params.painPoint || 'Generic industry challenge'}
      Goal: ${params.desiredOutcome || 'Establish authority'}
      Brand Tone: ${brand.tone}

      Requirements:
      - 5-7 slides total.
      - Strong narrative arc (Hook -> Agitate -> Solution -> Proof -> CTA).
      - Output strictly valid JSON object with keys: "hook", "narrative_arc", "slide_count", "key_messages" (array).`;

            const response = await model.invoke([
                new SystemMessage(systemPrompt),
                new HumanMessage(`Create strategy for: ${params.topic}`)
            ]);

            const strategy = extractJSON(response.content as string);
            return { strategy };
        };

        // NODE 2: COPYWRITER
        const copywriterNode = async (state: AgentState): Promise<Partial<AgentState>> => {
            console.log("✍️ Copywriter Node");
            if (!state.strategy) throw new Error("Missing strategy");
            const { params, strategy } = state;
            const brand = getBrandGuidelines(params.profileType);

            const systemPrompt = `You are an expert LinkedIn copywriter for ${brand.companyName}.
      Topic: ${params.topic}
      Narrative: ${strategy.narrative_arc}
      Target Audience: ${params.targetAudience}
      Key Messages: ${strategy.key_messages?.join(", ")}
      Tone: ${brand.tone}

      Output strict JSON format:
      {
        "topic": "${params.topic}",
        "caption": "Post caption...",
        "slides": [
            { "type": "hook", "headline": "...", "body": "..." },
            { "type": "content", "headline": "...", "body": "..." },
            { "type": "cta", "headline": "...", "body": "..." }
        ]
      }
      Ensure slide count matches ${strategy.slide_count}.`;

            const response = await model.invoke([
                new SystemMessage(systemPrompt),
                new HumanMessage("Write the carousel copy.")
            ]);

            const copy = extractJSON(response.content as string);
            return { copy };
        };

        // NODE 3: DESIGNER
        const designerNode = async (state: AgentState): Promise<Partial<AgentState>> => {
            console.log("🎨 Designer Node");
            if (!state.copy) throw new Error("Missing copy");
            const { copy } = state;
            const images: GeneratedImage[] = [];

            for (let i = 0; i < copy.slides.length; i++) {
                const slide = copy.slides[i];

                // Check Real Assets
                const retrivedAsset = await searchCompanyAssets(supabase, slide.headline);
                if (retrivedAsset) {
                    images.push({
                        slide_index: i,
                        image_url: retrivedAsset.url,
                        asset_source: "real",
                        asset_url: retrivedAsset.url
                    });
                    continue;
                }

                // AI Generation
                const imagePrompt = `Professional corporate vector illustration, clean white background, ${slide.headline}. Medical device context.`;
                try {
                    const imgResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${openRouterKey}`,
                            "Content-Type": "application/json",
                            "HTTP-Referer": "https://lifetrek.app"
                        },
                        body: JSON.stringify({
                            model: "black-forest-labs/flux-schnell",
                            messages: [{ role: "user", content: imagePrompt }]
                        })
                    });

                    const imgData = await imgResponse.json();
                    // Improved parsing for OpenRouter Image Response (Chat Completion format with image)
                    let imageUrl = "";

                    // Try standard OpenRouter image location
                    if (imgData.choices?.[0]?.message?.content) {
                        // Sometimes url is in content markdown
                        const match = imgData.choices[0].message.content.match(/\((https?:\/\/[^\)]+)\)/);
                        if (match) imageUrl = match[1];
                    }

                    // Fallback or specific structure
                    if (!imageUrl && imgData.data?.[0]?.url) imageUrl = imgData.data[0].url;

                    // Fallback to placeholder if failed to parse, to avoid breaking graph
                    if (!imageUrl) imageUrl = "https://images.unsplash.com/photo-1579684385180-27852b78160f?auto=format&fit=crop&q=80&w=1000";

                    images.push({
                        slide_index: i,
                        image_url: imageUrl,
                        asset_source: "ai-generated"
                    });
                } catch (err) {
                    images.push({ slide_index: i, image_url: "", asset_source: "text-only" });
                }
            }
            return { images };
        };

        // NODE 4: ANALYST
        const analystNode = async (state: AgentState): Promise<Partial<AgentState>> => {
            console.log("🔍 Analyst Node");
            const { copy } = state;
            if (!copy) throw new Error("Missing copy");

            const systemPrompt = `Brand Quality Analyst. Review JSON content.
        Content: ${JSON.stringify(copy)}
        Return JSON: { "overall_score": 0-100, "feedback": "...", "needs_regeneration": boolean }`;

            const response = await model.invoke([new SystemMessage(systemPrompt)]);
            const review = extractJSON(response.content as string);
            return { review };
        };

        // GRAPH
        const workflow = new StateGraph<AgentState>({
            channels: {
                params: { value: (x, y) => y, default: () => ({} as any) },
                messages: { value: (x, y) => x.concat(y), default: () => [] },
                strategy: { value: (x, y) => y ?? x, default: () => undefined },
                copy: { value: (x, y) => y ?? x, default: () => undefined },
                images: { value: (x, y) => y ?? x, default: () => undefined },
                review: { value: (x, y) => y ?? x, default: () => undefined },
                final_result: { value: (x, y) => y ?? x, default: () => undefined },
                error: { value: (x, y) => y, default: () => undefined }
            }
        });

        workflow.addNode("strategist", strategistNode);
        workflow.addNode("copywriter", copywriterNode);
        workflow.addNode("designer", designerNode);
        workflow.addNode("analyst", analystNode);

        workflow.setEntryPoint("strategist");
        workflow.addEdge("strategist", "copywriter");
        workflow.addEdge("copywriter", "designer");
        workflow.addEdge("designer", "analyst");
        workflow.addEdge("analyst", END);

        const app = workflow.compile();
        const result = await app.invoke({
            params: { topic, targetAudience, painPoint, desiredOutcome, format, profileType, researchLevel },
            messages: []
        });

        if (result.copy && result.review) {
            await supabase.from("linkedin_carousels").insert({
                topic: topic,
                status: result.review.overall_score >= 70 ? 'pending_approval' : 'draft',
                slides: result.copy.slides,
                image_urls: result.images?.map((img: GeneratedImage) => img.image_url) || [],
                caption: result.copy.caption,
                quality_score: result.review.overall_score,
                generation_metadata: { review: result.review, strategy: result.strategy }
            });
        }

        return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
