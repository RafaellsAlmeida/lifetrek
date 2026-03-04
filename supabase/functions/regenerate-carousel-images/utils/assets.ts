import { createClient } from "npm:@supabase/supabase-js@2.75.0";
import { CompanyAsset } from "../types.ts";

export class AssetLoader {
    private supabase: ReturnType<typeof createClient>;
    private assets: CompanyAsset[] = [];
    private styleTemplates: any[] = [];

    constructor(supabase: ReturnType<typeof createClient>) {
        this.supabase = supabase;
    }

    async load() {
        console.log("[ASSET_LOADER] Loading assets...");

        // Fetch company assets
        const { data: catalogAssets, error } = await this.supabase
            .from("product_catalog")
            .select("category, image_url, name, description, metadata")
            .in("category", ["facility", "equipment", "product", "asset"]);

        if (error) {
            console.error("[ASSET_LOADER] Error loading assets:", error);
        }

        this.assets = (catalogAssets || []).map((a: any) => ({
            type: a.category,
            url: a.image_url,
            name: a.name,
            description: a.description,
            metadata: a.metadata
        }));

        // Fetch style templates
        const { data: styles } = await this.supabase
            .from("style_embeddings")
            .select("template_name, style_type, description, prompt_used")
            .limit(3);

        this.styleTemplates = styles || [];

        console.log(`[ASSET_LOADER] Loaded ${this.assets.length} assets and ${this.styleTemplates.length} styles.`);
    }

    getStyleReference(): string {
        return this.styleTemplates
            .map(t => `- ${t.style_type?.toUpperCase()}: ${t.description}`)
            .join('\n');
    }

    getBrandAssetsForGen(): string[] {
        // Return standard facility/equipment images for AI reference
        // Exclude logos/badges manually
        return this.assets
            .filter(a => {
                const n = (a.name || '').toLowerCase();
                return !n.includes('logo') && !n.includes('iso') && !n.includes('badge');
            })
            .slice(0, 2)
            .map(a => a.url)
            .filter(Boolean) as string[];
    }

    /**
     * Pick the most semantically relevant real facility photo for a slide.
     * Uses keyword matching on slide headline/body, falls back to slide-index rotation.
     */
    getFacilityPhotoForSlide(slideIndex: number, headline: string = '', body: string = ''): string | null {
        const facilityAssets = this.assets.filter(a => a.type === 'facility' && a.url);
        if (facilityAssets.length === 0) return null;

        const combined = `${headline} ${body}`.toLowerCase();

        // Semantic keyword map: keywords → preferred photo name fragments (in priority order)
        const keywordMap: { keywords: string[]; names: string[] }[] = [
            { keywords: ['zeiss', 'cmm', 'metrologia', 'medição', 'dimensional', 'coordenada', 'inspeção'], names: ['production-floor'] },
            { keywords: ['swiss', 'torneamento', 'torno', 'eixo', 'cincom', 'citizen', '12 eixos', 'multi-eixo'], names: ['water-treatment', 'grinding-room'] },
            { keywords: ['cnc', 'usinagem', 'fresagem', 'fresadora', 'dfm', 'co-engenharia', 'co-engineer'], names: ['production-overview', 'water-treatment', 'grinding-room'] },
            { keywords: ['laser', 'marcação', 'rastreabilidade', 'traceability'], names: ['laser-marking'] },
            { keywords: ['electropolish', 'eletropolis', 'superfície', 'acabamento', 'surface', 'tratamento'], names: ['electropolish-line-new', 'polishing-manual'] },
            { keywords: ['polimento', 'polishing', 'polish'], names: ['polishing-manual'] },
            { keywords: ['implante', 'ortopédico', 'dental', 'osso', 'titanium', 'titânio', 'peek', 'biocompatibilidade'], names: ['clean-room-6', 'clean-room-2', 'cleanroom-hero'] },
            { keywords: ['sala limpa', 'clean room', 'cleanroom', 'sala-limpa', 'sanitária'], names: ['clean-room-6', 'clean-room-2', 'cleanroom-hero'] },
            { keywords: ['iso', 'conformidade', 'qualidade', 'auditoria', 'validação', 'certificação', 'anvisa', 'fda', 'regulat'], names: ['clean-room-6', 'production-floor', 'clean-room-1'] },
            { keywords: ['importação', 'nacional', 'resiliência', 'cadeia', 'supply chain', 'tco', 'custo total'], names: ['exterior', 'production-overview'] },
            { keywords: ['time-to-market', 'prazo', 'atraso', 'velocidade', 'lead time'], names: ['production-overview', 'grinding-room'] },
        ];

        for (const { keywords, names } of keywordMap) {
            if (keywords.some(k => combined.includes(k))) {
                for (const name of names) {
                    const found = facilityAssets.find(a => (a.name || '').toLowerCase().includes(name));
                    if (found?.url) {
                        console.log(`[ASSET_LOADER] 🎯 Matched "${name}" for slide "${headline}"`);
                        return found.url;
                    }
                }
            }
        }

        // Fallback: rotate through manufacturing photos (exclude reception, exterior, office)
        const manufacturingPhotos = facilityAssets.filter(a => {
            const n = (a.name || '').toLowerCase();
            return !n.includes('reception') && !n.includes('exterior') && !n.includes('office');
        });
        const pool = manufacturingPhotos.length > 0 ? manufacturingPhotos : facilityAssets;
        const chosen = pool[slideIndex % pool.length];
        console.log(`[ASSET_LOADER] 🔄 Fallback rotation → ${chosen.name}`);
        return chosen.url ?? null;
    }

    getLogo(): string | null {
        // Prefer "Lifetrek Logo" exact match or contains "logo"
        const exact = this.assets.find(a => a.name?.toLowerCase() === "lifetrek logo");
        if (exact) return exact.url;

        const anyLogo = this.assets.find(a => a.name?.toLowerCase().includes("logo"));
        return anyLogo ? anyLogo.url : null;
    }

    getIsoBadge(preferredName = "iso 13485"): string | null {
        console.log(`[ASSET_LOADER] Looking for ISO badge (pref: ${preferredName})...`);

        // 1. Strict match on name
        const strict = this.assets.find(a => a.name?.toLowerCase().includes(preferredName));
        if (strict) {
            console.log(`[ASSET_LOADER] ✅ Found strict match: ${strict.name}`);
            return strict.url;
        }

        // 2. Loose match on "iso" but ensure it's an "asset" category (likely a badge)
        // and explicitly avoid "product" or "facility" to avoid photos OF a cleanroom with iso in description
        const loose = this.assets.find(a =>
            (a.name?.toLowerCase().includes("iso") || a.description?.toLowerCase().includes("iso")) &&
            a.type === "asset"
        );

        if (loose) {
            console.log(`[ASSET_LOADER] ⚠️ Found loose match: ${loose.name}`);
            return loose.url;
        }

        console.log("[ASSET_LOADER] ❌ No ISO badge found");
        return null;
    }
}
