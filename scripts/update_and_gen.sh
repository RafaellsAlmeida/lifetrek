#!/bin/bash
SUPABASE_URL="https://dlflpvmdzkeouhgqwqba.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3Mjc2MDksImV4cCI6MjA4MzMwMzYwOX0.ALEISClMQTqYtDfRBVOQwm5vf7uEodqptSXyxIpRkCQ"
CAROUSEL_ID="05ebeff0-834c-48c3-ac06-3ce483600fbf"

# Get user token
echo "Logging in..."
AUTH_RES=$(curl -s -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"rafacrvg@icloud.com","password":"Lifetrek2026"}')

USER_TOKEN=$(echo $AUTH_RES | grep -o '"access_token":"[^"]*' | grep -o '[^"]*$')

if [ -z "$USER_TOKEN" ]; then
  echo "Login failed. Response:"
  echo $AUTH_RES
  exit 1
fi

echo "Login successful. Triggering edge function for slides 0-4..."

# Trigger edge function for each slide using USER_TOKEN
for i in {0..4}; do
  echo "Slide $i..."
  curl -s -X POST "$SUPABASE_URL/functions/v1/regenerate-carousel-images" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"carousel_id\": \"$CAROUSEL_ID\", \"table_name\": \"linkedin_carousels\", \"mode\": \"hybrid\", \"slide_index\": $i}"
  echo ""
done

echo "Done!"
