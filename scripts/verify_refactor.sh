#!/bin/bash

# Configuration
SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"
CAROUSEL_ID="${CAROUSEL_ID:-05ebeff0-834c-48c3-ac06-3ce483600fbf}" # DFM Checklist

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Error: Environment variables not set."
  exit 1
fi

FUNCTION_URL="${SUPABASE_URL}/functions/v1/regenerate-carousel-images"

echo "--- TEST 1: Hybrid Mode (Expect Satori Overlay + Correct ISO Badge) ---"
curl -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "carousel_id": "'"$CAROUSEL_ID"'",
    "mode": "hybrid",
    "batch_mode": true
  }'

echo -e "\n\n--- TEST 2: Pure AI Mode (Expect AI Generated Text/Logos) ---"
curl -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "carousel_id": "'"$CAROUSEL_ID"'",
    "mode": "ai",
    "batch_mode": true
  }'
