import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  buildCompanyPromptHint,
  lookupCompany,
  normalizeForLookup,
} from "../_shared/companyLookup.ts";
import {
  buildLeadCaptureReply,
  buildLeadReadyPromptHint,
  buildPostCaptureReply,
  collectKnownContact,
  inferLeadQualification,
  wantsCommercialHelp,
  type LeadQualificationState,
} from "./leadQualification.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESPONSE_STYLE_VERSION = "website-bot-v3-lead-qualification";
const OPENAI_CHAT_MODEL = "gpt-4o-mini";
const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
const OPENROUTER_CHAT_MODEL = "google/gemini-2.0-flash-001";
const OPENROUTER_EMBEDDING_MODEL = "openai/text-embedding-3-small";
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

type KnowledgeContextItem = {
  id: string;
  source_type: string | null;
  source_id: string | null;
  category?: string | null;
  question?: string | null;
  answer?: string | null;
  content: string;
  similarity?: number | null;
  source_table: "knowledge_base" | "knowledge_embeddings";
};

function dedupeKnowledgeContextItems(items: KnowledgeContextItem[]): KnowledgeContextItem[] {
  const seen = new Map<string, KnowledgeContextItem>();

  for (const item of items) {
    const key = [item.source_table, item.source_id ?? item.id, item.content].join("|");
    if (!seen.has(key)) {
      seen.set(key, item);
    }
  }

  return [...seen.values()].sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0));
}

function formatKnowledgeContext(items: KnowledgeContextItem[]): string {
  return (
    "\n\nBase de conhecimento relevante:\n" +
    items
      .map((item) => {
        const label = `${item.source_table}:${item.source_type || item.category || "info"}`;
        const snippet = trimSnippet(item.answer || item.content || item.question || "");
        return `- [${label}] ${snippet}`;
      })
      .join("\n")
  );
}

function summarizeKnowledgeContext(ragContext: string): string | null {
  const firstBullet = ragContext
    .split("\n")
    .find((line) => line.trimStart().startsWith("- "));

  if (!firstBullet) return null;

  return firstBullet.replace(/^- \[[^\]]+\]\s*/, "").trim();
}

async function fetchEmbedding(
  openAiKey: string | undefined,
  openRouterKey: string | undefined,
  input: string,
): Promise<{ embedding: number[] | null; provider: string | null; error: string | null }> {
  if (openAiKey) {
    try {
      const embResponse = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: OPENAI_EMBEDDING_MODEL,
          input,
        }),
      });

      if (embResponse.ok) {
        const embData = await embResponse.json();
        const embedding = embData.data?.[0]?.embedding ?? null;
        if (embedding) {
          return { embedding, provider: `openai:${OPENAI_EMBEDDING_MODEL}`, error: null };
        }
      } else {
        const errorText = await embResponse.text();
        console.error("OpenAI embedding request failed:", embResponse.status, errorText);
      }
    } catch (error) {
      console.error("OpenAI embedding error:", error);
    }
  }

  if (openRouterKey) {
    try {
      const embResponse = await fetch("https://openrouter.ai/api/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://lifetrek.com.br",
        },
        body: JSON.stringify({
          model: OPENROUTER_EMBEDDING_MODEL,
          input,
        }),
      });

      if (embResponse.ok) {
        const embData = await embResponse.json();
        const embedding = embData.data?.[0]?.embedding ?? null;
        if (embedding) {
          return { embedding, provider: `openrouter:${OPENROUTER_EMBEDDING_MODEL}`, error: null };
        }
      } else {
        const errorText = await embResponse.text();
        console.error("OpenRouter embedding request failed:", embResponse.status, errorText);
        return { embedding: null, provider: null, error: `openrouter ${embResponse.status}: ${errorText}` };
      }
    } catch (error) {
      console.error("OpenRouter embedding error:", error);
      return {
        embedding: null,
        provider: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return { embedding: null, provider: null, error: "No embedding provider configured" };
}

function extractAssistantText(content: unknown): string {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "text" in item && typeof item.text === "string") {
          return item.text;
        }
        return "";
      })
      .join("")
      .trim();
  }

  return "";
}

