#!/bin/bash

# Configuration
# Configuration
SUPABASE_URL="https://dlflpvmdzkeouhgqwqba.supabase.co"
# Service Role Key (Bypasses RLS)
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o"

echo "🚀 Creating Draft Campaigns for Resources..."

# 0. Create/Get a User ID (via Admin API)
echo "👤 Creating a temporary admin user for content generation..."
RAND_SFX=$(date +%s)
user_payload="{\"email\":\"bot_${RAND_SFX}@lifetrek.app\",\"password\":\"pass_${RAND_SFX}\",\"email_confirm\":true}"

user_resp=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "$user_payload")

USER_ID=$(echo "$user_resp" | jq -r '.id // empty')

if [ -z "$USER_ID" ] || [ "$USER_ID" == "null" ]; then
    echo "❌ Failed to create User. Response:"
    echo "$user_resp"
    # Fallback: maybe the user already exists? Try to get it from the response if it was an error?
    # Actually, try to just LIST users via admin api
    echo "   Trying to list users..."
    list_resp=$(curl -s -X GET "${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1" \
      -H "apikey: ${SERVICE_KEY}" \
      -H "Authorization: Bearer ${SERVICE_KEY}")
    USER_ID=$(echo "$list_resp" | jq -r '.users[0].id // empty')
fi

if [ -z "$USER_ID" ]; then
    echo "❌ Failed to get ANY User ID."
    exit 1
fi 

echo "✅ Using User ID: $USER_ID"

if [ -z "$USER_ID" ]; then
    echo "❌ Failed to fetch a User ID. Cannot proceed."
    exit 1
fi
echo "✅ Using User ID: $USER_ID"

# 1. Fetch Resources
echo "📥 Fetching published resources..."
resources_json=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/resources?select=id,title,type&status=eq.published&limit=10" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}")

# Check if curl failed
if [ $? -ne 0 ]; then
    echo "❌ Failed to fetch resources."
    exit 1
fi

count=$(echo "$resources_json" | jq '. | length')
echo "📚 Found $count resources."

# 2. Iterate and Generate DRAFTS
echo "$resources_json" | jq -c '.[]' | while read -r resource; do
    id=$(echo "$resource" | jq -r '.id')
    title=$(echo "$resource" | jq -r '.title')
    type=$(echo "$resource" | jq -r '.type')
    
    echo "--------------------------------------------------"
    echo "🎯 Processing: $title ($type)"
    
    # Strategy Logic
    ctaAction="Comment 'RESOURCE' to get the full ${title}"
    topicHook="Mastering ${title}"

    if [[ "$title" == *"Checklist"* ]] || [[ "$type" == *"checklist"* ]]; then
        ctaAction="Download the ${title}"
        topicHook="Are you missing a step? ${title} explained."
    elif [[ "$title" == *"Guide"* ]] || [[ "$type" == *"guide"* ]] || [[ "$title" == *"Guia"* ]]; then
        ctaAction="Read the comprehensive guide: ${title}"
        topicHook="Deep Dive: ${title}"
    fi

    echo "   Hook: $topicHook"
    echo "   CTA: $ctaAction"
    
    # Create valid JSON structure for 'slides' column (jsonb)
    slides_json=$(jq -n \
        --arg topic "$topicHook" \
        --arg cta "$ctaAction" \
        '[
            {
                "type": "hook",
                "headline": $topic,
                "body": "Draft content - Click Regenerate to create full post.",
                "image_url": ""
            },
            {
                "type": "cta",
                "headline": "Get the Resource",
                "body": $cta,
                "image_url": ""
            }
        ]')
        
    insert_payload=$(jq -n \
        --arg topic "$topicHook" \
        --argjson slides "$slides_json" \
        --arg caption "Draft created for resource promotion: $title" \
        --arg uid "$USER_ID" \
        --arg audience "Operations Managers, Engineering Leaders" \
            '{
                topic: $topic,
                slides: $slides,
                caption: $caption,
                status: "draft",
                admin_user_id: $uid,
                target_audience: $audience
            }')
            
    echo "   💾 Creating Draft in DB..."
    insert_res=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/linkedin_carousels" \
            -H "apikey: ${SERVICE_KEY}" \
            -H "Authorization: Bearer ${SERVICE_KEY}" \
            -H "Content-Type: application/json" \
            -H "Prefer: return=representation" \
            -d "$insert_payload")
            
    saved_id=$(echo "$insert_res" | jq -r '.[0].id // empty')
    
    if [ -n "$saved_id" ]; then
            echo "   ✅ Created Draft ID: $saved_id"
    else
            # Try to print error message from response
            err_msg=$(echo "$insert_res" | jq -r '.message // empty')
            if [ -n "$err_msg" ]; then
                echo "   ⚠️ Creation failed: $err_msg"
            else
                echo "   ⚠️ Creation failed (Unknown reason)"
            fi
    fi
    
    # Tiny delay
    sleep 0.5
done

echo "Done!"
