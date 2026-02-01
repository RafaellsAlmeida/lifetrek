
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const env = await load();
const supabase = createClient(
  env["SUPABASE_URL"] || Deno.env.get("SUPABASE_URL")!,
  env["SUPABASE_SERVICE_ROLE_KEY"] || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const slug = 'guia-metrologia-3d-cnc-swiss';
console.log(`🔎 Verifying resource: ${slug}...`);

const { data, error } = await supabase
  .from('resources')
  .select('id, title, status')
  .eq('slug', slug)
  .single();

if (error) {
  console.error("❌ Not found or error:", error);
} else {
  console.log("✅ VERIFIED: Resource exists!");
  console.log(JSON.stringify(data, null, 2));
}
