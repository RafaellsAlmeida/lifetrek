import { CompanyAsset } from "../types.ts";

declare const Deno: any;

type SlideIntent =
  | "company_trust"
  | "quality_machines_metrology"
  | "cleanroom_iso"
  | "vet_odonto_product"
  | "generic";

interface SmartSelectionCandidate {
  assetId: string | null;
  url: string;
  name: string;
  category: string;
  score: number;
  cosine: number;
  keywordBoost: number;
  curatedBoost: number;
  reason: string;
}

export interface SmartSelectionResult {
  useAi: boolean;
  source: "real" | "rule_override" | "ai";
  score: number;
  threshold: number;
  reason: string;
  intent: SlideIntent;
  url?: string;
  assetId?: string | null;
  topCandidates: SmartSelectionCandidate[];
}

interface LoadedAsset extends CompanyAsset {
  id?: string;
  type: string;
  tags: string[];
  qualityScore: number;
  embedding?: number[];
}

const INTENT_THRESHOLDS: Record<SlideIntent, number> = {
  company_trust: 0.68,
  quality_machines_metrology: 0.66,
  cleanroom_iso: 0.64,
  vet_odonto_product: 0.62,
  generic: 0.70,
};

const CURATED_HINTS = {
  companyTrust: ["exterior", "reception", "production-overview", "office"],
  qualityMachines: ["zeiss", "cmm", "production-floor", "water-treatment", "grinding", "laser", "citizen", "cnc"],
  cleanroom: ["clean-room", "cleanroom", "iso-7", "iso 7"],
};

function normalizeText(value: string): string {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function tokenize(value: string): string[] {
  const normalized = normalizeText(value);
  return normalized
    .split(/[^a-z0-9]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

function parseVector(raw: unknown): number[] | undefined {
  if (!raw) return undefined;
  if (Array.isArray(raw)) {
    const nums = raw.map((v) => Number(v)).filter((v) => Number.isFinite(v));
    return nums.length ? nums : undefined;
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        const nums = parsed.map((v) => Number(v)).filter((v) => Number.isFinite(v));
        return nums.length ? nums : undefined;
      }
    } catch {
      // Fall through to PostgreSQL vector textual format parsing.
    }

    const cleaned = trimmed.replace(/[\[\]{}]/g, "");
    const nums = cleaned
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((v) => Number.isFinite(v));
    return nums.length ? nums : undefined;
  }

  return undefined;
}

function cosineSimilarity(a?: number[], b?: number[]): number {
  if (!a || !b || a.length === 0 || b.length === 0) return 0;
  const dim = Math.min(a.length, b.length);
  if (dim === 0) return 0;

  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < dim; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    magA += av * av;
    magB += bv * bv;
  }

  if (magA === 0 || magB === 0) return 0;
  const cosine = dot / (Math.sqrt(magA) * Math.sqrt(magB));
  return Math.max(0, Math.min(1, cosine));
}

