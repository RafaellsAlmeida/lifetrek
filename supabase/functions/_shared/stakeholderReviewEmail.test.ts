import {
  buildStakeholderReviewEmail,
  resolveStakeholderEmails,
} from "./stakeholderReviewEmail.ts";

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

Deno.test("buildStakeholderReviewEmail generates the fast approval subject", () => {
  const email = buildStakeholderReviewEmail({
    reviewerEmail: "rbianchini@lifetrek-medical.com",
    reviewUrl: "https://lifetrek-medical.com/review/token",
    expiresAt: new Date("2026-03-23T12:00:00Z"),
    generatedAt: new Date("2026-03-16T12:00:00Z"),
    items: [
      {
        contentType: "blog_post",
        contentId: "blog-1",
        title: "Modelo de qualificação técnica",
        valueForProspects:
          "Ajuda o prospect a qualificar parceiro local com critérios objetivos.",
      },
    ],
  });

  assert(
    email.subject ===
      "Aprovação rápida: 1 conteúdo Lifetrek para revisar até 23/03/2026",
    `Unexpected subject: ${email.subject}`,
  );
  assert(
    email.text.includes("CTA: Revisar lote agora"),
    "Text fallback should include CTA label",
  );
  assert(
    email.text.includes("https://lifetrek-medical.com/review/token"),
    "Text fallback should include review URL",
  );
});

Deno.test("buildStakeholderReviewEmail escapes dynamic HTML", () => {
  const email = buildStakeholderReviewEmail({
    reviewerEmail: "njesus@lifetrek-medical.com",
    reviewUrl: "https://lifetrek-medical.com/review/token?item=<bad>",
    expiresAt: new Date("2026-03-23T12:00:00Z"),
    items: [
      {
        contentType: "linkedin_carousel",
        contentId: "linkedin-1",
        title: "<script>alert('x')</script>",
        valueForProspects: "Valor com <b>HTML</b> perigoso.",
        correctedRisks: ["Risco <alto> removido."],
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

Deno.test("buildStakeholderReviewEmail handles missing thumbnails and empty risk bullets", () => {
  const email = buildStakeholderReviewEmail({
    reviewerEmail: "njesus@lifetrek-medical.com",
    reviewUrl: "https://lifetrek-medical.com/review/token",
    expiresAt: new Date("2026-03-23T12:00:00Z"),
    items: [
      {
        contentType: "instagram_post",
        contentId: "instagram-1",
        title: "Post Instagram",
        valueForProspects: "Ajuda o prospect a avaliar o conteúdo com rapidez.",
        thumbnailUrl: null,
        correctedRisks: [],
      },
    ],
  });

  assert(
    !email.html.includes("undefined"),
    "HTML should not leak undefined values",
  );
  assert(
    !email.text.includes("undefined"),
    "Text should not leak undefined values",
  );
  assert(
    !email.html.includes("Riscos já corrigidos</div>"),
    "Empty risk lists should be omitted from HTML",
  );
  assert(
    email.preview_items[0].corrected_risks.length === 0,
    "Preview item should preserve empty risk list",
  );
});

Deno.test("resolveStakeholderEmails uses config before fallback", () => {
  assert(
    resolveStakeholderEmails({
      STAKEHOLDER_REVIEWER_EMAILS: "one@example.com, two@example.com",
    }).join(",") ===
      "one@example.com,two@example.com",
    "Comma-separated reviewer config should win",
  );
  assert(
    resolveStakeholderEmails({
      STAKEHOLDER_EMAIL_1: "first@example.com",
      STAKEHOLDER_EMAIL_2: "second@example.com",
    })
      .join(",") === "first@example.com,second@example.com",
    "Numbered reviewer config should be supported",
  );
  assert(
    resolveStakeholderEmails({}).join(",") ===
      "rbianchini@lifetrek-medical.com,njesus@lifetrek-medical.com",
    "Fallback reviewers should remain stable",
  );
});
