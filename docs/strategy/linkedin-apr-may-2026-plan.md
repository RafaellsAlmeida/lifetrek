# LinkedIn & Content Strategy: April–May 2026

**Based on Q1 2026 Performance Review | Created 2026-04-02**

---

## 1. Performance Summary (Jan–Mar 2026)

### Aggregate Numbers

| Metric | Jan | Feb | Mar | Q1 Total |
|--------|-----|-----|-----|----------|
| Posts | 8 | 9 | 9 | 26 |
| Impressions | 2,930 | 1,459 | 2,564 | 6,953 |
| Clicks | 218 | 123 | 124 | 465 |
| Reactions | 67 | 54 | 94 | 215 |
| Comments | 3 | 1 | 2 | 6 |
| Reposts | 4 | 4 | 1 | 9 |
| Wt. CTR | 7.44% | 8.43% | 4.83% | ~6.7% |
| Avg Engagement | 10.19% | 16.17% | 10.94% | ~12.4% |
| Avg Reactions/Post | 8.4 | 6.0 | 10.4 | 8.3 |

### Follower Growth

| Month | New Followers | Cumulative |
|-------|-------------|------------|
| Jan | 63 | 63 |
| Feb | 22 | 85 |
| Mar | 16 | 101 |
| **Total** | — | **146** |

Growth is decelerating: -65% Jan→Feb, -27% Feb→Mar. Initial launch spike has faded. Organic growth needs new fuel.

### Follower Quality (Top Industries)

- Medical Equipment Manufacturing: **32.2%** (47 followers) — on ICP
- Hospitals and Health Care: 6.8%
- Machinery Manufacturing: 6.8%
- Engineering job function: 14.4%, Operations: 14.4%, Biz Dev: 12.3%

### Page Visitor Quality (Warning)

- **24.3%** Medical Equipment Mfg — good
- **18.4%** IT Services & Consulting — off-ICP noise
- **36.2%** Sales function, only **5.3%** Engineering — visitors skew toward salespeople, not our ICP (engineers/quality/ops leaders)
- **66.9%** Entry-level seniority — not the decision-makers we target

### Top 5 Posts by Impressions (Q1)

| # | Post | Date | Impr | Reactions | Eng% | Format |
|---|------|------|------|-----------|------|--------|
| 1 | Lançamento do site | Jan 09 | 833 | 13 | 9.84% | Image |
| 2 | Vaga operador de usinagem | Jan 09 | 569 | 9 | 8.61% | Image |
| 3 | Metrologia ZEISS CMM | Feb 16 | 537 | 17 | 4.84% | Image |
| 4 | Geometria complexa — Citizen L20/M32 | Mar 12 | 470 | 15 | 7.23% | Image |
| 5 | A física por trás da validação 3D + CNC | Jan 27 | 346 | 10 | 6.07% | Image |

**Pattern**: Equipment-specific content (ZEISS CMM, Citizen CNC) consistently outperforms generic capability messaging. The audience responds to "show me the machine," not "trust our quality."

### Top 5 Posts by Engagement Rate (Q1)

| # | Post | Date | Impr | Eng% | Comments |
|---|------|------|------|------|----------|
| 1 | Importado vs produção local | Feb 27 | 15 | 46.67% | 0 |
| 2 | P&D e medicina personalizada | Jan 22 | 225 | 30.22% | 0 |
| 3 | Sala limpa e controle de contaminação | Feb 05 | 310 | 29.35% | 1 |
| 4 | Protótipo para produção em escala | Mar 04 | 180 | 22.22% | 0 |
| 5 | 5 riscos supply chain 2026 | Jan 23 | 188 | 13.3% | 1 |

---

## 2. Critical Patterns & Diagnosis

### Pattern 1: Zero Comments Problem

**6 total comments across 26 posts.** This is the single biggest algorithmic bottleneck. LinkedIn's algorithm weighs comments 5–10x more than reactions. Our engagement is reaction-heavy, which signals appreciation but not thought-leadership resonance.

- 20 of 26 posts (77%) received zero comments
- Only 4 posts ever received a comment
- No post received more than 2 comments

