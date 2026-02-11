
// ─── Environment Variables ──────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || "https://dlflpvmdzkeouhgqwqba.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ACCESS_TOKEN;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

if (!SUPABASE_KEY || !OPENROUTER_KEY) {
    console.error("❌ Missing env vars: SUPABASE_SERVICE_ROLE_KEY, OPENROUTER_API_KEY");
    process.exit(1);
}

// ─── 1. AssetLoader Logic (using fetch) ─────────────────────────────────────
class AssetLoaderNode {
    constructor(url, key) {
        this.url = url;
        this.key = key;
        this.assets = [];
    }

    async load() {
        console.log("📥 Loading assets from Supabase (REST API)...");

        // Construct REST URL: 
        // /rest/v1/product_catalog?select=category,image_url,name,description,metadata&category=in.(facility,equipment,product,asset)
        const endpoint = `${this.url}/rest/v1/product_catalog`;
        const params = new URLSearchParams({
            select: "category,image_url,name,description,metadata",
            category: "in.(facility,equipment,product,asset)"
        });

        try {
            const response = await fetch(`${endpoint}?${params}`, {
                method: "GET",
                headers: {
                    "apikey": this.key,
                    "Authorization": `Bearer ${this.key}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error(`Supabase error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            this.assets = (data || []).map(a => ({
                type: a.category,
                url: a.image_url,
                name: (a.name || "").toLowerCase(),
                description: (a.description || "").toLowerCase()
            }));
            console.log(`✅ Loaded ${this.assets.length} assets.`);
            console.log("📜 Asset Inventory:", this.assets.map(a => `[${a.type}] ${a.name}`).join("\n"));

        } catch (e) {
            console.error("❌ Failed to load assets:", e.message);
        }
    }

    getIsoBadge(preferredName = "iso 13485") {
        console.log(`🔎 Looking for ISO badge (pref: "${preferredName}")...`);

        // 1. Strict match
        const strict = this.assets.find(a => a.name.includes(preferredName));
        if (strict) {
            console.log(`   ✅ Found strict match: "${strict.name}"`);
            return strict.url;
        }

        // 2. Loose match (asset type only)
        const loose = this.assets.find(a =>
            (a.name.includes("iso") || a.description.includes("iso")) &&
            a.type === "asset"
        );

        if (loose) {
            console.log(`   ⚠️ Found loose match: "${loose.name}"`);
            return loose.url;
        }

        console.log("   ❌ No ISO badge found.");
        return null;
    }
}

// ─── 2. Main Logic ──────────────────────────────────────────────────────────
async function run() {
    console.log("🚀 Starting Verification (Node.js/Fetch)...");

    const loader = new AssetLoaderNode(SUPABASE_URL, SUPABASE_KEY);
    await loader.load();

    const isoUrl = loader.getIsoBadge();

    if (!isoUrl) {
        console.error("🚨 FAILED: Could not find ISO badge. Fix logic!");
        return;
    }

    console.log(`\n✅ VERIFIED: Logic found ISO Badge URL: ${isoUrl}`);

    // 3. Test Generation (Pure AI)
    console.log("\n🎨 Testing Image Generation with this asset (OpenRouter)...");

    const prompt = `Professional LinkedIn carousel slide background. 
    Topic: Medical Device Manufacturing Quality. 
    Style: Corporate, clean, blue #004F8F. 
    Include a subtle reference to the ISO certification badge provided. 
    NO TEXT. High quality, 4K.`;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "google/gemini-2.5-flash-preview", // Fast model
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            { type: "image_url", image_url: { url: isoUrl } }
                        ]
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        const json = await response.json();
        const content = json.choices[0]?.message?.content || "";

        console.log(`   ℹ️ OpenRouter Response: ${content.slice(0, 100)}...`);
        console.log("   ✅ Successfully passed ISO Badge URL to LLM context.");

    } catch (e) {
        console.error("   ❌ Generation request failed:", e.message);
    }
}

run();
