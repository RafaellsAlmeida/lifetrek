import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";
import { render2D } from "../../../src/lib/engineering-drawing/render2d.ts";
import {
  createDefaultConfidenceSummary,
  createEmptySpec,
} from "../../../src/lib/engineering-drawing/types.ts";
import type {
  AxisymmetricPartSpec,
  ExtractionResult,
} from "../../../src/lib/engineering-drawing/types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

async function verifyAdmin(authHeader: string | null): Promise<boolean> {
  if (!authHeader) return false;

  try {
    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) return false;

    const { data: permissionRow } = await supabase
      .from("admin_permissions")
      .select("email")
      .eq("email", user.email ?? "")
      .maybeSingle();

    if (permissionRow) return true;

    const { data: legacyRow } = await supabase
      .from("admin_users")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    return !!legacyRow;
  } catch (error) {
    console.error("[engineering-drawing] verifyAdmin error:", error);
    return false;
  }
}

type ExtractRequest = {
  action: "extract";
  imageUrl: string;
  title?: string;
  notes?: string;
};

type RenderRequest = {
  action: "render2d";
  spec: AxisymmetricPartSpec;
};

function isExtractRequest(payload: unknown): payload is ExtractRequest {
  return !!payload && typeof payload === "object" && (payload as ExtractRequest).action === "extract";
}

function isRenderRequest(payload: unknown): payload is RenderRequest {
  return !!payload && typeof payload === "object" && (payload as RenderRequest).action === "render2d";
}

function normalizeSpec(raw: any, fallbackTitle: string): AxisymmetricPartSpec {
  const fallback = createEmptySpec(fallbackTitle);

  return {
    partName: typeof raw?.partName === "string" && raw.partName.trim() ? raw.partName.trim() : fallback.partName,
    drawingNumber: typeof raw?.drawingNumber === "string" && raw.drawingNumber.trim() ? raw.drawingNumber.trim() : null,
    unit: "mm",
    totalLengthMm: typeof raw?.totalLengthMm === "number" ? raw.totalLengthMm : null,
    segments: Array.isArray(raw?.segments)
      ? raw.segments.map((segment: any, index: number) => ({
          id: typeof segment?.id === "string" && segment.id ? segment.id : crypto.randomUUID(),
          label: typeof segment?.label === "string" && segment.label.trim() ? segment.label.trim() : `Trecho ${index + 1}`,
          kind: segment?.kind === "taper" || segment?.kind === "thread" ? segment.kind : "cylinder",
          lengthMm: typeof segment?.lengthMm === "number" ? segment.lengthMm : null,
          startDiameterMm: typeof segment?.startDiameterMm === "number" ? segment.startDiameterMm : null,
          endDiameterMm: typeof segment?.endDiameterMm === "number" ? segment.endDiameterMm : null,
          externalShape:
            segment?.externalShape === "hex" || segment?.externalShape === "square" ? segment.externalShape : "round",
          acrossFlatsMm: typeof segment?.acrossFlatsMm === "number" ? segment.acrossFlatsMm : null,
          threadDesignation:
            typeof segment?.threadDesignation === "string" && segment.threadDesignation.trim()
              ? segment.threadDesignation.trim()
              : null,
          threadPitchMm: typeof segment?.threadPitchMm === "number" ? segment.threadPitchMm : null,
          chamferStartMm: typeof segment?.chamferStartMm === "number" ? segment.chamferStartMm : null,
          chamferStartAngleDeg:
            typeof segment?.chamferStartAngleDeg === "number" ? segment.chamferStartAngleDeg : null,
          chamferEndMm: typeof segment?.chamferEndMm === "number" ? segment.chamferEndMm : null,
          chamferEndAngleDeg: typeof segment?.chamferEndAngleDeg === "number" ? segment.chamferEndAngleDeg : null,
          filletStartRadiusMm:
            typeof segment?.filletStartRadiusMm === "number" ? segment.filletStartRadiusMm : null,
          filletEndRadiusMm: typeof segment?.filletEndRadiusMm === "number" ? segment.filletEndRadiusMm : null,
          note: typeof segment?.note === "string" && segment.note.trim() ? segment.note.trim() : null,
          confidence: typeof segment?.confidence === "number" ? segment.confidence : null,
        }))
      : fallback.segments,
    axialBores: Array.isArray(raw?.axialBores)
      ? raw.axialBores.map((bore: any, index: number) => ({
          id: typeof bore?.id === "string" && bore.id ? bore.id : crypto.randomUUID(),
          label: typeof bore?.label === "string" && bore.label.trim() ? bore.label.trim() : `Furo ${index + 1}`,
          diameterMm: typeof bore?.diameterMm === "number" ? bore.diameterMm : null,
          depthMm: typeof bore?.depthMm === "number" ? bore.depthMm : null,
          startFrom: bore?.startFrom === "right" ? "right" : "left",
          confidence: typeof bore?.confidence === "number" ? bore.confidence : null,
        }))
      : [],
    notes: Array.isArray(raw?.notes) ? raw.notes.filter((note: unknown) => typeof note === "string") : [],
    unsupportedFeatures: Array.isArray(raw?.unsupportedFeatures)
      ? raw.unsupportedFeatures.map((feature: any, index: number) => ({
          id: typeof feature?.id === "string" && feature.id ? feature.id : crypto.randomUUID(),
          label:
            typeof feature?.label === "string" && feature.label.trim() ? feature.label.trim() : `Feature ${index + 1}`,
          note: typeof feature?.note === "string" && feature.note.trim() ? feature.note.trim() : "Feature fora do escopo.",
          confidence: typeof feature?.confidence === "number" ? feature.confidence : null,
        }))
      : [],
  };
}

