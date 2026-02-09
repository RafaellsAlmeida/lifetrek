
#!/bin/bash

# ID of the carousel
ID="1cbe0260-dea1-4eaa-b43f-bde45239de51"

# New Caption
CAPTION="📉 **90 dias de lead time = Capital parado.**\n\nNa indústria de dispositivos médicos, cada dia com estoque no mar é um risco para o seu cash flow. A Lifetrek traz a precisão suíça para Indaiatuba:\n\n✅ **Entrega em 30 dias** (vs. 90+ importado)\n✅ **Zero risco cambial** e logístico\n✅ **Validação micron-level** na sua porta\n\nTransforme sua cadeia de suprimentos de um centro de custo em uma vantagem competitiva. Pare de sangrar caixa.\n\n#MedTech #SupplyChain #MedicalDevices #Indaiatuba #Lifetrek"

# JSON Payload
# Use jq to safely create JSON if available, otherwise manual construction
# Manual construction to avoid dependency
JSON_PAYLOAD=$(cat <<EOF
{
  "caption": "$CAPTION"
}
EOF
)

# Supabase Credentials
URL="https://dlflpvmdzkeouhgqwqba.supabase.co/rest/v1/linkedin_carousels?id=eq.$ID"
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o"

echo "Updating caption for ID: $ID"

# Execute Request
curl -X PATCH "$URL" \
  -H "apikey: $API_KEY" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD"

echo -e "\nUpdate complete."
