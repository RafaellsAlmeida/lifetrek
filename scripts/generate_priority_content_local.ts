
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { config } from "https://deno.land/std@0.168.0/dotenv/mod.ts";
// Static imports removed to allow env loading first

// Load .env file
const env = await config({ path: ".env" });

// Map .env keys to what agents.ts expects
Deno.env.set("OPEN_ROUTER_API", env.OPEN_ROUTER_API_KEY || Deno.env.get("OPEN_ROUTER_API_KEY") || "");
Deno.env.set("SUPABASE_URL", env.SUPABASE_URL || Deno.env.get("SUPABASE_URL") || "");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", env.SUPABASE_SERVICE_ROLE_KEY || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing Supabase credentials in .env");
    Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Dynamically import agents AFTER env vars are set
const { strategistAgent, copywriterAgent, designerAgent, brandAnalystAgent } = await import("../supabase/functions/generate-linkedin-carousel/agents.ts");
// Types are used in type positions so they disappear in JS, but for TS we might need them or use 'any'. 
// Since we are running with Deno (TS), we can import types statically? 
// Actually types don't have side effects, so static import of types is fine.
import { CarouselParams } from "../supabase/functions/generate-linkedin-carousel/types.ts";

// Fetch a valid admin user ID to associate with the generated content
console.log("🔍 Fetching an admin user ID...");
const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("id")
    .limit(1)
    .single();

if (adminError || !adminUser) {
    console.error("❌ Could not find an admin user to assign content to:", adminError);
    // Fallback? Try to list users via auth API if possible, or fail.
    // Service role key allows auth admin access.
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError || !users || users.length === 0) {
        console.error("❌ Could not list auth users either:", authError);
        Deno.exit(1);
    }
    console.log(`⚠️ Using first found auth user: ${users[0].id} (${users[0].email})`);
    // We need to check if this user is in admin_users table? 
    // If the constraint is foreign key to auth.users, any user works.
    // If it's to admin_users, we need an admin.
    // Let's assume the first auth user is valid for now or try to create one if needed.
    // But usually there is at least one admin.
    // If admin_users query failed, maybe no admins exist?
    // Let's proceed with the auth user id.
}

const ADMIN_USER_ID = adminUser?.id || (await supabase.auth.admin.listUsers()).data.users[0].id;
console.log(`👤 Using Admin User ID: ${ADMIN_USER_ID}`);

const tierOneContent = [
    {
        topic: "Padrão é suficiente para todos os pacientes?",
        targetAudience: "Cirurgiões Ortopédicos, Médicos de Coluna e Recon, Gestores de OEM",
        painPoint: "Deformidades e anatomias complexas onde implantes genéricos exigem improviso cirúrgico",
        desiredOutcome: "Soluções personalizadas (engenharia + manufatura de precisão) que garantem fit anatomico e segurança",
        proofPoints: ["Usinagem CNC de precisão", "Materiais grau implante (Ti, PEEK)", "ISO 13485 / ANVISA compliant"],
        ctaAction: "Comente PERSONALIZADO para avaliar viabilidade técnica",
        profileType: "company",
        researchLevel: "light"
    }
];

async function generatePriorityContentLocal() {
    console.log("🚀 Starting Priority Tier 1 Content Generation (LOCAL MODE)...");

    let successCount = 0;

    for (const content of tierOneContent) {
        console.log(`\n--------------------------------------------------`);
        console.log(`🎯 Topic: ${content.topic}`);
        console.log(`👤 Audience: ${content.targetAudience}`);

        try {
            const params: CarouselParams = {
                ...content,
                profileType: "company",
                format: "carousel",
                researchLevel: "light"
            };

            // Multi-Agent Pipeline Execution (Local function calls)

            // 1. Strategy
            console.log("WAITING for Strategist...");
            const strategy = await strategistAgent(params, supabase);

            // 2. Copywriting
            console.log("WAITING for Copywriter...");
            const copy = await copywriterAgent(params, strategy);

            // 3. Design
            console.log("WAITING for Designer...");
            const images = await designerAgent(supabase, params, copy);

            // 4. Brand Analysis
            console.log("WAITING for Brand Analyst...");
            const review = await brandAnalystAgent(copy, images);

            // Save to database
            const { data: savedCarousel, error: dbError } = await supabase
                .from("linkedin_carousels")
                .insert({
                    topic: content.topic,
                    status: review.overall_score >= 70 ? 'pending_approval' : 'draft',
                    slides: copy.slides,
                    image_urls: images.map(img => img.image_url),
                    caption: copy.caption,
                    quality_score: review.overall_score,
                    target_audience: content.targetAudience, // Added field
                    pain_point: content.painPoint, // Added field (assuming snake_case)
                    desired_outcome: content.desiredOutcome, // Added field (assuming snake_case)
                    admin_user_id: ADMIN_USER_ID, // Use the fetched ID
                    generation_metadata: {
                        review,
                        strategy,
                        params,
                        mode: "local_script_execution"
                    }
                })
                .select()
                .single();

            if (dbError) {
                console.error("❌ DB Insert Failed:", dbError);
            } else {
                console.log(`✅ Success! Saved Carousel ID: ${savedCarousel.id}`);
                console.log(`📊 Quality Score: ${review.overall_score}`);
                successCount++;
            }

        } catch (err) {
            console.error("❌ Exception during generation:", err);
        }

        // Wait 5 seconds between calls
        console.log("⏳ Cooling down for 5s...");
        await new Promise(r => setTimeout(r, 5000));
    }

    console.log(`\n✨ Finished. Successfully generated ${successCount}/${tierOneContent.length} items.`);
}

generatePriorityContentLocal();
