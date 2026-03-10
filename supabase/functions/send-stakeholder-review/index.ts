import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fixed stakeholder reviewer list
const STAKEHOLDER_EMAILS = [
  "rbianchini@lifetrek-medical.com",
  "njesus@lifetrek-medical.com",
];

const CONTENT_TYPE_LABELS: Record<string, string> = {
  linkedin_carousel: "LinkedIn",
  instagram_post: "Instagram",
  blog_post: "Blog Post",
};

const CONTENT_TYPE_COLORS: Record<string, string> = {
  linkedin_carousel: "#0077B5",
  instagram_post: "#E1306C",
  blog_post: "#1A7A3E",
};

interface PostRef {
  content_type: "linkedin_carousel" | "instagram_post" | "blog_post";
  content_id: string;
}

interface PostData {
  ref: PostRef;
  title: string;
  caption: string;
  thumbnail_url: string | null;
  slide_headlines: string[];
}

async function fetchPostData(supabase: ReturnType<typeof createClient>, ref: PostRef): Promise<PostData> {
  if (ref.content_type === "linkedin_carousel") {
    const { data, error } = await supabase
      .from("linkedin_carousels")
      .select("topic, caption, slides, image_urls, status")
      .eq("id", ref.content_id)
      .single();

    if (error || !data) throw new Error(`linkedin_carousel ${ref.content_id} not found`);
    if (data.status !== "approved") {
      throw new Error(`Post ${ref.content_id} must be approved before sending (current: ${data.status})`);
    }
    if (!data.caption?.trim()) {
      throw new Error(`Post ${ref.content_id} has no caption. Generate caption before sending.`);
    }

    const imageUrls = Array.isArray(data.image_urls) ? data.image_urls : [];
    const slides = Array.isArray(data.slides) ? data.slides : [];

    return {
      ref,
      title: data.topic || "Post LinkedIn",
      caption: data.caption,
      thumbnail_url: imageUrls[0] ?? null,
      slide_headlines: slides.slice(0, 3).map((s: Record<string, unknown>) => String(s?.headline ?? "")).filter(Boolean),
    };
  }

  if (ref.content_type === "instagram_post") {
    const { data, error } = await supabase
      .from("instagram_posts")
      .select("caption, slides, image_urls, status")
      .eq("id", ref.content_id)
      .single();

    if (error || !data) throw new Error(`instagram_post ${ref.content_id} not found`);
    if (data.status !== "approved") {
      throw new Error(`Post ${ref.content_id} must be approved before sending (current: ${data.status})`);
    }
    if (!data.caption?.trim()) {
      throw new Error(`Post ${ref.content_id} has no caption. Generate caption before sending.`);
    }

    const imageUrls = Array.isArray(data.image_urls) ? data.image_urls : [];

    return {
      ref,
      title: "Post Instagram",
      caption: data.caption,
      thumbnail_url: imageUrls[0] ?? null,
      slide_headlines: [],
    };
  }

  // blog_post
  const { data, error } = await supabase
    .from("blog_posts")
    .select("title, excerpt, hero_image_url, status")
    .eq("id", ref.content_id)
    .single();

  if (error || !data) throw new Error(`blog_post ${ref.content_id} not found`);
  if (data.status !== "approved") {
    throw new Error(`Post ${ref.content_id} must be approved before sending (current: ${data.status})`);
  }
  if (!data.title?.trim() && !data.excerpt?.trim()) {
    throw new Error(`Post ${ref.content_id} has no content. Add title and excerpt before sending.`);
  }

  return {
    ref,
    title: data.title || "Blog Post",
    caption: data.excerpt || "",
    thumbnail_url: data.hero_image_url ?? null,
    slide_headlines: [],
  };
}