export class AssetLoader {
  private supabase: any;
  private assets: LoadedAsset[] = [];
  private styleTemplates: any[] = [];

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  async load() {
    console.log("[ASSET_LOADER] Loading assets...");

    const { data: catalogAssets, error } = await this.supabase
      .from("product_catalog")
      .select("id, category, image_url, name, description, metadata, embedding")
      .in("category", ["facility", "equipment", "product", "asset", "template"]);

    if (error) {
      console.error("[ASSET_LOADER] Error loading product_catalog assets:", error);
    }

    const normalizedAssets: LoadedAsset[] = (catalogAssets || [])
      .filter((a: any) => Boolean(a?.image_url))
      .map((a: any) => {
        const metadata = a.metadata && typeof a.metadata === "object" ? a.metadata : {};
        const tags = Array.isArray(metadata.tags)
          ? metadata.tags.map((t: unknown) => String(t))
          : [];
        return {
          id: a.id,
          type: a.category,
          url: a.image_url,
          name: a.name,
          description: a.description,
          metadata,
          tags,
          qualityScore: Number(metadata.quality_score ?? 0.75),
          embedding: parseVector(a.embedding),
        } as LoadedAsset;
      });

    this.assets = normalizedAssets;

    // Optional table introduced by new migration. Keep function compatible if table is not present.
    const { data: embeddingRowsRaw, error: embeddingError } = await this.supabase
      .from("asset_embeddings")
      .select("asset_id, asset_url, category, tags, search_text, embedding, quality_score, active")
      .eq("active", true)
      .limit(5000);

    if (embeddingError) {
      console.warn("[ASSET_LOADER] asset_embeddings unavailable, falling back to product_catalog embeddings only.");
    } else {
      const embeddingRows: any[] = Array.isArray(embeddingRowsRaw) ? embeddingRowsRaw : [];
      const byUrl = new Map(this.assets.map((a) => [a.url, a]));
      for (const row of embeddingRows) {
        if (!row?.asset_url) continue;
        const existing = byUrl.get(row.asset_url);
        if (existing) {
          if (!existing.embedding) existing.embedding = parseVector(row.embedding);
          continue;
        }

        const name = String(row.search_text || row.asset_url.split("/").pop() || "asset");
        const tags = Array.isArray(row.tags) ? row.tags.map((t: unknown) => String(t)) : [];
        const extra: LoadedAsset = {
          id: row.asset_id || undefined,
          type: String(row.category || "asset"),
          url: row.asset_url,
          name,
          description: String(row.search_text || ""),
          tags,
          qualityScore: Number(row.quality_score ?? 0.75),
          embedding: parseVector(row.embedding),
        };
        this.assets.push(extra);
        byUrl.set(extra.url, extra);
      }
    }

    const { data: styles } = await this.supabase
      .from("style_embeddings")
      .select("template_name, style_type, description, prompt_used")
      .limit(3);

    this.styleTemplates = styles || [];

    console.log(`[ASSET_LOADER] Loaded ${this.assets.length} assets and ${this.styleTemplates.length} styles.`);
  }

  private classifyIntent(topic: string, headline: string, body: string): SlideIntent {
    const text = normalizeText(`${topic} ${headline} ${body}`);

    const has = (keywords: string[]) => keywords.some((k) => text.includes(k));

    if (has(["parceiro", "solucao completa", "solucao", "trust", "partnership", "quem somos"])) {
      return "company_trust";
    }

    if (has(["qualidade", "maquina", "maquinas", "metrologia", "zeiss", "cmm", "cnc", "usinagem", "production", "equipamento"])) {
      return "quality_machines_metrology";
    }

    if (has(["sala limpa", "clean room", "cleanroom", "iso 7", "iso", "anvisa", "fda", "compliance", "regulatorio", "regulatorio"])) {
      return "cleanroom_iso";
    }

    if (has(["vet", "veterin", "odonto", "odonto", "dental", "orthopedic", "ortoped", "implante"])) {
      return "vet_odonto_product";
    }

    return "generic";
  }

  private getPoolForIntent(intent: SlideIntent): LoadedAsset[] {
    const facility = this.assets.filter((a) => a.type === "facility");
    const equipment = this.assets.filter((a) => a.type === "equipment");
    const product = this.assets.filter((a) => a.type === "product");
    const allEligible = this.assets.filter((a) => ["facility", "equipment", "product", "asset", "template"].includes(a.type));

    switch (intent) {
      case "company_trust":
        return facility.filter((a) => {
          const n = normalizeText(a.name || "");
          return ["exterior", "reception", "production-overview", "office"].some((h) => n.includes(h));
        }).concat(facility);
      case "quality_machines_metrology":
        return equipment.concat(
          facility.filter((a) => {
            const n = normalizeText(a.name || "");
            return ["production", "water-treatment", "grinding", "laser", "cmm", "metrolog"].some((h) => n.includes(h));
          })
        );
      case "cleanroom_iso":
        return facility.filter((a) => {
          const n = normalizeText(a.name || "");
          return n.includes("clean-room") || n.includes("cleanroom") || n.includes("iso");
        });
      case "vet_odonto_product":
        return product.concat(
          facility.filter((a) => {
            const n = normalizeText(a.name || "");
            return n.includes("clean-room") || n.includes("production");
          })
        );
      case "generic":
      default:
        return allEligible;
    }
  }

