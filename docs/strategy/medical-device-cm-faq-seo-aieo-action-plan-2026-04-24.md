# Medical Device CM FAQ, SEO, and AIEO Action Plan

Source report: `docs/strategy/medical-device-cm-deep-research-report-2026-04-24.md`

## Objective

Turn the research findings into public, crawlable FAQ and answer-page content that reduces buyer anxiety around medical-device contract manufacturing while staying conservative on regulatory, quality, delivery, and legal claims.

## Core Positioning From The Report

Buyers are not only worried about machining quality. They worry about late discovery of risk: hidden process changes, weak change control, document drift, delayed CAPA, unclear audit responsibility, poor traceability, packaging/cleanliness failures, and schedule surprises.

The safest content strategy is to promise visibility, discipline, containment, and controlled scale-up. Avoid absolute guarantees like zero defects, never late, no audit risk, or guaranteed regulatory success.

## P0 Implementation Steps

1. Create a public FAQ cluster for medical-device contract manufacturing.
   - Add one canonical FAQ page or FAQ section anchored around supplier qualification, production transfer, ISO 13485, traceability, UDI marking, cleanroom handling, FAI, validation evidence, CAPA response, and IP protection.
   - Keep every answer short, specific, and evidence-led.
   - Link each answer to a deeper blog post or resource when available.

2. Publish 6 first-wave canonical answer pages.
   - How to qualify a medical-device manufacturing supplier under ISO 13485
   - What to ask before transferring a medical SKU to a contract manufacturer
   - What a pilot lot should prove before production scale-up
   - What full batch traceability should include for medical components
   - What to validate in UDI laser marking for reusable or traceable devices
   - How FAI, inspection records, and drawing revision control reduce supplier risk

3. Add FAQ sections to each canonical page.
   - Use 5-8 real buyer questions per page.
   - Start each answer with a direct 40-80 word response.
   - Follow with "what to ask your supplier" and "what evidence to request."
   - Avoid making claims about Lifetrek unless stakeholders have confirmed the exact capability.

4. Implement structured data.
   - Add `FAQPage` JSON-LD where FAQ content is visible on the page.
   - Keep `BlogPosting`, `BreadcrumbList`, and canonical URLs on answer pages.
   - Add or improve `Organization` schema with consistent identity: Lifetrek Medical, Indaiatuba, Sao Paulo, Brazil.
   - For resources, add appropriate schema such as `TechArticle`, `HowTo`, or `Dataset` only when the page content truly matches the schema.

5. Fix crawlability and discovery.
   - Include all published answer pages and public resources in the sitemap.
   - Add `llms.txt` with the strongest answer pages and resources.
   - Update `robots.txt` with explicit AI crawler guidance for public content.
   - Ensure public resource pages expose useful text before any gated download.

6. Update admin/content workflow.
   - Require `pillar_keyword`, `entity_keywords`, `icp_primary`, `funnel_stage`, and `cta_mode` for answer pages.
   - Add an approval checklist for regulated claims, evidence claims, operational SLAs, and customer references.
   - Add a content type/tag for "FAQ/AIEO answer page."

## FAQ Question Bank

### Supplier Qualification

- How do you qualify a medical-device contract manufacturer under ISO 13485?
- What documents should an OEM request before approving a manufacturing supplier?
- What should be included in a quality agreement before production release?
- How often should critical medical-device suppliers be audited?
- What are warning signs that a supplier is not ready for regulated production?

### Transfer And Scale-Up

- What should happen before transferring a SKU from NPI to production?
- Why start with a pilot lot before full production transfer?
- What should a production transfer package include?
- How do you prevent drawing-revision drift during supplier transfer?
- What evidence should a supplier provide before scaling a family of parts?

### Validation, FAI, And Inspection

- What is the difference between FAI, IQ, OQ, and PQ?
- When is a full FAI package useful for medical components?
- What should be included in a pilot-lot inspection package?
- How does CMM inspection reduce launch risk?
- What should happen if a validated machining program changes?

### Traceability, UDI, And Labeling

- What should full lot traceability include for medical components?
- What evidence should support UDI laser marking validation?
- How can incorrect or missing UDI information affect recall execution?
- What should be checked before releasing labels or marked parts?
- How do CoC, material certs, and inspection summaries work together?

### Cleanliness, Packaging, And Containment

- When does a medical component need cleanroom handling?
- What cleanliness and packaging risks should OEMs discuss with suppliers?
- What should happen when a suspect lot is found?
- What does a good containment response look like?
- How should suppliers document quarantine and disposition decisions?

## Low-Risk Copy Patterns

Use these after confirming they match actual Lifetrek practice:

- "documented change control"
- "traceable lot release"
- "pilot-first transfer"
- "revision-controlled drawing release"
- "shared audit readiness"
- "validated process summaries on request"
- "defined containment response windows"
- "lot genealogy package available for release review"

Avoid:

- "zero defects"
- "never late"
- "guaranteed audit pass"
- "FDA-approved manufacturing"
- "recall-proof"
- "eliminates all supplier risk"
- "validated for every device type" unless the exact scope is documented

## Stakeholder Questions To Ask Before Publishing Claims

Ask quality/regulatory:

