import { readFile } from "node:fs/promises";

import {
  buildManualApprovalEmail,
  type ManualApprovalEmailItem,
} from "../supabase/functions/_shared/manualApprovalEmail.ts";
import { resolveStakeholderEmails } from "../supabase/functions/_shared/stakeholderReviewEmail.ts";

interface ManualApprovalRequest {
  to?: string[];
  from?: string;
  reviewUrl: string;
  expiresAt?: string;
  ctaLabel?: string;
  intro?: string;
  notes?: string;
  subject?: string;
  items: ManualApprovalEmailItem[];
}

function printUsage(): void {
  console.error(`
Uso:
  npm run send:approval-email -- --input /caminho/request.json

Atalho para 1 item:
  npm run send:approval-email -- \\
    --to rbianchini@lifetrek-medical.com \\
    --review-url https://example.com/review/video \\
    --title "Vídeo clean room" \\
    --summary "Validar se o corte final pode seguir." \\
    --type-label "Vídeo"

Flags:
  --input        JSON com to/reviewUrl/items/notes/ctaLabel/subject
  --to           Pode repetir a flag; se omitir, usa stakeholders configurados
  --review-url   Link usado no botão do email
  --title        Título do item único
  --summary      Resumo do item único
  --type-label   Tipo do item único (ex.: Vídeo, Landing Page, PDF)
  --notes        Nota opcional
  --cta-label    Texto do botão
  --subject      Assunto opcional
  --expires-at   ISO datetime opcional
  --dry-run      Monta o email sem enviar
`);
}

function getSingleArg(
  args: Map<string, string[]>,
  key: string,
): string | undefined {
  return args.get(key)?.at(-1);
}

function parseArgs(argv: string[]): { args: Map<string, string[]>; dryRun: boolean } {
  const args = new Map<string, string[]>();
  let dryRun = false;

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (!current.startsWith("--")) continue;

    const key = current.slice(2);
    if (key === "dry-run") {
      dryRun = true;
      continue;
    }

    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }

    const existing = args.get(key) ?? [];
    existing.push(next);
    args.set(key, existing);
    index += 1;
  }

  return { args, dryRun };
}

async function loadInputFile(path: string | undefined): Promise<Partial<ManualApprovalRequest>> {
  if (!path) return {};
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw) as Partial<ManualApprovalRequest>;
}

function resolveRequest(
  fileInput: Partial<ManualApprovalRequest>,
  args: Map<string, string[]>,
): ManualApprovalRequest {
  const cliTo = args.get("to") ?? [];
  const fileTo = Array.isArray(fileInput.to) ? fileInput.to : [];
  const to = cliTo.length > 0
    ? cliTo
    : fileTo.length > 0
      ? fileTo
      : resolveStakeholderEmails(process.env);

  const reviewUrl = getSingleArg(args, "review-url") || fileInput.reviewUrl;
  const expiresAt = getSingleArg(args, "expires-at") || fileInput.expiresAt;
  const ctaLabel = getSingleArg(args, "cta-label") || fileInput.ctaLabel;
  const intro = getSingleArg(args, "intro") || fileInput.intro;
  const notes = getSingleArg(args, "notes") || fileInput.notes;
  const subject = getSingleArg(args, "subject") || fileInput.subject;
  const from = getSingleArg(args, "from") || fileInput.from || "Lifetrek Content <noreply@lifetrek-medical.com>";

  const title = getSingleArg(args, "title");
  const summary = getSingleArg(args, "summary");
  const typeLabel = getSingleArg(args, "type-label");

  const items = Array.isArray(fileInput.items) && fileInput.items.length > 0
    ? fileInput.items
    : title && summary
      ? [{
          typeLabel: typeLabel || "Material",
          title,
          summary,
        }]
      : [];

  if (!reviewUrl) {
    throw new Error("Missing --review-url or reviewUrl in input JSON.");
  }

  if (items.length === 0) {
    throw new Error("Provide items in --input or use --title plus --summary.");
  }

  if (to.length === 0) {
    throw new Error("No recipients resolved. Provide --to or configure stakeholder emails.");
  }

  return {
    to,
    from,
    reviewUrl,
    expiresAt,
    ctaLabel,
    intro,
    notes,
    subject,
    items,
  };
}

async function sendViaResend(payload: {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
}): Promise<{ id?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof body?.message === "string"
      ? body.message
      : typeof body?.error === "string"
        ? body.error
        : `Resend request failed with status ${response.status}`;
    throw new Error(message);
  }

  return body as { id?: string };
}

async function main(): Promise<void> {
  const { args, dryRun } = parseArgs(process.argv.slice(2));
  const inputPath = getSingleArg(args, "input");
  const fileInput = await loadInputFile(inputPath);
  const request = resolveRequest(fileInput, args);
  const expiresAt = request.expiresAt
    ? new Date(request.expiresAt)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  if (Number.isNaN(expiresAt.getTime())) {
    throw new Error("Invalid expiresAt/--expires-at value.");
  }

  const previews = request.to!.map((reviewerEmail) => ({
    reviewerEmail,
    email: buildManualApprovalEmail({
      reviewerEmail,
      reviewUrl: request.reviewUrl,
      items: request.items,
      expiresAt,
      notes: request.notes,
      ctaLabel: request.ctaLabel,
      intro: request.intro,
      subject: request.subject,
    }),
  }));

  if (dryRun) {
    console.log(JSON.stringify({
      dry_run: true,
      to: request.to,
      subject: previews[0]?.email.subject,
      review_url: request.reviewUrl,
      item_count: request.items.length,
    }, null, 2));
    return;
  }

  for (const preview of previews) {
    const result = await sendViaResend({
      from: request.from!,
      to: [preview.reviewerEmail],
      subject: preview.email.subject,
      html: preview.email.html,
      text: preview.email.text,
    });
    console.log(`Sent approval email to ${preview.reviewerEmail}${result.id ? ` (${result.id})` : ""}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  printUsage();
  process.exitCode = 1;
});
