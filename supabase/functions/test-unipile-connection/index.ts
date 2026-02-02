import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const UNIPILE_DSN = Deno.env.get("UNIPILE_DSN") || "http://api1.unipile.com:13200";
    const UNIPILE_API_KEY = Deno.env.get("UNIPILE_API_KEY");

    if (!UNIPILE_API_KEY) {
      throw new Error("Missing UNIPILE_API_KEY");
    }

    console.log(`Testing connection to: ${UNIPILE_DSN}`);

    // Call /api/v1/accounts
    // Ensure DSN has protocol
    let dsn = UNIPILE_DSN;
    if (!dsn.startsWith("http")) dsn = `https://${dsn}`;
    // Remove trailing slash
    if (dsn.endsWith("/")) dsn = dsn.slice(0, -1);

    const url = `${dsn}/api/v1/accounts`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-KEY": UNIPILE_API_KEY,
        "Content-Type": "application/json",
      },
    });

    const status = response.status;
    const text = await response.text();
    
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        data = text;
    }

    return new Response(JSON.stringify({ 
        success: response.ok, 
        dsn: dsn, 
        status, 
        data 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
