import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  buildCompanyPromptHint,
  lookupCompany,
  normalizeForLookup,
} from "../_shared/companyLookup.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESPONSE_STYLE_VERSION = "website-bot-v2-humanized";
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type ClientBufferMetadata = {
  grouped?: boolean;
  count?: number;
  windowMs?: number;
  rawMessages?: string[];
};

function checkRateLimit(id: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(id);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(id, { count: 1, resetTime: now + 60_000 });
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count += 1;
  return true;
}

function extractContact(text: string) {
  const result: Record<string, string> = {};
  const email = text.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
  if (email) result.email = email[0].toLowerCase();

  const digitsOnly = text.replace(/\D/g, "");
  if (digitsOnly.length >= 10) {
    result.phone = digitsOnly.slice(0, 13);
  }

  const name = text.match(/(?:me chamo|meu nome e|meu nome é|sou)\s+([A-ZÀ-Ý][A-Za-zÀ-ÿ'-]+)/i);
  if (name) result.name = name[1];

  return result;
}

function detectInterest(text: string): string {
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (normalized.includes("orcamento") || normalized.includes("preco")) {
    return "Orcamento";
  }
  if (normalized.includes("dental") || normalized.includes("odonto")) return "Dental";
  if (normalized.includes("ortoped")) return "Ortopedia";
  if (normalized.includes("veterinar") || normalized.includes("vet ")) return "Veterinario";
  if (normalized.includes("certificac") || normalized.includes("iso") || normalized.includes("anvisa")) return "Certificacoes";
  if (normalized.includes("material") || normalized.includes("titanio") || normalized.includes("peek")) return "Materiais";
  if (normalized.includes("oem") || normalized.includes("manufatura contratada")) return "OEM";
  return "Geral";
}

function trimSnippet(content: string): string {
  return content.replace(/\s+/g, " ").trim().slice(0, 420);
}

function uniqueTokens(query: string, interest: string, matchedCompany: string | null): string[] {
  const baseTokens = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 4 && !/\d/.test(token));

  const interestTokens =
    interest === "Veterinario"
      ? ["veterinary", "vet", "tplo", "animal", "implants"]
      : interest === "Dental"
        ? ["dental", "implant", "abutment", "odonto"]
        : interest === "Ortopedia"
          ? ["orthopedic", "trauma", "spinal", "implants"]
          : interest === "Certificacoes"
            ? ["iso", "anvisa", "quality", "certification"]
            : interest === "OEM"
              ? ["oem", "contract", "manufacturing"]
              : [];

  const companyTokens = matchedCompany
    ? matchedCompany
        .split(/\s+/)
        .map((token) => normalizeForLookup(token))
        .filter((token) => token.length >= 4)
    : [];

  return [...new Set([...baseTokens, ...interestTokens, ...companyTokens])].slice(0, 8);
}

async function fetchEmbedding(
  apiKey: string,
  input: string,
): Promise<number[] | null> {
  try {
    const embResponse = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lifetrek.com.br",
      },
      body: JSON.stringify({
        model: "openai/text-embedding-3-small",
        input,
      }),
    });

    if (!embResponse.ok) {
      console.error("Embedding request failed:", embResponse.status, await embResponse.text());
      return null;
    }

    const embData = await embResponse.json();
    return embData.data?.[0]?.embedding ?? null;
  } catch (error) {
    console.error("Embedding error:", error);
    return null;
  }
}