1. Can we publicly state that no production release happens before a signed quality agreement, defined responsibilities, and audit rights are in place?
2. Can we claim that every controlled drawing sent to production is logged, acknowledged, and revision-matched?
3. Which validation summaries can we say are available on request: IQ, OQ, PQ, cleaning validation, marking validation, packaging validation, or process-specific qualification summaries?
4. What exact containment/CAPA response windows are approved for public language?
5. Can we publicly describe hold/quarantine rules for suspect lots?
6. What wording is approved for ISO 13485, ANVISA, cleanroom, UDI, and traceability claims?

Ask operations/manufacturing:

1. Can we commit publicly to notifying customers before changes to site, sub-tier suppliers, validated programs, or critical processes?
2. What pilot-lot or single-SKU transfer approach is standard enough to publish?
3. What does a typical FAI package include today?
4. Can we describe capacity review, bottleneck review, or run-at-rate evidence before scaling?
5. Which raw-material risk reviews, alternates, or safety-stock practices are safe to mention?

Ask sales/customer leadership:

1. Which buyer anxieties are most common in current sales calls: delay, audit risk, traceability, UDI, validation evidence, IP, cost, or transfer complexity?
2. Which FAQs should be written in Portuguese first, English first, or both?
3. Can we publish anonymous examples or case-style proof without naming customers?
4. Which companion CTAs are approved: audit checklist, transfer checklist, traceability checklist, or technical diagnostic?
5. Which claims should route to a sales conversation instead of being stated directly on the website?

Ask legal/compliance:

1. Are we allowed to compare local manufacturing risk against import risk using public recall/enforcement examples?
2. What disclaimers are required when discussing FDA warning letters, recalls, UDI, validation, or supplier audits?
3. Are there terms we should avoid because they imply regulatory approval, medical outcome guarantees, or legal responsibility?
4. Can we mention customer audit rights, open-book change-order pricing, or IP protection in public FAQs?

## SEO And AIEO Page Template

Each answer page should use this structure:

1. Direct answer in the first 40-80 words.
2. Short explanation of why the issue matters to OEM, quality, regulatory, or engineering teams.
3. Practical manufacturing-level process explanation.
4. Common failure modes from the report.
5. Questions to ask a supplier.
6. Evidence to request.
7. Lifetrek-specific capability section, only with approved claims.
8. FAQ section.
9. One focused CTA to a checklist, diagnostic, or consultation.

## Metadata Rules

- Title: include the buyer question and primary entity, e.g. "How to Qualify a Medical Device Manufacturing Supplier Under ISO 13485"
- Meta description: answer the risk and mention the proof type, e.g. "Learn what OEMs should verify before approving a medical-device manufacturing supplier: quality agreement, traceability, FAI, validation evidence, and change control."
- Entity keywords: Lifetrek Medical, ISO 13485, ANVISA, medical device contract manufacturing, precision machining, Swiss machining, UDI laser marking, traceability, cleanroom manufacturing, Indaiatuba, Brazil.
- Internal links: connect FAQ pages to service pages, blog posts, resources, and contact/diagnostic CTAs.
- External links: cite regulatory or public sources sparingly where needed; do not over-link competitor content.

## First Sprint Checklist

- [ ] Confirm stakeholder answers for the public-claim questions above.
- [ ] Draft the public FAQ question bank in Portuguese and English. PT-BR first pass is done; English localization is still pending.
- [x] Add FAQ schema support wherever visible FAQ blocks are rendered.
- [x] Add missing resource SEO metadata and structured data.
- [x] Generate or update sitemap coverage for blogs and public resources.
- [x] Add `llms.txt`.
- [x] Update `robots.txt` AI crawler guidance.
- [ ] Publish the first 3 canonical answer pages.
- [ ] Pair each page with one CTA resource.
- [ ] Run Search Console URL inspection and basic AI-crawler fetch checks.
- [x] Start a 30-query AIEO benchmark for ChatGPT, Perplexity, Google AI features, and classic SERP.

Implementation notes as of 2026-04-24:

- PT-BR content ideas were added in `docs/content/faq-seo-aieo-content-ideas-2026-04-24.json`.
- First answer-page drafts were added in `docs/content/faq-seo-aieo-first-answer-page-drafts-2026-04-24.md`.
- Stakeholder approval email draft was added in `docs/marketing/stakeholder-approval-email-faq-seo-aieo-2026-04-24.md`.
- The first 30-query AIEO benchmark was added in `docs/strategy/aieo-30-query-benchmark-2026-04-24.md`.
- Resource detail pages now expose a public preview before the unlock gate, keeping resource pages more crawlable while preserving lead capture for full content.
- Blog pages already support FAQ schema for visible FAQ sections; resource pages now support markdown FAQ schema when visible FAQ content is present.
- `scripts/generate-sitemap.ts`, `public/llms.txt`, and `public/robots.txt` already exist in the repo and cover the core AIEO discovery foundation.

## Recommended First 3 Pages

1. How to qualify a medical-device manufacturing supplier under ISO 13485
2. What a pilot lot should prove before production scale-up
3. What full batch traceability should include for medical components

These map directly to the highest-frequency fears in the report and can be written conservatively without relying on hard guarantees.
