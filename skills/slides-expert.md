---
description: Optimize pitch decks and sales presentations for Lifetrek Medical
---

# Slides Expert Skill

## Purpose
Review and optimize pitch decks, sales presentations, and investor materials.

## Lifetrek Brand Application

### Colors
| Use | Hex |
|-----|-----|
| Primary (headers, key text) | `#004F8F` |
| Accent (highlights, CTAs) | `#1A7A3E` |
| Alert/Energy | `#F07818` |
| Background | `#FFFFFF` or `#F8FAFC` |

### Typography
- **Headlines**: Inter ExtraBold (800)
- **Body**: Inter Regular (400)
- **Minimum font size**: 24pt for presentations

### Logo Placement
- Top-right or bottom-right corner
- Clear space around logo (min 20px)
- Use `/src/assets/logo.png`

## HTML/CSS vs PPTX Differences

**CRITICAL: These formats are NOT interchangeable. Know the limitations!**

| Aspect | HTML/CSS | PowerPoint PPTX |
|--------|----------|----------------|
| **Layout** | Responsive, flexible | Fixed aspect ratio (16:9, 4:3) |
| **Fonts** | Must be web-safe or embedded | System fonts work |
| **Positioning** | Relative/Flex/Grid | Absolute pixel positions |
| **Effects** | box-shadow, gradients (may not export) | Native shadows, 3D effects |
| **Images** | URL-based, SVG works | Embedded, vector support varies |
| **Animations** | CSS transitions (lost on export) | Native animations preserved |

### When Creating for PPTX Export

1. **Use absolute positioning** - Flexbox won't translate
2. **Avoid complex CSS effects** - box-shadow, backdrop-filter break
3. **Embed fonts** - Link `@font-face` won't work in PPT
4. **Use standard colors** - Gradients may flatten
5. **Fixed dimensions** - Use exact pixels (1920x1080)
6. **No responsive design** - One size only

### Safe Components for Both Formats

✅ **Works in Both:**
- Solid color backgrounds
- Basic text formatting (bold, italic, size)
- Simple rectangles and shapes
- Embedded images (PNG, JPG)
- Standard bullet lists

❌ **HTML Only (breaks in PPTX):**
- Flexbox/Grid layouts
- CSS animations
- Custom web fonts (without embedding)
- backdrop-filter (glassmorphism)
- Complex gradients
- Hover states

### Conversion Tools
- **HTML → PPTX**: Use Puppeteer/Playwright screenshots, then import as images
- **PPTX → HTML**: python-pptx or aspose (limited fidelity)

### 1. Structure Check
- [ ] Clear narrative arc (Problem → Solution → Proof → CTA)
- [ ] 1 idea per slide
- [ ] Max 6 bullets per slide
- [ ] Max 6 words per bullet

### 2. Content Check
| Slide Type | Must Have |
|------------|-----------|
| Title | Company name, tagline, visual |
| Problem | Pain point, statistic, emotional hook |
| Solution | Clear value proposition, differentiator |
| Proof | Case study, certification, numbers |
| Team | Key people, relevant experience |
| CTA | Clear next step, contact info |

### 3. Visual Check
- [ ] Consistent color scheme
- [ ] High-quality images (no pixelation)
- [ ] Proper alignment/spacing
- [ ] Brand-compliant fonts
- [ ] Logo present on key slides

### 4. Presentation Check
- [ ] Works for 5-minute pitch
- [ ] Works for 15-minute deep dive
- [ ] Leave-behind version (more detail)

## Optimization Actions

### Quick Fixes
1. Replace stock photos with real facility/product images
2. Add certification badges (ISO, ANVISA)
3. Reduce text, increase visuals
4. Add customer logos (if permitted)

### Strategic Improvements
1. Lead with strongest proof point
2. Quantify all claims
3. Add comparison slide vs competitors
4. Include "Why Now" slide

## Pitch Deck Assets
- **Logo**: `/src/assets/logo.png`
- **ISO Badge**: `https://dlflpvmdzkeouhgqwqba.supabase.co/storage/v1/object/public/assets/iso.jpg`
- **Product Photos**: Query `product_catalog` table
- **Facility Photos**: Supabase `assets` bucket

## Output
Provide:
1. Slide-by-slide feedback
2. Priority fixes (top 3)
3. Redesigned slides (if requested)