  private computeKeywordBoost(intent: SlideIntent, queryText: string, asset: LoadedAsset): number {
    const queryTokens = new Set(tokenize(queryText));
    const haystack = `${asset.name || ""} ${asset.description || ""} ${(asset.tags || []).join(" ")}`;
    const assetTokens = new Set(tokenize(haystack));

    let overlap = 0;
    for (const token of queryTokens) {
      if (assetTokens.has(token)) overlap += 1;
    }

    const baseBoost = Math.min(0.12, overlap * 0.02);

    if (intent === "vet_odonto_product" && asset.type === "product") return Math.min(0.14, baseBoost + 0.03);
    if (intent === "cleanroom_iso" && asset.type === "facility") return Math.min(0.14, baseBoost + 0.02);
    return baseBoost;
  }

  private computeCuratedBoost(intent: SlideIntent, queryText: string, asset: LoadedAsset): number {
    const q = normalizeText(queryText);
    const n = normalizeText(`${asset.name || ""} ${asset.description || ""}`);

    if (
      intent === "company_trust" &&
      (q.includes("parceiro") || q.includes("solucao completa") || q.includes("solucao")) &&
      CURATED_HINTS.companyTrust.some((h) => n.includes(h))
    ) {
      return 0.12;
    }

    if (
      intent === "quality_machines_metrology" &&
      ["qualidade", "maquina", "metrologia", "zeiss", "cmm"].some((k) => q.includes(k)) &&
      CURATED_HINTS.qualityMachines.some((h) => n.includes(h))
    ) {
      return 0.10;
    }

    if (
      intent === "cleanroom_iso" &&
      ["sala limpa", "clean room", "cleanroom", "iso", "anvisa", "fda"].some((k) => q.includes(k)) &&
      CURATED_HINTS.cleanroom.some((h) => n.includes(h))
    ) {
      return 0.12;
    }

    if (
      intent === "vet_odonto_product" &&
      ["vet", "odonto", "dental", "ortoped", "implante"].some((k) => q.includes(k)) &&
      asset.type === "product"
    ) {
      return 0.08;
    }

    return 0;
  }

  private pickNonRepetitiveCandidate(
    candidates: SmartSelectionCandidate[],
    usedUrls: string[]
  ): SmartSelectionCandidate | undefined {
    if (!candidates.length) return undefined;

    const recent = new Set(usedUrls.slice(-2));
    const first = candidates[0];

    if (!recent.has(first.url)) return first;

    for (let i = 1; i < candidates.length; i++) {
      const alt = candidates[i];
      const delta = first.score - alt.score;
      if (!recent.has(alt.url) && delta <= 0.03) {
        return alt;
      }
    }

    return first;
  }

