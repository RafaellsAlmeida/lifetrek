export type StakeholderContentType =
  | "linkedin_carousel"
  | "instagram_post"
  | "blog_post";

export interface StakeholderEmailItem {
  contentType: StakeholderContentType;
  contentId: string;
  title: string;
  valueForProspects: string;
  correctedRisks?: string[];
  statusLabel?: string;
  thumbnailUrl?: string | null;
}

export interface StakeholderEmailPreviewItem {
  content_type: StakeholderContentType;
  content_id: string;
  type_label: string;
  title: string;
  value_for_prospects: string;
  corrected_risks: string[];
  status_label: string;
}

export interface StakeholderReviewEmailInput {
  reviewerEmail: string;
  items: StakeholderEmailItem[];
  reviewUrl: string;
  expiresAt: Date;
  notes?: string | null;
  generatedAt?: Date;
}

export interface StakeholderReviewEmailOutput {
  subject: string;
  text: string;
  html: string;
  preview_items: StakeholderEmailPreviewItem[];
}

const FALLBACK_REVIEWERS = [
  "rbianchini@lifetrek-medical.com",
  "njesus@lifetrek-medical.com",
];

const PREHEADER =
  "Resumo de riscos, links de revisão e próximos passos em menos de 5 minutos.";

const TYPE_LABELS: Record<StakeholderContentType, string> = {
  linkedin_carousel: "LinkedIn",
  instagram_post: "Instagram",
  blog_post: "Blog",
};

