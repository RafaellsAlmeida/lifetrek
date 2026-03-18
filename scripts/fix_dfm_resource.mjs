import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dlflpvmdzkeouhgqwqba.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
    console.log("Fetching resource...");
    const { data, error } = await supabase
        .from("resources")
        .select("id, title, content")
        .ilike("title", "%Checklist DFM%")
        .single();

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Title:", data.title);
        console.log("Content includes \\n?", data.content.includes("\\n"));
        console.log("Raw content sample:", JSON.stringify(data.content.substring(0, 100)));
        
        if (data.content.includes("\\n")) {
            console.log("Fixing content...");
            const fixedContent = data.content.replace(/\\n/g, "\n");
            const { error: updateError } = await supabase
                .from("resources")
                .update({ content: fixedContent })
                .eq("id", data.id);
            if (updateError) console.error("Update Error:", updateError);
            else console.log("Fixed successfully in DB.");
        }
    }
}

run();
