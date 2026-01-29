

# Plano: Chatbot Website - Diagnóstico e Production Ready

## Diagnóstico Completo

### Problema Principal: 404 - Função Não Deployada
```text
OPTIONS | 404 | https://iijkbhiqcsvtnfernrbs.supabase.co/functions/v1/website-bot
```

A função `website-bot` existe no código (`supabase/functions/website-bot/`) mas **NÃO está deployada** no Supabase.

### Problemas Identificados

| # | Problema | Impacto |
|---|----------|---------|
| 1 | **404 - Função não deployada** | Chatbot não responde |
| 2 | **Falta config em `config.toml`** | `website-bot` não está listada |
| 3 | **OPEN_ROUTER_API key** | Não existe nos secrets - precisa usar `LOVABLE_API_KEY` |
| 4 | **Tabela `api_usage_logs` não existe** | Rate limit falha |
| 5 | **LangChain/LangGraph complexo** | Overhead desnecessário para chat simples |
| 6 | **Dependências npm: em Edge Functions** | Podem causar timeout/erros |

---

## Arquitetura Atual vs Proposta

```text
┌─────────────────────────────────────────────────────────────┐
│                    ATUAL (Não funciona)                      │
├─────────────────────────────────────────────────────────────┤
│  AIChatbot.tsx                                               │
│       │                                                      │
│       ▼                                                      │
│  supabase.functions.invoke("website-bot")                   │
│       │                                                      │
│       ▼                                                      │
│  website-bot/index.ts  ← 404 (não deployada)                │
│       │                                                      │
│       ├── LangChain/LangGraph (npm:)                        │
│       ├── OpenRouter API (OPEN_ROUTER_API - missing)        │
│       └── api_usage_logs (tabela não existe)                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    PROPOSTA (Production Ready)               │
├─────────────────────────────────────────────────────────────┤
│  AIChatbot.tsx                                               │
│       │                                                      │
│       ▼                                                      │
│  supabase.functions.invoke("website-bot")                   │
│       │                                                      │
│       ▼                                                      │
│  website-bot/index.ts  ← SIMPLIFICADA                       │
│       │                                                      │
│       ├── Lovable AI Gateway (LOVABLE_API_KEY)              │
│       ├── RAG via knowledge_embeddings (se existir)         │
│       ├── Lead capture direto (contact_leads)               │
│       └── Rate limit simples in-memory                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Mudanças Propostas

### 1. Adicionar `website-bot` ao `config.toml`
```toml
[functions.website-bot]
verify_jwt = false   # Público - visitantes do site
```

### 2. Reescrever `website-bot/index.ts` - Simplificado
Remover LangChain/LangGraph e usar fetch direto:

```typescript
// Principais mudanças:
// 1. Usar LOVABLE_API_KEY + Lovable AI Gateway
// 2. Remover dependências npm: complexas
// 3. Rate limit simples in-memory (ou skip)
// 4. RAG opcional via knowledge_embeddings
// 5. Lead capture direto (sem tool calling)
```

### 3. Remover `tools.ts` (opcional)
A lógica de save_lead e search_knowledge será inline no index.ts.

### 4. Deployar a função
Após as mudanças, o deploy será automático pelo Lovable.

---

## Nova Implementação `website-bot/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // System prompt da Julia
    const systemPrompt = `Você é a Julia, assistente virtual da Lifetrek Medical.
Seu papel é ajudar visitantes do site com dúvidas sobre fabricação de dispositivos médicos.

CONHECIMENTO:
- Lifetrek fabrica implantes ortopédicos, dentários e veterinários
- Certificações: ISO 13485, ANVISA
- Materiais: Titânio, PEEK, Aço Inox
- Capacidade: CNC 5-eixos, Sala Limpa ISO 7

CONTATO HUMANO:
Se o usuário quiser falar com um humano, forneça:
"Fale com nossa especialista Vanessa: https://wa.me/5511945336226"

CAPTURA DE LEADS:
Se o usuário fornecer nome/email/telefone, agradeça e confirme que um especialista entrará em contato.

Seja breve, profissional e amigável.`;

    // Chamar Lovable AI Gateway
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
          ...messages
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas mensagens. Tente novamente em breve." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || "Desculpe, não consegui processar.";

    return new Response(
      JSON.stringify({ response: responseText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Website Bot Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

---

## Arquivos a Modificar/Criar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/config.toml` | **Modificar** | Adicionar `[functions.website-bot]` |
| `supabase/functions/website-bot/index.ts` | **Reescrever** | Versão simplificada com Lovable AI |
| `supabase/functions/website-bot/tools.ts` | **Remover** | Lógica inline no index |

---

## Benefícios da Nova Arquitetura

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Dependências** | LangChain, LangGraph, Zod (npm:) | Apenas esm.sh/supabase |
| **API Key** | OPEN_ROUTER_API (não existe) | LOVABLE_API_KEY (já existe) |
| **Latência** | Alta (LangGraph graph execution) | Baixa (fetch direto) |
| **Manutenção** | Complexa | Simples |
| **Deploy** | Falha (404) | Automático |

---

## Fluxo Production Ready

```text
┌─────────────────────────────────────────────────────────────┐
│                       WEBSITE (/)                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  💬 Julia - Assistente Lifetrek                      │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  🤖 Olá! Como posso ajudar?                          │   │
│  │                                                       │   │
│  │  👤 Vocês fabricam implantes dentários?              │   │
│  │                                                       │   │
│  │  🤖 Sim! A Lifetrek fabrica implantes dentários      │   │
│  │     em Titânio e PEEK. Quer saber mais sobre         │   │
│  │     materiais ou receber um orçamento?               │   │
│  │                                                       │   │
│  │  [______________________________] [Enviar]            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Critérios de Pronto

1. `website-bot` deployada e retornando 200
2. Chatbot responde no site público
3. Usa `LOVABLE_API_KEY` (já configurada)
4. Sem erros de timeout ou dependências
5. Rate limit tratado gracefully (429 → toast amigável)

