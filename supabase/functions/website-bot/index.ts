// supabase/functions/website-bot/index.ts
// Website Chatbot with RAG (Vector Search) + Lead Collection
// Uses OpenRouter with Gemini Flash + text-embedding-3-small

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const rateLimitMap = new Map();

function checkRateLimit(id: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(id);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(id, { count: 1, resetTime: now + 60000 });
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}

function extractContact(text: string) {
  const result: any = {};
  const email = text.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
  if (email) result.email = email[0].toLowerCase();
  const phone = text.match(/\d{10,11}/);
  if (phone) result.phone = phone[0];
  const name = text.match(/(?:chamo|nome|sou)\s+([A-Z][a-z]+)/i);
  if (name) result.name = name[1];
  return result;
}

function detectInterest(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('orcamento') || t.includes('preco')) return 'Orcamento';
  if (t.includes('dental')) return 'Dental';
  if (t.includes('ortoped')) return 'Ortopedia';
  if (t.includes('veterinar')) return 'Veterinario';
  if (t.includes('certificac') || t.includes('iso')) return 'Certificacoes';
  if (t.includes('material') || t.includes('titanio')) return 'Materiais';
  return 'Geral';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages, sessionId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const ip = req.headers.get("x-forwarded-for") || "anon";
    if (!checkRateLimit(ip)) {
      return new Response(JSON.stringify({ error: "Rate limited" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const apiKey = Deno.env.get("OPEN_ROUTER_API") || Deno.env.get("OPEN_ROUTER_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const allUserText = messages.filter((m: any) => m.role === "user").map((m: any) => m.content).join(" ");
    const contact = extractContact(allUserText);
    const interest = detectInterest(allUserText);
    const msgCount = messages.filter((m: any) => m.role === "user").length;
    const askContact = msgCount >= 3 && !contact.email && !contact.phone;

    // RAG: Get relevant knowledge base content using vector search
    let ragContext = "";
    const lastUserMsg = messages.filter((m: any) => m.role === "user").pop()?.content || "";

    if (lastUserMsg.length > 5) {
      try {
        // Generate embedding for user query
        const embResponse = await fetch("https://openrouter.ai/api/v1/embeddings", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://lifetrek.com.br"
          },
          body: JSON.stringify({
            model: "openai/text-embedding-3-small",
            input: lastUserMsg
          })
        });

        if (embResponse.ok) {
          const embData = await embResponse.json();
          const queryEmbedding = embData.data?.[0]?.embedding;

          if (queryEmbedding) {
            const { data: kbResults, error: kbError } = await supabase.rpc("match_knowledge_base", {
              query_embedding: queryEmbedding,
              match_count: 3,
              match_threshold: 0.3
            });

            if (!kbError && kbResults && kbResults.length > 0) {
              ragContext = "\n\nInformacoes relevantes da base de conhecimento:\n" +
                kbResults.map((r: any) => `- [${r.source_type || 'info'}]: ${r.content?.slice(0, 400)}`).join("\n");
            }
          }
        }
      } catch (ragError) {
        console.error("RAG error:", ragError);
      }
    }

    const system = `Voce e Julia, assistente da Lifetrek Medical. Respostas CURTAS (1-2 frases max).

Lifetrek: implantes ortopedicos, dentarios, veterinarios. ISO 13485, ANVISA. Titanio, PEEK, Inox. Indaiatuba/SP.
${ragContext}

EXEMPLOS de respostas ideais:
User: "Oi"
Julia: "Oi! Sou a Julia da Lifetrek. Como posso ajudar?"

User: "Voces fazem implantes dentarios?"
Julia: "Sim, fabricamos implantes dentarios em titanio. Quer um orcamento? Clica no WhatsApp verde."

User: "Qual o prazo de entrega?"
Julia: "Depende do projeto. Me conta mais ou fala com a Vanessa pelo WhatsApp verde."

Regras:
- MAX 2 frases, seja direto
- Orcamentos: "WhatsApp verde"
- Nao invente dados
${askContact ? "- Pergunte nome/contato naturalmente" : ""}`;

    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lifetrek.com.br"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [{ role: "system", content: system }, ...messages],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      return new Response(JSON.stringify({ error: "AI error", detail: err }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const data = await aiRes.json();
    const reply = data.choices?.[0]?.message?.content || "Desculpe, erro. Use WhatsApp.";

    // Save conversation
    const sid = sessionId || "anon-" + Date.now();
    const lastMsg = messages[messages.length - 1];

    if (lastMsg?.role === "user") {
      (async () => {
        try {
          await supabase.from("chatbot_conversations").insert({
            session_id: sid,
            role: "user",
            content: lastMsg.content,
            metadata: { ip, source: "chatbot" },
            detected_name: contact.name,
            detected_email: contact.email,
            detected_phone: contact.phone,
            detected_interest: interest
          });
        } catch (e: unknown) {
          console.error("Save error:", e);
        }
      })();
    }

    (async () => {
      try {
        await supabase.from("chatbot_conversations").insert({
          session_id: sid,
          role: "assistant",
          content: reply,
          metadata: { model: "gemini-flash", rag_used: ragContext.length > 0, rag_context_len: ragContext.length }
        });
      } catch (e: unknown) {
        console.error("Save error:", e);
      }
    })();

    // Create lead if contact found
    if (contact.email || contact.phone) {
      (async () => {
        try {
          const leadEmail = contact.email || "chatbot" + Date.now() + "@placeholder.lifetrek.com.br";
          await supabase.from("contact_leads").upsert(
            {
            source: "website",
            name: contact.name || "Lead Chatbot",
            email: leadEmail,
            phone: contact.phone || "Nao informado",
            project_type: interest,
            business_challenges: "Capturado via chatbot do site",
            message: allUserText.slice(0, 500)
            },
            { onConflict: "email" }
          );

          await supabase.from("analytics_events").insert({
            event_type: "chatbot_lead_captured",
            company_email: contact.email || leadEmail,
            company_name: contact.name || null,
            metadata: {
              source: "website-bot",
              sessionId: sid,
              interest,
              has_email: Boolean(contact.email),
              has_phone: Boolean(contact.phone),
            },
          });

          console.log("Lead saved:", contact.email || leadEmail);
        } catch (e: unknown) {
          console.error("Lead error:", e);
        }
      })();
    }

    return new Response(JSON.stringify({ response: reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: "Internal error", debug: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
