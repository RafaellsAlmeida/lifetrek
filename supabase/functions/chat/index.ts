// supabase/functions/chat/index.ts
// Chat Agent using OpenRouter + Orchestrator intent extraction mode

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { executeWithCostTracking } from "../_shared/costTracking.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

function extractJsonObject(text: string): Record<string, unknown> | null {
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        if (start >= 0 && end > start) {
            try {
                return JSON.parse(text.slice(start, end + 1));
            } catch {
                return null;
            }
        }
        return null;
    }
}

function normalizeIntent(raw: Record<string, unknown> | null) {
    const topic = typeof raw?.topic === "string" ? raw.topic.trim() : "";
    const targetAudience = typeof raw?.targetAudience === "string" ? raw.targetAudience.trim() : "";
    const platform = raw?.platform === "instagram" ? "instagram" : "linkedin";
    const painPoint = typeof raw?.painPoint === "string" ? raw.painPoint.trim() : "";
    const desiredOutcome = typeof raw?.desiredOutcome === "string" ? raw.desiredOutcome.trim() : "";
    const ctaAction = typeof raw?.ctaAction === "string" ? raw.ctaAction.trim() : "";
    const proofPoints = Array.isArray(raw?.proofPoints)
        ? raw?.proofPoints.filter((v): v is string => typeof v === "string" && v.trim().length > 0).map((v) => v.trim())
        : [];

    const missingFields: string[] = [];
    if (!topic) missingFields.push("topic");
    if (!targetAudience) missingFields.push("targetAudience");

    const generatedQuestion = missingFields.length > 0
        ? `Para gerar com qualidade, faltam: ${missingFields.join(", ")}. Pode me dizer esses campos em uma frase?`
        : "";
    const clarificationQuestion = typeof raw?.clarificationQuestion === "string" && raw.clarificationQuestion.trim().length > 0
        ? raw.clarificationQuestion
        : generatedQuestion;
    const confidence = typeof raw?.confidence === "number"
        ? Math.max(0, Math.min(1, raw.confidence))
        : (missingFields.length > 0 ? 0.45 : 0.85);

    return {
        parameters: {
            topic,
            targetAudience,
            platform,
            painPoint: painPoint || undefined,
            desiredOutcome: desiredOutcome || undefined,
            ctaAction: ctaAction || undefined,
            proofPoints,
        },
        missingFields,
        clarificationQuestion,
        confidence,
    };
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { messages, mode } = await req.json();

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const openRouterKey = Deno.env.get("OPEN_ROUTER_API_KEY");

        if (!openRouterKey) {
            throw new Error("OPEN_ROUTER_API_KEY is missing");
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // --- AUTH CHECK ---
        const authHeader = req.headers.get("Authorization");
        let user: { id: string; email?: string } | null = null;

        if (authHeader) {
            const { data, error } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
            if (!error && data?.user) {
                user = { id: data.user.id, email: data.user.email };
            }
        }

        // STRICT AUTH: Orchestrator is for internal use only.
        if (!user) {
            console.warn("🚫 Unauthorized access attempt to Orchestrator.");
            return new Response(
                JSON.stringify({ error: "Unauthorized. Orchestrator requires login.", status: 401 }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (mode === "orchestrator_intent") {
            const systemPrompt = `Você extrai parâmetros estruturados para geração de carrossel da Lifetrek.
Retorne APENAS JSON válido com este shape:
{
  "topic": "string",
  "targetAudience": "string",
  "platform": "linkedin|instagram",
  "painPoint": "string",
  "desiredOutcome": "string",
  "ctaAction": "string",
  "proofPoints": ["string"],
  "clarificationQuestion": "string",
  "confidence": 0.0
}

Regras:
- Idioma PT-BR.
- Se um campo estiver ausente, deixe string vazia e use clarificationQuestion para pedir só o que falta.
- platform padrão deve ser "linkedin" se não estiver claro.
- Não inclua markdown. JSON puro.`;

            const data = await executeWithCostTracking(
                supabase,
                {
                    userId: user.id,
                    operation: "content.chat.orchestrator-intent",
                    service: "openrouter",
                    model: "google/gemini-2.0-flash-001",
                    metadata: {
                        mode,
                        message_count: Array.isArray(messages) ? messages.length : 0,
                    },
                },
                async () => {
                    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${openRouterKey}`,
                            "HTTP-Referer": "https://lifetrek.app",
                            "X-Title": "Lifetrek App"
                        },
                        body: JSON.stringify({
                            model: "google/gemini-2.0-flash-001",
                            messages: [
                                { role: "system", content: systemPrompt },
                                ...messages.map((msg: { role: string; content: string }) => ({
                                    role: msg.role,
                                    content: msg.content
                                }))
                            ],
                            temperature: 0.2
                        })
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`OpenRouter API error: ${errorText}`);
                    }

                    return await response.json();
                }
            );
            const rawText = data.choices?.[0]?.message?.content || "{}";
            const parsed = extractJsonObject(rawText);
            const intent = normalizeIntent(parsed);

            return new Response(
                JSON.stringify({
                    success: true,
                    intent
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const systemPrompt = mode === "orchestrator"
            ? `Você é o Orquestrador de Conteúdo da Lifetrek Medical.
Seu objetivo é ajudar o time interno a planejar conteúdo de LinkedIn/Instagram (carrosséis), trazendo ângulos estratégicos, ganchos fortes e estrutura clara.

DIRETRIZES:
1. Tom profissional, técnico e colaborativo ("vamos", "juntos", "parceria").
2. Seja direto: proponha 2-3 ângulos e sugira estrutura de slides.
3. Sempre peça um detalhe faltante crítico (público, dor, prova, CTA) quando necessário.
4. Evite clichês de marketing. Use linguagem de engenharia e risco/qualidade.
5. Para temas de IA/LLM/search, use framing de engenharia de produção:
   - diferença entre geração de texto vs prefill-only ranking,
   - jornada em estágios (batching -> fast path de scoring -> reutilização de prefixo/KV -> gargalos de runtime Python),
   - foco em trade-offs de P99 e throughput.
6. Se citar números de benchmark de case externo, deixe explícito que são números reportados pela fonte.
7. Responda em português do Brasil.`
            : `Você é o Assistente Virtual da Lifetrek Medical.
Seu objetivo é ajudar visitantes do site com dúvidas sobre fabricação de dispositivos médicos (Implantes, Instrumentais, Caixas Gráficas) e capturar leads.

DIRETRIZES:
1. Seja educado, breve e profissional.
2. Se não souber a resposta, peça o e-mail para que um especialista entre em contato.
3. Se o usuário falar "Oi" ou "Ola", apresente-se brevemente e pergunte como pode ajudar na jornada de dispositivos médicos.`;

        // Call OpenRouter
        const data = await executeWithCostTracking(
            supabase,
            {
                userId: user.id,
                operation: mode === "orchestrator"
                    ? "content.chat.orchestrator"
                    : "content.chat.website-assistant",
                service: "openrouter",
                model: "google/gemini-2.0-flash-001",
                metadata: {
                    mode,
                    message_count: Array.isArray(messages) ? messages.length : 0,
                },
            },
            async () => {
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${openRouterKey}`,
                        "HTTP-Referer": "https://lifetrek.app",
                        "X-Title": "Lifetrek App"
                    },
                    body: JSON.stringify({
                        model: "google/gemini-2.0-flash-001",
                        messages: [
                            { role: "system", content: systemPrompt },
                            ...messages.map((msg: { role: string; content: string }) => ({
                                role: msg.role,
                                content: msg.content
                            }))
                        ],
                        temperature: 0.7
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`OpenRouter API error: ${errorText}`);
                }

                return await response.json();
            }
        );
        const responseText = data.choices?.[0]?.message?.content || "Sem resposta do agente.";

        return new Response(
            JSON.stringify({ text: responseText }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Chat Agent Error:", error);
        return new Response(
            JSON.stringify({ error: errorMessage, status: 500 }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
