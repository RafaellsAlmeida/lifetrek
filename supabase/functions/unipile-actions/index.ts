import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Supabase Setup
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!; // Client-like access is often enough if policies allow, but actions might need service role
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Unipile Config
const UNIPILE_DSN = Deno.env.get("UNIPILE_DSN") || "https://api28.unipile.com:15814";
const UNIPILE_API_KEY = Deno.env.get("UNIPILE_API_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, payload } = await req.json();
    
    // Authorization Check (verify user is logged in)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");
    
    // Initialize auth client to verify user
    const authClient = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    
    if (authError || !user) throw new Error("Unauthorized");

    // Route Actions
    if (action === "send_message") {
      return await handleSendMessage(payload);
    }
    
    if (action === "mark_as_read") {
        // TODO: Implement Unipile mark as read if API supports it
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    console.error("Error in unipile-actions:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleSendMessage(payload: any) {
    const { conversation_id, content, attachments } = payload;
    
    // 1. Get conversation details to know thread_id and account_id
    const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .select("external_account_id, thread_id, channel")
        .eq("id", conversation_id)
        .single();
        
    if (convError || !conversation) throw new Error("Conversation not found");
    
    // 2. Call Unipile API
    // Ensure DSN has protocol
    let dsn = UNIPILE_DSN;
    if (!dsn.startsWith("http")) dsn = `https://${dsn}`;
    
    const url = `${dsn}/api/v1/chats/${conversation.thread_id}/messages`;
    
    console.log(`Sending message to Unipile: ${url}`);
    
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "X-API-KEY": UNIPILE_API_KEY,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            text: content,
            attachments: attachments || []
        })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
        console.error("Unipile API Error:", result);
        throw new Error(result.message || "Failed to send message via Unipile");
    }
    
    // 3. Store in database (optional, webhook will also capture it, but for immediate UI feedback we might want to insert)
    // For now, we rely on the webhook to sync the sent message back, or the UI optimistic update.
    // But returning the Unipile response ID helps.
    
    return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
}