async function fetchKnowledgeContext(
  supabase: any,
  apiKey: string | undefined,
  query: string,
  interest: string,
  matchedCompany: string | null,
) {
  const retrieval = {
    mode: "none",
    vectorResults: 0,
    textResults: 0,
    terms: [] as string[],
  };

  const vector = apiKey ? await fetchEmbedding(apiKey, query) : null;
  if (vector) {
    const { data, error } = await (supabase as any).rpc("match_knowledge_base", {
      query_embedding: vector,
      match_count: 3,
      match_threshold: 0.3,
    }) as { data: any[] | null; error: any };

    if (!error && data?.length) {
      retrieval.mode = "vector";
      retrieval.vectorResults = data.length;
      return {
        context:
          "\n\nBase de conhecimento relevante:\n" +
          data
            .map((item: any) => `- [${item.source_type || item.category || "info"}] ${trimSnippet(item.answer || item.content || item.question || "")}`)
            .join("\n"),
        retrieval,
      };
    }
  }

  const terms = uniqueTokens(query, interest, matchedCompany);
  retrieval.terms = terms;
  const seen = new Map<string, any>();

  for (const term of terms) {
    const pattern = `%${term}%`;
    const { data, error } = await supabase
      .from("knowledge_base")
      .select("id, source_type, category, question, answer, content")
      .or(`content.ilike.${pattern},question.ilike.${pattern},answer.ilike.${pattern}`)
      .limit(3);

    if (error || !data?.length) continue;

    for (const item of data) {
      seen.set(item.id, item);
    }

    if (seen.size >= 3) break;
  }

  const results = [...seen.values()].slice(0, 3);
  if (!results.length) {
    return { context: "", retrieval };
  }

  retrieval.mode = "text";
  retrieval.textResults = results.length;

  return {
    context:
      "\n\nBase de conhecimento relevante:\n" +
      results
        .map((item: any) => `- [${item.source_type || item.category || "info"}] ${trimSnippet(item.answer || item.content || item.question || "")}`)
        .join("\n"),
    retrieval,
  };
}

function buildSystemPrompt(options: {
  ragContext: string;
  companyHint: string;
  interest: string;
  clientBuffer: ClientBufferMetadata | null;
}) {
  const { ragContext, companyHint, interest, clientBuffer } = options;
  const groupedHint =
    clientBuffer?.grouped && (clientBuffer.count ?? 0) > 1
      ? "O usuario enviou varias mensagens em sequencia. Responda os pontos principais no mesmo retorno, sem ignorar a mensagem mais recente."
      : "";

  return `Voce e Julia, assistente virtual da Lifetrek Medical.

Tom e estilo:
- PT-BR natural, humano, cordial, paciente e consultivo.
- Responda normalmente em 2 a 4 frases curtas.
- Primeiro responda a pergunta. So depois ofereca WhatsApp/comercial se fizer sentido.
- Se o usuario pedir orcamento, voce pode orientar para o WhatsApp, mas sem transformar a resposta em CTA seco.

Regras obrigatorias:
- Nunca responda apenas com "clique no WhatsApp verde" ou equivalente.
- Nunca diga que "nao encontrou a empresa" sem ter lookup confiavel.
- Nao invente clientes, pedidos ativos, marcas ou detalhes comerciais.
- Se houver match de portifolio aprovado, fale em linguagem de portifolio/parceria aprovada, nao em fabricacao ativa confirmada agora.
- Se nao conseguir confirmar algo, diga isso de forma educada e ofereca verificacao.
- Se o usuario perguntar varias coisas no mesmo pacote, responda os pontos principais no mesmo retorno.

Fatos base da Lifetrek:
- Fabricante brasileira em Indaiatuba/SP.
- Atua com implantes e componentes medicos, dentarios e veterinarios, instrumentais e projetos OEM/manufatura contratada.
- ISO 13485 e ANVISA.
- Materiais frequentes: titanio, PEEK e inox.
- A frente veterinaria inclui implantes ortopedicos adaptados, placas e parafusos.

Indicacao de interesse detectado: ${interest}.
${groupedHint}
${companyHint}
${ragContext}`;
}

function wantsQuoteOrHandoff(text: string): boolean {
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return [
    "orcamento",
    "orçamento",
    "preco",
    "preço",
    "cotacao",
    "cotação",
    "whatsapp",
    "comercial",
    "contato",
  ].some((term) => normalized.includes(term));
}

