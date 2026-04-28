# AEO Implementation Sprint

> Actionable implementation plan for a new Claude Code context window.
> Read this file first, then execute tasks in order.

## Background

The AEO (Answer Engine Optimization) execution plan lives at `docs/strategy/aeo-execution-plan.md`. It was written 2026-03-24 and audited 2026-04-02. Almost nothing has been implemented. This sprint covers the **Track A technical foundation** — the code changes that unblock everything else.

## Pre-flight

Before starting, run:

```bash
npm run dev:web
```

Use `BlogPostDetails.tsx:152-244` as the reference pattern for Helmet + JSON-LD implementation. It already has full SEO: meta tags, OG, Twitter cards, BlogPosting schema, BreadcrumbList schema, and conditional FAQPage schema.

---

## Task 1: Remove resource allowlist (quick win)

**File:** `src/pages/Resources.tsx`

**Problem:** Lines 28-35 define a hardcoded `APPROVED_RESOURCE_SLUGS` Set with 6 slugs. Line 48-50 filters all resources through this set. Published resources not in the set are invisible.

**Fix:**
1. Delete the `APPROVED_RESOURCE_SLUGS` constant (lines 28-35)
2. Remove the `isApproved` check from the filter (line 48-50)
3. The `useResources(true)` hook already filters by published status — that's sufficient

**After:** All published resources should appear on `/resources`.

**Verify:** Check `/resources` in browser — should show more than 6 resources (there are 4 published + 2 approved in the DB).

---

## Task 2: Add Helmet + SEO to ResourceDetail (medium)

**File:** `src/pages/ResourceDetail.tsx`

**Problem:** No Helmet component, no meta tags, no OG tags, no canonical URL, no structured data. Crawlers see only the SPA shell.

**Fix:**
1. Add `import { Helmet } from "react-helmet-async"` (already a project dependency — used in BlogPostDetails)
2. After the resource data loads, add a `<Helmet>` block inside the return JSX with:
   - `<title>{resource.title} | Lifetrek Medical</title>`
   - `<meta name="description" content={resource.description} />`
   - `<meta name="robots" content="index, follow" />`
   - `<link rel="canonical" href={canonicalUrl} />` where canonicalUrl = `https://lifetrek-medical.com/resources/${resource.slug}`
   - OG tags: `og:title`, `og:description`, `og:type` (article), `og:url`, `og:locale` (pt_BR), `og:site_name`
   - Twitter card tags
   - JSON-LD `BreadcrumbList` schema: Home > Resources > {title}
   - JSON-LD structured data appropriate to resource type:
     - For `type: 'guide'` → use `@type: "Article"` or `"TechArticle"`
     - For `type: 'checklist'` → use `@type: "HowTo"` with steps extracted from markdown headings
     - For `type: 'calculator'` → use `@type: "WebApplication"`

**Reference:** See `BlogPostDetails.tsx:152-244` for the exact Helmet pattern.

**Note:** `ResourceDetail.tsx` also has a `LEAD_MAGNET_PDF_SLUGS` set (line 21-25) — this is a separate gating mechanism for PDF downloads and should NOT be removed. It only gates the download button, not the content visibility.

---

## Task 3: Add Helmet + SEO to Resources listing page (quick)

**File:** `src/pages/Resources.tsx`

**Fix:** Add a simple `<Helmet>` block:
- `<title>Recursos Técnicos | Lifetrek Medical</title>`
- `<meta name="description" content="Checklists, guias e calculadoras para fabricação de dispositivos médicos. Recursos técnicos gratuitos da Lifetrek Medical." />`
- `<link rel="canonical" href="https://lifetrek-medical.com/resources" />`
- OG tags matching the above

---

## Task 4: Create `llms.txt` (quick win)

**File to create:** `public/llms.txt`

**Content:** This file tells LLMs what the site is about. Follow the emerging `llms.txt` spec. Include:

```
# Lifetrek Medical

> Lifetrek is a Brazilian medical device manufacturer specializing in precision CNC machining of orthopedic implants and surgical instruments, operating under ISO 13485 in an ISO 7 cleanroom environment.

## About

Lifetrek manufactures orthopedic implants and surgical instruments using Swiss-type CNC machining, 5-axis milling, and wire EDM. The facility includes ISO 7 cleanrooms, ZEISS CMM metrology, electropolishing, and laser marking with full UDI traceability.

## Key Topics

- Medical device manufacturing and supplier qualification
- ISO 13485 quality management systems
- ISO 7 cleanroom manufacturing for medical devices
- Swiss machining and precision CNC for medical components
- Titanium and 316L stainless steel processing
- CMM inspection and metrology for medical tolerances
- UDI laser marking and batch traceability
- Electropolishing and surface finishing
- NPI to production transfer for medical items, projects, and part families
- Import vs local manufacturing in Brazil

## Content

- Blog: https://lifetrek-medical.com/blog
- Resources: https://lifetrek-medical.com/resources
- Capabilities: https://lifetrek-medical.com/capabilities
- Products: https://lifetrek-medical.com/products

## Contact

- Website: https://lifetrek-medical.com
- Location: Indaiatuba, SP, Brazil
```

