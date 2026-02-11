import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * Sync Google Analytics 4 data to Supabase
 * 
 * Uses the GA4 Data API to fetch metrics and store in local tables.
 * Requires GA4_PROPERTY_ID and GA4_CREDENTIALS (JSON service account key) in secrets.
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const GA4_PROPERTY_ID = Deno.env.get("GA4_PROPERTY_ID") ?? "";
const GA4_CREDENTIALS = Deno.env.get("GA4_CREDENTIALS") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_SYNC_DAYS = 3;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Starting GA4 Analytics Sync...");

    if (!GA4_PROPERTY_ID || !GA4_CREDENTIALS) {
      throw new Error("Missing GA4_PROPERTY_ID or GA4_CREDENTIALS");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const accessToken = await getGoogleAccessToken();

    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date");
    const daysParam = url.searchParams.get("days");
    const requestedDays = Number.isFinite(Number(daysParam)) ? Number(daysParam) : DEFAULT_SYNC_DAYS;
    const syncDays = Math.min(Math.max(requestedDays, 1), 30);

    const targetDates = dateParam
      ? [dateParam]
      : getLastNDates(syncDays);

    const dailyColumns = await getTableColumns(supabase, "ga4_analytics_daily");
    const pageColumns = await getTableColumns(supabase, "ga4_page_analytics");
    const sourceColumns = await getTableColumns(supabase, "ga4_traffic_sources");

    const results = {
      daily: 0,
      pages: 0,
      sources: 0,
    };

    for (const targetDate of targetDates) {
      console.log(`Fetching GA4 data for ${targetDate}...`);

      // 1. Fetch Daily Overview Metrics
      const dailyMetrics = await fetchGA4Report(accessToken, {
        dateRanges: [{ startDate: targetDate, endDate: targetDate }],
        metrics: [
          { name: "totalUsers" },
          { name: "newUsers" },
          { name: "sessions" },
          { name: "engagedSessions" },
          { name: "averageSessionDuration" },
          { name: "engagementRate" },
          { name: "bounceRate" },
          { name: "screenPageViews" },
          { name: "eventCount" },
        ],
        keepEmptyRows: true,
      });

      const row = dailyMetrics.rows?.[0];
      if (row) {
        const values = row.metricValues || [];
        const dailyPayload = filterPayload({
          snapshot_date: targetDate,
          total_users: parseInt(values[0]?.value || "0"),
          new_users: parseInt(values[1]?.value || "0"),
          sessions: parseInt(values[2]?.value || "0"),
          engaged_sessions: parseInt(values[3]?.value || "0"),
          avg_session_duration_seconds: parseFloat(values[4]?.value || "0"),
          engagement_rate: parseFloat(values[5]?.value || "0"),
          bounce_rate: parseFloat(values[6]?.value || "0"),
          page_views: parseInt(values[7]?.value || "0"),
          events_count: parseInt(values[8]?.value || "0"),
        }, dailyColumns);

        const { error: dailyError } = await supabase
          .from("ga4_analytics_daily")
          .upsert(dailyPayload, { onConflict: "snapshot_date" });

        if (dailyError) console.error("Error upserting daily:", dailyError);
        else {
          results.daily += 1;
          console.log("Daily metrics saved.");
        }
      }

      // 2. Fetch Page-level Metrics
      const pageMetrics = await fetchGA4Report(accessToken, {
        dateRanges: [{ startDate: targetDate, endDate: targetDate }],
        dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
        metrics: [
          { name: "screenPageViews" },
          { name: "averageSessionDuration" },
          { name: "bounceRate" },
        ],
        limit: 50,
        keepEmptyRows: true,
      });

      const pagePayloads = (pageMetrics.rows || []).map((row: any) => filterPayload({
        snapshot_date: targetDate,
        page_path: row.dimensionValues?.[0]?.value || "/",
        page_title: row.dimensionValues?.[1]?.value || "",
        page_views: parseInt(row.metricValues?.[0]?.value || "0"),
        avg_time_on_page_seconds: parseFloat(row.metricValues?.[1]?.value || "0"),
        bounce_rate: parseFloat(row.metricValues?.[2]?.value || "0"),
      }, pageColumns));

      if (pagePayloads.length > 0) {
        const { error: pageError } = await supabase
          .from("ga4_page_analytics")
          .upsert(pagePayloads, { onConflict: "snapshot_date,page_path" });

        if (pageError) console.error("Error upserting pages:", pageError);
        else {
          results.pages += pagePayloads.length;
          console.log(`${pagePayloads.length} page metrics saved.`);
        }
      }

      // 3. Fetch Traffic Sources
      const sourceMetrics = await fetchGA4Report(accessToken, {
        dateRanges: [{ startDate: targetDate, endDate: targetDate }],
        dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "newUsers" },
          { name: "engagedSessions" },
          { name: "engagementRate" },
        ],
        limit: 50,
        keepEmptyRows: true,
      });

      const sourcePayloads = (sourceMetrics.rows || []).map((row: any) => filterPayload({
        snapshot_date: targetDate,
        source: row.dimensionValues?.[0]?.value || "(direct)",
        medium: row.dimensionValues?.[1]?.value || "(none)",
        sessions: parseInt(row.metricValues?.[0]?.value || "0"),
        users: parseInt(row.metricValues?.[1]?.value || "0"),
        new_users: parseInt(row.metricValues?.[2]?.value || "0"),
        engaged_sessions: parseInt(row.metricValues?.[3]?.value || "0"),
        engagement_rate: parseFloat(row.metricValues?.[4]?.value || "0"),
      }, sourceColumns));

      if (sourcePayloads.length > 0) {
        // Delete existing for date then insert (safer for sources with null handling)
        await supabase
          .from("ga4_traffic_sources")
          .delete()
          .eq("snapshot_date", targetDate);
        
        const { error: sourceError } = await supabase
          .from("ga4_traffic_sources")
          .insert(sourcePayloads);

        if (sourceError) console.error("Error inserting sources:", sourceError);
        else {
          results.sources += sourcePayloads.length;
          console.log(`${sourcePayloads.length} traffic sources saved.`);
        }
      }
    }

    console.log("GA4 sync completed successfully.");

    return new Response(JSON.stringify({ 
      success: true, 
      dates: targetDates,
      metrics: results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("GA4 Sync Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/**
 * Get Google OAuth2 access token from service account credentials
 */
async function getGoogleAccessToken(): Promise<string> {
  const credentials = JSON.parse(GA4_CREDENTIALS);
  if (credentials?.private_key?.includes("\\n")) {
    credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
  }
  
  // Create JWT
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const base64Header = base64urlEncode(JSON.stringify(header));
  const base64Claim = base64urlEncode(JSON.stringify(claim));
  const signatureInput = `${base64Header}.${base64Claim}`;

  // Sign with private key
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(credentials.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signatureInput)
  );

  const base64Signature = base64urlEncode(new Uint8Array(signature));

  const jwt = `${base64Header}.${base64Claim}.${base64Signature}`;

  // Exchange JWT for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text();
    throw new Error(`Failed to get access token: ${errorText}`);
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

/**
 * Fetch data from GA4 Data API
 */
async function fetchGA4Report(accessToken: string, body: any): Promise<any> {
  const propertyId = normalizePropertyId(GA4_PROPERTY_ID);
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
  
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`GA4 API Error: ${res.status} ${errorText}`);
  }

  return await res.json();
}

/**
 * Convert PEM-formatted private key to ArrayBuffer for crypto.subtle
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\n/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function base64urlEncode(input: string | Uint8Array): string {
  const base64 = typeof input === "string"
    ? btoa(input)
    : btoa(String.fromCharCode(...input));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function normalizePropertyId(rawId: string): string {
  const trimmed = rawId.trim();
  if (trimmed.includes("/")) {
    const parts = trimmed.split("/");
    return parts[parts.length - 1];
  }
  return trimmed;
}

function getLastNDates(days: number): string[] {
  const today = new Date();
  const dates: string[] = [];
  for (let i = 1; i <= days; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(date.toISOString().split("T")[0]);
  }
  return dates;
}

async function getTableColumns(
  supabase: ReturnType<typeof createClient>,
  tableName: string,
): Promise<Set<string> | null> {
  try {
    const { data, error } = await supabase
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_schema", "public")
      .eq("table_name", tableName);

    if (error || !data) {
      console.warn(`Could not fetch columns for ${tableName}:`, error?.message);
      return null;
    }

    return new Set(data.map((row: { column_name: string }) => row.column_name));
  } catch (error) {
    console.warn(`Failed to inspect columns for ${tableName}:`, error);
    return null;
  }
}

function filterPayload<T extends Record<string, unknown>>(
  payload: T,
  columns: Set<string> | null,
): Partial<T> {
  if (!columns) return payload;
  const filteredEntries = Object.entries(payload).filter(([key]) => columns.has(key));
  return Object.fromEntries(filteredEntries) as Partial<T>;
}