function baseCapabilityReply(interest: string, text: string): string {
  const normalized = text.toLowerCase();

  if (normalized.includes("marca") && normalized.includes("trabalh")) {
    return "Trabalhamos com fabricação sob a marca da empresa parceira, conforme o projeto e a estratégia comercial de cada cliente.";
  }

  if (interest === "Veterinario") {
    return "Sim, fabricamos implantes veterinários e também atuamos com manufatura contratada para essa frente.";
  }

  if (interest === "Dental") {
    return "Sim, atendemos projetos odontológicos com implantes, componentes e instrumentais de precisão.";
  }

  if (interest === "Ortopedia") {
    return "Sim, atuamos com implantes e componentes ortopédicos de precisão, inclusive em projetos OEM.";
  }

  if (interest === "Certificacoes") {
    return "A Lifetrek atua com ISO 13485 e ANVISA, com rastreabilidade e processos voltados à fabricação de dispositivos médicos.";
  }

  if (interest === "OEM") {
    return "Sim, a Lifetrek atua com projetos OEM e manufatura contratada para empresas da área médica.";
  }

  return "A Lifetrek fabrica componentes e dispositivos médicos com foco em precisão, qualidade e manufatura contratada.";
}

function buildRelationshipReply(
  lookup: Awaited<ReturnType<typeof lookupCompany>>,
): string | null {
  if (lookup.matchedCompany && lookup.matchSource === "approved_registry") {
    if (lookup.segment === "veterinary") {
      return `A ${lookup.matchedCompany} aparece no nosso portfólio aprovado na frente veterinária.`;
    }

    return `A ${lookup.matchedCompany} aparece no nosso portfólio aprovado da Lifetrek.`;
  }

  if (lookup.matchedCompany) {
    return `Encontrei referência interna à ${lookup.matchedCompany}, mas prefiro confirmar os detalhes comerciais antes de afirmar algo além disso.`;
  }

  if (lookup.detectedCompany) {
    return `Não consegui confirmar com segurança um vínculo comercial específico com ${lookup.detectedCompany}, mas posso encaminhar essa verificação interna para o nosso time.`;
  }

  return null;
}

