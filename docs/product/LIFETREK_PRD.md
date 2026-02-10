# Lifetrek Medical - Product Requirements Document (PRD)
**Version 2.0 | December 2024**

---

## Executive Summary

Lifetrek Medical is building an intelligent web platform that combines:
1. **Premium Marketing Website** - Showcasing precision medical manufacturing capabilities
2. **Intelligent CRM System** - AI-powered lead scoring, qualification, and automated draft responses
3. **Administrative Tools** - Product image enhancement, carousel generation, pitch deck creation

### Core Business Objective
Transform inbound leads into qualified opportunities through AI-assisted sales intelligence, reducing manual qualification time while maintaining the consultative, partnership-oriented approach that defines Lifetrek's brand.

---

## Product Vision

### Mission
Deliver precision-engineered components that meet the most demanding quality standards in medical manufacturing, supported by intelligent digital tools that accelerate the sales cycle.

### Platform Goals
1. **Convert visitors to leads** - Professional website with clear CTAs and contact forms
2. **Qualify leads automatically** - AI scoring based on fit, volume, and readiness signals
3. **Accelerate response time** - AI-drafted replies in Brazilian Portuguese, ready for human review
4. **Enrich lead intelligence** - Company research, competitor detection, validation
5. **Streamline admin workflows** - Product images, content generation, sales presentations

---

## System Architecture

### Technology Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Lovable Cloud (Supabase) - PostgreSQL + Edge Functions
- **AI Services**: 
  - **Image Generation**: `google/gemini-3-pro-image-preview` (Nano Banana Pro) - ALWAYS use this model
  - **Text/Analysis**: `google/gemini-2.5-flash` via Lovable AI Gateway
  - **Lead Scoring & Email**: Custom prompts via Lovable AI
- **Authentication**: Supabase Auth with role-based access (admin/user)

### AI Model Policy
**CRITICAL**: All image generation tasks MUST use `google/gemini-3-pro-image-preview` (Nano Banana Pro). This is the designated model for all product image optimization, carousel generation, and visual content creation.

---

## Feature Specifications

### 1. Marketing Website (Public)

#### 1.1 Homepage
- Hero section with value proposition
- Capabilities overview (Swiss turning, 5-axis CNC, CMM inspection)
- Certifications display (ISO 13485, ANVISA)
- Client logos/testimonials
- Contact CTA

#### 1.2 Products/Services Pages
- Dental implants
- Orthopedic components
- Surgical instruments
- Veterinary implants
- Custom precision parts

#### 1.3 Company Pages
- About Us (30+ years history)
- Facilities (cleanroom, equipment)
- Quality & Certifications
- Contact form with intelligent routing

#### 1.4 Contact Form Fields
- Name, Email, Phone, Company
- Project types (multi-select: dental_implants, orthopedic_implants, spinal_implants, veterinary_implants, surgical_instruments, micro_precision_parts, custom_tooling, medical_devices, measurement_tools, other_medical)
- Annual volume estimate
- Technical requirements
- Message

---

### 2. Intelligent CRM System (Admin)

#### 2.1 Lead Management Dashboard
- Lead list with filtering (status, priority, project type, date range)
- Lead detail view with full history
- Status workflow: new → contacted → in_progress → quoted → closed/rejected
- Priority levels: low, medium, high
- Assignment to team members

#### 2.2 AI Lead Scoring (0-100 Scale)

**Scoring Criteria Weights:**
| Factor | Weight | Description |
|--------|--------|-------------|
| Website Quality | 20 | Professional website presence |
| LinkedIn Presence | 20 | Company LinkedIn activity/profile |
| Annual Volume | 15 | Prototype vs production, quantities |
| Project Complexity | 15 | Complex precision vs simple commodity |
| Company Size | 15 | SMB vs enterprise indicators |
| Industry Match | 15 | Medical/dental/vet/OEM vs unrelated |
| Technical Detail | 5 | Drawings provided, specifications |
| Form Completeness | 3 | All fields filled properly |
| Urgency Signals | 2 | Timeline indicators |