**Root cause**: Posts end with brand statements ("Engenharia de Precisão a Serviço da Vida") or vague CTAs ("Reduza seu risco regulatório") instead of questions that invite professional dialogue.

### Pattern 2: Equipment-Specific Content Wins

Posts naming specific equipment (ZEISS CMM, Citizen L20/M32, Swiss-Type) average **~450 impressions** vs ~190 for generic capability posts. LinkedIn's B2B audience wants technical specificity, not marketing claims.

### Pattern 3: Video is Underutilized

The one video post (Sala Limpa ISO 7, Mar 10) earned 267 impressions, 1 repost, 10 reactions. It held its own against image posts while LinkedIn algorithmically favors native video with higher distribution. We have a full Remotion video pipeline (`remotion/`) that is underutilized: LifetrekVignette, SalaLimpaTour, SwissTurningTour, MasterShowcase, KineticText compositions all exist.

### Pattern 4: Visitor-ICP Mismatch

Our followers are 32% Medical Equipment Manufacturing (good), but page visitors are dominated by IT Services (18.4%), Sales functions (36.2%), and Entry-level (66.9%). Content is attracting the wrong audience to our profile page.

### Pattern 5: Lead Magnets Are Invisible

We have 12 published/pending lead magnets on `/resources` but zero LinkedIn posts promote them. The funnel from LinkedIn → resource page has no bridge. Additionally, resources gate with an email form but deliver rendered Markdown instead of a polished PDF — low perceived value for the effort.

---

## 3. Strategic Changes for April–May 2026

### Change 1: Introduce Remotion Short Videos (2/month)

**Why**: Video performs well, uses our branded vignette, LinkedIn distributes it better, and it avoids the "CR credentials" carousel aesthetic fatigue.

**Specs**:
- 30–45 seconds, 1080×1080 square (LinkedIn feed optimized)
- Open with `LifetrekVignette` (first 3s, trimmed from the 7.5s comp)
- Core: Real facility B-roll or equipment photos with kinetic text overlay + subtle pan/zoom animation
- Close with branded end card
- Silent-friendly: all key messages readable without audio (subtitles/text burns)

**Implementation**:
- Create a new Remotion composition `LinkedInShort` in `remotion/compositions/` — 30fps, 900–1350 frames (30–45s)
- Accept props: `topic`, `slides[]` (text + background image path), `accentColor`
- Reuse existing `KineticText.tsx` patterns for text animation
- Pull background images from `product_catalog` storage (facility photos)
- Render via `npx remotion render LinkedInShort --props='...'`

**Content types that work as video**:
- Equipment in action (Citizen CNC cutting titanium, ZEISS CMM measuring)
- Clean room gowning/entry protocol walkthrough
- Macro close-ups of precision components with dimension callouts
- Before/after: raw titanium bar → finished implant component

### Change 2: Engineer Comment-Driving Closers (Every Post)

**Why**: Long-term branding play, not direct marketing. Comments are the currency that triggers algorithmic distribution. Zero comments = content dies in feed.

**Replace** brand statement closers with engineer-to-engineer questions:

| Instead of | Use |
|------------|-----|
| "Precisão é nosso diferencial" | "Na sua operação, qual tolerância mais apertada você já validou em Ti Gr5?" |
| "Reduza seu risco com parceiro local" | "Seu maior gargalo hoje é frete, lead-time, ou custo de requalificação?" |
| "Engenharia a Serviço da Vida" | "Você mediu o custo real de um setup extra? Quanto acumula em um lote de 5.000?" |

**Rules**:
- Question must be specific enough that only someone in the industry would answer
- Avoid yes/no questions — prompt for experience sharing
- Keep under 20 words
- Test 2 polls per month (LinkedIn gives polls extra distribution)

### Change 3: Reduce Posting Frequency from 9 to 8/month

**Why**: Quality over quantity. The deceleration from Feb→Mar suggests audience fatigue. At 146 followers, posting every 3 days means the same people see every post. Better to have 8 high-quality pieces that each earn comments than 9 that get silent reactions.

