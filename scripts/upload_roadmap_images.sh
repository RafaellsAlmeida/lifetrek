
#!/bin/bash

# Define paths
SLIDE1="/Users/rafaelalmeida/.gemini/antigravity/brain/9b69d090-b767-4e7a-b0b0-477b0356526c/roadmap_slide_1_clean_1770649125323.png"
SLIDE2="/Users/rafaelalmeida/.gemini/antigravity/brain/9b69d090-b767-4e7a-b0b0-477b0356526c/roadmap_slide_2_clean_1770649142417.png"

# Supabase Config
PROJECT_URL="https://dlflpvmdzkeouhgqwqba.supabase.co"
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o"
BUCKET="carousel-images"

echo "Uploading Slide 1..."
curl -X POST "$PROJECT_URL/storage/v1/object/$BUCKET/roadmap_clean_slide_1.png" \
  -H "Authorization: Bearer $API_KEY" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: image/png" \
  --data-binary "@$SLIDE1"

echo -e "\nUploading Slide 2..."
curl -X POST "$PROJECT_URL/storage/v1/object/$BUCKET/roadmap_clean_slide_2.png" \
  -H "Authorization: Bearer $API_KEY" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: image/png" \
  --data-binary "@$SLIDE2"

echo -e "\nUploads complete."
