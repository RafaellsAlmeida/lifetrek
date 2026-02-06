
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// HARDCODED CREDENTIALS (Bypassing .env read due to EPERM)
const SUPABASE_URL = "https://dlflpvmdzkeouhgqwqba.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3Mjc2MDksImV4cCI6MjA4MzMwMzYwOX0.ALEISClMQTqYtDfRBVOQwm5vf7uEodqptSXyxIpRkCQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. Map Resource to Strategy
function getStrategyForResource(resource: any) {
    const isChecklist = resource.type?.toLowerCase().includes("checklist") || resource.title.toLowerCase().includes("checklist");
    const isGuide = resource.type?.toLowerCase().includes("guide") || resource.title.toLowerCase().includes("guia");

    // Default Strategy
    let strategy = {
        painPoint: "Inefficiency and lack of standard processes",
        desiredOutcome: "Streamlined operations and compliance",
        targetAudience: "Medical Device Manufacturers, Quality Engineers",
        ctaAction: `Comment 'RESOURCE' to get the full ${resource.title}`,
        topicHook: `Mastering ${resource.title}: A Strategic Approach`
    };

    if (isChecklist) {
        strategy.painPoint = "Fear of missing critical steps during audits or production";
        strategy.desiredOutcome = "100% Audit Readiness and Process Control";
        strategy.ctaAction = `Download the ${resource.title} (Link in Bio)`;
        strategy.topicHook = `Are you missing a step? usage of ${resource.title} explained.`;
    } else if (isGuide) {
        strategy.painPoint = "Navigating complex technical requirements without a map";
        strategy.desiredOutcome = "Deep technical mastery and competitive advantage";
        strategy.ctaAction = `Read the comprehensive guide: ${resource.title}`;
        strategy.topicHook = `Deep Dive: ${resource.title} - What you need to know.`;
    }

    // Special override based on title keywords
    if (resource.title.includes("ISO 13485")) {
        strategy.painPoint = "Non-compliance risks with ISO 13485";
        strategy.targetAudience = "QA/RA Managers, Lead Auditors";
    }
    if (resource.title.includes("Metrologia")) {
        strategy.painPoint = "Measurement uncertainty in micron-level components";
        strategy.desiredOutcome = "Sub-micron precision assurance";
        strategy.targetAudience = "Metrologists, CNC Machinists";
    }
    if (resource.title.includes("Supply Chain")) {
        strategy.painPoint = "Supply chain disruptions and volatility";
        strategy.targetAudience = "Operations Managers, Procurement Directors";
    }

    return strategy;
}

async function main() {
    console.log("🚀 Starting Intentional Content Campaign Generation...");
    console.log(`🔗 Connected to: ${SUPABASE_URL}`);

    // Fetch Resources
    const { data: resources, error } = await supabase
        .from("resources")
        .select("*")
        .eq("status", "published")
        .limit(10); // Process batch of 10

    if (error) {
        console.error("❌ Error fetching resources:", error);
        Deno.exit(1);
    }

    console.log(`📚 Found ${resources.length} active resources to promote.`);

    let successCount = 0;

    for (const resource of resources) {
        const strategy = getStrategyForResource(resource);

        console.log(`\n--------------------------------------------------`);
        console.log(`🎯 Resource: ${resource.title}`);
        console.log(`   Hook: ${strategy.topicHook}`);
        console.log(`   CTA: ${strategy.ctaAction}`);

        // Construct Payload for Edge Function
        // Using 'generate-linkedin-carousel' function
        const payload = {
            topic: strategy.topicHook,
            targetAudience: strategy.targetAudience,
            painPoint: strategy.painPoint,
            desiredOutcome: strategy.desiredOutcome,
            ctaAction: strategy.ctaAction,
            postType: "value", // Driven by value
            format: "carousel",
            selectedEquipment: [], // Let AI decide or empty
            referenceImage: "",
            scheduledDate: new Date().toISOString()
        };

        try {
            // Call Edge Function
            // Note: We use standard fetch, assuming the function is deployed
            const functionUrl = `${SUPABASE_URL}/functions/v1/generate-linkedin-carousel`;
            const response = await fetch(functionUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${SUPABASE_KEY}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const text = await response.text();
                // If 404, maybe function name changed?
                console.error(`   ❌ Generation Failed (${response.status}): ${text.substring(0, 100)}`);
            } else {
                const data = await response.json();
                const result = data.carousel || data.carousels?.[0];

                if (result) {
                    console.log(`   ✅ Content Generated! Title: "${result.topic}"`);

                    if (!result.id) {
                        // Manual Insert
                        const { error: insertError } = await supabase
                            .from("linkedin_carousels")
                            .insert({
                                topic: result.topic,
                                content: result,
                                status: 'draft',
                                // resource_id not in schema, skipping link
                            });

                        if (insertError) {
                            console.warn("   ⚠️ Could not insert into DB:", insertError.message);
                        } else {
                            console.log("   💾 Saved to Database.");
                        }
                    } else {
                        console.log(`   💾 Already Saved (ID: ${result.id})`);
                    }
                    successCount++;
                } else {
                    console.warn(`   ⚠️ Success response but no carousel data found.`);
                }
            }

        } catch (err) {
            console.error("   ❌ Exception:", err);
        }

        // Wait to avoid rate limits
        await new Promise(r => setTimeout(r, 2000));
    }

    console.log(`\n✨ Finished. Generated ${successCount}/${resources.length} campaigns.`);
}

main();
