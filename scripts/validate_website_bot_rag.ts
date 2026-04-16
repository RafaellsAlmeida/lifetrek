import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "supabase", "functions", ".env") });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing env vars. Required: SUPABASE_URL (or VITE_SUPABASE_URL), SUPABASE_ANON_KEY/VITE_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

type Scenario = {
  name: string;
  message: string;
  expectedRouteIntent: "exact_fact" | "capability" | "general_chat";
  expectedRouteBranch: "exact_lookup" | "rag_retrieval" | "model_only";
  expectedRetrievalModePrefix: string;
};

const scenarios: Scenario[] = [
  {
    name: "exact-fact-equipment",
    message: "Vocês têm Citizen L20?",
    expectedRouteIntent: "exact_fact",
    expectedRouteBranch: "exact_lookup",
    expectedRetrievalModePrefix: "exact_lookup",
  },
  {
    name: "exact-fact-count",
    message: "Quantos Citizen vocês têm?",
    expectedRouteIntent: "exact_fact",
    expectedRouteBranch: "exact_lookup",
    expectedRetrievalModePrefix: "exact_lookup",
  },
  {
    name: "capability-rag",
    message: "Quais são as capacidades de usinagem da Lifetrek?",
    expectedRouteIntent: "capability",
    expectedRouteBranch: "rag_retrieval",
    expectedRetrievalModePrefix: "",
  },
  {
    name: "general-chat",
    message: "Oi",
    expectedRouteIntent: "general_chat",
    expectedRouteBranch: "model_only",
    expectedRetrievalModePrefix: "none",
  },
  {
    name: "lead-intent-follow-up",
    message: "Quero fazer um orçamento para implantes, vocês conseguem me atender?",
    expectedRouteIntent: "general_chat",
    expectedRouteBranch: "model_only",
    expectedRetrievalModePrefix: "none",
  },
];

const invokeClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function waitForAssistantRow(sessionId: string) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { data } = await serviceClient
      .from("chatbot_conversations")
      .select("content, metadata, created_at")
      .eq("session_id", sessionId)
      .eq("role", "assistant")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) return data;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  return null;
}

async function runScenario(scenario: Scenario) {
  const sessionId = `validate-rag-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const { data, error } = await invokeClient.functions.invoke("website-bot", {
    body: {
      sessionId,
      messages: [{ role: "user", content: scenario.message }],
    },
  });

  if (error) {
    return {
      scenario,
      ok: false,
      reason: `invoke error: ${error.message}`,
      response: null as unknown,
      metadata: null as Record<string, unknown> | null,
    };
  }

  const row = await waitForAssistantRow(sessionId);
  const metadata = (row?.metadata ?? null) as Record<string, unknown> | null;
  const routeIntent = typeof metadata?.route_intent === "string" ? metadata.route_intent : "";
  const routeBranch = typeof metadata?.route_branch === "string" ? metadata.route_branch : "";
  const retrievalMode = typeof metadata?.retrieval_mode === "string" ? metadata.retrieval_mode : "";
  const hasRoutingMetadata = Boolean(routeIntent || routeBranch || retrievalMode);

  if (!hasRoutingMetadata) {
    return {
      scenario,
      ok: false,
      reason: "routing metadata not found in assistant message (deploy/serve latest website-bot first)",
      response: data,
      metadata,
    };
  }

  const intentOk = routeIntent === scenario.expectedRouteIntent;
  const branchOk = routeBranch === scenario.expectedRouteBranch;
  const retrievalOk = scenario.expectedRetrievalModePrefix
    ? retrievalMode.startsWith(scenario.expectedRetrievalModePrefix)
    : retrievalMode.length > 0;
  const ok = Boolean(row) && intentOk && branchOk && retrievalOk;

  return {
    scenario,
    ok,
    reason: ok
      ? "ok"
      : `expected intent=${scenario.expectedRouteIntent}, branch=${scenario.expectedRouteBranch}, retrieval~=${scenario.expectedRetrievalModePrefix}; got intent=${routeIntent}, branch=${routeBranch}, retrieval=${retrievalMode}`,
    response: data,
    metadata,
  };
}

async function main() {
  console.log("Running website-bot hybrid RAG smoke check...");
  const results = [];
  for (const scenario of scenarios) {
    const result = await runScenario(scenario);
    results.push(result);
    const status = result.ok ? "PASS" : "FAIL";
    console.log(`[${status}] ${scenario.name}: ${result.reason}`);
  }

  const failed = results.filter((result) => !result.ok);
  if (failed.length > 0) {
    console.error(`\n${failed.length} scenario(s) failed.`);
    process.exit(1);
  }

  console.log("\nAll hybrid RAG scenarios passed.");
}

main().catch((error) => {
  console.error("Unexpected validation error:", error);
  process.exit(1);
});
