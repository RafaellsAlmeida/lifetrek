
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dlflpvmdzkeouhgqwqba.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    console.log("Checking connection to:", SUPABASE_URL);
    try {
        const { data, error } = await supabase.from("linkedin_carousels").select("id").limit(1);
        if (error) {
            console.error("❌ Error:", error.message);
        } else {
            console.log("✅ Success! Found records:", data.length);
        }
    } catch (err) {
        console.error("❌ Unexpected error:", err);
    }
}

check();
