import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const UNIPILE_DSN = Deno.env.get("UNIPILE_DSN") || "https://api28.unipile.com:15814";
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
    
    // Connections - try multiple approaches to get accurate count
    let totalConnections = 0;
    try {
        const relationsData = await fetchUnipile(`/api/v1/users/${accountId}/relations`, { limit: 1 });
        // Unipile may return total in different fields depending on version
        totalConnections = relationsData?.total || relationsData?.total_items || 0;
        // If no total field, count from items array length (capped at limit)
        if (totalConnections === 0 && relationsData?.items) {
            // Fetch a larger batch to get a better count
            const fullRelations = await fetchUnipile(`/api/v1/users/${accountId}/relations`, { limit: 100 });
            totalConnections = fullRelations?.total || fullRelations?.total_items || (fullRelations?.items?.length || 0);
        }
        console.log(`Connections: ${totalConnections}`);
    } catch (e) {
        console.error(`Error fetching relations: ${e.message}`);
    }

    // Conversations (Snapshot) - use API total if available, otherwise count items
    let totalConvsFetched = 0;
    let unreadCount = 0;
    try {
        const chatsData = await fetchUnipile("/api/v1/chats", {
            account_id: accountId,
            limit: 50
        });
        const chats = chatsData?.items || [];
        // Use API-provided total if available, otherwise fall back to items length
        totalConvsFetched = chatsData?.total || chatsData?.total_items || chats.length;
        unreadCount = chats.filter((c: any) => c.unread_count > 0).length;
        console.log(`Chats total: ${totalConvsFetched}, Fetched: ${chats.length}, Unread: ${unreadCount}`);
    } catch (e) {
         console.error(`Error fetching chats: ${e.message}`);
    }

    // 4. Upsert to Supabase
    if (totalConnections === 0 && totalConvsFetched === 0) {
        // If everything failed, might be worth throwing or returning error
        console.warn("Partial sync: No data fetched from Unipile endpoints.");
    }

    const payload = {
        unipile_account_id: accountId,
        snapshot_date: new Date().toISOString().split('T')[0],
        total_connections: totalConnections,
        total_conversations: totalConvsFetched,
        unread_conversations: unreadCount,
        meta: targetAccount
    };
    
    // ... rest upsert logic

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
            "Content-Type": "application/json",
            "User-Agent": "Lifetrek-Bot/1.0"
        }
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Unipile API Error fetching ${url.toString()}: ${res.status} ${res.statusText} | Body: ${text}`);
    }

    return await res.json();
}
