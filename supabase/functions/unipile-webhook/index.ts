import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-unipile-signature",
};

// Supabase client setup
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const type = body.type; // Unipile event type

    console.log(`Received Unipile webhook: ${type}`, JSON.stringify(body));

    // Handle 'message_created' event
    if (type === "message_created") {
      await handleMessageCreated(body);
    }
    
    // Handle 'tracking_sent' (optional, for read receipts/delivery)
    if (type === "tracking_sent") {
       // Implementation for read receipts if needed
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleMessageCreated(event: any) {
  const { data } = event;
  const { account_id, thread_id, id: message_id, content, sender_id, attachments, timestamp, provider } = data;

  // Determine channel
  // Unipile provider: LIN, GMAIL, WA, etc. -> map to our 'channel' enum
  let channel = 'email'; // Default
  if (provider === 'LIN') channel = 'linkedin';
  if (provider === 'WA') channel = 'whatsapp';

  // 1. Upsert Conversation
  // We need to fetch or create the conversation record
  // Try to find existing conversation by thread_id
  let { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select("id, lead_id")
    .eq("thread_id", thread_id)
    .single();

  if (convError && convError.code !== "PGRST116") { // Error other than 'not found'
    console.error("Error fetching conversation:", convError);
    throw convError;
  }

  // If new conversation, try to match with a Lead
  if (!conversation) {
     // Logic to matching lead (by sender ID or name)
     // Unipile usually provides participant info. For now, we create without lead connection or try to exact match
     // TODO: Enhanced lead matching logic here
  }
  
  const conversationData = {
    channel,
    external_account_id: account_id,
    thread_id,
    contact_identifier: sender_id || "unknown", // Depending on event structure
    last_message_at: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
    last_message_preview: typeof content === 'string' ? content.substring(0, 100) : "Media",
    status: 'active',
    updated_at: new Date().toISOString(),
    // TODO: Add Logic to extract name from participants list if available in event
  };

  // Upsert conversation (using thread_id as unique key)
  const { data: upsertedConv, error: upsertError } = await supabase
    .from("conversations")
    .upsert(conversationData, { onConflict: "channel, thread_id" })
    .select()
    .single();

  if (upsertError) {
      console.error("Error upserting conversation:", upsertError);
      throw upsertError;
  }
  conversation = upsertedConv;

  // 2. Insert Message
  const messageData = {
    conversation_id: conversation.id,
    external_message_id: message_id,
    content: content || "",
    content_type: attachments && attachments.length > 0 ? 'file' : 'text',
    sender_type: sender_id === account_id ? 'agent' : 'contact', // Simplistic check, refine based on account 'me' ID
    sender_identifier: sender_id,
    attachments: attachments,
    created_at: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
  };

  const { error: msgError } = await supabase
    .from("conversation_messages")
    .insert(messageData);
    
  if (msgError) {
      // Ignore unique constraint violation (duplicate webhook delivery)
      if (msgError.code !== '23505') {
          console.error("Error inserting message:", msgError);
          throw msgError;
      }
  } else {
      console.log("Message inserted successfully:", message_id);
  }
}