function buildPostCardHtml(
  post: PostData,
  token: string,
  itemId: string,
  supabaseFunctionsUrl: string,
  reviewBaseUrl: string,
  anonKey: string,
): string {
  const typeLabel = CONTENT_TYPE_LABELS[post.ref.content_type] || post.ref.content_type;
  const typeColor = CONTENT_TYPE_COLORS[post.ref.content_type] || "#004F8F";
  const captionPreview = post.caption.length > 220 ? post.caption.slice(0, 220) + "…" : post.caption;

  const approveUrl = `${supabaseFunctionsUrl}/stakeholder-review-action?apikey=${anonKey}&token=${token}&item=${itemId}&action=approve`;
  const rejectUrl  = `${supabaseFunctionsUrl}/stakeholder-review-action?apikey=${anonKey}&token=${token}&item=${itemId}&action=reject`;
  const reviewUrl  = `${reviewBaseUrl}/review/${token}?item=${itemId}`;

  const thumbnailCell = post.thumbnail_url
    ? `<td width="120" valign="top" style="padding-right:14px;">
         <img src="${post.thumbnail_url}" alt="" width="120" height="120"
              style="display:block;width:120px;height:120px;object-fit:cover;border-radius:8px;border:0;" />
       </td>`
    : `<td width="120" valign="top" style="padding-right:14px;">
         <div style="width:120px;height:120px;background:#e2e8f0;border-radius:8px;
                     font-size:11px;color:#94a3b8;text-align:center;line-height:120px;">
           Sem imagem
         </div>
       </td>`;

  const headlinesHtml = post.slide_headlines.length > 0
    ? `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:10px;">
         <tr><td>
           <div style="font-size:11px;color:#718096;text-transform:uppercase;
                       letter-spacing:0.5px;margin-bottom:5px;">Slides</div>
           ${post.slide_headlines
             .map(h => `<div style="font-size:12px;color:#374151;padding:2px 0 2px 10px;
                                    border-left:2px solid #004F8F;">${h}</div>`)
             .join("")}
         </td></tr>
       </table>`
    : "";

  return `