const TYPE_COLORS: Record<StakeholderContentType, string> = {
  linkedin_carousel: "#0077B5",
  instagram_post: "#BE185D",
  blog_post: "#1A7A3E",
};

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderTextWithLinks(value: string): string {
  const parts = String(value ?? "").split(/(https?:\/\/[^\s]+)/g);

  return parts
    .map((part) => {
      if (!part) return "";
      if (/^https?:\/\/[^\s]+$/.test(part)) {
        const href = escapeHtml(part);
        return `<a href="${href}" style="color:#9a3412;text-decoration:underline;">${href}</a>`;
      }
      return escapeHtml(part).replaceAll("\n", "<br />");
    })
    .join("");
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string, maxLength: number): string {
  const normalized = normalizeWhitespace(value);
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function getReviewerName(email: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  const knownNames: Record<string, string> = {
    "njesus@lifetrek-medical.com": "Nelson",
    "rbianchini@lifetrek-medical.com": "Rafael",
  };
  if (knownNames[normalizedEmail]) return knownNames[normalizedEmail];

  const rawName = email.split("@")[0]?.split(".")[0] || email;
  return rawName.charAt(0).toUpperCase() + rawName.slice(1);
}

function formatPtDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function countByType(items: StakeholderEmailItem[]): string {
  const counts = items.reduce<Record<StakeholderContentType, number>>(
    (acc, item) => {
      acc[item.contentType] += 1;
      return acc;
    },
    { linkedin_carousel: 0, instagram_post: 0, blog_post: 0 },
  );

  const parts = [
    counts.linkedin_carousel ? `${counts.linkedin_carousel} LinkedIn` : "",
    counts.instagram_post ? `${counts.instagram_post} Instagram` : "",
    counts.blog_post
      ? `${counts.blog_post} ${counts.blog_post === 1 ? "blog" : "blogs"}`
      : "",
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : `${items.length} conteúdo(s)`;
}

function normalizePreviewItems(
  items: StakeholderEmailItem[],
): StakeholderEmailPreviewItem[] {
  return items.map((item) => ({
    content_type: item.contentType,
    content_id: item.contentId,
    type_label: TYPE_LABELS[item.contentType],
    title: truncate(item.title || TYPE_LABELS[item.contentType], 130),
    value_for_prospects: truncate(item.valueForProspects, 180),
    corrected_risks: (item.correctedRisks ?? [])
      .map((risk) => truncate(risk, 130))
      .filter(Boolean)
      .slice(0, 2),
    status_label: item.statusLabel || "Pronto para revisão",
  }));
}

function buildRiskText(risks: string[]): string[] {
  if (risks.length === 0) return [];
  return ["Riscos já corrigidos:", ...risks.map((risk) => `- ${risk}`)];
}

function buildItemText(item: StakeholderEmailPreviewItem): string {
  return [
    `${item.type_label} — ${item.title}`,
    `Por que vale para prospects: ${item.value_for_prospects}`,
    ...buildRiskText(item.corrected_risks),
  ].join("\n");
}

function buildRiskHtml(risks: string[]): string {
  if (risks.length === 0) return "";

  return `
      <div style="font-size:12px;font-weight:700;color:#334155;margin:12px 0 6px;">
        Riscos já corrigidos
      </div>
      <ul style="margin:0;padding-left:18px;color:#475569;font-size:13px;line-height:1.5;">
        ${risks.map((risk) => `<li>${escapeHtml(risk)}</li>`).join("")}
      </ul>`;
}

function buildItemHtml(item: StakeholderEmailPreviewItem): string {
  const color = TYPE_COLORS[item.content_type];

  return `
    <tr>
      <td style="padding:0 0 14px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%"
          style="border:1px solid #dbe3ef;border-radius:10px;background:#ffffff;">
          <tr>
            <td style="padding:16px 18px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="vertical-align:top;">
                    <span style="display:inline-block;background:${color};color:#ffffff;
                      font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
                      border-radius:999px;padding:4px 10px;">${
    escapeHtml(item.type_label)
  }</span>
                  </td>
                  <td align="right" style="font-size:12px;color:#64748b;vertical-align:top;">
                    ${escapeHtml(item.status_label)}
                  </td>
                </tr>
              </table>
              <div style="font-size:16px;line-height:1.35;font-weight:700;color:#0f172a;margin-top:10px;">
                ${escapeHtml(item.title)}
              </div>
              <div style="font-size:13px;line-height:1.55;color:#475569;margin-top:8px;">
                <strong style="color:#334155;">Por que vale para prospects:</strong>
                ${escapeHtml(item.value_for_prospects)}
              </div>
              ${buildRiskHtml(item.corrected_risks)}
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

export function resolveStakeholderEmails(
  env: Record<string, string | undefined>,
): string[] {
  const configuredList = env.STAKEHOLDER_REVIEWER_EMAILS ||
    env.STAKEHOLDER_EMAILS || "";
  const configuredEmails = configuredList
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  const numberedEmails = [
    env.STAKEHOLDER_EMAIL_1,
    env.STAKEHOLDER_EMAIL_2,
    env.STAKEHOLDER_EMAIL_3,
    env.STAKEHOLDER_EMAIL_4,
  ]
    .map((email) => email?.trim())
    .filter((email): email is string => Boolean(email));

  const resolved = configuredEmails.length > 0
    ? configuredEmails
    : numberedEmails;
  return Array.from(
    new Set(resolved.length > 0 ? resolved : FALLBACK_REVIEWERS),
  );
}

export function buildStakeholderReviewEmail(
  input: StakeholderReviewEmailInput,
): StakeholderReviewEmailOutput {
  const generatedAt = input.generatedAt ?? new Date();
  const items = normalizePreviewItems(input.items);
  const reviewerName = getReviewerName(input.reviewerEmail);
  const expiryDate = formatPtDate(input.expiresAt);
  const subject = `Aprovação rápida: ${items.length} ${
    items.length === 1 ? "conteúdo" : "conteúdos"
  } Lifetrek para revisar até ${expiryDate}`;
  const contentSummary = countByType(input.items);
  const notes = input.notes?.trim();

  const text = [
    `Assunto: ${subject}`,
    "",
    `Olá, ${reviewerName}.`,
    "",
    `Separei ${items.length} ${
      items.length === 1
        ? "conteúdo já revisado tecnicamente"
        : "conteúdos já revisados tecnicamente"
    } para aprovação final. A ideia é validar se a mensagem está adequada para publicação e se existe algum ajuste comercial, técnico ou regulatório antes de avançarmos.`,
    "",
    "O que preciso de você:",
    "1. Aprovar o lote, se estiver de acordo.",
    "2. Marcar ajustes específicos, se algo precisar mudar.",
    "3. Rejeitar apenas se houver risco técnico/comercial relevante.",
    "",
    "Resumo do lote:",
    `- ${contentSummary}.`,
    "- Claims de economia, prazo e regulação foram suavizados.",
    "- As decisões foram reorientadas para evidência por SKU, CTQ, fornecedor e governança.",
    "- A auditoria completa está no anexo/link de apoio.",
    notes ? `- Nota de Rafael: ${normalizeWhitespace(notes)}` : undefined,
    "",
    "CTA: Revisar lote agora",
    input.reviewUrl,
    "",
    "Itens:",
    items.map(buildItemText).join("\n\n"),
    "",
    "Obrigado,",
    "Rafael",
  ]
    .filter((line): line is string => line !== undefined)
    .join("\n");

  const notesHtml = notes
    ? `
      <tr>
        <td style="padding:0 0 18px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%"
            style="background:#fff7ed;border-left:4px solid #F07818;border-radius:0 8px 8px 0;">
            <tr>
              <td style="padding:12px 14px;">
                <div style="font-size:11px;font-weight:700;color:#9a3412;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">
                  Nota de Rafael
                </div>
                <div style="font-size:13px;line-height:1.5;color:#7c2d12;">
                  ${renderTextWithLinks(notes)}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#0f172a;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${escapeHtml(PREHEADER)}
  </div>
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f4f7fa;padding:20px 0;">
    <tr>
      <td align="center" style="padding:0 12px;">
        <table cellpadding="0" cellspacing="0" border="0" width="640" style="width:100%;max-width:640px;">
          <tr>
            <td style="background:#004F8F;border-radius:12px 12px 0 0;padding:26px 28px;">
              <div style="font-size:22px;line-height:1.25;font-weight:800;color:#ffffff;">
                Aprovação rápida de conteúdo
              </div>
              <div style="font-size:13px;line-height:1.5;color:#dbeafe;margin-top:4px;">
                Lifetrek Medical · ${escapeHtml(formatPtDate(generatedAt))}
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border-left:1px solid #dbe3ef;border-right:1px solid #dbe3ef;padding:26px 28px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="font-size:16px;line-height:1.6;color:#334155;padding:0 0 18px;">
                    Olá, <strong style="color:#0f172a;">${
    escapeHtml(reviewerName)
  }</strong>.
                    Separei <strong>${items.length} ${
    items.length === 1 ? "conteúdo já revisado" : "conteúdos já revisados"
  }</strong>
                    para aprovação final. A ideia é validar se a mensagem está adequada para publicação e se existe algum ajuste comercial, técnico ou regulatório antes de avançarmos.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:2px 0 24px;">
                    <a href="${escapeHtml(input.reviewUrl)}"
                      style="display:inline-block;background:#004F8F;color:#ffffff;text-decoration:none;
                      font-size:15px;font-weight:700;border-radius:999px;padding:13px 24px;">
                      Revisar lote agora
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 18px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%"
                      style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
                      <tr>
                        <td style="padding:16px 18px;">
                          <div style="font-size:12px;font-weight:800;color:#004F8F;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">
                            Resumo do lote
                          </div>
                          <div style="font-size:13px;line-height:1.65;color:#475569;">
                            <div>${escapeHtml(contentSummary)}.</div>
                            <div>Claims de economia, prazo e regulação foram suavizados.</div>
                            <div>As decisões foram reorientadas para evidência por SKU, CTQ, fornecedor e governança.</div>
                            <div>A auditoria completa fica no anexo/link de apoio, sem poluir a aprovação.</div>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ${notesHtml}
                <tr>
                  <td style="font-size:12px;font-weight:800;color:#004F8F;text-transform:uppercase;letter-spacing:.08em;padding:4px 0 12px;">
                    Itens para revisão
                  </td>
                </tr>
                ${items.map(buildItemHtml).join("")}
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;border:1px solid #dbe3ef;border-top:none;border-radius:0 0 12px 12px;padding:16px 28px;">
              <div style="font-size:12px;line-height:1.6;color:#64748b;">
                Este link expira em <strong>${
    escapeHtml(expiryDate)
  }</strong>. A aprovação deve ser feita na página de revisão para preservar comentários, edições e rastreabilidade.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html, preview_items: items };
}
