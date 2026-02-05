#!/bin/bash
# Regenerate carousel images

SUPABASE_URL="https://dlflpvmdzkeouhgqwqba.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3Mjc2MDksImV4cCI6MjA4MzMwMzYwOX0.ALEISClMQTqYtDfRBVOQwm5vf7uEodqptSXyxIpRkCQ"

# Carousels to regenerate
CAROUSELS=(
  "dd4ae665-0a13-4f4b-b2cd-73e16cf3ee3b"  # Fadiga
  "c9526851-608c-4e7a-9243-3afc004886fc"  # 3D/CNC
  "f607a06b-4bcf-4a5f-9272-e578e7295689"  # Custom-Fit
  "fb61c417-8951-4431-adfb-45026184994d"  # Plano Piloto
  "e7f72b61-090f-4e65-9692-e2fcbabf7614"  # Metrologia
  "44c39ef8-a466-4251-8860-7a15deb30dbf"  # ISO 7 vs 8
  "b2597cef-4140-4bfe-9384-4940e197cb5e"  # DFM Checklist
  "1cbe0260-dea1-4eaa-b43f-bde45239de51"  # Local Swiss
)

for carousel_id in "${CAROUSELS[@]}"; do
  echo "================================================"
  echo "Regenerating: $carousel_id"
  echo "================================================"

  curl -s -X POST "${SUPABASE_URL}/functions/v1/regenerate-carousel-images" \
    -H "Authorization: Bearer ${ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"carousel_id\": \"${carousel_id}\"}" | jq -r '.success, .images_generated, .duration_ms'

  echo ""
  sleep 5  # Delay between carousels
done

echo "Done!"
