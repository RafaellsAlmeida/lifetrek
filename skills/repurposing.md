---
description: Fix, iterate, and adapt content that needs small adjustments before publishing
---

# Repurposing Skill

## Purpose
Take content that's 80% ready and fix the remaining 20% - images, text, formatting errors.

## Common Issues & Fixes

### 1. Image Problems

| Issue | Solution |
|-------|----------|
| Wrong text in AI image | Re-generate with HTML composition instead |
| Pixelated/low quality | Re-generate at higher resolution |
| Off-brand colors | Apply color overlay or re-generate with brand prompt |
| Missing logo | Use browser_subagent to compose with logo |
| Wrong aspect ratio | Crop or re-generate with correct dimensions |

**Quick Fix Workflow:**
```
1. User shares problematic image
2. I analyze what's wrong
3. If text issue → Switch to HTML composition
4. If quality issue → Re-generate with same prompt + "4K, high resolution"
5. If brand issue → Add brand colors to prompt
```

### 2. Text Problems

| Issue | Solution |
|-------|----------|
| Typo | Fix directly in copy |
| Too long | Condense to 6 words per bullet |
| Wrong tone | Rewrite with correct brand voice |
| Missing CTA | Add appropriate call-to-action |
| Wrong language | Translate maintaining technical accuracy |

### 3. Format Conversions

| From | To | Method |
|------|-----|--------|
| Carousel | Single post | Extract strongest slide |
| Blog | LinkedIn post | Summarize key points |
| Post | Stories | Split into 3-5 story frames |
| English | Portuguese | Translate with brand voice |
| Draft | Final | Apply brand template |

## Repurposing Checklist

Before publishing, verify:
- [ ] All text is correct (no typos, proper Portuguese)
- [ ] Logo is present and high-quality
- [ ] Colors match brand (#004F8F, #1A7A3E, #F07818)
- [ ] CTA is clear and actionable
- [ ] Image resolution is adequate (min 1024px)
- [ ] Proper certifications mentioned (if relevant)

## Quick Iteration Loop

When user says "almost right, but..."

```
1. Identify the specific issue
2. Propose the smallest fix possible
3. Make the change
4. Show result immediately
5. Ask "anything else?"
```

## HTML Composition Fallback

When AI image text fails, use this template:

```html
<div style="
  width: 1024px; 
  height: 1024px; 
  background: url('BACKGROUND_URL');
  background-size: cover;
  position: relative;
  font-family: 'Inter', sans-serif;
">
  <div style="
    position: absolute;
    left: 50px; bottom: 100px;
    width: 600px;
    background: rgba(0, 79, 143, 0.9);
    border-radius: 24px;
    padding: 60px;
    color: white;
  ">
    <h1 style="font-size: 48px; font-weight: 800;">HEADLINE</h1>
    <p style="font-size: 24px;">BODY TEXT</p>
  </div>
</div>
```

Then screenshot with browser_subagent.

## Asset Locations
- **Logo**: `/src/assets/logo.png` or Supabase `assets/logo.png`
- **ISO Badge**: Supabase `assets/iso.jpg`
- **Product photos**: Supabase `product_catalog` table
