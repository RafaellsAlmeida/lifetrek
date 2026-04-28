# Lifetrek AEO Execution Plan

## Objective

Turn Lifetrek's existing technical credibility into a repeatable Answer Engine Optimization system that:

- wins citations for high-intent manufacturing questions,
- routes technical buyers into the existing funnel,
- improves discoverability without inventing a new content stack.

This plan is based on:

- `deep-research-report.md`
- the current Lifetrek content strategy and resource backlog
- the current public-site/codebase implementation
- current external guidance verified on 2026-03-24

## What We Can Use Immediately

### 1. `blog_posts` is already the best Answer Hub surface

The blog system already supports:

- canonical URLs
- OG/Twitter metadata
- `BlogPosting` schema
- breadcrumb schema
- auto-generated `FAQPage` schema when the article includes FAQ headings
- SEO title/description/keywords
- ICP + funnel metadata in the data model

Conclusion:
Use blog posts as the canonical, public, indexable answer pages.

### 2. `resources` is already the best BOFU companion surface

The resource system already supports:

- guides
- checklists
- calculators
- markdown content
- tables
- mermaid
- downloads
- interactive blocks
- approval workflow

Conclusion:
Use resources as downloadable companions, calculators, and evidence packs, not as the main answer-engine landing page.

### 3. The content operation already exists

Lifetrek already has:

- admin blog workflow
- content approval workflow
- resource workflow
- blog topic backlog
- lead magnet backlog
- LinkedIn/orchestrator motion

Conclusion:
We do not need new architecture. We need to re-map the current system around AEO.

## Current Gaps Blocking AEO

### Technical gaps

1. `/resources` and `/resources/:slug` do not currently have route-level SEO head tags and structured data.
2. resource detail content is gated, so crawlers likely see teaser content instead of the actual answer asset.
3. `public/sitemap.xml` is static and does not include published blog detail pages or resource detail pages.
4. `public/robots.txt` is permissive, but it has no explicit AI-crawler guidance.
5. there is no `llms.txt`.
6. the public site is a client-rendered SPA, which increases risk for answer-engine fetchers that do limited JS execution.

### Content-operation gaps

1. the admin blog editor does not expose all metadata required to reliably approve/publish AEO-ready posts (`icp_primary`, `pillar_keyword`, `entity_keywords`, `cta_mode`).
2. `/resources` uses a hardcoded allowlist, so published resources can still remain undiscoverable.
3. resources are positioned like lead magnets, but the research report's best answer-engine opportunities need public, extractable text first.

## AEO Operating Model

### Core rule

Public answer first. Gated asset second.

### Channel roles

| Surface | Role in AEO system | Rule |
| --- | --- | --- |
| `blog_posts` | Canonical answer pages | Fully public, indexable, structured, FAQ-enabled |
| `resources` | BOFU upgrade | Checklist, calculator, template, glossary, evidence pack |
| LinkedIn | Distribution + corroboration | One post points to one canonical answer page |
| Forums/Reddit/Quora-style answers | Demand capture | Helpful answer, cite the canonical page when relevant |

### Required answer-page structure

Every canonical AEO page should follow this shape:

1. direct answer in 40-80 words
2. why it matters for OEM/engineering/quality
3. how the process works at manufacturing level
4. common failure modes
5. what to ask a supplier
6. what Lifetrek can document or validate
7. FAQ section
8. CTA to one relevant resource or technical diagnostic

## Priority Topic Clusters

These are the clusters already supported by the current backlog and Lifetrek proof points.

### Cluster 1: Supplier qualification and ISO 13485

- qualifying a medical machining supplier
- ISO 13485 audit readiness
- supplier validation framework
- traceability expectations

### Cluster 2: Cleanroom and contamination control

- what ISO 7 changes operationally
- which process steps need controlled environment
- packaging/handling/gowning logic

### Cluster 3: Swiss machining, tolerance, metrology

- when Swiss turning is the right choice
- what tolerances are realistic
- how CMM inspection reduces supplier risk

### Cluster 4: Materials and finishing

- titanium vs 316L selection
- electropolishing / surface finishing
- cleanability / corrosion / durability concerns

### Cluster 5: Traceability, UDI, and validation

- permanent marking durability
- lot traceability fields
- validation evidence expectations

## First 12 Canonical AEO Pages

These can be produced from the existing topic and resource system without new architecture.

