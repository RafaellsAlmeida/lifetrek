// supabase/functions/chat/index.ts
// Chat Agent using OpenRouter

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { messages } = await req.json();

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

        const systemPrompt = `Você é o Assistente Virtual da Lifetrek Medical.
Seu objetivo é ajudar visitantes do site com dúvidas sobre fabricação de dispositivos médicos (Implantes, Instrumentais, Caixas Gráficas) e capturar leads.

DIRETRIZES:
1. Seja educado, breve e profissional.
2. Se não souber a resposta, peça o e-mail para que um especialista entre em contato.
3. Se o usuário falar "Oi" ou "Ola", apresente-se brevemente e pergunte como pode ajudar na jornada de dispositivos médicos.`;

        // Call OpenRouter
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

        const data = await response.json();
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
