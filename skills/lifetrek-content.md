---
description: Create Lifetrek brand-compliant social media content (carousels, posts, slides)
---

# Lifetrek Content Creation Skill

Use this skill when creating any visual content for Lifetrek Medical, including LinkedIn carousels, post images, or slide decks.

## 1. Brand Guidelines (ALWAYS FOLLOW)

Before creating ANY content, review the brand book:
**File**: `/Users/rafaelalmeida/lifetrek/docs/brand/BRAND_BOOK.md`

### Quick Reference:
| Element | Value |
|---------|-------|
| **Primary Color** | `#004F8F` (Corporate Blue) |
| **Accent Green** | `#1A7A3E` (Innovation Green) |
| **Accent Orange** | `#F07818` (Energy Orange) |
| **Font Family** | Inter (Google Fonts) |
| **Headline Weight** | 800 (Extra Bold) |
| **Body Weight** | 400 (Regular) |
| **Tone** | Professional, technically precise, quality-focused |

### Voice Rules (CRITICAL):
- **NUNCA usar primeira pessoa** ("eu", "percebi", "trabalhei", "criamos")
- **SEMPRE usar voz institucional/impessoal** ("A Lifetrek desenvolveu", "Este guia apresenta")
- **Tom B2B sério** - sem linguagem casual ou influencer
- **Foco em dados e fatos** - não em experiências pessoais

### Visual Style:
- Clean, modern B2B aesthetic
- Medical manufacturing focus
- Precision-first, premium quality
- High contrast, bright lighting

## 2. Required Assets

### Logo (ALWAYS Include)
**Local Path**: `/Users/rafaelalmeida/lifetrek/src/assets/logo.png`
**Supabase URL**: `https://dlflpvmdzkeouhgqwqba.supabase.co/storage/v1/object/public/assets/logo.png`

### ISO Certification Badge
**Supabase URL**: `https://dlflpvmdzkeouhgqwqba.supabase.co/storage/v1/object/public/assets/iso.jpg`

### Real Product/Equipment Photos
Search in Supabase `product_catalog` table or use these categories:
- Metrology equipment
- CNC machines
- Cleanroom photos
- Team/facility shots

## 3. Decision: When to Use Each Mode

**VARY between these approaches based on context:**

### Mode A: Full AI Generation
**When to use:**
- Artistic/creative posts (abstract concepts, emotional appeal)
- Posts without strict text requirements
- When user says "surprise me" or wants something unique
- Fast iteration/brainstorming

**How:** Use `generate_image` with full prompts including composition, but NO critical text in image.

### Mode B: AI Background + HTML Composition
**When to use:**
- Posts requiring precise text (headlines, CTAs)
- Official announcements, certifications display
- When brand compliance is critical
- Multi-slide carousels with consistent layout

**How:** 
1. Generate clean background with `generate_image` (NO TEXT prompt)
2. Create HTML overlay with logo, headline, body
3. Screenshot with `browser_subagent`

### Mode C: Real Photo + HTML Composition
**When to use:**
- Product showcases
- Facility/team features
- Metrology/equipment content
- When the topic matches existing assets

**How:**
1. Search `product_catalog` or use known asset URLs
2. Create HTML overlay with branding
3. Screenshot with `browser_subagent`

### Decision Tree
```
Is this about a specific product/equipment?
├─ YES → Use Mode C (Real Photo)
└─ NO → Is precise text display critical?
         ├─ YES → Use Mode B (AI + HTML)
         └─ NO → Use Mode A (Full AI)
```

## 4. Content Creation Workflow (Chat Mode)

### Step 1: Strategy
Ask the user:
- What is the main topic?
- Who is the target audience?
- What is the CTA (call-to-action)?

### Step 2: Copywriting
Write headlines and body text following:
- Portuguese (pt-BR) unless specified otherwise
- Short, punchy headlines (max 60 chars)
- Body text 2-3 sentences
- Include relevant certifications (ISO 13485, ANVISA, FDA)

### Step 3: Visual Design
Use `generate_image` tool with prompts like:
```
Professional medical engineering background.
[Topic-specific description].
Corporate blue lighting (#004F8F).
NO TEXT, NO TYPOGRAPHY, clean background.
Focus on [titanium, glass, cleanroom, CNC, metrology].
```

### Step 4: Composition
Create HTML template with:
- Background image from Step 3
- Logo in top-right corner (white background pill)
- ISO badge next to logo (optional)
- Glass card with headline and body text
- Brand gradient bar at bottom

Use `browser_subagent` to screenshot the HTML at 1024x1024.

### Step 5: Review
Show the user and iterate based on feedback.

## 4. HTML Template (Copy-Paste Ready)

```html
<!DOCTYPE html>
<html>
<head>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap" rel="stylesheet">
    <style>
        body { margin: 0; font-family: 'Inter', sans-serif; }
        .slide {
            width: 1024px;
            height: 1024px;
            position: relative;
            background-image: url('BACKGROUND_URL_HERE');
            background-size: cover;
        }
        .logo-container {
            position: absolute;
            top: 50px;
            right: 50px;
            background: white;
            padding: 15px 30px;
            border-radius: 50px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .logo-container img { height: 35px; }
        .glass-card {
            position: absolute;
            left: 50px;
            bottom: 100px;
            width: 600px;
            background: rgba(0, 79, 143, 0.9);
            border-radius: 24px;
            padding: 60px;
            color: white;
        }
        h1 { font-weight: 800; font-size: 52px; margin-bottom: 20px; }
        p { font-size: 24px; line-height: 1.6; }
        .brand-line {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 12px;
            background: linear-gradient(90deg, #004F8F 0%, #1A7A3E 100%);
        }
    </style>
</head>
<body>
    <div class="slide">
        <div class="logo-container">
            <img src="LOGO_URL_HERE" alt="Lifetrek Medical" />
        </div>
        <div class="glass-card">
            <h1>HEADLINE_HERE</h1>
            <p>BODY_TEXT_HERE</p>
        </div>
        <div class="brand-line"></div>
    </div>
</body>
</html>
```

