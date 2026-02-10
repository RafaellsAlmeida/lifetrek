/**
 * Trigger Slide-by-Slide Regeneration
 * Bypasses WORKER_LIMIT by calling the Edge Function for one slide at a time.
 */

const SUPABASE_URL = "https://dlflpvmdzkeouhgqwqba.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3Mjc2MDksImV4cCI6MjA4MzMwMzYwOX0.ALEISClMQTqYtDfRBVOQwm5vf7uEodqptSXyxIpRkCQ";
const carouselId = "3addfff1-f913-4774-87f0-bca4d09d5c5e";

async function triggerSlide(index) {
    console.log(`\n📸 Triggering Slide ${index}...`);
    const response = await fetch(`${SUPABASE_URL}/functions/v1/regenerate-carousel-images`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${ANON_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            carousel_id: carouselId,
            slide_index: index,
            mode: "hybrid"
        }),
    });

    const data = await response.json();
    if (data.success) {
        console.log(`   ✅ Slide ${index} generated successfully.`);
    } else {
        console.error(`   ❌ Slide ${index} failed:`, data.error || data.message);
    }
}

async function run() {
    for (let i = 0; i < 5; i++) {
        await triggerSlide(i);
    }
    console.log("\n🏁 All slides processed.");
}

run().catch(console.error);
