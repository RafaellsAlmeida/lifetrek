import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";
import { Resend } from "npm:resend@2.0.0";

import {
  buildStakeholderReviewEmail,
  resolveStakeholderEmails,
  type StakeholderContentType,
  type StakeholderEmailItem,
} from "../_shared/stakeholderReviewEmail.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PostRef {
  content_type: StakeholderContentType;
  content_id: string;
}

interface PostData {
  ref: PostRef;
  title: string;
  caption: string;
  thumbnail_url: string | null;
  status: string | null;
}

interface SendStakeholderReviewRequest {
  post_refs?: PostRef[];
  notes?: string;
  dry_run?: boolean;
}

function jsonResponse(payload: unknown, statusCode = 200): Response {
  return new Response(JSON.stringify(payload), {
    status: statusCode,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonError(
  error: string,
  statusCode = 400,
  extra?: Record<string, unknown>,
): Response {
  return jsonResponse({ error, ...extra }, statusCode);
}

function hasAdminApprovedStatus(status: string | null | undefined): boolean {
  return status === "approved" || status === "admin_approved";
}

function contentTableFromType(
  contentType: StakeholderContentType,
): "linkedin_carousels" | "instagram_posts" | "blog_posts" {
  if (contentType === "linkedin_carousel") return "linkedin_carousels";
  if (contentType === "instagram_post") return "instagram_posts";
  return "blog_posts";
}

function normalizeText(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function firstSentence(value: string, maxLength = 180): string {
  const normalized = normalizeText(value);
  if (!normalized) return "";

  const sentenceMatch = normalized.match(/^(.+?[.!?])\s/);
  const candidate = sentenceMatch?.[1] || normalized;
  return candidate.length <= maxLength
    ? candidate
    : `${candidate.slice(0, maxLength - 1).trimEnd()}…`;
}

function buildValueForProspects(post: PostData): string {
  const candidate = firstSentence(post.caption || post.title);
  if (candidate) return candidate;

  if (post.ref.content_type === "blog_post") {
    return "Ajuda o prospect a avaliar o tema com critérios técnicos antes de avançar.";
  }

  return "Ajuda o prospect a entender o ponto central do conteúdo antes da publicação.";
}

function buildCorrectedRisks(post: PostData): string[] {
  if (post.ref.content_type === "blog_post") {
    return [
      "Texto revisado para reduzir promessas amplas ou claims sem evidência.",
      "Resumo ajustado para manter valor técnico sem overclaim.",
    ];
  }

  if (post.ref.content_type === "linkedin_carousel") {
    return [
      "Legenda e estrutura revisadas para manter a promessa técnica sob controle.",
      "A decisão foi movida para a página de revisão, preservando comentário e rastreabilidade.",
    ];
  }

  return [
    "Legenda revisada para evitar promessa comercial ampla.",
    "Aprovação concentrada na página de revisão, não em cliques isolados no email.",
  ];
}

function buildEmailItems(posts: PostData[]): StakeholderEmailItem[] {
  return posts.map((post) => ({
    contentType: post.ref.content_type,
    contentId: post.ref.content_id,
    title: post.title,
    valueForProspects: buildValueForProspects(post),
    correctedRisks: buildCorrectedRisks(post),
    statusLabel: "Pronto para revisão",
    thumbnailUrl: post.thumbnail_url,
  }));
}

function getReviewBaseUrl(): string {
  return (Deno.env.get("REVIEW_BASE_URL") ?? "https://lifetrek-medical.com")
    .replace(/\/+$/, "");
}

function getStakeholderEnv(): Record<string, string | undefined> {
  return {
    STAKEHOLDER_REVIEWER_EMAILS: Deno.env.get("STAKEHOLDER_REVIEWER_EMAILS") ??
      undefined,
    STAKEHOLDER_EMAILS: Deno.env.get("STAKEHOLDER_EMAILS") ?? undefined,
    STAKEHOLDER_EMAIL_1: Deno.env.get("STAKEHOLDER_EMAIL_1") ?? undefined,
    STAKEHOLDER_EMAIL_2: Deno.env.get("STAKEHOLDER_EMAIL_2") ?? undefined,
    STAKEHOLDER_EMAIL_3: Deno.env.get("STAKEHOLDER_EMAIL_3") ?? undefined,
    STAKEHOLDER_EMAIL_4: Deno.env.get("STAKEHOLDER_EMAIL_4") ?? undefined,
  };
}

function buildReviewUrl(reviewBaseUrl: string, token: string): string {
  return `${reviewBaseUrl}/review/${encodeURIComponent(token)}`;
}

function validatePostRef(ref: unknown): ref is PostRef {
  if (!ref || typeof ref !== "object") return false;
  const record = ref as Record<string, unknown>;
  return (
    (record.content_type === "linkedin_carousel" ||
      record.content_type === "instagram_post" ||
      record.content_type === "blog_post") &&
    typeof record.content_id === "string" &&
    record.content_id.trim().length > 0
  );
}

async function fetchPostData(supabase: any, ref: PostRef): Promise<PostData> {
  if (ref.content_type === "linkedin_carousel") {
    const { data, error }: { data: any; error: any } = await supabase
      .from("linkedin_carousels")
      .select("topic, caption, slides, image_urls, status")
      .eq("id", ref.content_id)
      .single();

    if (error || !data) {
      throw new Error(`linkedin_carousel ${ref.content_id} not found`);
    }
    if (!hasAdminApprovedStatus(data.status)) {
      throw new Error(
        `Post ${ref.content_id} must be approved before sending (current: ${data.status})`,
      );
    }
    if (!data.caption?.trim()) {
      throw new Error(
        `Post ${ref.content_id} has no caption. Generate caption before sending.`,
      );
    }

    const imageUrls = Array.isArray(data.image_urls) ? data.image_urls : [];
    const slides = Array.isArray(data.slides) ? data.slides : [];
    const firstHeadline = slides
      .map((slide: Record<string, unknown>) => normalizeText(slide?.headline))
      .find(Boolean);

    return {
      ref,
      title: normalizeText(data.topic) || firstHeadline || "Post LinkedIn",
      caption: normalizeText(data.caption),
      thumbnail_url: imageUrls.find((url: unknown) =>
        typeof url === "string" && url.trim()
      ) ?? null,
      status: data.status ?? null,
    };
  }

  if (ref.content_type === "instagram_post") {
    const { data, error }: { data: any; error: any } = await supabase
      .from("instagram_posts")
      .select("topic, caption, slides, image_urls, status")
      .eq("id", ref.content_id)
      .single();

    if (error || !data) {
      throw new Error(`instagram_post ${ref.content_id} not found`);
    }
    if (!hasAdminApprovedStatus(data.status)) {
      throw new Error(
        `Post ${ref.content_id} must be approved before sending (current: ${data.status})`,
      );
    }
    if (!data.caption?.trim()) {
      throw new Error(
        `Post ${ref.content_id} has no caption. Generate caption before sending.`,
      );
    }

    const imageUrls = Array.isArray(data.image_urls) ? data.image_urls : [];

    return {
      ref,
      title: normalizeText(data.topic) || "Post Instagram",
      caption: normalizeText(data.caption),
      thumbnail_url: imageUrls.find((url: unknown) =>
        typeof url === "string" && url.trim()
      ) ?? null,
      status: data.status ?? null,
    };
  }

  const { data, error }: { data: any; error: any } = await supabase
    .from("blog_posts")
    .select("title, excerpt, hero_image_url, status")
    .eq("id", ref.content_id)
    .single();

  if (error || !data) throw new Error(`blog_post ${ref.content_id} not found`);
  if (!hasAdminApprovedStatus(data.status)) {
    throw new Error(
      `O blog post deve estar com status 'Aprovado' antes de enviar (atual: ${data.status})`,
    );
  }
  if (!data.title?.trim()) {
    throw new Error(
      `O blog post ${ref.content_id} não tem título. Adicione um título antes de enviar.`,
    );
  }

  return {
    ref,
    title: normalizeText(data.title) || "Blog",
    caption: normalizeText(data.excerpt),
    thumbnail_url: data.hero_image_url ?? null,
    status: data.status ?? null,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    return jsonError("Supabase service configuration is missing.", 500);
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwtToken = authHeader.replace("Bearer ", "").trim();
    if (!jwtToken) {
      return jsonError("Missing Authorization bearer token", 401);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      jwtToken,
    );
    if (authError || !user) {
      return jsonError("Unauthorized", 401);
    }

    const [adminPermResult, legacyAdminResult] = await Promise.all([
      user.email
        ? supabase.from("admin_permissions").select("permission_level").eq(
          "email",
          user.email,
        ).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase.from("admin_users").select("permission_level").eq(
        "user_id",
        user.id,
      ).maybeSingle(),
    ]);

    if (!adminPermResult.data && !legacyAdminResult.data) {
      return jsonError("Admin access required", 403);
    }

    const body = await req.json().catch(
      () => ({}),
    ) as SendStakeholderReviewRequest;
    const postRefs = Array.isArray(body.post_refs) ? body.post_refs : [];
    const invalidRef = postRefs.find((ref) => !validatePostRef(ref));

    if (postRefs.length === 0 || invalidRef) {
      return jsonError(
        "post_refs must be a non-empty array of valid stakeholder review references",
        400,
      );
    }

    const posts: PostData[] = [];
    for (const ref of postRefs) {
      try {
        posts.push(await fetchPostData(supabase, ref));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return jsonError(msg, 400);
      }
    }

    const reviewerEmails = resolveStakeholderEmails(getStakeholderEnv());
    const reviewBaseUrl = getReviewBaseUrl();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const emailItems = buildEmailItems(posts);
    const notes = body.notes?.trim() || null;

    if (body.dry_run) {
      const previewEmail = buildStakeholderReviewEmail({
        reviewerEmail: reviewerEmails[0] ?? "stakeholder@lifetrek-medical.com",
        items: emailItems,
        reviewUrl: buildReviewUrl(reviewBaseUrl, "preview-token"),
        expiresAt,
        notes,
      });

      return jsonResponse({
        data: {
          dry_run: true,
          sent_to: reviewerEmails,
          item_count: posts.length,
          subject: previewEmail.subject,
          text: previewEmail.text,
          html: previewEmail.html,
          preview_items: previewEmail.preview_items,
        },
      });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return jsonError("RESEND_API_KEY not configured", 500);
    }

    const { data: batch, error: batchError } = await supabase
      .from("stakeholder_review_batches")
      .insert({
        created_by: user.id,
        notes,
        expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single();

    if (batchError || !batch) {
      throw new Error(`Failed to create batch: ${batchError?.message}`);
    }

    const { data: tokens, error: tokensError } = await supabase
      .from("stakeholder_review_tokens")
      .insert(
        reviewerEmails.map((email) => ({
          batch_id: batch.id,
          reviewer_email: email,
          expires_at: expiresAt.toISOString(),
        })),
      )
      .select("id, reviewer_email, token");

    if (tokensError || !tokens) {
      throw new Error(`Failed to create tokens: ${tokensError?.message}`);
    }

    const { data: items, error: itemsError } = await supabase
      .from("stakeholder_review_items")
      .insert(
        posts.map((post) => ({
          batch_id: batch.id,
          content_type: post.ref.content_type,
          content_id: post.ref.content_id,
          status: "pending",
        })),
      )
      .select("id, content_id");

    if (itemsError || !items) {
      throw new Error(`Failed to create review items: ${itemsError?.message}`);
    }

    const resend = new Resend(resendApiKey);
    const sendResults: { email: string; id?: string; error?: string }[] = [];
    let subject = "";

    for (const tokenRow of tokens) {
      const email = buildStakeholderReviewEmail({
        reviewerEmail: tokenRow.reviewer_email,
        items: emailItems,
        reviewUrl: buildReviewUrl(reviewBaseUrl, tokenRow.token),
        expiresAt,
        notes,
      });
      subject = email.subject;

      try {
        const result = await resend.emails.send({
          from: "Lifetrek Content <noreply@lifetrek-medical.com>",
          to: [tokenRow.reviewer_email],
          subject: email.subject,
          text: email.text,
          html: email.html,
        });
        const resendResult = result as {
          id?: string;
          data?: { id?: string };
          error?: string | { message?: string };
        };
        if (resendResult.error) {
          const message = typeof resendResult.error === "string"
            ? resendResult.error
            : resendResult.error.message || "Unknown Resend error";
          throw new Error(message);
        }
        sendResults.push({
          email: tokenRow.reviewer_email,
          id: resendResult.data?.id ?? resendResult.id,
        });
        console.log(
          `[STAKEHOLDER-REVIEW] Sent to ${tokenRow.reviewer_email}`,
          result,
        );
      } catch (emailErr: unknown) {
        const msg = emailErr instanceof Error
          ? emailErr.message
          : String(emailErr);
        console.error(
          `[STAKEHOLDER-REVIEW] Failed to send to ${tokenRow.reviewer_email}:`,
          msg,
        );
        sendResults.push({ email: tokenRow.reviewer_email, error: msg });
      }
    }

    const sendFailures = sendResults.filter((result) => result.error);
    if (sendFailures.length > 0) {
      await supabase.from("stakeholder_review_batches").delete().eq(
        "id",
        batch.id,
      );
      return jsonResponse(
        {
          error: "Falha ao enviar emails de revisão. O lote foi cancelado.",
          data: {
            batch_id: batch.id,
            sent_to: reviewerEmails,
            item_count: posts.length,
            send_results: sendResults,
          },
        },
        502,
      );
    }

    for (const post of posts) {
      await supabase
        .from(contentTableFromType(post.ref.content_type))
        .update({ status: "stakeholder_review_pending" })
        .eq("id", post.ref.content_id);
    }

    return jsonResponse({
      data: {
        batch_id: batch.id,
        sent_to: reviewerEmails,
        item_count: posts.length,
        subject,
        send_results: sendResults,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[STAKEHOLDER-REVIEW]", err);
    return jsonError(msg, 500);
  }
});