<table cellpadding="0" cellspacing="0" border="0" width="100%"
       style="background:#ffffff;border-radius:10px;margin-bottom:20px;
              border:1px solid #e2e8f0;overflow:hidden;">
  <tr>
    <td style="padding:20px;">

      <!-- Type badge + title -->
      <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;">
        <tr>
          <td style="background:${typeColor};color:#ffffff;font-size:11px;font-weight:700;
                     padding:3px 10px;border-radius:20px;text-transform:uppercase;
                     letter-spacing:0.5px;white-space:nowrap;">
            ${typeLabel}
          </td>
          <td style="padding-left:10px;font-size:14px;font-weight:600;color:#1a202c;">
            ${post.title}
          </td>
        </tr>
      </table>

      <!-- Thumbnail + caption -->
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          ${thumbnailCell}
          <td valign="top">
            <div style="font-size:13px;color:#4a5568;font-style:italic;line-height:1.6;">
              ${captionPreview}
            </div>
            ${headlinesHtml}
          </td>
        </tr>
      </table>

      <!-- Action buttons -->
      <table cellpadding="0" cellspacing="0" border="0" style="margin-top:18px;">
        <tr>
          <td style="padding-right:8px;">
            <a href="${approveUrl}"
               style="background:#1A7A3E;color:#ffffff;text-decoration:none;
                      padding:10px 18px;border-radius:6px;font-size:13px;font-weight:600;
                      display:inline-block;white-space:nowrap;">
              ✅ Aprovar
            </a>
          </td>
          <td style="padding-right:8px;">
            <a href="${reviewUrl}"
               style="background:#004F8F;color:#ffffff;text-decoration:none;
                      padding:10px 18px;border-radius:6px;font-size:13px;font-weight:600;
                      display:inline-block;white-space:nowrap;">
              ✏️ Revisar / Editar
            </a>
          </td>
          <td>
            <a href="${rejectUrl}"
               style="background:#DC2626;color:#ffffff;text-decoration:none;
                      padding:10px 18px;border-radius:6px;font-size:13px;font-weight:600;
                      display:inline-block;white-space:nowrap;">
              ❌ Rejeitar
            </a>
          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>`;
}

function buildEmailHtml(
  reviewerEmail: string,
  posts: PostData[],
  itemIds: Record<string, string>,
  token: string,
  supabaseFunctionsUrl: string,
  reviewBaseUrl: string,
  anonKey: string,
  notes: string | null,
  expiresAt: Date,
): string {
  const rawName = reviewerEmail.split("@")[0].split(".")[0];
  const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  const expiryStr = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  }).format(expiresAt);

  const contentCount = posts.length;
  const contentWord = contentCount === 1 ? "conteúdo aguarda" : "conteúdos aguardam";

  const notesHtml = notes
    ? `<tr><td style="padding-bottom:20px;">
         <table cellpadding="0" cellspacing="0" border="0" width="100%">
           <tr>
             <td style="background:#FEF3C7;border-left:4px solid #F07818;
                        padding:12px 16px;border-radius:0 6px 6px 0;">
               <div style="font-size:11px;font-weight:700;color:#92400E;
                            text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">
                 Nota de Rafael
               </div>
               <div style="font-size:13px;color:#78350F;">${notes}</div>
             </td>
           </tr>
         </table>
       </td></tr>`
    : "";

  const postCards = posts
    .map(post => buildPostCardHtml(post, token, itemIds[post.ref.content_id], supabaseFunctionsUrl, reviewBaseUrl, anonKey))
    .join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Lifetrek – Aprovação de Conteúdo</title>
</head>
<body style="margin:0;padding:0;background:#F4F7FA;
             font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">

  <table cellpadding="0" cellspacing="0" border="0" width="100%"
         style="background:#F4F7FA;padding:20px 0;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="620"
               style="max-width:620px;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#004F8F 0%,#003D75 100%);
                       border-radius:12px 12px 0 0;padding:28px 30px;">
              <div style="color:#ffffff;font-size:22px;font-weight:700;
                           letter-spacing:-0.3px;margin-bottom:4px;">
                Lifetrek Medical
              </div>
              <div style="color:rgba(255,255,255,0.8);font-size:13px;">
                Aprovação de Conteúdo
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:28px 30px;
                       border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">

                <!-- Greeting -->
                <tr>
                  <td style="padding-bottom:8px;">
                    <div style="font-size:16px;color:#1a202c;font-weight:500;">
                      Olá, <strong>${firstName}</strong> 👋
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:24px;">
                    <div style="font-size:14px;color:#4a5568;line-height:1.6;">
                      Você tem <strong>${contentCount} ${contentWord}</strong> sua aprovação
                      antes da publicação. Revise cada post abaixo e clique em
                      <strong>Aprovar</strong>, <strong>Revisar&nbsp;/&nbsp;Editar</strong>
                      ou <strong>Rejeitar</strong>.
                    </div>
                  </td>
                </tr>

                ${notesHtml}

                <!-- Green divider -->
                <tr>
                  <td style="padding-bottom:24px;">
                    <div style="height:2px;background:#1A7A3E;border-radius:2px;"></div>
                  </td>
                </tr>

                <!-- Post cards -->
                <tr>
                  <td>
                    ${postCards}
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:16px 30px;
                       border:1px solid #e2e8f0;border-top:none;
                       border-radius:0 0 12px 12px;">
              <div style="font-size:12px;color:#94a3b8;line-height:1.6;">
                ⏰ Este link expira em <strong style="color:#64748b;">${expiryStr}</strong>.<br>
                Lifetrek Medical · Sistema interno de aprovação de conteúdo · ${new Date().getFullYear()}
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl       = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey   = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("VITE_SUPABASE_ANON_KEY") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendApiKey      = Deno.env.get("RESEND_API_KEY");
  const reviewBaseUrl     = Deno.env.get("REVIEW_BASE_URL") ?? "https://lifetrek-medical.com";

  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // --- Auth ---
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwtToken = authHeader.replace("Bearer ", "").trim();
    if (!jwtToken) {
      return new Response(JSON.stringify({ error: "Missing Authorization bearer token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwtToken);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [adminPermResult, legacyAdminResult] = await Promise.all([
      user.email
        ? supabase.from("admin_permissions").select("permission_level").eq("email", user.email).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase.from("admin_users").select("permission_level").eq("user_id", user.id).maybeSingle(),
    ]);

    if (!adminPermResult.data && !legacyAdminResult.data) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Parse body ---
    const body = await req.json().catch(() => ({}));
    const { post_refs, notes } = body as { post_refs?: PostRef[]; notes?: string };

    if (!Array.isArray(post_refs) || post_refs.length === 0) {
      return new Response(JSON.stringify({ error: "post_refs must be a non-empty array" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Validate & fetch all posts ---
    const posts: PostData[] = [];
    for (const ref of post_refs) {
      try {
        posts.push(await fetchPostData(supabase, ref));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return new Response(JSON.stringify({ error: msg }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // --- Create batch ---
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const { data: batch, error: batchError } = await supabase
      .from("stakeholder_review_batches")
      .insert({ created_by: user.id, notes: notes ?? null, expires_at: expiresAt.toISOString() })
      .select("id")
      .single();

    if (batchError || !batch) throw new Error(`Failed to create batch: ${batchError?.message}`);

    // --- Create tokens (one per reviewer) ---
    const { data: tokens, error: tokensError } = await supabase
      .from("stakeholder_review_tokens")
      .insert(
        STAKEHOLDER_EMAILS.map(email => ({
          batch_id: batch.id,
          reviewer_email: email,
          expires_at: expiresAt.toISOString(),
        }))
      )
      .select("id, reviewer_email, token");

    if (tokensError || !tokens) throw new Error(`Failed to create tokens: ${tokensError?.message}`);

    // --- Create review items (one per post) ---
    const { data: items, error: itemsError } = await supabase
      .from("stakeholder_review_items")
      .insert(
        posts.map(p => ({
          batch_id: batch.id,
          content_type: p.ref.content_type,
          content_id: p.ref.content_id,
          status: "pending",
        }))
      )
      .select("id, content_id");

    if (itemsError || !items) throw new Error(`Failed to create review items: ${itemsError?.message}`);

    const itemIds: Record<string, string> = Object.fromEntries(items.map(i => [i.content_id, i.id]));

    // --- Update content statuses ---
    for (const p of posts) {
      const table =
        p.ref.content_type === "linkedin_carousel" ? "linkedin_carousels" :
        p.ref.content_type === "instagram_post"    ? "instagram_posts" :
                                                     "blog_posts";
      await supabase.from(table).update({ status: "stakeholder_review_pending" }).eq("id", p.ref.content_id);
    }

    // --- Send emails ---
    const resend = new Resend(resendApiKey);
    const supabaseFunctionsUrl = `${supabaseUrl}/functions/v1`;
    const sendResults: { email: string; id?: string; error?: string }[] = [];

    for (const tokenRow of tokens) {
      const html = buildEmailHtml(
        tokenRow.reviewer_email,
        posts,
        itemIds,
        tokenRow.token,
        supabaseFunctionsUrl,
        reviewBaseUrl,
        supabaseAnonKey,
        notes ?? null,
        expiresAt,
      );

      try {
        const result = await resend.emails.send({
          from: "Lifetrek Content <noreply@lifetrek-medical.com>",
          to: [tokenRow.reviewer_email],
          subject: `Lifetrek – ${posts.length} ${posts.length === 1 ? "conteúdo aguarda" : "conteúdos aguardam"} sua aprovação`,
          html,
        });
        sendResults.push({ email: tokenRow.reviewer_email, id: (result as { id?: string }).id });
        console.log(`[STAKEHOLDER-REVIEW] Sent to ${tokenRow.reviewer_email}`, result);
      } catch (emailErr: unknown) {
        const msg = emailErr instanceof Error ? emailErr.message : String(emailErr);
        console.error(`[STAKEHOLDER-REVIEW] Failed to send to ${tokenRow.reviewer_email}:`, msg);
        sendResults.push({ email: tokenRow.reviewer_email, error: msg });
      }
    }

    return new Response(
      JSON.stringify({
        data: {
          batch_id: batch.id,
          sent_to: STAKEHOLDER_EMAILS,
          item_count: posts.length,
          send_results: sendResults,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[STAKEHOLDER-REVIEW]", err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