## 5. Edge Function Modes

The Edge Function (`generate-linkedin-carousel`) supports TWO modes:

| Mode | Parameter | Behavior |
|------|-----------|----------|
| **AI-Native** | `style_mode: "ai-native"` (or omit) | Full AI generation including text in image |
| **Hybrid-Composite** | `style_mode: "hybrid-composite"` | AI background + Satori text overlay |

Both modes are available in the UI. The hybrid mode guarantees brand compliance.

---

## 6. Criação de Conteúdo via Terminal (CLI)

### Opção A: Edge Function (Pipeline Completo)

Chame a Edge Function diretamente com curl:

```bash
# 1. Criar arquivo JSON com os parâmetros
cat > /tmp/carousel_request.json << 'EOF'
{
  "topic": "Título do Carrossel",
  "targetAudience": "Gerentes de Operações, Engenheiros de P&D",
  "painPoint": "Descrição do problema/dor do cliente",
  "desiredOutcome": "Resultado desejado pelo cliente",
  "proofPoints": ["Prova 1", "Prova 2", "Certificação"],
  "ctaAction": "Link ou ação desejada",
  "profileType": "company",
  "format": "carousel",
  "researchLevel": "medium",
  "style_mode": "hybrid-composite"
}
EOF

# 2. Chamar a Edge Function
curl -X POST "https://dlflpvmdzkeouhgqwqba.supabase.co/functions/v1/generate-linkedin-carousel" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d @/tmp/carousel_request.json
```

**Parâmetros importantes:**
- `researchLevel`: "none" | "light" | "medium" | "deep"
- `style_mode`: "ai-native" (imagem com texto) | "hybrid-composite" (fundo + overlay)
- `profileType`: "company" | "personal"

### Opção B: Geração de Imagens com Gemini/Nano Banana

Para gerar imagens individualmente usando a API do Gemini (recomendado para controle total):

```bash
# Usando a API do Gemini diretamente
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{"parts": [{"text": "Professional medical engineering background. Abstract concept of precision manufacturing. Corporate blue lighting (#004F8F). NO TEXT, NO TYPOGRAPHY, clean background. Focus on titanium, glass, cleanroom. 1024x1024."}]}],
    "generationConfig": {
      "responseModalities": ["IMAGE"],
      "imageConfig": {"aspectRatio": "1:1"}
    }
  }'
```

**Modelos disponíveis:**
| Modelo | Uso | Resolução |
|--------|-----|-----------|
| `gemini-2.5-flash-image` | Rápido, alto volume | 1024px |
| `gemini-3-pro-image-preview` | Profissional, texto preciso | Até 4K |

**Prompt Template para Backgrounds:**
```
Professional medical engineering background.
[Conceito abstrato do tema].
Corporate blue lighting (#004F8F).
NO TEXT, NO TYPOGRAPHY, clean background.
Focus on [titanium, glass, cleanroom, CNC, metrology].
High quality, 4K, sharp details.
```

### Opção C: Script CLI Local

Execute o script de geração local:

```bash
# Gera apenas copy (sem imagens)
deno run --allow-net --allow-read --allow-env scripts/generate_social_agent.ts "Seu Tópico Aqui"
```

---

## 7. Salvando na Aprovação de Conteúdo

Após gerar o conteúdo, salve no banco para aparecer em `/admin/content-approval`:

### Via SQL (Supabase)

```sql
INSERT INTO linkedin_carousels (
  topic,
  status,
  slides,
  image_urls,
  caption,
  quality_score,
  target_audience,
  pain_point,
  desired_outcome
) VALUES (
  'Título do Carrossel',
  'pending_approval',  -- Aparece na fila de aprovação
  '[{"type": "hook", "headline": "...", "body": "..."}, ...]'::jsonb,
  ARRAY['https://url-da-imagem-1.png', 'https://url-da-imagem-2.png'],
  'Legenda do post com hashtags...',
  85,
  'Gerentes de Operações',
  'Pain point descrito',
  'Outcome desejado'
);
```

### Via Supabase CLI

```bash
# Inserir via supabase CLI
supabase db execute --file /tmp/insert_carousel.sql
```

### Status do Conteúdo

| Status | Descrição |
|--------|-----------|
| `draft` | Rascunho, não aparece na aprovação |
| `pending_approval` | Aguardando revisão em `/admin/content-approval` |
| `approved` | Aprovado, pronto para publicar |
| `rejected` | Rejeitado, precisa de ajustes |
| `published` | Já publicado no LinkedIn |

---

## 8. Checklist de Qualidade (Antes de Salvar)

- [ ] Texto em português BR correto (sem typos)
- [ ] Voz institucional (sem primeira pessoa)
- [ ] Logo presente e legível
- [ ] Cores da marca (#004F8F, #1A7A3E)
- [ ] CTA claro e acionável
- [ ] Resolução mínima 1024x1024
- [ ] Certificações mencionadas se relevante (ISO 13485, ANVISA)
- [ ] Hashtags apropriadas (#DispositivosMedicos #MedTech)
