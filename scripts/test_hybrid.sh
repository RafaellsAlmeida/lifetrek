#!/bin/bash

# Configuration (use env vars, never hardcode secrets)
SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"
CAROUSEL_ID="${CAROUSEL_ID:-f7e37f67-d64e-4470-9998-5d33e6943533}"
SLIDE_INDEX="${SLIDE_INDEX:-0}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment."
  exit 1
fi

FUNCTION_URL="${SUPABASE_URL}/functions/v1/regenerate-carousel-images"
SERVICE_KEY="$SUPABASE_SERVICE_ROLE_KEY"

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
