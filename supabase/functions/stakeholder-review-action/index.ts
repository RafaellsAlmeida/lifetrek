/**
 * stakeholder-review-action
 *
 * Public edge function — no JWT required (verify_jwt = false in config.toml).
 * Security is entirely token-based: each reviewer gets a UUID token that expires in 7 days.
 *
 * Supported actions (via GET query params):
 *   ?token=<uuid>&item=<item_id>&action=approve           → approve item, return HTML
 *   ?token=<uuid>&item=<item_id>&action=reject             → show rejection comment form
 *   ?token=<uuid>&action=fetch                             → return batch items as JSON
 *
 * SPA JSON actions (via POST):
 *   { token, item_id, action: "approve" }                 → approve item, return JSON
 *   { token, item_id, action: "reject", comment }         → reject item, return JSON/HTML
 *   { token, item_id, action: "edit_suggest", copy_edits }→ save copy edits, return JSON
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BRAND_BLUE = "#004F8F";
const BRAND_GREEN = "#1A7A3E";

function jsonResponse(payload: unknown, statusCode = 200): Response {
  return new Response(JSON.stringify(payload), {
    status: statusCode,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonError(error: string, statusCode = 400, extra?: Record<string, unknown>): Response {
  return jsonResponse({ error, ...extra }, statusCode);
}

// ─── HTML page helpers ────────────────────────────────────────────────────────

function htmlPage(title: string, body: string, statusCode = 200): Response {
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${title} · Lifetrek</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      background: #F4F7FA; min-height: 100vh;
      display: flex; align-items: center; justify-content: center; padding: 24px;
    }
    .card {
      background: #fff; border-radius: 12px; padding: 36px 40px;
      max-width: 520px; width: 100%;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;
    }
    .logo { font-size: 18px; font-weight: 700; color: ${BRAND_BLUE}; margin-bottom: 24px; }
    h1 { font-size: 22px; color: #1a202c; margin-bottom: 12px; }
    p  { font-size: 15px; color: #4a5568; line-height: 1.6; margin-bottom: 16px; }
    textarea {
      width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px;
      font-size: 14px; line-height: 1.5; resize: vertical; min-height: 100px;
      margin-bottom: 16px; font-family: inherit;
    }
    textarea:focus { outline: 2px solid ${BRAND_BLUE}; border-color: transparent; }
    .btn {
      display: inline-block; padding: 11px 24px; border-radius: 6px;
      font-size: 14px; font-weight: 600; text-decoration: none; cursor: pointer;
      border: none; width: 100%; text-align: center;
    }
    .btn-red   { background: #DC2626; color: #fff; }
    .btn-blue  { background: ${BRAND_BLUE}; color: #fff; }
    .btn-green { background: ${BRAND_GREEN}; color: #fff; }
    .icon { font-size: 40px; margin-bottom: 16px; }
    .subtle { font-size: 13px; color: #94a3b8; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Lifetrek Medical</div>
    ${body}
  </div>
</body>
</html>`;
  return new Response(html, {
    status: statusCode,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function errorPage(message: string, statusCode = 400): Response {
  return htmlPage("Erro", `
    <div class="icon">⚠️</div>
    <h1>Algo deu errado</h1>
    <p>${message}</p>
    <p class="subtle">Se o problema persistir, entre em contato com Rafael.</p>
  `, statusCode);
}

function formatReviewerName(reviewerEmail: string): string {
  const firstName = reviewerEmail.split("@")[0].split(".")[0] ?? reviewerEmail;
  return firstName.charAt(0).toUpperCase() + firstName.slice(1);
}

function getContentTable(contentType: string): "linkedin_carousels" | "instagram_posts" | "blog_posts" {
  return contentType === "linkedin_carousel"
    ? "linkedin_carousels"
    : contentType === "instagram_post"
      ? "instagram_posts"
      : "blog_posts";
}

function normalizeSlides(rawSlides: unknown): Array<{ index: number; headline: string; body: string }> {
  const baseSlides = Array.isArray(rawSlides)
    ? rawSlides
    : rawSlides && typeof rawSlides === "object" && Array.isArray((rawSlides as { slides?: unknown[] }).slides)
      ? (rawSlides as { slides: unknown[] }).slides
      : [];

  return baseSlides
    .map((slide, index) => {
      if (!slide || typeof slide !== "object") {
        return null;
      }

      const record = slide as Record<string, unknown>;
      const headline =
        typeof record.headline === "string" ? record.headline :
          typeof record.title === "string" ? record.title :
            typeof record.heading === "string" ? record.heading :
              typeof record.label === "string" ? record.label :
                "";
      const body =
        typeof record.body === "string" ? record.body :
          typeof record.content === "string" ? record.content :
            typeof record.text === "string" ? record.text :
              typeof record.description === "string" ? record.description :
                "";

      if (!headline.trim() && !body.trim()) {
        return null;
      }

      return {
        index,
        headline: headline.trim(),
        body: body.trim(),
      };
    })
    .filter((slide): slide is { index: number; headline: string; body: string } => slide !== null);
}

function reviewedConflictResponse(
  itemId: string,
  currentStatus: string,
  wantsJson: boolean,
): Response {
  if (wantsJson) {
    return jsonError("Este conteúdo já foi revisado.", 409, {
      data: {
        success: false,
        item_id: itemId,
        status: currentStatus,
      },
    });
  }

  return htmlPage("Já revisado", `
    <div class="icon">🔒</div>
    <h1>Conteúdo já revisado</h1>
    <p>Esta ação não pode mais ser alterada porque o conteúdo já foi revisado.</p>
    <p class="subtle">Pode fechar esta janela.</p>
  `);
}

function idempotentActionResponse(
  itemId: string,
  currentStatus: string,
  wantsJson: boolean,
): Response {
  if (wantsJson) {
    return jsonResponse({
      data: {
        success: true,
        item_id: itemId,
        status: currentStatus,
        already_reviewed: true,
      },
    });
  }

  return htmlPage("Já revisado", `
    <div class="icon">✅</div>
    <h1>Já revisado</h1>
    <p>Este conteúdo já foi revisado anteriormente.</p>
    <p class="subtle">Obrigado pelo seu tempo.</p>
  `);
}

// ─── Token validation ─────────────────────────────────────────────────────────

interface TokenRow {
  id: string;
  batch_id: string;
  reviewer_email: string;
  expires_at: string;
  last_used_at: string | null;
}

async function validateToken(
  supabase: any,
  token: string,
): Promise<{ ok: true; row: TokenRow } | { ok: false; reason: string; statusCode: number }> {
  const { data, error } = await supabase
    .from("stakeholder_review_tokens")
    .select("id, batch_id, reviewer_email, expires_at, last_used_at")
    .eq("token", token)
    .maybeSingle();

  if (error || !data) return { ok: false, reason: "Link inválido.", statusCode: 404 };

  const now = new Date();
  const expiry = new Date(data.expires_at);
  if (now > expiry) return { ok: false, reason: "Este link expirou. Peça a Rafael um novo envio.", statusCode: 410 };

  return { ok: true, row: data as TokenRow };
}

async function touchToken(supabase: any, token: string): Promise<void> {
  await supabase
    .from("stakeholder_review_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("token", token);
}

// ─── Content status updater ───────────────────────────────────────────────────

async function trySetContentApproved(
  supabase: any,
  contentType: string,
  contentId: string,
): Promise<void> {
  await supabase
    .from(getContentTable(contentType))
    .update({ status: "stakeholder_approved" })
    .eq("id", contentId);
}

async function trySetContentRejected(
  supabase: any,
  batchId: string,
  contentType: string,
  contentId: string,
): Promise<void> {
  const { data: approvedItem } = await supabase
    .from("stakeholder_review_items")
    .select("id")
    .eq("batch_id", batchId)
    .eq("content_id", contentId)
    .eq("status", "approved")
    .maybeSingle();

  if (approvedItem) return;

  await supabase
    .from(getContentTable(contentType))
    .update({ status: "stakeholder_rejected" })
    .eq("id", contentId);
}

// ─── Fetch action (returns JSON for review page) ──────────────────────────────

async function handleFetch(
  supabase: any,
  tokenRow: TokenRow,
): Promise<Response> {
  const { data: items, error } = await supabase
    .from("stakeholder_review_items")
    .select("id, batch_id, content_type, content_id, status, reviewer_comment, copy_edits, reviewed_by_email, reviewed_at")
    .eq("batch_id", tokenRow.batch_id);

  if (error) {
    return jsonError("Falha ao carregar os itens de revisão.", 500);
  }

  const enriched = await Promise.all(
    (items ?? []).map(async (item: Record<string, unknown>) => {
      const contentType = String(item.content_type);
      const contentId = String(item.content_id);
      let title = "";
      let caption = "";
      let thumbnailUrl: string | null = null;
      let slides: Array<{ index: number; headline: string; body: string }> = [];
      let content: string | null = null;

      if (contentType === "linkedin_carousel") {
        const { data } = await supabase
          .from("linkedin_carousels")
          .select("topic, caption, slides, image_urls")
          .eq("id", contentId)
          .single();

        if (data) {
          title = data.topic || "Post LinkedIn";
          caption = data.caption || "";
          thumbnailUrl = Array.isArray(data.image_urls)
            ? (data.image_urls.find((value: unknown) => typeof value === "string" && value.length > 0) ?? null)
            : null;
          slides = normalizeSlides(data.slides);
        }
      } else if (contentType === "instagram_post") {
        const { data } = await supabase
          .from("instagram_posts")
          .select("caption, slides, image_urls")
          .eq("id", contentId)
          .single();

        if (data) {
          title = "Post Instagram";
          caption = data.caption || "";
          thumbnailUrl = Array.isArray(data.image_urls)
            ? (data.image_urls.find((value: unknown) => typeof value === "string" && value.length > 0) ?? null)
            : null;
          slides = normalizeSlides(data.slides);
        }
      } else if (contentType === "blog_post") {
        const { data } = await supabase
          .from("blog_posts")
          .select("title, excerpt, hero_image_url, content")
          .eq("id", contentId)
          .single();

        if (data) {
          title = data.title || "Blog Post";
          caption = data.excerpt || "";
          thumbnailUrl = data.hero_image_url ?? null;
          slides = [];
          content = data.content ?? null;
        }
      }

      return {
        item_id: String(item.id),
        content_type: contentType,
        content_id: contentId,
        status: String(item.status),
        title,
        caption,
        thumbnail_url: thumbnailUrl,
        slides,
        content,
        reviewer_comment: item.reviewer_comment ?? null,
        copy_edits: item.copy_edits ?? null,
        reviewed_by_email: item.reviewed_by_email ?? null,
        reviewed_at: item.reviewed_at ?? null,
      };
    }),
  );

  const { data: batch } = await supabase
    .from("stakeholder_review_batches")
    .select("expires_at, notes")
    .eq("id", tokenRow.batch_id)
    .single();

  return jsonResponse({
    data: {
      reviewer_name: formatReviewerName(tokenRow.reviewer_email),
      reviewer_email: tokenRow.reviewer_email,
      expires_at: batch?.expires_at ?? tokenRow.expires_at,
      notes: batch?.notes ?? null,
      items: enriched,
    },
  });
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const url = new URL(req.url);

  if (req.method === "GET") {
    const token = url.searchParams.get("token") ?? "";
    const itemId = url.searchParams.get("item") ?? "";
    const action = url.searchParams.get("action") ?? "";
    const wantsJson = action === "fetch";

    if (!token) {
      return wantsJson ? jsonError("Token em falta.", 400) : errorPage("Token em falta.");
    }

    const validation = await validateToken(supabase, token);
    if (!validation.ok) {
      return wantsJson
        ? jsonError(validation.reason, validation.statusCode)
        : errorPage(validation.reason, validation.statusCode);
    }

    const { row: tokenRow } = validation;
    await touchToken(supabase, token);

    if (action === "fetch") {
      return handleFetch(supabase, tokenRow);
    }

    if (!itemId) return errorPage("Item em falta.");

    const { data: item, error: itemError } = await supabase
      .from("stakeholder_review_items")
      .select("id, batch_id, content_type, content_id, status")
      .eq("id", itemId)
      .eq("batch_id", tokenRow.batch_id)
      .maybeSingle();

    if (itemError || !item) return errorPage("Item de revisão não encontrado.");

    if (action === "approve") {
      if (item.status === "approved") {
        return idempotentActionResponse(itemId, "approved", false);
      }

      if (item.status !== "pending") {
        return reviewedConflictResponse(itemId, item.status, false);
      }

      await supabase
        .from("stakeholder_review_items")
        .update({
          status: "approved",
          reviewed_by_email: tokenRow.reviewer_email,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", itemId);

      await trySetContentApproved(supabase, item.content_type, item.content_id);

      return htmlPage("Aprovado!", `
        <div class="icon">✅</div>
        <h1>Conteúdo aprovado!</h1>
        <p>Obrigado, <strong>${formatReviewerName(tokenRow.reviewer_email)}</strong>. Seu feedback foi registrado com sucesso.</p>
        <p style="font-size:13px;color:#64748b;">Rafael será notificado e tomará as próximas ações de publicação.</p>
        <p class="subtle">Pode fechar esta janela.</p>
      `);
    }

    if (action === "reject") {
      if (item.status !== "pending") {
        return reviewedConflictResponse(itemId, item.status, false);
      }

      return htmlPage("Rejeitar conteúdo", `
        <div class="icon">❌</div>
        <h1>Rejeitar conteúdo</h1>
        <p>Adicione um comentário opcional explicando o motivo da rejeição.</p>
        <form method="POST" action="${supabaseUrl}/functions/v1/stakeholder-review-action">
          <input type="hidden" name="token" value="${token}" />
          <input type="hidden" name="item_id" value="${itemId}" />
          <input type="hidden" name="action" value="reject" />
          <textarea name="comment" placeholder="Ex.: O texto do slide 2 precisa ser revisado…" rows="4"></textarea>
          <button type="submit" class="btn btn-red">Confirmar rejeição</button>
        </form>
        <p class="subtle" style="margin-top:12px;text-align:center;">
          <a href="javascript:history.back()" style="color:${BRAND_BLUE};font-size:13px;">← Voltar</a>
        </p>
      `);
    }

    return errorPage("Ação desconhecida.");
  }

  if (req.method === "POST") {
    let body: Record<string, unknown>;
    const contentType = req.headers.get("content-type") ?? "";
    const wantsJson = contentType.includes("application/json");

    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      body = await req.json().catch(() => ({}));
    }

    const token = String(body.token ?? "");
    const itemId = String(body.item_id ?? "");
    const action = String(body.action ?? "");

    if (!token) {
      return wantsJson ? jsonError("Token em falta.", 400) : errorPage("Token em falta.");
    }

    const validation = await validateToken(supabase, token);
    if (!validation.ok) {
      return wantsJson
        ? jsonError(validation.reason, validation.statusCode)
        : errorPage(validation.reason, validation.statusCode);
    }

    const { row: tokenRow } = validation;
    await touchToken(supabase, token);

    if (!itemId) {
      return wantsJson ? jsonError("Item em falta.", 400) : errorPage("Item em falta.");
    }

    const { data: item, error: itemError } = await supabase
      .from("stakeholder_review_items")
      .select("id, batch_id, content_type, content_id, status")
      .eq("id", itemId)
      .eq("batch_id", tokenRow.batch_id)
      .maybeSingle();

    if (itemError || !item) {
      return wantsJson ? jsonError("Item de revisão não encontrado.", 404) : errorPage("Item de revisão não encontrado.");
    }

    if (action === "approve") {
      if (item.status === "approved") {
        return idempotentActionResponse(itemId, "approved", wantsJson);
      }

      if (item.status !== "pending") {
        return reviewedConflictResponse(itemId, item.status, wantsJson);
      }

      await supabase
        .from("stakeholder_review_items")
        .update({
          status: "approved",
          reviewed_by_email: tokenRow.reviewer_email,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", itemId);

      await trySetContentApproved(supabase, item.content_type, item.content_id);

      return wantsJson
        ? jsonResponse({ data: { success: true, status: "approved", item_id: itemId } })
        : htmlPage("Aprovado!", `
            <div class="icon">✅</div>
            <h1>Conteúdo aprovado!</h1>
            <p>Obrigado, <strong>${formatReviewerName(tokenRow.reviewer_email)}</strong>. Seu feedback foi registrado com sucesso.</p>
            <p class="subtle">Pode fechar esta janela.</p>
          `);
    }

    if (action === "reject") {
      if (item.status === "rejected") {
        return idempotentActionResponse(itemId, "rejected", wantsJson);
      }

      if (item.status !== "pending") {
        return reviewedConflictResponse(itemId, item.status, wantsJson);
      }

      const comment = String(body.comment ?? "").trim();

      await supabase
        .from("stakeholder_review_items")
        .update({
          status: "rejected",
          reviewed_by_email: tokenRow.reviewer_email,
          reviewer_comment: comment || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", itemId);

      await trySetContentRejected(supabase, item.batch_id, item.content_type, item.content_id);

      if (wantsJson) {
        return jsonResponse({
          data: {
            success: true,
            status: "rejected",
            item_id: itemId,
            reviewer_comment: comment || null,
          },
        });
      }

      return htmlPage("Feedback registrado", `
        <div class="icon">📝</div>
        <h1>Feedback registrado</h1>
        <p>Obrigado. Sua rejeição foi enviada para Rafael revisar.</p>
        ${comment ? `<p style="background:#f8fafc;padding:12px;border-radius:8px;font-size:13px;color:#374151;font-style:italic;">"${comment}"</p>` : ""}
        <p class="subtle">Pode fechar esta janela.</p>
      `);
    }

    if (action === "edit_suggest") {
      if (item.status === "edit_suggested") {
        return idempotentActionResponse(itemId, "edit_suggested", true);
      }

      if (item.status !== "pending") {
        return reviewedConflictResponse(itemId, item.status, true);
      }

      const copyEdits = body.copy_edits;
      if (!copyEdits || typeof copyEdits !== "object" || Array.isArray(copyEdits)) {
        return jsonError("copy_edits obrigatório.", 400);
      }

      await supabase
        .from("stakeholder_review_items")
        .update({
          status: "edit_suggested",
          reviewed_by_email: tokenRow.reviewer_email,
          copy_edits: copyEdits,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", itemId);

      return jsonResponse({
        data: {
          success: true,
          status: "edit_suggested",
          item_id: itemId,
        },
      });
    }

    return wantsJson ? jsonError("Ação desconhecida.", 400) : errorPage("Ação desconhecida.");
  }

  return new Response("Method not allowed", { status: 405 });
});
