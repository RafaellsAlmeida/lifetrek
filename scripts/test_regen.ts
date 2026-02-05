// Test regenerate-carousel-images function
const SUPABASE_URL = "https://dlflpvmdzkeouhgqwqba.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3Mjc2MDksImV4cCI6MjA4MzMwMzYwOX0.ALEISClMQTqYtDfRBVOQwm5vf7uEodqptSXyxIpRkCQ";

const carouselId = Deno.args[0] || "dd4ae665-0a13-4f4b-b2cd-73e16cf3ee3b";

console.log(`Testing regeneration for carousel: ${carouselId}`);

const response = await fetch(`${SUPABASE_URL}/functions/v1/regenerate-carousel-images`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${ANON_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ carousel_id: carouselId })
});

console.log("Response status:", response.status);

const text = await response.text();
console.log("\n=== RAW RESPONSE ===");
console.log(text.slice(0, 2000));

try {
  const data = JSON.parse(text);
  console.log("\n=== RESULT ===");
  console.log("Success:", data.success);
  console.log("Images generated:", data.images_generated);
  console.log("Duration:", data.duration_ms, "ms");
  console.log("Reference images used:", data.reference_images_used);

  if (data.logs) {
    console.log("\n=== LOGS ===");
    for (const log of data.logs.slice(-30)) {
      console.log(log);
    }
  }

  if (data.error) {
    console.log("\n=== ERROR ===");
    console.log(data.error);
  }
} catch (e) {
  console.log("Parse error:", e);
}
