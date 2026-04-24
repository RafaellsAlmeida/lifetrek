import { buildManualApprovalEmail } from "./manualApprovalEmail.ts";

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

Deno.test("buildManualApprovalEmail includes CTA label and review url", () => {
  const email = buildManualApprovalEmail({
    reviewerEmail: "rbianchini@lifetrek-medical.com",
    reviewUrl: "https://example.com/review/video-clean-room",
    expiresAt: new Date("2026-04-30T12:00:00Z"),
    ctaLabel: "Abrir vídeo para revisão",
    items: [
      {
        typeLabel: "Vídeo",
        title: "Tour pela sala limpa",
        summary: "Validar se o material pode seguir para envio externo.",
      },
    ],
  });

  assert(
    email.subject ===
      "Aprovação rápida: 1 material Lifetrek para revisar até 30/04/2026",
    `Unexpected subject: ${email.subject}`,
  );
  assert(
    email.text.includes("CTA: Abrir vídeo para revisão"),
    "Text fallback should include CTA label",
  );
  assert(
    email.html.includes("https://example.com/review/video-clean-room"),
    "HTML should include review URL",
  );
});

Deno.test("buildManualApprovalEmail escapes dynamic HTML and renders notes safely", () => {
  const email = buildManualApprovalEmail({
    reviewerEmail: "njesus@lifetrek-medical.com",
    reviewUrl: "https://example.com/review?item=<bad>",
    expiresAt: new Date("2026-04-30T12:00:00Z"),
    items: [
      {
        typeLabel: "Vídeo",
        title: "<script>alert('x')</script>",
        summary: "Resumo com <b>HTML</b> perigoso.",
        highlights: ["Checar claim <alto>."],
      },
    ],
    notes: "Nota com <strong>HTML</strong>",
  });

  assert(
    !email.html.includes("<script>"),
    "HTML should not include raw script tags",
  );
  assert(
    email.html.includes("&lt;script&gt;"),
    "HTML should escape script tags",
  );
  assert(
    email.html.includes("Nota de Rafael"),
    "HTML should include notes block",
  );
  assert(
    !email.html.includes("<strong>HTML</strong>"),
    "HTML should escape note markup",
  );
});
