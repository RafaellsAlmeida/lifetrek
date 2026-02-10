#!/bin/bash

# Configuration
FUNCTION_URL="https://dlflpvmdzkeouhgqwqba.supabase.co/functions/v1/regenerate-carousel-images"
CAROUSEL_ID="f7e37f67-d64e-4470-9998-5d33e6943533"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o"
SLIDE_INDEX=0

echo "Triggering HYBRID regeneration for Carousel ID: $CAROUSEL_ID (Slide $SLIDE_INDEX)..."

# JSON Payload
PAYLOAD=$(cat <<EOF
{
  "carousel_id": "$CAROUSEL_ID",
  "table_name": "linkedin_carousels",
  "mode": "hybrid",
  "slide_index": $SLIDE_INDEX
}
EOF
)

# Execute Request
RESPONSE=$(curl -s -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

echo "Response:"
echo "$RESPONSE"

echo -e "\n\nRequest sent."
