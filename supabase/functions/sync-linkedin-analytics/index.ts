import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const UNIPILE_DSN = Deno.env.get("UNIPILE_DSN") || "https://api28.unipile.com:15814"; // Defaulting to the working DSN
const UNIPILE_API_KEY = Deno.env.get("UNIPILE_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Starting Daily Analytics Sync...");

    if (!UNIPILE_API_KEY) {
      throw new Error("Missing UNIPILE_API_KEY");
    }

    // 1. Setup Clients
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 2. Fetch Accounts from Unipile
    const accounts = await fetchUnipile("/api/v1/accounts");
    const items = accounts.items || accounts || [];
    
    // Find LinkedIn Account
    const targetAccount = items.find((acc: any) => 
        acc.provider === "linkedin" || (acc.type === "LINKEDIN" && acc.id)
    );

    if (!targetAccount) {
        console.log("No LinkedIn account found.");
        return new Response(JSON.stringify({ message: "No LinkedIn account found" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const accountId = targetAccount.id;
    console.log(`Syncing for account: ${targetAccount.name} (${accountId})`);

    // 3. Fetch Data
    // Connections
    const relationsData = await fetchUnipile(`/api/v1/users/${accountId}/relations?limit=1`);
    const totalConnections = relationsData?.total || 0;

    // Conversations (Snapshot)
    const chatsData = await fetchUnipile("/api/v1/chats", {
        account_id: accountId,
        limit: 50
    });
    
    const chats = chatsData?.items || [];
    const totalConvsFetched = chats.length; 
    // Note: total_convs in DB is usually meant to be 'Total Active', unread is what counts most.
    // Unipile doesn't give a total count easily without paginating all. 50 is a good sample for "Active".
    const unreadCount = chats.filter((c: any) => c.unread_count > 0).length;

    // 4. Upsert to Supabase
    const payload = {
        unipile_account_id: accountId,
        snapshot_date: new Date().toISOString().split('T')[0],
        total_connections: totalConnections,
        total_conversations: totalConvsFetched,
        unread_conversations: unreadCount,
        meta: targetAccount
    };

    const { error } = await supabase
        .from("linkedin_analytics_daily")
        .upsert(payload, { onConflict: "unipile_account_id, snapshot_date" });

    if (error) {
        throw error;
    }

    console.log("Successfully synced analytics data.");

    return new Response(JSON.stringify({ success: true, data: payload }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Sync Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function fetchUnipile(path: string, params: Record<string, string | number> = {}) {
    const url = new URL(`${UNIPILE_DSN.replace(/\/$/, "")}${path}`);
    Object.keys(params).forEach(key => url.searchParams.append(key, String(params[key])));
    
    console.log(`[Unipile] GET ${url.toString()}`);
    
    const res = await fetch(url.toString(), {
        headers: {
            "X-API-KEY": UNIPILE_API_KEY,
            "Content-Type": "application/json"
        }
    });

    if (!res.ok) {
        throw new Error(`Unipile API Error: ${res.status} ${res.statusText}`);
    }

    return await res.json();
}
