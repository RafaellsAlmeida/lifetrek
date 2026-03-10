/**
 * stakeholder-review-action
 *
 * Public edge function — no JWT required (verify_jwt = false in config.toml).
 * Security is entirely token-based: each reviewer gets a UUID token that expires in 7 days.
 *
 * Supported actions (via GET query params):
 *   ?token=<uuid>&item=<item_id>&action=approve           → approve item, return HTML
 *   ?token=<uuid>&item=<item_id>&action=reject             → show rejection comment form
 *   ?token=<uuid>&item=<item_id>&action=fetch              → return batch items as JSON
 *
 * Reject form POST:
 *   POST body: { token, item_id, action: "reject", comment: string }
 *
 * Edit-suggest POST:
 *   POST body: { token, item_id, action: "edit_suggest", copy_edits: object }
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BRAND_BLUE  = "#004F8F";
const BRAND_GREEN = "#1A7A3E";

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

// ─── Token validation ─────────────────────────────────────────────────────────

interface TokenRow {
  id: string;
  batch_id: string;
  reviewer_email: string;
  expires_at: string;
  last_used_at: string | null;
}

async function validateToken(
  supabase: ReturnType<typeof createClient>,
  token: string,
): Promise<{ ok: true; row: TokenRow } | { ok: false; reason: string }> {
  const { data, error } = await supabase
    .from("stakeholder_review_tokens")
    .select("id, batch_id, reviewer_email, expires_at, last_used_at")
    .eq("token", token)
    .maybeSingle();

  if (error || !data) return { ok: false, reason: "Token inválido." };

  const now = new Date();
  const expiry = new Date(data.expires_at);
  if (now > expiry) return { ok: false, reason: "Este link expirou. Peça a Rafael um novo envio." };

  return { ok: true, row: data as TokenRow };
}

// ─── Content status updater ───────────────────────────────────────────────────

async function trySetContentApproved(
  supabase: ReturnType<typeof createClient>,
  batchId: string,
  contentType: string,
  contentId: string,
): Promise<void> {
  // Only set stakeholder_approved if no other approved item exists for this content
  // (avoid downgrading if someone already approved via a different reviewer)
  const { data: existing } = await supabase
    .from("stakeholder_review_items")
    .select("id")
    .eq("batch_id", batchId)
    .eq("content_id", contentId)
    .eq("status", "approved")
    .maybeSingle();

  if (existing) return; // already approved by another reviewer — skip

  const table =
    contentType === "linkedin_carousel" ? "linkedin_carousels" :
    contentType === "instagram_post"    ? "instagram_posts" :
                                          "blog_posts";

  await supabase.from(table).update({ status: "stakeholder_approved" }).eq("id", contentId);
}

async function trySetContentRejected(
  supabase: ReturnType<typeof createClient>,
  batchId: string,
  contentType: string,
  contentId: string,
): Promise<void> {
  // Only reject if no approved item exists for this content in this batch
  const { data: approvedItem } = await supabase
    .from("stakeholder_review_items")
    .select("id")
    .eq("batch_id", batchId)
    .eq("content_id", contentId)
    .eq("status", "approved")
    .maybeSingle();

  if (approvedItem) return; // first approval wins — do not downgrade to rejected

  const table =
    contentType === "linkedin_carousel" ? "linkedin_carousels" :
    contentType === "instagram_post"    ? "instagram_posts" :
                                          "blog_posts";

  await supabase.from(table).update({ status: "stakeholder_rejected" }).eq("id", contentId);
}

// ─── Fetch action (returns JSON for review page) ──────────────────────────────

async function handleFetch(
  supabase: ReturnType<typeof createClient>,
  tokenRow: TokenRow,
): Promise<Response> {
  const { data: items, error } = await supabase
    .from("stakeholder_review_items")
    .select("id, content_type, content_id, status, reviewer_comment, copy_edits")
    .eq("batch_id", tokenRow.batch_id);

  if (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch items" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Enrich each item with content data
  const enriched = await Promise.all(
    (items ?? []).map(async (item: Record<string, unknown>) => {
      let title = "", caption = "", thumbnail_url = null, slides: unknown[] = [];

      if (item.content_type === "linkedin_carousel") {
        const { data } = await supabase
          .from("linkedin_carousels")
          .select("topic, caption, slides, image_urls")
          .eq("id", item.content_id)
          .single();
        if (data) {
          title = data.topic;
          caption = data.caption;
          thumbnail_url = Array.isArray(data.image_urls) ? data.image_urls[0] : null;
          slides = Array.isArray(data.slides) ? data.slides : [];
        }
      } else if (item.content_type === "instagram_post") {
        const { data } = await supabase
          .from("instagram_posts")
          .select("caption, slides, image_urls")
          .eq("id", item.content_id)
          .single();
        if (data) {
          title = "Post Instagram";
          caption = data.caption;
          thumbnail_url = Array.isArray(data.image_urls) ? data.image_urls[0] : null;
          slides = Array.isArray(data.slides) ? data.slides : [];
        }
      } else if (item.content_type === "blog_post") {
        const { data } = await supabase
          .from("blog_posts")
          .select("title, excerpt, hero_image_url")
          .eq("id", item.content_id)
          .single();
        if (data) {
          title = data.title;
          caption = data.excerpt;
          thumbnail_url = data.hero_image_url;
        }
      }

      return { ...item, title, caption, thumbnail_url, slides };
    })
  );

  const { data: batch } = await supabase
    .from("stakeholder_review_batches")
    .select("expires_at, notes")
    .eq("id", tokenRow.batch_id)
    .single();

  return new Response(
    JSON.stringify({
      data: {
        reviewer_email: tokenRow.reviewer_email,
        expires_at: batch?.expires_at,
        notes: batch?.notes,
        items: enriched,
      },
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl        = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase           = createClient(supabaseUrl, supabaseServiceKey);

  const url = new URL(req.url);

  // ── GET requests (from email links) ────────────────────────────────────────
  if (req.method === "GET") {
    const token  = url.searchParams.get("token") ?? "";
    const itemId = url.searchParams.get("item") ?? "";
    const action = url.searchParams.get("action") ?? "";

    if (!token) return errorPage("Token em falta.");

    const validation = await validateToken(supabase, token);
    if (!validation.ok) {
      return errorPage(validation.reason);
    }
    const { row: tokenRow } = validation;

    // Update last_used_at
    await supabase
      .from("stakeholder_review_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("token", token);

    if (action === "fetch") {
      return handleFetch(supabase, tokenRow);
    }

    if (!itemId) return errorPage("Item em falta.");

    // Fetch the review item
    const { data: item, error: itemError } = await supabase
      .from("stakeholder_review_items")
      .select("id, batch_id, content_type, content_id, status")
      .eq("id", itemId)
      .eq("batch_id", tokenRow.batch_id)
      .maybeSingle();

    if (itemError || !item) return errorPage("Item de revisão não encontrado.");

    if (action === "approve") {
      if (item.status === "approved") {
        return htmlPage("Já aprovado", `
          <div class="icon">✅</div>
          <h1>Já aprovado</h1>
          <p>Você já aprovou este conteúdo anteriormente.</p>
          <p class="subtle">Obrigado pelo seu tempo!</p>
        `);
      }

      await supabase
        .from("stakeholder_review_items")
        .update({ status: "approved", reviewed_by_email: tokenRow.reviewer_email, reviewed_at: new Date().toISOString() })
        .eq("id", itemId);

      await trySetContentApproved(supabase, item.batch_id, item.content_type, item.content_id);

      const reviewerFirstName = tokenRow.reviewer_email.split("@")[0].split(".")[0];
      const name = reviewerFirstName.charAt(0).toUpperCase() + reviewerFirstName.slice(1);

      return htmlPage("Aprovado!", `
        <div class="icon">✅</div>
        <h1>Conteúdo aprovado!</h1>
        <p>Obrigado, <strong>${name}</strong>. Seu feedback foi registrado com sucesso.</p>
        <p style="font-size:13px;color:#64748b;">Rafael será notificado e tomará as próximas ações de publicação.</p>
        <p class="subtle">Pode fechar esta janela.</p>
      `);
    }

    if (action === "reject") {
      // Show rejection form
      const reviewUrl = url.toString().replace("action=reject", "action=reject_form");
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

  // ── POST requests (form submissions) ───────────────────────────────────────
  if (req.method === "POST") {
    let body: Record<string, unknown>;

    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      body = await req.json().catch(() => ({}));
    }

    const token  = String(body.token ?? "");
    const itemId = String(body.item_id ?? "");
    const action = String(body.action ?? "");

    if (!token) return errorPage("Token em falta.");

    const validation = await validateToken(supabase, token);
    if (!validation.ok) return errorPage(validation.reason);
    const { row: tokenRow } = validation;

    await supabase
      .from("stakeholder_review_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("token", token);

    if (!itemId) return errorPage("Item em falta.");

    const { data: item, error: itemError } = await supabase
      .from("stakeholder_review_items")
      .select("id, batch_id, content_type, content_id, status")
      .eq("id", itemId)
      .eq("batch_id", tokenRow.batch_id)
      .maybeSingle();

    if (itemError || !item) return errorPage("Item de revisão não encontrado.");

    if (action === "reject") {
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

      return htmlPage("Feedback registrado", `
        <div class="icon">📝</div>
        <h1>Feedback registrado</h1>
        <p>Obrigado. Sua rejeição foi enviada para Rafael revisar.</p>
        ${comment ? `<p style="background:#f8fafc;padding:12px;border-radius:8px;font-size:13px;color:#374151;font-style:italic;">"${comment}"</p>` : ""}
        <p class="subtle">Pode fechar esta janela.</p>
      `);
    }

    if (action === "edit_suggest") {
      const copyEdits = body.copy_edits;
      if (!copyEdits || typeof copyEdits !== "object") {
        return new Response(JSON.stringify({ error: "copy_edits required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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

      return new Response(
        JSON.stringify({ data: { ok: true, message: "Sugestão de edição salva." } }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return errorPage("Ação desconhecida.");
  }

  return new Response("Method not allowed", { status: 405 });
});
