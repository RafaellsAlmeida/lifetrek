const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("❌ Missing GEMINI_API_KEY environment variable.");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;

async function listModels() {
    const response = await fetch(url);
    if (!response.ok) {
        console.error("❌ Error:", response.status, await response.text());
    } else {
        const data = await response.json();
        console.log("✅ Models:", JSON.stringify(data, null, 2));
    }
}

listModels();
