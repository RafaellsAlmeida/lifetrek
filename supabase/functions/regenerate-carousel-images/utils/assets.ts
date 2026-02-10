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