| Priority | Canonical page (`blog_posts`) | Companion asset (`resources`) | Funnel role |
| --- | --- | --- | --- |
| P0 | How to qualify a medical device manufacturing supplier under ISO 13485 | `checklist-auditoria-fornecedores-medicos` | MOFU/BOFU |
| P0 | ISO 7 cleanroom manufacturing for medical devices: what actually changes | `guia-sala-limpa-iso-7` | MOFU |
| P0 | UDI laser marking that survives sterilization: what to validate | `checklist-rastreabilidade-serializacao` | BOFU |
| P0 | Swiss machining for medical components: when it is the right process | `whitepaper-usinagem-suica-dispositivos-medicos` | MOFU |
| P0 | Medical machining tolerances: what is realistic and what drives cost | `guia-metrologia-3d-cnc-swiss` | MOFU |
| P0 | ZEISS CMM inspection in medical manufacturing: what buyers should ask | `guia-metrologia-alta-precisao` | BOFU |
| P1 | Titanium Ti-6Al-4V vs 316L for implants and instruments | evidence pack resource | MOFU |
| P1 | How to transfer a medical item or project from NPI to production without surprises | `checklist-transferencia-npi-producao` | BOFU |
| P1 | Cost of poor quality in regulated machining: how to quantify supplier risk | `calculadora-custo-falha-qualidade` | BOFU |
| P1 | Import vs local manufacturing in Brazil: how to evaluate risk and lead time | `roadmap-90-dias-migracao-skus` | MOFU/BOFU |
| P1 | Internal ISO 13485 audit vs supplier audit: what is different | `checklist-auditoria-iso-13485` | MOFU |
| P1 | What full batch traceability should look like in practice | traceability glossary resource | BOFU |

## 14-Day Plan

### Track A: Technical foundation

1. add route-level SEO head tags to `/resources` and `/resources/:slug`
2. add resource structured data suitable for guide/checklist/calculator pages
3. replace the static sitemap with generated coverage for published blogs and resources
4. add `llms.txt`
5. update `robots.txt` with explicit AI-crawler notes without blocking public content
6. remove the hardcoded resource allowlist

### Track B: Content operation

1. expose AEO metadata fields in the admin blog editor
2. define a standard AEO blog template
3. define a standard AEO resource metadata contract
4. map the current backlog into the 5 AEO clusters
5. draft the first 3 canonical pages and their paired resources

### Track C: Measurement

1. create a 30-query benchmark set
2. track weekly citation presence for ChatGPT, Perplexity, Google AI features, and classic SERP
3. review Search Console impressions/clicks for answer pages
4. log branded query growth and resource-assisted conversions

## 30-60-90 Day Rollout

### Day 30

- 3 canonical answer pages live
- 3 companion resources aligned
- generated sitemap live
- `llms.txt` live
- resource metadata live
- query benchmark running weekly

### Day 60

- 10 canonical answer pages live
- 6 BOFU resources aligned
- LinkedIn cadence tied to answer pages
- forum-answering cadence running weekly
- first internal citation-share review complete

### Day 90

- 20+ canonical answer pages live
- 8-10 evidence/checklist/calculator assets aligned
- topic cluster coverage complete across the 5 priority clusters
- monthly optimization cycle running from evidence, not intuition

## Repo-Backed Implementation Backlog

### Highest-value code changes

1. Add route SEO to:
   - `src/pages/Resources.tsx`
   - `src/pages/ResourceDetail.tsx`

2. Replace static sitemap approach:
   - `public/sitemap.xml`
   - new generation path from published `blog_posts` and `resources`

3. Remove hidden discoverability blocker:
   - `src/pages/Resources.tsx`

4. Expose missing blog AEO metadata in admin:
   - `src/pages/Admin/AdminBlog.tsx`
   - related save/update flows

5. Create AI-readable site manifest:
   - `public/llms.txt`

### Important follow-on work

1. decide whether resource body stays fully public and only download/export is gated
2. evaluate prerender/static publishing for key public answer pages
3. expand site-wide entity schema beyond the homepage default in `index.html`

## Continuous Improvement Loop

### Weekly loop

1. Run the fixed 30-query benchmark.
2. Record:
   - whether Lifetrek appears
   - which page is cited
   - which competitors co-appear
   - whether the cited page is blog, resource, LinkedIn, or another surface
3. Review new Search Console data.
4. Improve the bottom 3 pages by:
   - sharpening direct answers
   - improving FAQ coverage
   - tightening titles/descriptions
   - pairing a better BOFU asset

### Monthly loop

1. review crawler guidance and AI-surface changes
2. review topic gaps from sales calls and unanswered search/forum questions
3. publish 2-4 new pages in uncovered clusters
4. retire weak topics that do not show citation or conversion potential

### Quality rule

Do not scale content volume faster than SME review, factual validation, and metadata quality can support.

## External Guidance Verified On 2026-03-24

These points should guide implementation:

1. Google allows generative-AI-assisted content, but warns that generating many pages without added user value can violate scaled-content abuse rules.
2. Google explicitly says metadata and structured data must remain accurate for AI-assisted content.
3. Google FAQ rich results are currently limited; FAQ sections are still useful for extractability, but should not be treated as a guaranteed SERP feature.
4. OpenAI and Perplexity both publish crawler-specific guidance, so AEO needs bot-aware crawl verification rather than generic SEO assumptions.
5. `llms.txt` is an emerging optional standard, not a replacement for structured data, sitemaps, or crawlability.