**Cadence**: 2 posts per week, Tuesday + Thursday, 8–10am BRT.

### Change 4: Equipment-First Content (Double Down)

**Why**: ZEISS CMM post (537 impr, 17 reactions), Citizen L20/M32 post (470 impr, 15 reactions) are our clear winners. The ICP (engineering directors, quality leaders) responds to specific machinery because it signals real capability, not marketing.

**Rule**: At least 4 of 8 monthly posts must name specific equipment, process parameters, or material grades in the headline.

**Equipment content queue**:
- Citizen L20 8-axis Swiss turning: live cutting demo (video)
- ZEISS CMM Contura/Accura inspection workflow
- Laser marking station: UDI compliance on Ti Gr5
- Electropolish line for surface finish Ra ≤ 0.4 μm
- Clean room ISO 7: particle monitoring system
- Grinding room: cylindrical grinding for ortho stems

### Change 5: Lead Magnet Promotion (1/month)

**Why**: We have 12 lead magnets that nobody downloads because there's no bridge from LinkedIn. Per our social media guidelines, explicit CTAs are allowed exclusively for lead magnet announcements.

**Execution**:
- 1 post per month is a carousel dedicated to previewing a lead magnet
- Carousel delivers 80% of the value (educational), last slide CTA: "Baixe o [recurso] completo — link na bio"
- Update LinkedIn profile featured section with the current month's promoted resource
- Rotate: April → `scorecard-risco-supply-chain-2026`, May → `checklist-transferencia-npi-producao`

**Website improvements needed**:
- Add PDF export to top 3 resources (polished branded PDF > rendered Markdown)
- Add "Featured Resource" inline card on topically related blog posts
- Shorten the unlock form: email-only (name/company optional) to reduce friction

### Change 6: Fix the Visitor-ICP Gap

**Why**: 36% of page visitors are in Sales functions, 67% Entry-level. Our ICP is engineering directors, quality managers, ops leaders.

