#!/bin/bash

# Configuration
RESOURCE_ID="fffea378-aec1-40d3-b616-d3a253ec78b4"
CAROUSEL_ID="5b96302d-b0c1-4b07-b0dc-a12239228c51"
THUMBNAIL_URL="https://dlflpvmdzkeouhgqwqba.supabase.co/storage/v1/object/public/carousel-images/roadmap_clean_slide_1.png"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o"
API_URL="https://dlflpvmdzkeouhgqwqba.supabase.co/rest/v1"

echo "Updating Roadmap Resource..."

# Update Resource Thumbnail via curl
curl -X PATCH "$API_URL/resources?id=eq.$RESOURCE_ID" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"thumbnail_url\": \"$THUMBNAIL_URL\", \"updated_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}"

echo -e "\nResource updated."

echo "Approving Roadmap Carousel..."

# Approve Carousel
curl -X PATCH "$API_URL/linkedin_carousels?id=eq.$CAROUSEL_ID" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"status\": \"approved\", \"updated_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}"

echo -e "\nCarousel approved."