**Score Interpretation:**
- **80-100 (Ideal Fit)**: Medical/dental OEM, production volumes, ISO requirements, clear project
- **70-79 (Strong Fit)**: Good market fit, moderate volume, some requirements unclear
- **50-69 (Moderate Fit)**: Adjacent market, prototype only, or missing key info
- **30-49 (Low Fit)**: Vague requirements, commodity parts, no regulatory needs
- **0-29 (Poor Fit)**: Unrelated industry, unrealistic expectations

#### 2.3 AI Draft Email Response

**Email Structure (Brazilian Portuguese):**

1. **GREETING & ACKNOWLEDGMENT** (2-3 sentences)
   - Thank by name
   - Reference company and project type

2. **QUALIFICATION QUESTIONS** (3-6 bullets)
   - Volumes (protótipo vs produção, quantidades)
   - Materials (Ti-6Al-4V, PEEK, inox 316L)
   - Drawings (2D/3D, samples)
   - Timeline (prototype and production)
   - Regulatory (ISO 13485, ANVISA, FDA, MDR)
   - Only ask what's missing

3. **COMPANY-SPECIFIC INSIGHTS** (2-3 sentences)
   - Reference their segment
   - Mention relevant Lifetrek experience

4. **VALUE PROPOSITION** (2-3 sentences)
   - ISO 13485, ANVISA approved
   - 100% CMM inspection
   - ISO 7 cleanroom packaging
   - Connect to their risk reduction

5. **CALL TO ACTION**
   - Clear next step: call scheduling, NDA, quote request
   - End with question

**Tone Guidelines:**
- Professional, technical, accessible
- Consultative, partnership-oriented
- Never promise price/timeline without drawings

#### 2.4 Company Research (Enrichment)
- Domain-based lookup
- Website summary extraction
- LinkedIn information
- Industry classification
- Key products identification
- Recent news mentions

#### 2.5 Lead Validation
- Email format validation
- Phone format validation
- Company domain verification
- Duplicate detection

---

### 3. Product Image Enhancement (Admin)

#### 3.1 Image Processing Pipeline
1. **Upload**: Accept multiple images (drag & drop)
2. **Analysis**: Auto-detect product name, category, brand, model
3. **Enhancement**: Transform to professional photoshoot quality
4. **Metadata**: Populate name, description, category
5. **Storage**: Persist to Supabase Storage with full metadata

#### 3.2 AI Image Model
**ALWAYS USE**: `google/gemini-3-pro-image-preview` (Nano Banana Pro)

**Default Enhancement Prompt:**
```
Transform this industrial product photo into a premium professional photograph.
Apply studio lighting, clean white/gradient background, sharp focus, 
commercial-grade presentation suitable for catalog or website use.
```

#### 3.3 Gallery Management
- Grid view with filtering by category
- Search by name/description
- Edit metadata (name, description, category, brand, model)
- Featured/visible toggles
- Bulk operations (delete, export)
- Download with intelligent naming

---

### 4. LinkedIn Carousel Generator (Admin)

#### 4.1 Carousel Creation
- Topic and target audience inputs
- Pain point and desired outcome
- Proof points and CTA
- Format selection

#### 4.2 Slide Generation
- AI-generated content per slide
- Visual styling matching brand
- Image integration via `google/gemini-3-pro-image-preview`

#### 4.3 Export
- PNG/PDF export options
- Copy-ready captions

---

### 5. Pitch Deck System (Admin)

#### 5.1 Slide Structure
1. Cover
2. Para Quem Fabricamos
3. O Problema
4. Nossa Promessa
5. O Que Fazemos
6. Como Fazemos (horizontal timeline)
7. Equipamentos de Manufatura
8. Laboratório de Metrologia
9. Cleanrooms
10. Clientes
11. Piloto de Baixo Risco
12. Próximos Passos
13. Contact/CTA

#### 5.2 Design Standards
- Premium minimalist aesthetic ($100k quality)
- 100% brand book adherence
- Blue dominant, orange/green as micro-accents only
- Glass morphism effects
- Two heading variations: gradient text OR blue with gradient underline
- Consistent slide dimensions

#### 5.3 Features
- Smooth fade/slide animations (framer-motion)
- Keyboard navigation (arrows)
- Professional PDF export
- Fullscreen presentation mode