async function fetchChatCompletion(options: {
  openAiKey: string | undefined;
  openRouterKey: string | undefined;
  systemPrompt: string;
  messages: ChatMessage[];
}): Promise<{ reply: string; modelLabel: string; providerError: string | null }> {
  const { openAiKey, openRouterKey, systemPrompt, messages } = options;

  if (openAiKey) {
    try {
      const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: OPENAI_CHAT_MODEL,
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          temperature: 0.35,
          max_completion_tokens: 450,
        }),
      });

      if (aiRes.ok) {
        const data = await aiRes.json();
        const reply = extractAssistantText(data.choices?.[0]?.message?.content);
        if (reply) {
          return {
            reply,
            modelLabel: `openai:${OPENAI_CHAT_MODEL}`,
            providerError: null,
          };
        }
      } else {
        const errorText = await aiRes.text();
        console.error("OpenAI chat request failed:", aiRes.status, errorText);
      }
    } catch (error) {
      console.error("OpenAI chat error:", error);
    }
  }

  if (openRouterKey) {
    try {
      const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lifetrek.com.br",
      },
      body: JSON.stringify({
        model: OPENROUTER_CHAT_MODEL,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        temperature: 0.35,
        max_tokens: 450,
      }),
    });

      if (aiRes.ok) {
        const data = await aiRes.json();
        const reply = extractAssistantText(data.choices?.[0]?.message?.content);
        if (reply) {
          return {
            reply,
            modelLabel: `openrouter:${OPENROUTER_CHAT_MODEL}`,
            providerError: null,
          };
        }
      } else {
        const errorText = await aiRes.text();
        console.error("OpenRouter chat request failed:", aiRes.status, errorText);
        return {
          reply: "",
          modelLabel: "",
          providerError: `openrouter ${aiRes.status}: ${errorText}`,
        };
      }
    } catch (error) {
      console.error("OpenRouter chat error:", error);
      return {
        reply: "",
        modelLabel: "",
        providerError: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return {
    reply: "",
    modelLabel: "",
    providerError: "No chat provider configured",
  };
}

async function fetchKnowledgeContext(
  supabase: any,
  openAiKey: string | undefined,
  openRouterKey: string | undefined,
  query: string,
  interest: string,
  matchedCompany: string | null,
) {
  const retrieval = {
    mode: "none",
    vectorResults: 0,
    textResults: 0,
    terms: [] as string[],
    embeddingProvider: null as string | null,
    sourceMatches: [] as string[],
  };

  const embeddingResult = await fetchEmbedding(openAiKey, openRouterKey, query);
  retrieval.embeddingProvider = embeddingResult.provider;

  if (embeddingResult.embedding) {
    const [knowledgeBaseVector, knowledgeEmbeddingsVector] = await Promise.all([
      (supabase as any).rpc("match_knowledge_base", {
        query_embedding: embeddingResult.embedding,
        match_count: 3,
        match_threshold: 0.3,
      }) as Promise<{ data: any[] | null; error: any }>,
      (supabase as any).rpc("match_knowledge", {
        query_embedding: embeddingResult.embedding,
        match_count: 3,
        match_threshold: 0.3,
      }) as Promise<{ data: any[] | null; error: any }>,
    ]);

    const vectorItems: KnowledgeContextItem[] = [];

    if (!knowledgeBaseVector.error && knowledgeBaseVector.data?.length) {
      vectorItems.push(
        ...knowledgeBaseVector.data.map((item: any) => ({
          ...item,
          source_table: "knowledge_base" as const,
        })),
      );
    }

    if (!knowledgeEmbeddingsVector.error && knowledgeEmbeddingsVector.data?.length) {
      vectorItems.push(
        ...knowledgeEmbeddingsVector.data.map((item: any) => ({
          ...item,
          category: item.source_type || item.metadata?.category || null,
          source_table: "knowledge_embeddings" as const,
        })),
      );
    }

    const mergedVectorItems = dedupeKnowledgeContextItems(vectorItems).slice(0, 4);

    if (mergedVectorItems.length) {
      retrieval.mode = "vector";
      retrieval.vectorResults = mergedVectorItems.length;
      retrieval.sourceMatches = mergedVectorItems.map(
        (item) => `${item.source_table}:${item.source_type || item.category || "info"}`,
      );
      return {
        context: formatKnowledgeContext(mergedVectorItems),
        retrieval,
      };
    }
  }

  const terms = uniqueTokens(query, interest, matchedCompany);
  retrieval.terms = terms;
  const seen = new Map<string, any>();

  for (const term of terms) {
    const pattern = `%${term}%`;
    const [knowledgeBaseText, knowledgeEmbeddingsText] = await Promise.all([
      supabase
        .from("knowledge_base")
        .select("id, source_type, category, question, answer, content")
        .or(`content.ilike.${pattern},question.ilike.${pattern},answer.ilike.${pattern}`)
        .limit(3),
      supabase
        .from("knowledge_embeddings")
        .select("id, source_type, source_id, content, metadata")
        .ilike("content", pattern)
        .limit(3),
    ]);

    if (!knowledgeBaseText.error && knowledgeBaseText.data?.length) {
      for (const item of knowledgeBaseText.data) {
        seen.set(`knowledge_base:${item.id}`, {
          ...item,
          source_table: "knowledge_base" as const,
        });
      }
    }

    if (!knowledgeEmbeddingsText.error && knowledgeEmbeddingsText.data?.length) {
      for (const item of knowledgeEmbeddingsText.data) {
        seen.set(`knowledge_embeddings:${item.id}`, {
          ...item,
          category: item.source_type || item.metadata?.category || null,
          source_table: "knowledge_embeddings" as const,
        });
      }
    }

    if (seen.size >= 3) break;
  }

  const results = dedupeKnowledgeContextItems([...seen.values()]).slice(0, 3);
  if (!results.length) {
    return { context: "", retrieval };
  }

  retrieval.mode = "text";
  retrieval.textResults = results.length;
  retrieval.sourceMatches = results.map(
    (item) => `${item.source_table}:${item.source_type || item.category || "info"}`,
  );

  return {
    context: formatKnowledgeContext(results),
    retrieval,
  };
}

function buildSystemPrompt(options: {
  ragContext: string;
  companyHint: string;
  interest: string;
  clientBuffer: ClientBufferMetadata | null;
  leadQualificationHint: string;
}) {
  const { ragContext, companyHint, interest, clientBuffer, leadQualificationHint } = options;
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
- Se ja tivermos nome, email e telefone para atendimento comercial, agradeca brevemente e nao peca esses dados novamente.
- Se o usuario perguntar varias coisas no mesmo pacote, responda os pontos principais no mesmo retorno.

Fatos base da Lifetrek:
- Fabricante brasileira em Indaiatuba/SP.
- Atua com implantes e componentes medicos, dentarios e veterinarios, instrumentais e projetos OEM/manufatura contratada.
- ISO 13485 e ANVISA.
- Materiais frequentes: titanio, PEEK e inox.
- A frente veterinaria inclui implantes ortopedicos adaptados, placas e parafusos.
- Se o contexto recuperado trouxer um fato especifico, responda com ele de forma direta antes de qualquer fechamento comercial.

Indicacao de interesse detectado: ${interest}.
${groupedHint}
${companyHint}
${leadQualificationHint}
${ragContext}`;
}

function baseCapabilityReply(interest: string, text: string): string {
  const normalized = text.toLowerCase();

  if (normalized.includes("citizen") && normalized.includes("l20")) {
    return "Sim, temos Citizen L20 no parque fabril da Lifetrek.";
  }

  if (normalized.includes("citizen") && normalized.includes("m32")) {
    return "Sim, temos Citizen M32 no parque fabril da Lifetrek.";
  }

  if (normalized.includes("zeiss") && normalized.includes("contura")) {
    return "Sim, temos ZEISS Contura para metrologia dimensional.";
  }

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
  leadQualification: LeadQualificationState;
}) {
  const { allUserText, interest, companyLookup, ragContext, leadQualification } = options;
  const parts: string[] = [];
  const ragSummary = summarizeKnowledgeContext(ragContext);

  if (ragSummary) {
    parts.push(`Encontrei na base da Lifetrek: ${ragSummary}`);
  }

  parts.push(baseCapabilityReply(interest, allUserText));

  const relationshipReply = buildRelationshipReply(companyLookup);
  if (relationshipReply) {
    parts.push(relationshipReply);
  }

  if (leadQualification.readyForCommercialFollowUp) {
    const leadName = leadQualification.knownContact.name ? `, ${leadQualification.knownContact.name}` : "";
    parts.unshift(`Perfeito${leadName}. Ja anotei seus dados de contato.`);
  }

  const followUpMessage = leadQualification.readyForCommercialFollowUp
    ? "Se voce me disser qual produto, componente ou projeto quer cotar, eu consigo te orientar melhor e encaminhar para o comercial."
    : wantsCommercialHelp(allUserText)
      ? "Se quiser, eu ja deixo isso encaminhado com o time comercial assim que voce me passar seus dados de contato."
      : "Se fizer sentido, também posso te direcionar para o time comercial para validar o seu projeto.";

  parts.push(followUpMessage);

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

    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    const openRouterKey = Deno.env.get("OPEN_ROUTER_API") || Deno.env.get("OPEN_ROUTER_API_KEY");

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
    const historicalUserMessages = userMessages.slice(0, -1).map((message) => message.content);
    const userInputs = [
      ...historicalUserMessages,
      ...(rawBufferedMessages.length ? rawBufferedMessages : lastUserMessage ? [lastUserMessage] : []),
    ];
    const conversationText = userInputs.join(" ").trim();

    const leadQualification = inferLeadQualification({
      userMessages: userInputs,
      lastUserMessage,
      conversationText: conversationText || allUserText,
    });
    const contact = collectKnownContact(userInputs);
    const interest = detectInterest(allUserText || conversationText);
    const companyLookup = await lookupCompany(
      supabase,
      conversationText || allUserText || lastUserMessage,
    );
    const detectedCompany = companyLookup.matchedCompany || companyLookup.detectedCompany;
    const qualifiedCompanyReference = companyLookup.matchSource
      ? (companyLookup.matchedCompany || companyLookup.detectedCompany)
      : null;

    const { context: ragContext, retrieval } = await fetchKnowledgeContext(
      supabase,
      openAiKey,
      openRouterKey,
      conversationText || allUserText || lastUserMessage,
      interest,
      companyLookup.matchedCompany,
    );

    const systemPrompt = buildSystemPrompt({
      ragContext,
      companyHint: buildCompanyPromptHint(companyLookup),
      interest,
      clientBuffer: clientBuffer ?? null,
      leadQualificationHint: buildLeadReadyPromptHint({
        state: leadQualification,
        interest,
        detectedCompany: qualifiedCompanyReference,
      }),
    });

    let reply = "";
    let modelLabel = "gemini-flash";
    let aiFallbackUsed = false;
    let providerError: string | null = null;

    if (leadQualification.shouldRequestContact) {
      reply = buildLeadCaptureReply({
        state: leadQualification,
        interest,
        detectedCompany: qualifiedCompanyReference,
      });
      modelLabel = "deterministic-lead-capture";
    } else {
      const postCaptureReply = buildPostCaptureReply({
        state: leadQualification,
        interest,
      });

      if (postCaptureReply) {
        reply = postCaptureReply;
        modelLabel = "deterministic-post-capture";
      }
    }

    if (!reply) {
      const completion = await fetchChatCompletion({
        openAiKey,
        openRouterKey,
        systemPrompt,
        messages: typedMessages,
      });

      reply = completion.reply;
      if (completion.modelLabel) {
        modelLabel = completion.modelLabel;
      }
      providerError = completion.providerError;
    }

    if (!reply) {
      reply = buildFallbackReply({
        allUserText: conversationText || allUserText,
        interest,
        companyLookup,
        ragContext,
        leadQualification,
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
            lead_qualification: leadQualification,
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
          lead_qualification: leadQualification,
          ai_fallback_used: aiFallbackUsed,
          provider_error: providerError,
          response_style_version: RESPONSE_STYLE_VERSION,
        },
        detected_company: detectedCompany,
      });
    } catch (error) {
      console.error("Assistant save error:", error);
    }

    const shouldPersistLead =
      leadQualification.readyForCommercialFollowUp ||
      (!leadQualification.wantsCommercialHelp && Boolean(contact.email || contact.phone));

    if (shouldPersistLead && (contact.email || contact.phone)) {
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
              message: (conversationText || allUserText).slice(0, 500),
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
              ready_for_commercial_follow_up: leadQualification.readyForCommercialFollowUp,
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
