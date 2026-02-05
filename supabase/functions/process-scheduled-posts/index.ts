import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");
    const isCronAuth = authHeader === `Bearer ${cronSecret}`;

    if (!isCronAuth && cronSecret) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { 
            status: 401, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
    }

    console.log("Checking for scheduled posts to publish...");

    const now = new Date().toISOString();
    const results = [];

    // 1. Process LinkedIn Carousels
    const { data: linkedinToPublish, error: liError } = await supabase
        .from("linkedin_carousels")
        .select("id, topic")
        .eq("status", "scheduled")
        .lte("scheduled_date", now);

    if (liError) throw liError;

    for (const item of linkedinToPublish || []) {
        console.log(`Publishing LinkedIn Carousel: ${item.topic}`);
        // Here we would call Unipile or LinkedIn API
        const { error: updateError } = await supabase
            .from("linkedin_carousels")
            .update({ 
                status: "published",
                updated_at: now
            })
            .eq("id", item.id);
        
        if (updateError) console.error(`Failed to update ${item.id}:`, updateError);
        results.push({ type: "linkedin", id: item.id, status: updateError ? "failed" : "published" });
    }

    // 2. Process Instagram Posts
    const { data: instagramToPublish, error: igError } = await (supabase
        .from("instagram_posts" as any)
        .select("id, topic")
        .eq("status", "scheduled")
        .lte("scheduled_date", now) as any);

    if (!igError) {
        for (const item of instagramToPublish || []) {
            console.log(`Publishing Instagram Post: ${item.topic}`);
            await supabase
                .from("instagram_posts" as any)
                .update({ status: "published", updated_at: now })
                .eq("id", item.id);
            results.push({ type: "instagram", id: item.id, status: "published" });
        }
    }

    // 3. Process Blog Posts
    const { data: blogsToPublish, error: blogError } = await supabase
        .from("blog_posts")
        .select("id, title")
        .eq("status", "scheduled")
        .lte("scheduled_date", now);

    if (!blogError) {
        for (const item of blogsToPublish || []) {
            console.log(`Publishing Blog Post: ${item.title}`);
            await supabase
                .from("blog_posts")
                .update({ status: "published", published_at: now })
                .eq("id", item.id);
            results.push({ type: "blog", id: item.id, status: "published" });
        }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed_at: now,
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error processing scheduled posts:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
