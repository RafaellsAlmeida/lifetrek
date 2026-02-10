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

echo "Using Service Key to bypass 401..."

# Function to regenerate a single slide
regenerate_slide() {
  local INDEX=$1
  echo "Regenerating Slide Index: $INDEX..."
  
  PAYLOAD=$(cat <<EOF
{
  "carousel_id": "$CAROUSEL_ID",
  "table_name": "linkedin_carousels",
  "slide_index": $INDEX
}
EOF
)

  curl -X POST "$FUNCTION_URL" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD"
    
  echo -e "\n"
}

# Regenerate Steps 1, 2, 3 (Indices 1, 2, 3)
regenerate_slide 1
sleep 2
regenerate_slide 2
sleep 2
regenerate_slide 3

echo "Regeneration complete."
