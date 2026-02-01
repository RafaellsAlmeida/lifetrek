
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

// Load environment variables
const env = await load();
const OPENROUTER_KEY = env["OPEN_ROUTER_API_KEY"] || Deno.env.get("OPEN_ROUTER_API_KEY");

if (!OPENROUTER_KEY) {
  console.error("❌ Error: OPEN_ROUTER_API_KEY not found in .env or environment.");
  Deno.exit(1);
}

// Configuration
const SITE_URL = "https://lifetrek.app";
const SITE_TITLE = "Lifetrek CLI Agent";

// --- BRAND GUIDELINES (Simplified from agent_tools.ts) ---
const BRAND = {
  companyName: 'Lifetrek Medical',
  tone: 'Professional, authoritative, technically precise, confident, quality-focused',
  visualStyle: 'Clean, modern B2B aesthetic with medical manufacturing focus.'
};

async function chat(messages: any[], model = "google/gemini-2.0-flash-001") {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": SITE_URL,
      "X-Title": SITE_TITLE,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter Error: ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// --- FULL AGENT PROMPTS ---

const STRATEGIST_SYSTEM_PROMPT = `You are a LinkedIn content strategist for ${BRAND.companyName}.
      Task: Plan a LinkedIn carousel about the user provided topic.
      Target Audience: Decision Makers (Medical Device OEMs)
      Brand Tone: ${BRAND.tone}

      Requirements:
      - 5-7 slides total.
      - Strong narrative arc (Hook -> Agitate -> Solution -> Proof -> CTA).
      - Output strictly valid JSON object with keys: "hook", "narrative_arc", "slide_count", "key_messages" (array).`;

const COPYWRITER_SYSTEM_PROMPT = `You are an expert LinkedIn copywriter for ${BRAND.companyName}.
      Tone: ${BRAND.tone}

      Output strict JSON format:
      {
        "caption": "Post caption with hashtags...",
        "slides": [
            { "type": "hook", "headline": "...", "body": "..." },
            { "type": "content", "headline": "...", "body": "..." },
            { "type": "cta", "headline": "...", "body": "..." }
        ]
      }`;

const ANALYST_SYSTEM_PROMPT = `Brand Quality Analyst. Review JSON content.
      Return JSON: { "overall_score": 0-100, "feedback": "...", "needs_regeneration": boolean }`;

// --- MAIN WORKFLOW ---

async function runAgent(topic: string) {
  console.log(`🚀 Starting Social Agent for topic: "${topic}"...`);

  // 1. Strategist Node
  console.log("🎯 Strategist analyzing...");
  const strategyJson = await chat([
    { role: "system", content: STRATEGIST_SYSTEM_PROMPT },
    { role: "user", content: `Create strategy for: ${topic}` }
  ]);
  
  let strategy;
  try {
    strategy = JSON.parse(strategyJson.replace(/```json|```/g, "").trim());
    console.log("✅ Strategy Hook:", strategy.hook);
  } catch (e) {
    console.error("Failed to parse Strategy JSON", strategyJson);
    return;
  }

  // 2. Copywriter Node
  console.log("✍️ Copywriter drafting...");
  const copyPrompt = `
      Topic: ${topic}
      Narrative: ${strategy.narrative_arc}
      Key Messages: ${strategy.key_messages?.join(", ")}
      Slide Count: ${strategy.slide_count}
      
      Write the carousel copy.
  `;
  
  const copyJson = await chat([
    { role: "system", content: COPYWRITER_SYSTEM_PROMPT },
    { role: "user", content: copyPrompt }
  ]);
  
  let copy;
  try {
    copy = JSON.parse(copyJson.replace(/```json|```/g, "").trim());
    console.log("✅ Copy draft complete.");
  } catch (e) {
    console.error("Failed to parse Copy JSON", copyJson);
    return;
  }

  // 3. Analyst Node (Orchestrator Check)
  console.log("🔍 Analyst reviewing...");
  const reviewJson = await chat([
    { role: "system", content: ANALYST_SYSTEM_PROMPT },
    { role: "user", content: `Content: ${JSON.stringify(copy)}` }
  ]);
  
  let review;
  try {
    review = JSON.parse(reviewJson.replace(/```json|```/g, "").trim());
    console.log(`✅ Quality Score: ${review.overall_score}/100`);
    console.log(`📝 Feedback: ${review.feedback}`);
  } catch (e) {
    console.log("Review parsing failed, skipping.");
  }

  // Final Output
  console.log("\n--- FINAL OUTPUT ---\n");
  console.log(`**Caption**:\n${copy.caption}\n`);
  console.log("--- Slides ---");
  copy.slides.forEach((slide: any, i: number) => {
    console.log(`\nSlide ${i+1} [${slide.type}]: ${slide.headline}`);
    console.log(`Body: ${slide.body}`);
    console.log(`Visual Prompt: Professional vector illustration of ${slide.headline}`);
  });
}

// CLI Args
const topic = Deno.args[0] || "Capabilities";
await runAgent(topic);
