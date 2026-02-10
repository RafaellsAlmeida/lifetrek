
#!/bin/bash

# Public URLs
IMG1="https://dlflpvmdzkeouhgqwqba.supabase.co/storage/v1/object/public/carousel-images/roadmap_clean_slide_1.png"
IMG2="https://dlflpvmdzkeouhgqwqba.supabase.co/storage/v1/object/public/carousel-images/roadmap_clean_slide_2.png"

# JSON Payload
# Note: We need to escape quotes in the JSON string
JSON_PAYLOAD=$(cat <<EOF
{
  "slides": [
    {
      "type": "image",
      "url": "$IMG1",
      "alt": "Roadmap Slide 1",
      "title": "Roteiro de 90 Dias"
    },
    {
      "type": "image",
      "url": "$IMG2",
      "alt": "Roadmap Slide 2",
      "title": "Próximo Passo"
    }
  ],
  "image_urls": ["$IMG1", "$IMG2"],
  "status": "pending_approval"
}
EOF
)

# Supabase Credentials
URL="https://dlflpvmdzkeouhgqwqba.supabase.co/rest/v1/linkedin_carousels?id=eq.5b96302d-b0c1-4b07-b0dc-a12239228c51"
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o"

# Execute Request
curl -X PATCH "$URL" \
  -H "apikey: $API_KEY" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD"

echo "Update complete."