---

## Database Schema

### Core Tables

```sql
-- contact_leads: Inbound inquiries
contact_leads (
  id, name, email, company, phone,
  project_type, project_types[], annual_volume,
  technical_requirements, message,
  status (new/contacted/in_progress/quoted/closed/rejected),
  priority (low/medium/high),
  lead_score, score_breakdown,
  admin_notes, assigned_to,
  created_at, updated_at
)

-- company_research: Enrichment data
company_research (
  id, domain, company_name,
  website_summary, linkedin_info,
  industry, key_products[],
  recent_news, researched_at, expires_at
)

-- ai_response_suggestions: Draft emails
ai_response_suggestions (
  id, lead_id, company_research_id,
  subject_line, email_body,
  key_points[], priority_level,
  follow_up_date, created_at
)

-- processed_product_images: Enhanced images
processed_product_images (
  id, original_url, enhanced_url,
  original_filename, name, description,
  category, brand, model,
  custom_prompt, is_featured, is_visible,
  file_size, processed_by, created_at
)

-- linkedin_carousels: Generated content
linkedin_carousels (
  id, admin_user_id,
  topic, target_audience, pain_point,
  desired_outcome, proof_points, cta_action,
  slides, caption, format,
  image_urls, generation_settings,
  is_favorite, performance_metrics
)
```

---

## Security & Access Control

### Authentication
- Email/password authentication via Supabase Auth
- Auto-confirm email signups enabled
- Session persistence

### Role-Based Access
- **admin**: Full CRM access, image processing, carousel generation
- **user**: Limited access (future client portal)

### RLS Policies
- Public: Insert contact_leads, view visible product images
- Admin: Full CRUD on all tables
- Users: View own data only

---

## Integration Points

### External Services
- **Lovable AI Gateway**: Text generation, analysis
- **Nano Banana Pro**: Image generation (`google/gemini-3-pro-image-preview`)
- **Resend**: Email notifications (RESEND_API_KEY)
- **Firecrawl**: Website scraping for research (FIRECRAWL_API_KEY)
- **Perplexity**: Additional research capabilities (PERPLEXITY_API_KEY)

### Edge Functions
- `calculate-lead-score`: AI-powered lead scoring
- `analyze-product-image`: Product recognition and metadata
- `enhance-product-image`: Image optimization
- `generate-carousel`: LinkedIn content generation
- `research-company`: Domain-based enrichment

---

## Success Metrics

### Lead Management
- Average lead score accuracy vs manual qualification
- Time from inquiry to first response
- Conversion rate by lead score tier
- Response draft acceptance rate

### Content Generation
- Image enhancement quality ratings
- Carousel engagement metrics
- Pitch deck usage/downloads

### Business Impact
- Qualified lead volume increase
- Sales cycle time reduction
- Admin time savings

---

## Roadmap

### Phase 1: Foundation (Complete)
- Marketing website
- Contact form with lead capture
- Basic admin dashboard
- Product image gallery

### Phase 2: Intelligence (Current)
- AI lead scoring with custom weights
- AI draft email responses
- Company research enrichment
- Email/phone validation

### Phase 3: Automation (Next)
- Sales sequences (cadências automáticas)
- Competitor detection
- Intent signal tracking
- AI qualification chatbot

### Phase 4: Scale
- Client portal
- Quote management
- Project tracking
- Advanced analytics

---

## Appendix

### A. Project Type Enum Values
```
dental_implants, orthopedic_implants, spinal_implants,
veterinary_implants, surgical_instruments, micro_precision_parts,
custom_tooling, medical_devices, measurement_tools, other_medical
```

### B. Lead Status Flow
```
new → contacted → in_progress → quoted → closed
                                       → rejected
```

### C. API Endpoints (Edge Functions)
- POST `/functions/v1/calculate-lead-score`
- POST `/functions/v1/analyze-product-image`
- POST `/functions/v1/enhance-product-image`
- POST `/functions/v1/generate-carousel`
- POST `/functions/v1/research-company`

---

**Document Owner**: Lifetrek Medical Development Team  
**Last Updated**: December 2024  
**Next Review**: Q1 2025
