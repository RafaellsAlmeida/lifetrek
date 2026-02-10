#!/bin/bash

# Configuration
FUNCTION_URL="https://dlflpvmdzkeouhgqwqba.supabase.co/functions/v1/regenerate-carousel-images"
CAROUSEL_ID="05ebeff0-834c-48c3-ac06-3ce483600fbf"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o"

echo "Triggering regeneration for Carousel ID: $CAROUSEL_ID..."

# JSON Payload
PAYLOAD=$(cat <<EOF
{
  "carousel_id": "$CAROUSEL_ID",
  "table_name": "linkedin_carousels",
  "batch_mode": true
}
EOF
)

# Execute Request
curl -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"

echo -e "\n\nRequest sent."
