
const SUPABASE_URL = "https://dlflpvmdzkeouhgqwqba.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3Mjc2MDksImV4cCI6MjA4MzMwMzYwOX0.ALEISClMQTqYtDfRBVOQwm5vf7uEodqptSXyxIpRkCQ";

async function checkResources() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/resources?select=title,status,slug`, {
            headers: {
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!response.ok) {
            console.error("Response error:", response.status, await response.text());
            return;
        }

        const data = await response.json();
        console.log("RESOURCES_START");
        console.log(JSON.stringify(data, null, 2));
        console.log("RESOURCES_END");
    } catch (err) {
        console.error("Fetch error:", err);
    }
}

checkResources();
