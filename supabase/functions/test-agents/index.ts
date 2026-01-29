
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { strategistAgent } from "./agents.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
    try {
        console.log("Testing strategistAgent...");
        const strategy = await strategistAgent({
            topic: "Test",
            targetAudience: "Test"
        }, supabase);

        return new Response(JSON.stringify(strategy), { headers: { "Content-Type": "application/json" } });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message, stack: error.stack }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
});
