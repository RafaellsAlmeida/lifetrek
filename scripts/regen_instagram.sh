#!/bin/bash
# Regenerate Instagram images

SUPABASE_URL="https://dlflpvmdzkeouhgqwqba.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3Mjc2MDksImV4cCI6MjA4MzMwMzYwOX0.ALEISClMQTqYtDfRBVOQwm5vf7uEodqptSXyxIpRkCQ"

# Instagram Posts to regenerate
POSTS=(
  "b4d9257c-8d84-4135-be18-081943c621b6" # Do Protótipo à Produção em Escala
  "59217224-c54a-48e3-b6bf-4017c7b4db24" # ANVISA & FDA: Navegando a Conformidade
  "46261e15-34ce-4077-bfc0-2fcaa06ea16d" # Tour Virtual: Nossa Planta de Manufatura
  "93584ea0-bf54-4cbf-91f8-72bc5dad8e3f" # Lifetrek Medical: The Precision Partner Behind Critical Medical Devices
  "a31da9e2-367c-4c22-ba81-af7831d25976" # From Raw Titanium to Sterile Package: One-Stop Manufacturing
  "0cc7d583-c3bd-4791-ad09-83a47b915388" # Quality is Not a Department — It's Our Product
  "a9136ae8-223c-457d-8a47-3957797e2541" # Behind the Scenes: How Swiss Turning Creates Micro-Precision Medical Parts
  "63e9d52b-df4a-44d2-a506-3e92178ee498" # Inside Our ISO 7 Cleanroom: Where Sterile Packaging Meets Precision
  "7a81e005-ae2b-4e55-8ecb-b4df40800ed0" # O Custo Real da Importação vs. Fabricação Local de Dispositivos Médicos
)

for post_id in "${POSTS[@]}"; do
  echo "================================================"
  echo "Regenerating Instagram Post: $post_id"
  echo "================================================"

  # Note: table_name="instagram_posts" is supported after deploying the updated function
  curl -s -X POST "${SUPABASE_URL}/functions/v1/regenerate-carousel-images" \
    -H "Authorization: Bearer ${ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"carousel_id\": \"${post_id}\", \"table_name\": \"instagram_posts\"}" | jq -r '.success, .images_generated, .duration_ms'

  echo ""
  sleep 5  # Delay between posts
done

echo "Done!"
