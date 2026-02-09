
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { config } from "https://deno.land/std@0.168.0/dotenv/mod.ts";

const env = await config({ path: ".env" });
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || env.SUPABASE_URL;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);

const { data, error } = await supabase
    .from("linkedin_carousels")
    .select("id, topic, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

if (error) {
    console.error("Error:", error);
} else {
    console.log("Recent Carousels:");
    console.table(data);
}
