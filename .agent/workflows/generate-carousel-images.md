---
description: Generate AI carousel images using Nano Banana Pro
---

# Generate Carousel Images

## Quick Test (curl)

// turbo
```bash
curl -X POST 'https://dlflpvmdzkeouhgqwqba.supabase.co/functions/v1/regenerate-carousel-images' \
  -H 'Authorization: Bearer <ANON_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"carousel_id": "<UUID>", "table_name": "linkedin_carousels"}'
```

## Single Slide Regeneration

```bash
curl -X POST 'https://dlflpvmdzkeouhgqwqba.supabase.co/functions/v1/regenerate-carousel-images' \
  -H 'Authorization: Bearer <ANON_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"carousel_id": "<UUID>", "slide_index": 0}'
```

## Supported Tables

| table_name | Content Type |
|------------|--------------|
| `linkedin_carousels` | LinkedIn slides |
| `instagram_posts` | Instagram posts |
| `blog_posts` | Blog cover images |
| `content_templates` | Resource covers |

## Response Fields

```json
{
  "success": true,
  "slides_regenerated": 5,
  "reference_images_used": 2,
  "duration_ms": 45000,
  "logs": ["[info] ..."]
}
```

## Troubleshooting

1. **Timeout 546** → Too many slides, use `slide_index` for one at a time
2. **GEMINI_API_KEY missing** → Check Supabase secrets
3. **Upload failed** → Check `carousel-images` bucket exists