**Actions**:
- Review LinkedIn company page "About" section — ensure it speaks to OEMs/engineering, not generic manufacturing
- Add ICP-specific keywords to the company tagline and specialties
- In post captions, use explicit audience callouts: "Para diretores de engenharia de OEMs:", "Se você lidera qualidade em dispositivos médicos:"
- Stop using generic hashtags (#Manufacturing) — focus on #DispositivosMedicos #ISO13485 #UsinagaoDePrecisao #ImplantesMedicos

---

## 4. April 2026 Content Calendar

### Week 1 (Apr 7–10)

| Day | Content | Format | Topic Category | ICP Target | Engagement Lever |
|-----|---------|--------|---------------|------------|-----------------|
| Tue 8 | Citizen L20 Swiss turning — live titanium cut | **Remotion Video** (35s) | Manufacturing & Validation | R&D / Engineering | "Qual geometria mais desafiadora você já produziu em Ti Gr5?" |
| Thu 10 | ISO 13485 audit readiness — 5 non-conformities we catch first | Carousel (Template A, 7 slides) | Quality & Compliance | Quality / Regulatory | "Na última auditoria, qual NC pegou seu time de surpresa?" |

### Week 2 (Apr 14–17)

| Day | Content | Format | Topic Category | ICP Target | Engagement Lever |
|-----|---------|--------|---------------|------------|-----------------|
| Tue 15 | Lead Magnet: Scorecard Risco Supply Chain 2026 | Carousel (Template B hook + A body, 7 slides) | Supply Chain & Scale | Supply Chain / CFO | **CTA**: "Baixe o scorecard completo — link na bio" |
| Thu 17 | Import vs local manufacturing: myth busting | Text + Image (Template C split) | Supply Chain & Scale | Executive Decision Makers | **Poll**: "Maior risco do seu sourcing hoje? A) Frete B) Lead-time C) Requalificação D) Câmbio" |

### Week 3 (Apr 21–24)

| Day | Content | Format | Topic Category | ICP Target | Engagement Lever |
|-----|---------|--------|---------------|------------|-----------------|
| Tue 22 | Clean Room ISO 7: particle monitoring walkthrough | **Remotion Video** (40s) | Manufacturing & Validation | Quality / Operations | "Sua sala limpa monitora partículas em tempo real ou por amostragem?" |
| Thu 24 | ZEISS CMM inspection: how we validate sub-10μm tolerances | Carousel (Template A, 6 slides) | Quality & Compliance | R&D / Engineering | "Qual a menor tolerância que você exige do seu fornecedor de usinagem?" |

### Week 4 (Apr 28–30)

| Day | Content | Format | Topic Category | ICP Target | Engagement Lever |
|-----|---------|--------|---------------|------------|-----------------|
| Tue 29 | Port-a-cath: from titanium bar to sterile kit — one partner | Carousel (Template B, 7 slides) | Personalized Solutions | Supply Chain / Ops | "Quantos fornecedores sua cadeia de kits cirúrgicos tem hoje?" |
| Thu 30 (Wed) | UDI laser marking: why marks degrade after sterilization | Image (Template A) | Manufacturing & Validation | Quality / Regulatory | "Já enfrentou problemas de legibilidade UDI pós-esterilização?" |

### May 2026 (Preview — Details TBD)

| Week | Video | Carousel/Image | Engagement Format | Lead Magnet |
|------|-------|---------------|-------------------|-------------|
| W1 | Electropolish line for Ra ≤ 0.4 μm | Grinding room: ortho stem finishing | — | — |
| W2 | — | NPI transfer checklist preview | — | **CTA**: `checklist-transferencia-npi-producao` |
| W3 | Laser marking live demo | DFM feedback loop: P&D + manufacturing | Poll: "Make vs Buy" | — |
| W4 | — | Scalability: prototype → 10k units | — | — |

---

## 5. Content Mix Target

| Category | % | Posts/Month | Q1 Actual |
|----------|---|------------|-----------|
| Educational (carousels, how-tos) | 50% | 4 | ~80% |
| Authority (equipment showcase, results) | 25% | 2 | ~20% |
| Engagement (polls, questions, myth-busting) | 12.5% | 1 | 0% |
| Lead Magnet Promotion | 12.5% | 1 | 0% |

---

## 6. Format Mix Target

| Format | Posts/Month | Q1 Actual |
|--------|-----------|-----------|
| Remotion Short Video (30–45s) | 2 | ~0.3 (1 in 3 months) |
| Carousel (5–7 slides) | 4 | ~3 |
| Single Image + Caption | 1 | ~5 |
| Poll / Text-Only | 1 | 0 |

---

## 7. Implementation Tasks

### Remotion Video Pipeline

- [x] Create `remotion/compositions/LinkedInShort.tsx` — accepts topic, slides[], accentColor props
- [x] Trim `LifetrekVignette` to 3s version for use as video intro
- [x] Build render script: `scripts/render-linkedin-short.ts` that takes a JSON brief and outputs MP4
- [x] Test with first video: "Citizen L20 Swiss turning titanium" using existing facility photos
- [x] Ensure 1080×1080 square output, silent-friendly with burned-in text

### Lead Magnet Improvements

- [x] Add PDF export to `scorecard-risco-supply-chain-2026` (branded, downloadable)
- [x] Add PDF export to `checklist-transferencia-npi-producao`
- [x] Add PDF export to `checklist-producao-local`
- [x] Simplify resource unlock form: email-only, name/company optional
- [x] Add inline "Featured Resource" component to topically related blog posts
- [ ] Update LinkedIn company page featured section with April's lead magnet

### LinkedIn Profile & Page Fixes

- [ ] Update company page "About" with ICP-specific language (OEMs, engineering, precision manufacturing)
- [ ] Update specialties/keywords to target engineering and quality directors
- [x] Add link-in-bio pointing to `/resources` with UTM tracking (`?utm_source=linkedin&utm_medium=organic&utm_campaign=apr-2026`)

### Analytics & Measurement

- [x] Query GA4 data in Supabase for LinkedIn referral traffic (source=linkedin.com)
- [x] Check `/resources` funnel: `resource_view` → unlock form → `resource_download` conversion rate
- [x] Add `post_format` field (video/carousel/image/poll) to seeded posts data for format-level analysis
- [x] Set up monthly review cadence in admin: first Monday reminder + operational checklist for LinkedIn XLS export and GA4 review (LinkedIn page exports remain manual)

---

## 8. Success Metrics (April–May)

| Metric | Q1 Baseline | April Target | May Target |
|--------|-------------|-------------|------------|
| Avg Comments/Post | 0.23 | ≥ 1.0 | ≥ 1.5 |
| Posts with ≥ 1 Comment | 23% | 50% | 60% |
| Avg Impressions/Post | 267 | 300 | 350 |
| Video Posts/Month | 0.3 | 2 | 2 |
| Lead Magnet Downloads | ~0 | 5 | 10 |
| New Followers/Month | 16 (Mar) | 25 | 30 |
| Visitor % Engineering Function | 5.3% | 10% | 15% |

### How to Measure

- **LinkedIn analytics**: Export XLS monthly via company page → Analytics → Content/Followers/Visitors
- **Lead magnet downloads**: Query `analytics_events` where `event_type = 'resource_download'` or `'lead_magnet_usage'`
- **GA4 referral**: Check `ga4_traffic_sources` for `source = 'linkedin.com'`
- **Monthly report**: Use admin dashboard at `/admin/analytics` → Monthly Marketing Report

---

## 9. Brand & Compliance Guardrails

All content must follow:

- `docs/brand/BRAND_BOOK.md` — colors, typography, voice
- `docs/brand/SOCIAL_MEDIA_GUIDELINES.md` — 4 approved visual templates only
- `docs/brand/VIDEO_GUIDELINES.md` — cinematic industrial video style
- `docs/marketing/MARKETING_STRATEGY_WORKING_DOC.md` — ICP definitions, message rules
- `docs/marketing_funnel_strategy.md` — funnel mapping, editorial rules

**Non-negotiable rules**:
- CTAs are prohibited on all posts except lead magnet announcements
- Always use real Lifetrek facility photos as backgrounds
- Professional, engineer-to-engineer tone — no marketing clichés
- Max 2 regulatory-focused posts in a row; alternate with process/quality/equipment
- Never overwrite existing carousel images — always version (per AGENTS.md)

---

## 10. Reference: Remotion Compositions Available

| Composition | Duration | Resolution | Status |
|-------------|----------|------------|--------|
| `LifetrekVignette` | 7.5s @ 30fps | 1080×1080 | Ready — use as intro/outro |
| `SalaLimpaTour` | TBD | TBD | Ready — clean room walkthrough |
| `SwissTurningTour` | TBD | TBD | Ready — CNC showcase |
| `MasterShowcase` | TBD | TBD | Ready — full production (silent/VO/full) |
| `KineticText` | TBD | TBD | Ready — text animation patterns |
| `AnimatedMap` | TBD | TBD | Ready — geographic context |
| **`LinkedInShort`** | 30–45s @ 30fps | 1080×1080 | **TO BUILD** — parameterized template |

---

## 11. Reference: Lead Magnets to Promote

| Month | Resource | Slug | ICP Match | Why This One |
|-------|----------|------|-----------|-------------|
| **April** | Scorecard de Risco de Supply Chain 2026 | `scorecard-risco-supply-chain-2026` | Supply Chain / CFO | Timely (tariff/logistics volatility), shareable scoring tool |
| **May** | Checklist de Transferência NPI → Produção | `checklist-transferencia-npi-producao` | Engineering / Ops | Practical, high perceived value for OEMs evaluating local partners |
| June (planned) | Guia de Validação de Fornecedor ANVISA/FDA | `guia-validacao-fornecedor-anvisa-fda` | Quality / Regulatory | Deep MOFU/BOFU content for qualified leads |

---

*Document generated from Q1 2026 LinkedIn Analytics review. Data sources: LinkedIn Content XLS (Jan–Mar 2026), LinkedIn Followers XLS (Mar 2026), LinkedIn Visitors XLS (Mar 2026), seeded post data in `useMonthlyMarketingReport.ts`.*