function buildFallbackReply(options: {
  allUserText: string;
  interest: string;
  companyLookup: Awaited<ReturnType<typeof lookupCompany>>;
  ragContext: string;
}) {
  const { allUserText, interest, companyLookup, ragContext } = options;
  const parts = [
    baseCapabilityReply(interest, allUserText),
    buildRelationshipReply(companyLookup),
  ].filter((value): value is string => Boolean(value));

  if (!parts.length && ragContext) {
    parts.push("Tenho contexto suficiente para te orientar sobre essa frente da Lifetrek.");
  }

  parts.push(
    wantsQuoteOrHandoff(allUserText)
      ? "Se quiser, eu já te direciono para o comercial no WhatsApp para orçamento ou validação interna."
      : "Se fizer sentido, também posso te direcionar para o time comercial para validar o seu projeto.",
  );

  return parts.slice(0, 3).join(" ");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages, sessionId, clientBuffer } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ip = req.headers.get("x-forwarded-for") || "anon";
    if (!checkRateLimit(ip)) {
      return new Response(JSON.stringify({ error: "Rate limited" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("OPEN_ROUTER_API") || Deno.env.get("OPEN_ROUTER_API_KEY");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const typedMessages = messages as ChatMessage[];
    const userMessages = typedMessages.filter((message) => message.role === "user");
    const rawBufferedMessages = Array.isArray(clientBuffer?.rawMessages)
      ? clientBuffer.rawMessages.filter((message: unknown): message is string => typeof message === "string" && message.trim().length > 0)
      : [];
    const allUserText = rawBufferedMessages.length
      ? rawBufferedMessages.join(" ")
      : userMessages.map((message) => message.content).join(" ");
    const lastUserMessage = rawBufferedMessages.at(-1) ?? userMessages.at(-1)?.content ?? "";

    const contact = extractContact(allUserText);
    const interest = detectInterest(allUserText);
    const companyLookup = await lookupCompany(supabase, allUserText || lastUserMessage);
    const detectedCompany = companyLookup.matchedCompany || companyLookup.detectedCompany;

    const { context: ragContext, retrieval } = await fetchKnowledgeContext(
      supabase,
      apiKey,
      allUserText || lastUserMessage,
      interest,
      companyLookup.matchedCompany,
    );

    const systemPrompt = buildSystemPrompt({
      ragContext,
      companyHint: buildCompanyPromptHint(companyLookup),
      interest,
      clientBuffer: clientBuffer ?? null,
    });

    let reply = "";
    let modelLabel = "gemini-flash";
    let aiFallbackUsed = false;
    let providerError: string | null = null;

    if (apiKey) {
      try {
        const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://lifetrek.com.br",
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-001",
            messages: [{ role: "system", content: systemPrompt }, ...typedMessages],
            temperature: 0.35,
            max_tokens: 450,
          }),
        });

        if (!aiRes.ok) {
          providerError = await aiRes.text();
        } else {
          const data = await aiRes.json();
          reply = data.choices?.[0]?.message?.content?.trim() || "";
        }
      } catch (error) {
        providerError = error instanceof Error ? error.message : String(error);
      }
    } else {
      providerError = "OPEN_ROUTER_API missing";
    }

    if (!reply) {
      reply = buildFallbackReply({
        allUserText,
        interest,
        companyLookup,
        ragContext,
      });
      modelLabel = "deterministic-fallback";
      aiFallbackUsed = true;
    }

    const sid = sessionId || `anon-${Date.now()}`;
    const lastMessage = typedMessages[typedMessages.length - 1];

    if (lastMessage?.role === "user") {
      try {
        await supabase.from("chatbot_conversations").insert({
          session_id: sid,
          role: "user",
          content: lastMessage.content,
          metadata: {
            ip,
            source: "chatbot",
            client_buffer: clientBuffer ?? null,
            company_lookup: companyLookup,
            response_style_version: RESPONSE_STYLE_VERSION,
          },
          detected_name: contact.name,
          detected_email: contact.email,
          detected_phone: contact.phone,
          detected_interest: interest,
          detected_company: detectedCompany,
        });
      } catch (error) {
        console.error("User save error:", error);
      }
    }

    try {
      await supabase.from("chatbot_conversations").insert({
        session_id: sid,
        role: "assistant",
        content: reply,
        metadata: {
          model: modelLabel,
          rag_used: Boolean(ragContext),
          rag_context_len: ragContext.length,
          company_lookup: companyLookup,
          retrieval,
          client_buffer: clientBuffer ?? null,
          ai_fallback_used: aiFallbackUsed,
          provider_error: providerError,
          response_style_version: RESPONSE_STYLE_VERSION,
        },
        detected_company: detectedCompany,
      });
    } catch (error) {
      console.error("Assistant save error:", error);
    }

    if (contact.email || contact.phone) {
      (async () => {
        try {
          const leadEmail = contact.email || `chatbot${Date.now()}@placeholder.lifetrek.com.br`;
          await supabase.from("contact_leads").upsert(
            {
              source: "website",
              name: contact.name || "Lead Chatbot",
              email: leadEmail,
              phone: contact.phone || "Nao informado",
              company: detectedCompany || null,
              project_type: interest,
              business_challenges: "Capturado via chatbot do site",
              message: allUserText.slice(0, 500),
            },
            { onConflict: "email" },
          );

          await supabase.from("analytics_events").insert({
            event_type: "chatbot_lead_captured",
            company_email: contact.email || leadEmail,
            company_name: detectedCompany || contact.name || null,
            metadata: {
              source: "website-bot",
              sessionId: sid,
              interest,
              has_email: Boolean(contact.email),
              has_phone: Boolean(contact.phone),
              detected_company: detectedCompany,
            },
          });
        } catch (error) {
          console.error("Lead error:", error);
        }
      })();
    }

    return new Response(JSON.stringify({ response: reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: "Internal error", debug: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
