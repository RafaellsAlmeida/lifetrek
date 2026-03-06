import type { APIRequestContext } from "@playwright/test";

export function getSupabaseUrl(): string {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!url) throw new Error("VITE_SUPABASE_URL is not set");
  return url;
}

export function getSupabaseHeaders(accessToken?: string): Record<string, string> {
  const anonKey =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";
  const bearer = accessToken || anonKey;

  return {
    apikey: anonKey,
    Authorization: `Bearer ${bearer}`,
    "Content-Type": "application/json",
  };
}

export async function supabaseSelect(
  request: APIRequestContext,
  table: string,
  params: Record<string, string> = {},
  accessToken?: string
) {
  const url = new URL(`${getSupabaseUrl()}/rest/v1/${table}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const response = await request.get(url.toString(), {
    headers: getSupabaseHeaders(accessToken),
  });

  return { status: response.status(), body: await response.json() };
}

export async function supabaseInsert(
  request: APIRequestContext,
  table: string,
  data: Record<string, unknown>,
  accessToken?: string
) {
  const response = await request.post(`${getSupabaseUrl()}/rest/v1/${table}`, {
    headers: {
      ...getSupabaseHeaders(accessToken),
      Prefer: "return=representation",
    },
    data,
  });

  return { status: response.status(), body: await response.json() };
}

export async function supabaseDelete(
  request: APIRequestContext,
  table: string,
  params: Record<string, string>,
  accessToken?: string
) {
  const url = new URL(`${getSupabaseUrl()}/rest/v1/${table}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const response = await request.delete(url.toString(), {
    headers: getSupabaseHeaders(accessToken),
  });

  return { status: response.status() };
}