---

## Task 5: Update `robots.txt` with AI-crawler directives (quick win)

**File:** `public/robots.txt`

**Current state:** Only lists Googlebot, Bingbot, Twitterbot, facebookexternalhit. No AI-crawler guidance.

**Fix:** Add explicit AI-crawler rules. We WANT AI crawlers to index public content. Add these blocks before the existing content:

```
# AI Crawlers - Welcome to index public content
User-agent: GPTBot
Allow: /
Disallow: /admin
Disallow: /admin/*

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /
Disallow: /admin
Disallow: /admin/*

User-agent: Amazonbot
Allow: /
Disallow: /admin

User-agent: anthropic-ai
Allow: /
Disallow: /admin

User-agent: Bytespider
Allow: /
Disallow: /admin
```

Keep all existing rules. Add `Sitemap` reference to `llms.txt` as well:
```
# AI manifest
llms.txt: https://lifetrek-medical.com/llms.txt
```

---

## Task 6: Dynamic sitemap generation (medium)

**Problem:** `public/sitemap.xml` is static with 11 hardcoded pages. Blog detail pages and resource detail pages are not included, so crawlers cannot discover them.

**Approach:** Create a build-time script that generates the sitemap from Supabase data. The script should:

1. Create `scripts/generate-sitemap.ts`
2. Query `blog_posts` where `status = 'published'` — get slugs and `updated_at`
3. Query `resources` where `status = 'published'` — get slugs and `updated_at`
4. Generate XML combining:
   - The existing 11 static pages
   - `/blog/{slug}` for each published blog post
   - `/resources/{slug}` for each published resource
5. Write to `public/sitemap.xml`
6. Add an npm script: `"generate:sitemap": "npx tsx scripts/generate-sitemap.ts"`

**Environment:** The script needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from `.env`.

**Important:** The sitemap should be regenerated as part of the build process or on a schedule. Add a note in the script header about this.

---

## Task 7: AEO metadata fields in admin blog editor (medium)

**File:** `src/pages/Admin/AdminBlog.tsx`

**Problem:** The blog type system defines `pillar_keyword`, `entity_keywords`, and `cta_mode` (`src/types/blog.ts:34-36`). The approval flow already enforces `pillar_keyword` and `icp_primary` (`src/hooks/useBlogPosts.ts:168-171`). But the admin editor UI has no form fields for these — users cannot fill them.

**Fix:**
1. Read the current editor state shape in `AdminBlog.tsx` (around line 78-102)
2. Add form fields for:
   - `pillar_keyword` (text input) — the primary keyword this post targets
   - `entity_keywords` (tag input or comma-separated text) — related entity keywords
   - `cta_mode` (select: "article_only" | "diagnostico" | "resource_optional") — CTA strategy
3. Wire these fields to save into the post's `metadata` JSONB column
4. `icp_primary` already has some handling (line 71) — verify it has a visible UI field too

**Note:** The approval blocker at `src/components/admin/content/approvalBlockers.ts:79` already checks `pillar_keyword`. Adding the editor field means users can actually satisfy this requirement through the UI.

---

## Verification Checklist

After completing all tasks:

- [ ] `/resources` shows all published resources (not just 6)
- [ ] `/resources/:slug` has proper meta tags in page source (check with View Source or browser dev tools Elements > head)
- [ ] `/resources/:slug` has JSON-LD structured data visible in page source
- [ ] `https://lifetrek-medical.com/llms.txt` is accessible
- [ ] `robots.txt` includes AI-crawler directives
- [ ] `sitemap.xml` includes blog and resource detail URLs
- [ ] Admin blog editor shows fields for `pillar_keyword`, `entity_keywords`, `cta_mode`
- [ ] Run `npm run build` to confirm no build errors

## What This Sprint Does NOT Cover

These are Track B/C items for a follow-up sprint:

- Publishing the 12 canonical AEO pages (content work, not code)
- Reviewing/unblocking 22 pending_review blog posts (manual review)
- 30-query benchmark creation and citation tracking (measurement)
- Prerender/SSR evaluation for SPA crawlability (architectural decision)
- Forum/Reddit answer distribution cadence (operational)
