import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Hardcoded for reliability in script
const supabaseUrl = "https://dlflpvmdzkeouhgqwqba.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUnipileData() {
  console.log("--- Checking Automation Profiles ---");
  const { data: profiles, error: profError } = await supabase
    .from("automation_profiles")
    .select("*");

  if (profError) {
    if (profError.code === "42P01") {
        console.log("Table 'automation_profiles' does not exist.");
    } else {
        console.error("Error fetching profiles:", profError);
    }
  } else {
    console.log(`Found ${profiles?.length || 0} profiles.`);
    profiles?.forEach(p => {
        console.log(`- User: ${p.user_id}, Role: ${p.role}, Unipile ID: ${p.unipile_account_id || "NONE"}`);
    });
  }

  console.log("\n--- Checking Conversations for External Account IDs ---");
  // Limit to 5 distinct IDs
  const { data: conversations, error: convError } = await supabase
    .from("conversations")
    .select("external_account_id")
    .limit(50);
    
    if (convError) {
       console.error("Error fetching conversations:", convError); 
    } else {
        const uniqueIds = [...new Set(conversations?.map(c => c.external_account_id).filter(Boolean))];
        console.log(`Found ${uniqueIds.length} unique external account IDs in recent conversations:`);
        uniqueIds.forEach(id => console.log(`- ${id}`));
    }
}

checkUnipileData();