async function extractWithAi(payload: ExtractRequest): Promise<ExtractionResult> {
  if (!lovableApiKey) {
    throw new Error("LOVABLE_API_KEY não configurada.");
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Você extrai apenas drafts estruturados de peças usinadas predominantemente axisimétricas.

Regras obrigatórias:
- Nunca invente medidas.
- Se uma medida não estiver legível, use null.
- Suporte apenas: trechos cilíndricos, taper simples, rosca métrica externa, sextavado/quadrado, furo axial simples, chanfros e raios básicos.
- Qualquer feature fora desse escopo deve ir para unsupportedFeatures.
- Todas as unidades são mm.
- Retorne JSON puro com este formato:
{
  "specDraft": {
    "partName": "string",
    "drawingNumber": "string|null",
    "unit": "mm",
    "totalLengthMm": "number|null",
    "segments": [
      {
        "label": "string",
        "kind": "cylinder|taper|thread",
        "lengthMm": "number|null",
        "startDiameterMm": "number|null",
        "endDiameterMm": "number|null",
        "externalShape": "round|hex|square",
        "acrossFlatsMm": "number|null",
        "threadDesignation": "string|null",
        "threadPitchMm": "number|null",
        "chamferStartMm": "number|null",
        "chamferStartAngleDeg": "number|null",
        "chamferEndMm": "number|null",
        "chamferEndAngleDeg": "number|null",
        "filletStartRadiusMm": "number|null",
        "filletEndRadiusMm": "number|null",
        "note": "string|null",
        "confidence": "number|null"
      }
    ],
    "axialBores": [
      {
        "label": "string",
        "diameterMm": "number|null",
        "depthMm": "number|null",
        "startFrom": "left|right",
        "confidence": "number|null"
      }
    ],
    "notes": ["string"],
    "unsupportedFeatures": [
      {
        "label": "string",
        "note": "string",
        "confidence": "number|null"
      }
    ]
  },
  "ambiguities": [
    {
      "fieldPath": "string",
      "question": "string",
      "reason": "string",
      "confidence": "number|null",
      "suggestedAction": "string|null"
    }
  ],
  "confidenceSummary": { "high": 0, "medium": 0, "low": 0 },
  "sourceSketchSummary": "string"
}
`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Título: ${payload.title ?? "Peça sem nome"}
Observações: ${payload.notes ?? "Sem observações"}
Extraia um draft técnico rigoroso e não invente medidas.`,
            },
            {
              type: "image_url",
              image_url: { url: payload.imageUrl },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Falha na extração IA (${response.status})`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  const parsed = typeof content === "string" ? JSON.parse(content) : content;
  const normalizedSpec = normalizeSpec(parsed?.specDraft, payload.title ?? "Nova peça");

  return {
    specDraft: normalizedSpec,
    ambiguities: Array.isArray(parsed?.ambiguities)
      ? parsed.ambiguities.map((ambiguity: any) => ({
          id: typeof ambiguity?.id === "string" && ambiguity.id ? ambiguity.id : crypto.randomUUID(),
          fieldPath: typeof ambiguity?.fieldPath === "string" ? ambiguity.fieldPath : "specDraft",
          question: typeof ambiguity?.question === "string" ? ambiguity.question : "Confirmar leitura do croqui.",
          reason: typeof ambiguity?.reason === "string" ? ambiguity.reason : "Ambiguidade identificada na leitura.",
          confidence: typeof ambiguity?.confidence === "number" ? ambiguity.confidence : null,
          suggestedAction:
            typeof ambiguity?.suggestedAction === "string" ? ambiguity.suggestedAction : "Revisar manualmente.",
        }))
      : [],
    confidenceSummary:
      typeof parsed?.confidenceSummary === "object" && parsed.confidenceSummary
        ? {
            high: Number(parsed.confidenceSummary.high ?? 0),
            medium: Number(parsed.confidenceSummary.medium ?? 0),
            low: Number(parsed.confidenceSummary.low ?? 0),
          }
        : createDefaultConfidenceSummary(),
    sourceSketchSummary:
      typeof parsed?.sourceSketchSummary === "string"
        ? parsed.sourceSketchSummary
        : "Extração IA concluída com revisão humana obrigatória.",
    extractionSource: "ai",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const isAdmin = await verifyAdmin(req.headers.get("authorization"));
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Unauthorized - Admin access required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();

    if (isExtractRequest(payload)) {
      const result = await extractWithAi(payload);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (isRenderRequest(payload)) {
      const result = render2D(payload.spec);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[engineering-drawing] error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown engineering drawing error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
