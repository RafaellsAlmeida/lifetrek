export interface ManualApprovalEmailItem {
  typeLabel: string;
  title: string;
  summary: string;
  highlights?: string[];
  statusLabel?: string;
}

export interface ManualApprovalEmailInput {
  reviewerEmail: string;
  reviewUrl: string;
  items: ManualApprovalEmailItem[];
  expiresAt: Date;
  notes?: string | null;
  generatedAt?: Date;
  ctaLabel?: string | null;
  intro?: string | null;
  subject?: string | null;
}

export interface ManualApprovalEmailOutput {
  subject: string;
  text: string;
  html: string;
}

const PREHEADER =
  "Resumo rápido do material, contexto do envio e um botão para revisar.";

function escapeHtml(value: unknown): string {
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

function buildHighlightsText(highlights: string[]): string[] {
  if (highlights.length === 0) return [];
  return ["Pontos para validar:", ...highlights.map((item) => `- ${item}`)];
}

function buildItemText(item: ManualApprovalEmailItem): string {
  const highlights = (item.highlights ?? []).filter(Boolean).slice(0, 3);

  return [
    `${item.typeLabel} — ${item.title}`,
    `Resumo: ${truncate(item.summary, 220)}`,
    ...buildHighlightsText(highlights),
  ].join("\n");
}

function buildHighlightsHtml(highlights: string[]): string {
  if (highlights.length === 0) return "";

  return `
    <div style="font-size:12px;font-weight:700;color:#334155;margin:12px 0 6px;">
      Pontos para validar
    </div>
    <ul style="margin:0;padding-left:18px;color:#475569;font-size:13px;line-height:1.5;">
      ${highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
    </ul>`;
}

function buildItemHtml(item: ManualApprovalEmailItem): string {
  const highlights = (item.highlights ?? []).filter(Boolean).slice(0, 3);

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
                    <span style="display:inline-block;background:#004F8F;color:#ffffff;
                      font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
                      border-radius:999px;padding:4px 10px;">${
    escapeHtml(item.typeLabel)
  }</span>
                  </td>
                  <td align="right" style="font-size:12px;color:#64748b;vertical-align:top;">
                    ${escapeHtml(item.statusLabel || "Pronto para revisão")}
                  </td>
                </tr>
              </table>
              <div style="font-size:16px;line-height:1.35;font-weight:700;color:#0f172a;margin-top:10px;">
                ${escapeHtml(item.title)}
              </div>
              <div style="font-size:13px;line-height:1.55;color:#475569;margin-top:8px;">
                <strong style="color:#334155;">Resumo:</strong>
                ${escapeHtml(truncate(item.summary, 220))}
              </div>
              ${buildHighlightsHtml(highlights)}
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

export function buildManualApprovalEmail(
  input: ManualApprovalEmailInput,
): ManualApprovalEmailOutput {
  const generatedAt = input.generatedAt ?? new Date();
  const reviewerName = getReviewerName(input.reviewerEmail);
  const expiryDate = formatPtDate(input.expiresAt);
  const ctaLabel = normalizeWhitespace(input.ctaLabel || "Revisar material");
  const intro = normalizeWhitespace(
    input.intro ||
      "Separei este material para validação final. A ideia é confirmar se a mensagem, o contexto e o formato estão adequados antes de avançarmos.",
  );
  const notes = input.notes?.trim();
  const itemCount = input.items.length;
  const subject =
    input.subject?.trim() ||
    `Aprovação rápida: ${itemCount} ${
      itemCount === 1 ? "material" : "materiais"
    } Lifetrek para revisar até ${expiryDate}`;

  const text = [
    `Assunto: ${subject}`,
    "",
    `Olá, ${reviewerName}.`,
    "",
    intro,
    "",
    notes ? `Nota de Rafael: ${normalizeWhitespace(notes)}` : undefined,
    "",
    `CTA: ${ctaLabel}`,
    input.reviewUrl,
    "",
    "Itens:",
    input.items.map(buildItemText).join("\n\n"),
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
                Aprovação rápida de material
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
  }</strong>. ${escapeHtml(intro)}
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:2px 0 24px;">
                    <a href="${escapeHtml(input.reviewUrl)}"
                      style="display:inline-block;background:#004F8F;color:#ffffff;text-decoration:none;
                      font-size:15px;font-weight:700;border-radius:999px;padding:13px 24px;">
                      ${escapeHtml(ctaLabel)}
                    </a>
                  </td>
                </tr>
                ${notesHtml}
                <tr>
                  <td style="font-size:12px;font-weight:800;color:#004F8F;text-transform:uppercase;letter-spacing:.08em;padding:4px 0 12px;">
                    Itens para revisão
                  </td>
                </tr>
                ${input.items.map(buildItemHtml).join("")}
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;border:1px solid #dbe3ef;border-top:none;border-radius:0 0 12px 12px;padding:16px 28px;">
              <div style="font-size:12px;line-height:1.6;color:#64748b;">
                Este link expira em <strong>${
    escapeHtml(expiryDate)
  }</strong>. Use o botão acima para revisar o material e responder no fluxo combinado.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}
