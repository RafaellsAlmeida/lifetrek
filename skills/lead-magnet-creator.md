---
description: Create downloadable lead magnets (PDFs, guides, checklists) for lead generation
---

# Lead Magnet Creator Skill

## Purpose
Create high-value downloadable resources that capture leads.

## Lead Magnet Types

| Type | Best For | Effort |
|------|----------|--------|
| **Checklist** | Quick wins, actionable steps | Low |
| **Guide/Ebook** | Deep expertise, thought leadership | High |
| **Template** | Practical tools, reusable frameworks | Medium |
| **Case Study** | Social proof, results-focused | Medium |
| **Comparison Chart** | Decision support, evaluation stage | Low |
| **Calculator** | Interactive engagement | High |

## Recommended for Lifetrek

### Tier 1 (Quick to Create)
1. ✅ Checklist: "10 Perguntas para Avaliar seu Fornecedor de Usinagem Médica"
2. ✅ Comparison: "Titanium vs PEEK: Qual Material é Melhor para Implantes?"
3. ✅ Checklist: "Documentação Essencial para Aprovação ANVISA"

### Tier 2 (Medium Effort)
1. Template: "RFQ Template para Dispositivos Médicos"
2. Case Study: "Como Reduzimos o Lead Time de 12 para 4 Semanas"
3. Guide: "Introdução à Metrologia de Implantes Ortopédicos"

### Tier 3 (High Value)
1. Ebook: "O Guia Completo de Usinagem CNC para Dispositivos Médicos"
2. Whitepaper: "ISO 13485 na Prática: Implementação para Pequenas Empresas"

## Structure Template

### Checklist (1-2 pages)
```
Title: [Action] + [Benefit]
Subtitle: "O guia prático para [audience]"

Introduction (50 words)
- Why this matters
- What they'll get

Checklist Items (10-15 items)
□ Item 1
□ Item 2
...

Call to Action
- "Precisa de ajuda? Fale conosco"
- Website + LinkedIn
```

### Guide (5-10 pages)
```
Cover Page
- Title, subtitle, Lifetrek branding

Table of Contents

Chapter 1: O Problema
- Pain point description
- Market context

Chapter 2: A Solução
- Your approach
- Key principles

Chapter 3: Implementação
- Step-by-step guide
- Best practices

Chapter 4: Resultados
- Case study snippets
- Expected outcomes

Conclusion + CTA
- Contact information
- Demo offer
```

## Design Guidelines

### PDF Styling
| Element | Specification |
|---------|---------------|
| Page Size | A4 or Letter |
| Primary Color | #004F8F |
| Accent Color | #1A7A3E |
| Font | Inter |
| Headers | 24-32pt, Bold |
| Body | 11-12pt, Regular |
| Margins | 1 inch |

### Cover Page Must Have
- Lifetrek logo (top or bottom)
- Clear title (large)
- Subtitle with value proposition
- Visual element (abstract or product photo)
- ISO/certification badges

## Creation Workflow

1. **Choose Type**: Based on funnel stage and audience
2. **Outline**: 3-5 main sections
3. **Write Content**: Use copywriter skill
4. **Design**: Create in HTML or Canva
5. **Brand Check**: Verify colors, fonts, logo
6. **Export**: PDF (for download) + Web preview image

## Integration Points

- **Supabase**: Store in `resources` table with `resource_type = 'lead_magnet'`
- **Landing Page**: Auto-generate with resource component
- **Resend**: Email delivery after form submission
- **Analytics**: Track downloads

## Example HTML Structure

```html
<!DOCTYPE html>
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap" rel="stylesheet">
  <style>
    @page { size: A4; margin: 1in; }
    body { font-family: 'Inter', sans-serif; color: #1a1a1a; }
    h1 { color: #004F8F; font-size: 32px; }
    h2 { color: #1A7A3E; font-size: 24px; }
    .checkbox { width: 20px; height: 20px; border: 2px solid #004F8F; }
  </style>
</head>
<body>
  <!-- Content here -->
</body>
</html>
```

Use `browser_subagent` to print to PDF.
