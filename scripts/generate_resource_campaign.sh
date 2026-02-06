#!/bin/bash

# Configuration
# Configuration
SUPABASE_URL="https://dlflpvmdzkeouhgqwqba.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3Mjc2MDksImV4cCI6MjA4MzMwMzYwOX0.ALEISClMQTqYtDfRBVOQwm5vf7uEodqptSXyxIpRkCQ"

# Alternate Project for Generation (Brain)
GEN_URL="https://iijkbhiqcsvtnfernrbs.supabase.co"
GEN_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpamtiaGlxY3N2dG5mZXJucmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNTE2MzUsImV4cCI6MjA3NTkyNzYzNX0.HQJ1vRWwn7YXmWDvb9Pf_JgzeyCDOpXdf2NI-76IUbM"
FUNCTION_URL="${GEN_URL}/functions/v1/generate-linkedin-carousel"

echo "🚀 Starting Intentional Content Campaign (Bash/Curl)..."

# 1. Fetch Resources
echo "📥 Fetching published resources..."
resources_json=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/resources?select=id,title,type&status=eq.published&limit=10" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}")

# Check if curl failed
if [ $? -ne 0 ]; then
    echo "❌ Failed to fetch resources."
    exit 1
fi

count=$(echo "$resources_json" | jq '. | length')
echo "📚 Found $count resources."

# 2. Iterate and Generate
# We use a while loop with jq to read line by line
echo "$resources_json" | jq -c '.[]' | while read -r resource; do
    id=$(echo "$resource" | jq -r '.id')
    title=$(echo "$resource" | jq -r '.title')
    type=$(echo "$resource" | jq -r '.type')
    
    echo "--------------------------------------------------"
    echo "🎯 Processing: $title ($type)"
    
    # Strategy Logic (Simplified in Bash)
    painPoint="Inefficiency and lack of standard processes"
    desiredOutcome="Streamlined operations and compliance"
    targetAudience="Medical Device Manufacturers"
    ctaAction="Comment 'RESOURCE' to get the full ${title}"
    topicHook="Mastering ${title}: A Strategic Approach"

    # Simple keyword matching
    if [[ "$title" == *"Checklist"* ]] || [[ "$type" == *"checklist"* ]]; then
        painPoint="Fear of missing critical steps during audits"
        desiredOutcome="100% Audit Readiness"
        ctaAction="Download the ${title} (Link in Bio)"
        topicHook="Are you missing a step? ${title} explained."
    elif [[ "$title" == *"Guide"* ]] || [[ "$type" == *"guide"* ]] || [[ "$title" == *"Guia"* ]]; then
        painPoint="Navigating complex technical requirements"
        ctaAction="Read the comprehensive guide: ${title}"
        topicHook="Deep Dive: ${title} - What you need to know."
    fi

    if [[ "$title" == *"ISO 13485"* ]]; then
        painPoint="Non-compliance risks with ISO 13485"
        targetAudience="QA/RA Managers"
    elif [[ "$title" == *"Metrologia"* ]]; then
        painPoint="Measurement uncertainty in micron-level components"
        desiredOutcome="Sub-micron precision assurance"
    fi

    echo "   Hook: $topicHook"
    echo "   CTA: $ctaAction"

    # Construct JSON payload
    # Note: We use jq to construct safe JSON to avoid escaping hell
    payload=$(jq -n \
                  --arg topic "$topicHook" \
                  --arg target "$targetAudience" \
                  --arg pain "$painPoint" \
                  --arg outcome "$desiredOutcome" \
                  --arg cta "$ctaAction" \
                  '{
                    topic: $topic,
                    targetAudience: $target,
                    painPoint: $pain,
                    desiredOutcome: $outcome,
                    ctaAction: $cta,
                    postType: "value",
                    format: "carousel",
                    selectedEquipment: [],
                    stream: false
                  }')

    # Call Edge Function
    # We use a temp file for response to handle it better
    echo "   ⚡ Generating Content (via alternate project)..."
    response=$(curl -s -X POST "$FUNCTION_URL" \
      -H "Authorization: Bearer ${GEN_KEY}" \
      -H "Content-Type: application/json" \
      -d "$payload")
    
    # Check for success (simple check if generated content exists)
    generated_topic=$(echo "$response" | jq -r '.carousel.topic // .carousels[0].topic // empty')
    
    if [ -n "$generated_topic" ]; then
        echo "   ✅ Generated: $generated_topic"
        # We assume the function returns the object but doesn't insert?
        # Actually generate-linkedin-carousel usually returns the object.
        # We can try to insert it via REST API too!
        
        # Extract full carousel object
        carousel_data=$(echo "$response" | jq '.carousel // .carousels[0]')
        
        # Prepare insert payload (remove id to let DB generate it, or keep if function generated it)
        # We need to wrap it for insert: { topic: ..., content: ... }
        # content column expects jsonb.
        
        insert_payload=$(jq -n --arg topic "$generated_topic" --argjson content "$carousel_data" \
            '{
                topic: $topic,
                content: $content,
                status: "draft"
            }')
            
        echo "   💾 Saving to DB..."
        insert_res=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/linkedin_carousels" \
            -H "apikey: ${ANON_KEY}" \
            -H "Authorization: Bearer ${ANON_KEY}" \
            -H "Content-Type: application/json" \
            -H "Prefer: return=representation" \
            -d "$insert_payload")
            
        saved_id=$(echo "$insert_res" | jq -r '.[0].id // empty')
        
        if [ -n "$saved_id" ]; then
             echo "   ✅ Saved ID: $saved_id"
        else
             # If insert failed, print error (likely RLS if Anon cannot insert)
             # But likely Anon can insert drafts.
             echo "   ⚠️ Save failed or no ID returned: $(echo "$insert_res" | grep -o 'message.*' | cut -c 1-50)..."
        fi
        
    else
        echo "   ❌ Generation failed or no data."
        # echo "Response: $response" 
    fi
    
    echo "   ⏳ Waiting 3s..."
    sleep 3
done

echo "Done!"
