
const { createClient } = require('@supabase/supabase-js');
// Load dotenv if available, but we have hardcoded fallbacks
try {
    require('dotenv').config();
} catch (e) { }

// Hardcoded credentials from generate_blog_and_resource_campaign.js to ensure it runs
const SUPABASE_URL = process.env.SUPABASE_URL || "https://dlflpvmdzkeouhgqwqba.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o";

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Error: Credentials validation failed.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const payload = {
    topic: "Supplier Audit Checklist - ISO 13485 (Version B - AI Native)",
    targetAudience: "Quality Managers, Regulatory Affairs Directors, Medical Device Supply Chain Leads",
    painPoint: "Suppliers who have the ISO 13485 certificate but fail in practice (traceability gaps, hidden NCs, poor process control).",
    desiredOutcome: "A robust, validated supply chain where suppliers are true partners, not just paper-compliant. Deep system verification.",
    proofPoints: [
        "Auditors look for 'living' systems, not just manuals.",
        "Traceability must link raw material to finished device in minutes.",
        "Validation of special processes is critical for risk reduction."
    ],
    ctaAction: "Download the free 39-point Supplier Audit Checklist (Link in Bio)",
    profileType: "company",
    format: "carousel",
    researchLevel: "deep",
    style_mode: "ai-native"
};

console.log("🚀 Triggering 'generate-linkedin-carousel' for Version B (AI-Native)...");
// console.log("Payload:", JSON.stringify(payload, null, 2));

async function run() {
    try {
        const { data, error } = await supabase.functions.invoke("generate-linkedin-carousel", {
            body: payload
        });

        if (error) {
            console.error("❌ Error generating carousel:", error);
            // Check if error body has more info
            if (error && error.context) console.error("Context:", await error.context.json());
        } else {
            console.log("✅ Carousel generation triggered successfully!");
            console.log("Result:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("❌ Exception:", e);
    }
}

run();
