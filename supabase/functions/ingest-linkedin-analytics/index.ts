import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.75.0";
import type { Database } from "../../../src/integrations/supabase/types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ConflictPolicy = "skip" | "overwrite_period";

interface IngestRequestBody {
  csv_text?: string;
  file_name?: string;
  mode?: "validate" | "ingest";
  conflict_policy?: ConflictPolicy;
}

interface ParsedRow {
  [key: string]: string;
}

type NormalizedRow = Database["public"]["Tables"]["linkedin_analytics"]["Insert"];
type ServiceSupabaseClient = SupabaseClient<Database>;

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values.map((v) => v.replace(/\r/g, "").trim());
}

function parseCsv(csvText: string): ParsedRow[] {
  const lines = csvText
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i]);
    const row: ParsedRow = {};
    for (let j = 0; j < headers.length; j += 1) {
      row[headers[j]] = values[j] ?? "";
    }
    rows.push(row);
  }

  return rows;
}

function normalizeHeader(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function findByAliases(row: ParsedRow, aliases: string[]): string {
  const aliasSet = new Set(aliases.map(normalizeHeader));
  for (const [key, value] of Object.entries(row)) {
    if (aliasSet.has(normalizeHeader(key))) {
      return String(value ?? "").trim();
    }
  }
  return "";
}

function toInt(value: string): number {
  const cleaned = String(value || "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".")
    .replace(/[^0-9.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
}

function toRate(value: string): number | null {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const cleaned = raw
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".")
    .replace(/%/g, "")
    .replace(/[^0-9.-]/g, "");
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function parseDate(value: string): Date | null {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const ddmmyyyy = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyy) {
    const day = Number(ddmmyyyy[1]);
    const month = Number(ddmmyyyy[2]) - 1;
    const year = Number(ddmmyyyy[3]);
    const date = new Date(Date.UTC(year, month, day));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function periodOf(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function getExistingHashes(
  supabase: ServiceSupabaseClient,
  hashes: string[]
): Promise<Set<string>> {
  const existing = new Set<string>();
  const chunkSize = 200;

  for (let i = 0; i < hashes.length; i += chunkSize) {
    const chunk = hashes.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from("linkedin_analytics")
      .select("source_row_hash")
      .in("source_row_hash", chunk);

    if (error) {
      console.warn("[ingest-linkedin-analytics] existing hash lookup warning:", error.message);
      continue;
    }

    for (const row of data || []) {
      if ((row as { source_row_hash?: string }).source_row_hash) {
        existing.add((row as { source_row_hash: string }).source_row_hash);
      }
    }
  }

  return existing;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !/^Bearer\s+/i.test(authHeader)) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing Authorization bearer token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = (await req.json()) as IngestRequestBody;
    const mode = body.mode === "validate" ? "validate" : "ingest";
    const conflictPolicy: ConflictPolicy = body.conflict_policy === "overwrite_period" ? "overwrite_period" : "skip";
    const fileName = body.file_name?.trim() || null;
    const csvText = body.csv_text?.trim();

    if (!csvText) {
      return new Response(
        JSON.stringify({ success: false, error: "csv_text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsedRows = parseCsv(csvText);
    if (!parsedRows.length) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "CSV has no data rows",
          expected_columns: [
            "post date",
            "post url",
            "impressions",
            "clicks",
            "reactions",
            "comments",
            "shares",
          ],
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rejectedRows: Array<{ row_number: number; reason: string }> = [];
    const normalizedRows: NormalizedRow[] = [];

    for (let i = 0; i < parsedRows.length; i += 1) {
      const row = parsedRows[i];
      const rowNumber = i + 2;

      const postDateRaw = findByAliases(row, [
        "post date",
        "date",
        "posted_at",
        "posted at",
        "publish date",
        "data",
        "data de publicacao",
        "data de publicação",
      ]);
      const postUrl = findByAliases(row, [
        "post url",
        "url",
        "post link",
        "link",
        "url da postagem",
      ]);

      const parsedDate = parseDate(postDateRaw);
      if (!parsedDate) {
        rejectedRows.push({ row_number: rowNumber, reason: "Invalid or missing post date" });
        continue;
      }
      if (!postUrl) {
        rejectedRows.push({ row_number: rowNumber, reason: "Missing post url" });
        continue;
      }

      const impressions = toInt(findByAliases(row, ["impressions", "impressões", "views", "visualizacoes", "visualizações"]));
      const clicks = toInt(findByAliases(row, ["clicks", "cliques"]));
      const reactions = toInt(findByAliases(row, ["reactions", "likes", "reações", "curtidas"]));
      const comments = toInt(findByAliases(row, ["comments", "comentarios", "comentários"]));
      const shares = toInt(findByAliases(row, ["shares", "compartilhamentos", "reposts"]));
      const engagementRate = toRate(findByAliases(row, ["engagement rate", "engagement_rate", "taxa de engajamento"]));
      const ctr = toRate(findByAliases(row, ["ctr", "click through rate", "taxa de clique"]));
      const postIdRaw = findByAliases(row, ["post id", "post_id", "id da postagem"]);
      const isoDate = parsedDate.toISOString().slice(0, 10);

      const hashInput = [
        isoDate,
        postUrl,
        impressions,
        clicks,
        reactions,
        comments,
        shares,
      ].join("|");
      const rowHash = await sha256Hex(hashInput);

      normalizedRows.push({
        uploaded_period: periodOf(parsedDate),
        posted_at: isoDate,
        post_url: postUrl,
        post_id: postIdRaw || null,
        impressions,
        clicks,
        reactions,
        comments,
        shares,
        engagement_rate: engagementRate,
        ctr,
        source_file_name: fileName,
        source_row_hash: rowHash,
        raw_payload: row,
        ingested_by: user.id,
      });
    }

    const periods = Array.from(new Set(normalizedRows.map((row) => row.uploaded_period)));
    const duplicatePeriods: string[] = [];

    if (periods.length) {
      const { data: periodRows, error: periodError } = await supabase
        .from("linkedin_analytics")
        .select("uploaded_period")
        .in("uploaded_period", periods)
        .limit(5000);

      if (!periodError) {
        const existingPeriods = new Set((periodRows || []).map((r) => (r as { uploaded_period: string }).uploaded_period));
        duplicatePeriods.push(...periods.filter((p) => existingPeriods.has(p)));
      }
    }

    if (mode === "validate") {
      return new Response(
        JSON.stringify({
          success: true,
          mode,
          expected_columns: [
            "post date",
            "post url",
            "impressions",
            "clicks",
            "reactions",
            "comments",
            "shares",
            "engagement rate",
            "ctr",
            "post id",
          ],
          rows_total: parsedRows.length,
          accepted_count: normalizedRows.length,
          rejected_count: rejectedRows.length,
          rejected_rows: rejectedRows.slice(0, 200),
          periods_detected: periods,
          duplicate_periods: duplicatePeriods,
          policy_hint: "Use conflict_policy=overwrite_period to replace existing period rows.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!normalizedRows.length) {
      return new Response(
        JSON.stringify({
          success: false,
          mode,
          error: "No valid rows to ingest",
          rows_total: parsedRows.length,
          accepted_count: 0,
          rejected_count: rejectedRows.length,
          rejected_rows: rejectedRows.slice(0, 200),
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let rowsToInsert = normalizedRows;
    let skippedAsDuplicateHash = 0;
    let deletedForOverwrite = 0;

    if (conflictPolicy === "overwrite_period" && periods.length) {
      const { data: deleteRows, error: deleteError } = await supabase
        .from("linkedin_analytics")
        .delete()
        .in("uploaded_period", periods)
        .select("id");
      if (deleteError) {
        throw new Error(`Failed to apply overwrite policy: ${deleteError.message}`);
      }
      deletedForOverwrite = (deleteRows || []).length;
    } else {
      const existingHashes = await getExistingHashes(
        supabase,
        normalizedRows.map((row) => row.source_row_hash)
      );
      rowsToInsert = normalizedRows.filter((row) => !existingHashes.has(row.source_row_hash));
      skippedAsDuplicateHash = normalizedRows.length - rowsToInsert.length;
    }

    let insertedCount = 0;
    if (rowsToInsert.length) {
      const { data: insertedRows, error: insertError } = await supabase
        .from("linkedin_analytics")
        .insert(rowsToInsert)
        .select("id");

      if (insertError) {
        throw new Error(`Failed to insert analytics rows: ${insertError.message}`);
      }
      insertedCount = (insertedRows || []).length;
    }

    return new Response(
      JSON.stringify({
        success: true,
        mode,
        conflict_policy: conflictPolicy,
        rows_total: parsedRows.length,
        accepted_count: normalizedRows.length,
        rejected_count: rejectedRows.length,
        inserted_count: insertedCount,
        skipped_duplicate_hash_count: skippedAsDuplicateHash,
        deleted_for_overwrite_count: deletedForOverwrite,
        rejected_rows: rejectedRows.slice(0, 200),
        periods_detected: periods,
        duplicate_periods: duplicatePeriods,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ingest-linkedin-analytics] error:", error);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
