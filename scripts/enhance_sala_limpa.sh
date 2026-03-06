#!/bin/bash
API_KEY="AIzaSyChIQbZza-1yO1RN0XtpRGT3MSYmEDTEh4"
MODEL="gemini-3-pro-image-preview"
OUT_DIR="public/remotion/assets/images"

mkdir -p "$OUT_DIR"

generate_image() {
    local prompt=$1
    local ref_path=$2
    local out_name=$3
    local aspect_ratio="16:9"

    echo "Generating $out_name..."
    
    local payload_file="/tmp/payload_sl.json"
    if [ -f "$ref_path" ]; then
        local b64_data=$(base64 -i "$ref_path")
        local mime_type="image/png"
        [[ "$ref_path" == *.jpg ]] && mime_type="image/jpeg"
        [[ "$ref_path" == *.jpeg ]] && mime_type="image/jpeg"
        
        printf '{"contents": [{"parts": [{"text": "%s"}, {"inlineData": {"mimeType": "%s", "data": "%s"}}]}], "generationConfig": {"responseModalities": ["IMAGE", "TEXT"], "imageConfig": {"aspectRatio": "%s"}}}' "$prompt" "$mime_type" "$b64_data" "$aspect_ratio" > "$payload_file"
    else
        printf '{"contents": [{"parts": [{"text": "%s"}]}], "generationConfig": {"responseModalities": ["IMAGE", "TEXT"], "imageConfig": {"aspectRatio": "%s"}}}' "$prompt" "$aspect_ratio" > "$payload_file"
    fi

    local response=$(curl -s -X POST "https://generativelanguage.googleapis.com/v1beta/models/$MODEL:generateContent?key=$API_KEY" \
        -H "Content-Type: application/json" \
        -d @"$payload_file")

    local b64_img=$(echo "$response" | jq -r '.candidates[0].content.parts[] | select(.inlineData != null) | .inlineData.data')
    
    if [ -n "$b64_img" ] && [ "$b64_img" != "null" ]; then
        echo "$b64_img" | base64 -d > "$OUT_DIR/$out_name"
        echo "✅ Saved $OUT_DIR/$out_name"
    else
        echo "❌ Failed to generate $out_name. Response: $response"
    fi
    rm -f "$payload_file"
}

# 1. Split sala_limpa_1.png into 3 variations (Nano Banana Pro)
generate_image "Create a cinematic, 8K ultra-realistic wide-angle view of a high-tech medical cleanroom interior. Sterile blue lighting, corporate aesthetic, pristine surfaces." "$OUT_DIR/sala_limpa_1.png" "sala_limpa_split_1.png"
generate_image "Create a detailed view of medical Grade ISO 7 cleanroom entrance with advanced monitoring systems. Glass partitions, professional manufacturing environment." "$OUT_DIR/sala_limpa_1.png" "sala_limpa_split_2.png"
generate_image "A high-end laboratory/cleanroom workstation with specialized medical manufacturing equipment. Photorealistic, 4K HD, high-contrast corporate lighting." "$OUT_DIR/sala_limpa_1.png" "sala_limpa_split_3.png"

# 2. Upscale sala_limpa_2.png and sala_limpa_3.png to 4K HD
generate_image "Upscale this cleanroom image to 4K HD resolution. Eliminate all pixelation, enhance the clarity of the equipment and surfaces, and ensure a professional clinical aesthetic." "$OUT_DIR/sala_limpa_2.png" "sala_limpa_2_upscaled.png"
generate_image "Perform a 4K HD upscale of this medical manufacturing environment. Sharpen every detail, optimize lighting for a premium corporate look, and remove any compression artifacts." "$OUT_DIR/sala_limpa_3.png" "sala_limpa_3_upscaled.png"
