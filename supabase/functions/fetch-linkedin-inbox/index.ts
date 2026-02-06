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
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const { action, chat_id, cursor } = await req.json();

    // 1. Verify User is Admin
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    // Double check admin table
    const { data: adminPerm } = await supabase
        .from("admin_permissions")
        .select("permission_level")
        .eq("email", user.email)
        .maybeSingle();
    
    // Also check legacy
    const { data: legacyAdmin } = await supabase
         .from("admin_users")
         .select("permission_level")
         .eq("user_id", user.id)
         .maybeSingle();

    if (!adminPerm && !legacyAdmin) {
         return new Response(JSON.stringify({ error: "Forbidden: Admins only" }), { status: 403, headers: corsHeaders });
    }

    // 2. Fetch Unipile Data
    if (!UNIPILE_API_KEY) {
        throw new Error("Server configuration error: Missing Unipile API Key");
    }

    // Resolve Account ID
    // TODO: support multi-account. For now, picking the first LinkedIn account found.
    const accounts = await fetchUnipile("/api/v1/accounts");
    const items = accounts.items || accounts || [];
    const targetAccount = items.find((acc: any) => 
        acc.provider === "linkedin" || acc.type === "LINKEDIN"
    );

    if (!targetAccount) {
         return new Response(JSON.stringify({ error: "No LinkedIn account connected" }), { status: 404, headers: corsHeaders });
    }

    const accountId = targetAccount.id;

    let resultData;

    if (action === "list_chats") {
        console.log(`Fetching chats for account ${accountId}`);
        resultData = await fetchUnipile("/api/v1/chats", {
            account_id: accountId,
            limit: 20,
            cursor: cursor || ""
        });
    } else if (action === "get_messages") {
        if (!chat_id) throw new Error("Missing chat_id");
        console.log(`Fetching messages for chat ${chat_id}`);
        resultData = await fetchUnipile(`/api/v1/chats/${chat_id}/messages`, {
            limit: 30,
            cursor: cursor || ""
        });
        // Messages come in reverse order usually? API documentation says "List messages in a chat"
    } else {
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(resultData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Fetch Inbox Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function fetchUnipile(path: string, params: Record<string, string | number> = {}) {
    const url = new URL(`${UNIPILE_DSN.replace(/\/$/, "")}${path}`);
    Object.keys(params).forEach(key => {
        if (params[key]) url.searchParams.append(key, String(params[key]));
    });
    
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
        throw new Error(`Unipile API Error fetching ${path}: ${res.status} | ${text}`);
    }

    return await res.json();
}