## Recommended Next Move

Implement the first AEO sprint in this order:

1. remove resource discoverability blockers
2. add SEO/schema to resource routes
3. add `llms.txt`
4. expose missing blog metadata fields in admin
5. publish the first 3 canonical answer pages paired to existing resources

If we do only those five things first, the plan becomes operational instead of theoretical.

---

## Implementation Status (audited 2026-04-02)

### Track A: Technical Foundation

| # | Item | Status | Notes |
|---|------|--------|-------|
| A1 | SEO head tags on `/resources` and `/resources/:slug` | NOT DONE | `ResourceDetail.tsx` has no Helmet, no meta/OG tags, no canonical. Blog pages (`BlogPostDetails.tsx:152-244`) have full Helmet+JSON-LD — use as reference pattern |
| A2 | Resource structured data (JSON-LD) | NOT DONE | No schema.org markup on ResourceDetail. Blog has `BlogPosting`, `BreadcrumbList`, `FAQPage` schemas |
| A3 | Dynamic sitemap | NOT DONE | `public/sitemap.xml` is static with 11 hardcoded pages. No `/blog/:slug` or `/resources/:slug` URLs. No generation script exists |
| A4 | `llms.txt` | NOT DONE | File does not exist |
| A5 | `robots.txt` AI-crawler guidance | NOT DONE | No GPTBot, ChatGPT-User, PerplexityBot, ClaudeBot directives. Only traditional bots listed |
| A6 | Resource allowlist removed | NOT DONE | `src/pages/Resources.tsx:28-35` has hardcoded `APPROVED_RESOURCE_SLUGS` Set with 6 slugs. Line 48-50 filters all resources through this set. This blocks all other published resources from appearing on the public site |

### Track B: Content Operation

| # | Item | Status | Notes |
|---|------|--------|-------|
| B1 | AEO metadata in admin blog editor | PARTIAL | TypeScript types exist in `src/types/blog.ts:34-36` (`cta_mode`, `pillar_keyword`, `entity_keywords`). Approval/publish flows enforce `pillar_keyword` + `icp_primary` (`src/hooks/useBlogPosts.ts:168-171`). `AdminBlog.tsx` reads `icp_primary` from metadata (line 71). BUT: no UI form fields exist in the editor to set `pillar_keyword`, `entity_keywords`, or `cta_mode` — users cannot fill these via the admin UI |
| B2 | Standard AEO blog template | NOT DONE | |
| B3 | Standard AEO resource metadata contract | NOT DONE | |
| B4 | Backlog mapped to 5 AEO clusters | NOT DONE | |
| B5 | First 3 canonical pages drafted | 1 OF 12 | One ISO 7 post exists in DB (`pending_review`, created 2026-02-12). 6 markdown drafts exist in `docs/content/drafts/` but are not published to `blog_posts` table |

### Track C: Measurement

| # | Item | Status |
|---|------|--------|
| C1 | 30-query benchmark set | NOT DONE |
| C2 | Weekly citation tracking | NOT DONE |
| C3 | Search Console monitoring | NOT DONE |
| C4 | Branded query / conversion logging | NOT DONE |

### Content Pipeline State (2026-04-02)

| Type | Published | Approved | Pending Review | Draft |
|------|-----------|----------|----------------|-------|
| Blog posts | 1 | 2 | 22 | 6 |
| Resources | 4 | 2 | 10 (pending_approval) | — |

### Key File References

| File | Role |
|------|------|
| `src/pages/BlogPostDetails.tsx:152-244` | Reference pattern — has full Helmet + 3 JSON-LD schemas |
| `src/pages/ResourceDetail.tsx` | Target — needs Helmet + JSON-LD added |
| `src/pages/Resources.tsx:28-50` | Target — allowlist to remove |
| `src/pages/Admin/AdminBlog.tsx` | Target — needs AEO metadata form fields |
| `src/types/blog.ts:34-36` | AEO metadata types already defined |
| `src/hooks/useBlogPosts.ts:168-171, 227-230` | Approval/publish enforcement already checks `pillar_keyword` + `icp_primary` |
| `src/components/admin/content/approvalBlockers.ts:79` | Approval blocker already validates `pillar_keyword` |
| `public/sitemap.xml` | Target — replace with dynamic generation |
| `public/robots.txt` | Target — add AI-crawler directives |
| `docs/content/drafts/` | 6 markdown drafts available for conversion to blog_posts |

### Overall Progress

~5-10% complete. The plan (written 2026-03-24) is still theoretical. None of the 14-day sprint items have been executed. See `docs/strategy/aeo-implementation-sprint.md` for the actionable implementation plan.
