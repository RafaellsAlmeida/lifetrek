// supabase/functions/website-bot/index.ts
// Simplified Website Chatbot - Production Ready
// Uses Lovable AI Gateway for fast, reliable responses

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limiting (per function instance)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 15;

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(clientId);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  entry.count++;
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages, sessionId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid request: messages array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limit by IP or fallback identifier
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    if (!checkRateLimit(clientIp)) {
      return new Response(
        JSON.stringify({ error: "Muitas mensagens. Aguarde um momento e tente novamente." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      throw new Error("AI service not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // System prompt for Julia - Lifetrek Website Assistant
    const systemPrompt = `Você é a Julia, assistente virtual da Lifetrek Medical.
Seu papel é ajudar visitantes do site com dúvidas sobre fabricação de dispositivos médicos.

SOBRE A LIFETREK:
- Fabricação: Implantes ortopédicos, dentários, veterinários e instrumentais cirúrgicos
- Certificações: ISO 13485:2016, registro ANVISA, BPF
- Materiais: Titânio Grau 5 (Ti6Al4V), PEEK, Aço Inox 316L, Cobalto-Cromo
- Infraestrutura: CNC 5-eixos, tornos Swiss-Type, 2 Salas Limpas ISO 7, CMM ZEISS 3D
- Capacidades: Tolerâncias de ±0.005mm, tratamento de superfície, passivação, anodização
- Clientes: OEMs, hospitais, distribuidores B2B

CONTATO HUMANO:
Se o usuário quiser falar com um especialista ou solicitar orçamento:
"Para falar diretamente com nossa especialista Vanessa, por favor clique no **botão verde com ícone do WhatsApp** que aparece no canto inferior direito, ao lado do botão de enviar."

CAPTURA DE LEADS:
Se o usuário fornecer informações de contato (nome, email, telefone, empresa):
- Agradeça cordialmente
- Confirme que um especialista entrará em contato em breve
- Se possível, pergunte sobre o tipo de projeto/necessidade

DIRETRIZES:
1. Seja profissional, breve e amigável
2. Responda em português brasileiro
3. Para dúvidas técnicas específicas, ofereça conectar com Vanessa
4. NÃO gere conteúdo de marketing (posts, carrosséis) - isso não é sua função
5. NÃO invente especificações técnicas - se não souber, ofereça contato humano
6. Mantenha respostas concisas (máximo 3-4 frases quando possível)`;

    // Call Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role,
            content: m.content
          }))
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Serviço temporariamente ocupado. Tente novamente em breve." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Serviço indisponível no momento." }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || 
      "Desculpe, não consegui processar sua mensagem. Fale com nossa especialista Vanessa: https://wa.me/5511945336226";

    // --- LOGGING ---
    // sessionId is available from request root

    // Save conversation to DB
    if (sessionId && sessionId !== 'unknown') {
        const lastUserMessage = messages[messages.length - 1];
        if (lastUserMessage && lastUserMessage.role === 'user') {
            await supabase.from('chatbot_conversations').insert({
                session_id: sessionId,
                role: 'user',
                content: lastUserMessage.content,
                metadata: { client_ip: clientIp }
            });
        }

        await supabase.from('chatbot_conversations').insert({
            session_id: sessionId,
            role: 'assistant',
            content: responseText
        });
    }

    // Optional: Try to detect and save lead info from conversation
    await tryExtractAndSaveLead(supabase, messages, responseText);

    return new Response(
      JSON.stringify({ response: responseText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Website Bot Error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Desculpe, ocorreu um erro. Fale com nossa especialista Vanessa: https://wa.me/5511945336226" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper function to extract potential lead info from conversation
async function tryExtractAndSaveLead(
  supabase: any,
  messages: Array<{ role: string; content: string }>,
  aiResponse: string
): Promise<void> {
  try {
    // Simple regex patterns for contact info
    const emailPattern = /[\w.-]+@[\w.-]+\.\w+/i;
    const phonePattern = /(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[-\s]?\d{4}/;

    // Check all user messages for contact info
    const userMessages = messages.filter(m => m.role === "user").map(m => m.content).join(" ");
    
    const emailMatch = userMessages.match(emailPattern);
    const phoneMatch = userMessages.match(phonePattern);

    // Only save if we found at least email or phone
    if (emailMatch || phoneMatch) {
      const leadData: any = {
        source: "website_chatbot",
        email: emailMatch?.[0] || "nao_informado@placeholder.com",
        phone: phoneMatch?.[0] || "Não informado",
        name: "Lead via Chatbot",
        project_type: "Consulta via Chat",
        technical_requirements: userMessages.slice(0, 500),
      };

      const { error } = await supabase.from("contact_leads").insert(leadData);
      
      if (error) {
        console.warn("Could not save lead (non-blocking):", error.message);
      } else {
        console.log("✅ Lead captured from chatbot");
      }
    }
  } catch (e) {
    // Non-blocking - don't fail the chat if lead capture fails
    console.warn("Lead extraction failed (non-blocking):", e);
  }
}
