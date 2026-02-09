
#!/bin/bash

# Define paths
SLIDE1="/Users/rafaelalmeida/.gemini/antigravity/brain/9b69d090-b767-4e7a-b0b0-477b0356526c/roadmap_slide_1_clean_1770649125323.png"
SLIDE2="/Users/rafaelalmeida/.gemini/antigravity/brain/9b69d090-b767-4e7a-b0b0-477b0356526c/roadmap_slide_2_clean_1770649142417.png"
PAYLOAD_FILE="/Users/rafaelalmeida/lifetrek/scripts/payload.json"

echo "Encoding images..."
# Encode images
B64_1=$(base64 < "$SLIDE1" | tr -d '\n')
B64_2=$(base64 < "$SLIDE2" | tr -d '\n')

# Form Data URL
IMG1="data:image/png;base64,$B64_1"
IMG2="data:image/png;base64,$B64_2"

echo "Creating JSON payload..."
# JSON Payload
cat <<EOF > "$PAYLOAD_FILE"
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

# Supabase Credentials
URL="https://dlflpvmdzkeouhgqwqba.supabase.co/rest/v1/linkedin_carousels?topic=eq.Roadmap%20de%2090%20Dias"
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o"

echo "Sending request..."
# Execute Request
curl -X PATCH "$URL" \
  -H "apikey: $API_KEY" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d @"$PAYLOAD_FILE"

echo "Update complete."
rm "$PAYLOAD_FILE"
