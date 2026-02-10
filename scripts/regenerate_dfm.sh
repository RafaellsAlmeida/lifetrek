#!/bin/bash

# Configuration (use env vars, never hardcode secrets)
SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"
CAROUSEL_ID="${CAROUSEL_ID:-05ebeff0-834c-48c3-ac06-3ce483600fbf}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment."
  exit 1
fi

FUNCTION_URL="${SUPABASE_URL}/functions/v1/regenerate-carousel-images"
SERVICE_KEY="$SUPABASE_SERVICE_ROLE_KEY"

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