  private async generateEmbedding(input: string, dimensions = 1536): Promise<number[] | undefined> {
    const openRouterKey =
      Deno.env.get("OPENROUTER_API_KEY") ||
      Deno.env.get("OPEN_ROUTER_API_KEY") ||
      Deno.env.get("OPEN_ROUTER_API");

    if (!openRouterKey) {
      return undefined;
    }

    try {
      const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openRouterKey}`,
        },
        body: JSON.stringify({
          model: "openai/text-embedding-3-small",
          input,
          dimensions,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        console.warn(`[ASSET_LOADER] Embedding API failed: ${body}`);
        return undefined;
      }

      const data = await response.json();
      const embedding = data?.data?.[0]?.embedding;
      return parseVector(embedding);
    } catch (error) {
      console.warn("[ASSET_LOADER] Embedding generation failed, using lexical scoring only.", error);
      return undefined;
    }
  }

  async getSmartBackgroundForSlide(params: {
    slideIndex: number;
    topic?: string;
    headline?: string;
    body?: string;
    usedUrls?: string[];
    allowAiFallback?: boolean;
  }): Promise<SmartSelectionResult> {
    const topic = params.topic || "";
    const headline = params.headline || "";
    const body = params.body || "";
    const usedUrls = params.usedUrls || [];
    const allowAiFallback = params.allowAiFallback !== false;

    const intent = this.classifyIntent(topic, headline, body);
    const threshold = INTENT_THRESHOLDS[intent];
    const queryText = `${topic} ${headline} ${body}`.trim();

    const candidatePool = this.getPoolForIntent(intent);
    const dedupedPool = Array.from(new Map(candidatePool.map((a) => [a.url, a])).values());

    if (!dedupedPool.length) {
      return {
        useAi: true,
        source: "ai",
        score: 0,
        threshold,
        reason: `No internal assets available for intent=${intent}`,
        intent,
        topCandidates: [],
      };
    }

    const queryEmbedding = await this.generateEmbedding(queryText, 1536);

    const scored = dedupedPool
      .map((asset) => {
        const cosine = cosineSimilarity(queryEmbedding, asset.embedding);
        const keywordBoost = this.computeKeywordBoost(intent, queryText, asset);
        const curatedBoost = this.computeCuratedBoost(intent, queryText, asset);
        const score = Math.min(0.99, Math.max(0, cosine + keywordBoost + curatedBoost));

        const reasonParts: string[] = [];
        if (cosine > 0) reasonParts.push(`cosine=${cosine.toFixed(3)}`);
        if (keywordBoost > 0) reasonParts.push(`keyword_boost=${keywordBoost.toFixed(3)}`);
        if (curatedBoost > 0) reasonParts.push(`curated_boost=${curatedBoost.toFixed(3)}`);
        if (!reasonParts.length) reasonParts.push("lexical fallback");

        return {
          assetId: asset.id || null,
          url: asset.url,
          name: asset.name || asset.url.split("/").pop() || "asset",
          category: asset.type,
          score,
          cosine,
          keywordBoost,
          curatedBoost,
          reason: reasonParts.join(", "),
        } as SmartSelectionCandidate;
      })
      .sort((a, b) => b.score - a.score);

    const topCandidates = scored.slice(0, 6);
    const chosen = this.pickNonRepetitiveCandidate(scored, usedUrls);

    if (!chosen) {
      return {
        useAi: true,
        source: "ai",
        score: 0,
        threshold,
        reason: `No candidate selected for intent=${intent}`,
        intent,
        topCandidates,
      };
    }

    const usedCuratedOverride = chosen.curatedBoost > 0;

    if (chosen.score < threshold && allowAiFallback) {
      return {
        useAi: true,
        source: "ai",
        score: chosen.score,
        threshold,
        reason: `Top score ${chosen.score.toFixed(3)} below threshold ${threshold.toFixed(2)} for intent=${intent}`,
        intent,
        topCandidates,
      };
    }

    return {
      useAi: false,
      source: usedCuratedOverride ? "rule_override" : "real",
      score: chosen.score,
      threshold,
      reason: `Selected ${chosen.name} (${chosen.reason}) for intent=${intent}`,
      intent,
      url: chosen.url,
      assetId: chosen.assetId,
      topCandidates,
    };
  }

  getStyleReference(): string {
    return this.styleTemplates
      .map((t) => `- ${t.style_type?.toUpperCase()}: ${t.description}`)
      .join("\n");
  }

  getBrandAssetsForGen(): string[] {
    return this.assets
      .filter((a) => {
        const n = (a.name || "").toLowerCase();
        return !n.includes("logo") && !n.includes("iso") && !n.includes("badge");
      })
      .slice(0, 2)
      .map((a) => a.url)
      .filter(Boolean) as string[];
  }

  /**
   * Legacy hybrid selector based on keyword map.
   * Kept for compatibility with mode=hybrid.
   */
  getFacilityPhotoForSlide(slideIndex: number, headline: string = "", body: string = ""): string | null {
    const facilityAssets = this.assets.filter((a) => a.type === "facility" && a.url);
    if (facilityAssets.length === 0) return null;

    const combined = `${headline} ${body}`.toLowerCase();

    const keywordMap: { keywords: string[]; names: string[] }[] = [
      { keywords: ["zeiss", "cmm", "metrologia", "medicao", "dimensional", "coordenada", "inspecao"], names: ["production-floor"] },
      { keywords: ["swiss", "torneamento", "torno", "eixo", "citizen", "multi-eixo"], names: ["water-treatment", "grinding-room"] },
      { keywords: ["cnc", "usinagem", "fresagem", "dfm", "co-engenharia", "co-engineer"], names: ["production-overview", "water-treatment", "grinding-room"] },
      { keywords: ["laser", "marcacao", "rastreabilidade", "traceability"], names: ["laser-marking"] },
      { keywords: ["electropolish", "eletropolis", "superficie", "acabamento", "surface"], names: ["electropolish-line-new", "polishing-manual"] },
      { keywords: ["polimento", "polishing", "polish"], names: ["polishing-manual"] },
      { keywords: ["implante", "ortopedico", "dental", "osso", "titanium", "titanio", "peek"], names: ["clean-room-6", "clean-room-2", "cleanroom-hero"] },
      { keywords: ["sala limpa", "clean room", "cleanroom", "sala-limpa", "sanitaria"], names: ["clean-room-6", "clean-room-2", "cleanroom-hero"] },
      { keywords: ["iso", "conformidade", "qualidade", "auditoria", "validacao", "certificacao", "anvisa", "fda", "regulat"], names: ["clean-room-6", "production-floor", "clean-room-1"] },
      { keywords: ["importacao", "nacional", "resiliencia", "cadeia", "supply chain", "tco", "custo total"], names: ["exterior", "production-overview"] },
      { keywords: ["time-to-market", "prazo", "atraso", "velocidade", "lead time"], names: ["production-overview", "grinding-room"] },
    ];

    for (const { keywords, names } of keywordMap) {
      if (keywords.some((k) => combined.includes(k))) {
        for (const name of names) {
          const found = facilityAssets.find((a) => (a.name || "").toLowerCase().includes(name));
          if (found?.url) {
            console.log(`[ASSET_LOADER] Matched "${name}" for slide "${headline}"`);
            return found.url;
          }
        }
      }
    }

    const manufacturingPhotos = facilityAssets.filter((a) => {
      const n = (a.name || "").toLowerCase();
      return !n.includes("reception") && !n.includes("exterior") && !n.includes("office");
    });
    const pool = manufacturingPhotos.length > 0 ? manufacturingPhotos : facilityAssets;
    const chosen = pool[slideIndex % pool.length];
    return chosen.url ?? null;
  }

  getLogo(): string | null {
    const exact = this.assets.find((a) => a.name?.toLowerCase() === "lifetrek logo");
    if (exact) return exact.url;

    const anyLogo = this.assets.find((a) => a.name?.toLowerCase().includes("logo"));
    return anyLogo ? anyLogo.url : null;
  }

  getIsoBadge(preferredName = "iso 13485"): string | null {
    const strict = this.assets.find((a) => a.name?.toLowerCase().includes(preferredName));
    if (strict) return strict.url;

    const loose = this.assets.find(
      (a) =>
        (a.name?.toLowerCase().includes("iso") || a.description?.toLowerCase().includes("iso")) &&
        a.type === "asset"
    );

    if (loose) return loose.url;
    return null;
  }
}
