
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { config } from "https://deno.land/std@0.168.0/dotenv/mod.ts";

// Load .env file
const env = await config({ path: ".env" });

// Map .env keys to what agents.ts expects
Deno.env.set("OPEN_ROUTER_API", env.OPEN_ROUTER_API_KEY || Deno.env.get("OPEN_ROUTER_API_KEY") || "");
Deno.env.set("SUPABASE_URL", env.SUPABASE_URL || Deno.env.get("SUPABASE_URL") || "");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", env.SUPABASE_SERVICE_ROLE_KEY || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");
Deno.env.set("GEMINI_API_KEY", env.GEMINI_API_KEY || Deno.env.get("GEMINI_API_KEY") || "");

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing Supabase credentials in .env");
    Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Dynamically import agents AFTER env vars are set
const { strategistAgent, copywriterAgent, designerAgent, brandAnalystAgent } = await import("../supabase/functions/generate-linkedin-carousel/agents.ts");
import { CarouselParams } from "../supabase/functions/generate-linkedin-carousel/types.ts";

async function run() {
    console.log("🚀 Starting Batch March 2026 Content Generation (LOCAL MODE)...");

    // 1. Load Plan
    const planFile = "tmp/march_plan.json";
    const planData = JSON.parse(await Deno.readTextFile(planFile));
    console.log(`📄 Loaded ${planData.length} items from ${planFile}`);

    // 2. Fetch Admin User ID
    console.log("🔍 Fetching an admin user ID...");
    const { data: adminUser, error: adminError } = await supabase
        .from("admin_users")
        .select("id")
        .limit(1)
        .single();

    let adminUserId = adminUser?.id;

    if (adminError || !adminUserId) {
        console.warn("⚠️ Could not find an admin user in admin_users table. Fetching from auth...");
        const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
        if (authError || !users || users.length === 0) {
            console.error("❌ Could not list auth users either:", authError);
            Deno.exit(1);
        }
        adminUserId = users[0].id;
        console.log(`⚠️ Using auth user ID: ${adminUserId} (${users[0].email})`);
    }

    let successCount = 0;

    for (let i = 0; i < planData.length; i++) {
        const content = planData[i];
        console.log(`\n--------------------------------------------------`);
        console.log(`🎯 [${i + 1}/${planData.length}] Topic: ${content.topic}`);
        console.log(`👤 Audience: ${content.targetAudience}`);

        try {
            const params: CarouselParams = {
                topic: content.topic,
                targetAudience: content.targetAudience,
                painPoint: content.painPoint,
                desiredOutcome: content.desiredOutcome,
                ctaAction: content.ctaAction,
                profileType: "company",
                format: "carousel",
                researchLevel: "light"
            };

            // Multi-Agent Pipeline Execution
            console.log("WAITING for Strategist...");
            const strategy = await strategistAgent(params, supabase);

            console.log("WAITING for Copywriter...");
            const copy = await copywriterAgent(params, strategy);

            console.log("WAITING for Designer...");
            const images = await designerAgent(supabase, params, copy);

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
                    target_audience: content.targetAudience,
                    pain_point: content.painPoint,
                    desired_outcome: content.desiredOutcome,
                    admin_user_id: adminUserId,
                    scheduled_at: content.date ? new Date(content.date).toISOString() : null,
                    generation_metadata: {
                        review,
                        strategy,
                        params,
                        mode: "local_batch_execution",
                        plan_date: content.date
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
            console.error("❌ Exception during generation:", err instanceof Error ? err.message : String(err));
        }

        // Wait 3 seconds between calls to avoid rate limits
        if (i < planData.length - 1) {
            console.log("⏳ Cooling down for 3s...");
            await new Promise(r => setTimeout(r, 3000));
        }
    }

    console.log(`\n✨ Finished. Successfully generated ${successCount}/${planData.length} items.`);
}

run();
