
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = "https://dlflpvmdzkeouhgqwqba.supabase.co";
// Using the same key found in previous working scripts
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o";

const mapping = [
    { file: 'cover_1_cnc_1771450689520.png', keyword: 'Custo da Não-Conformidade' },
    { file: 'cover_2_iso_1771450690471.png', keyword: 'Checklist de Validação ISO' },
    { file: 'cover_3_swiss_1771450691484.png', keyword: 'Swiss Turning' },
    { file: 'cover_4_tm30_1771450692391.png', keyword: 'Time-to-Market' },
    { file: 'cover_5_dfm_1771450693337.png', keyword: 'DFM' },
    { file: 'cover_6_zeiss_1771450694289.png', keyword: 'Metrologia ZEISS' },
    { file: 'cover_7_local_1771450695253.png', keyword: 'Resiliência da Cadeia Local' },
    { file: 'cover_8_tco_1771450696485.png', keyword: 'Importação vs Local' }
];

async function uploadFile(fileName, filePath) {
    const fileBuffer = fs.readFileSync(filePath);

    // 1. Upload to Storage
    console.log(`📤 Uploading ${fileName}...`);
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/public_assets/${fileName}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'apikey': SUPABASE_KEY,
            'Content-Type': 'image/png',
            'x-upsert': 'true'
        },
        body: fileBuffer
    });

    if (!response.ok) {
        console.error(`❌ Upload failed: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.error(text);

        // Retry with 'assets' bucket if 'public_assets' fails
        console.log(`🔄 Retrying with 'assets' bucket...`);
        const retryResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/assets/${fileName}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'apikey': SUPABASE_KEY,
                'Content-Type': 'image/png',
                'x-upsert': 'true'
            },
            body: fileBuffer
        });

        if (!retryResponse.ok) {
            console.error(`❌ Retry failed: ${retryResponse.statusText}`);
            return null;
        }

        return `${SUPABASE_URL}/storage/v1/object/public/assets/${fileName}`;
    }

    return `${SUPABASE_URL}/storage/v1/object/public/public_assets/${fileName}`;
}

async function updateDatabase(keyword, publicUrl) {
    console.log(`🔍 Searching for "${keyword}"...`);
    const searchRes = await fetch(`${SUPABASE_URL}/rest/v1/linkedin_carousels?select=id&topic=ilike.*${encodeURIComponent(keyword)}*&limit=1`, {
        headers: { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY }
    });

    const searchData = await searchRes.json();
    if (!searchData || searchData.length === 0) {
        console.warn(`⚠️ Record not found for "${keyword}"`);
        return;
    }

    const id = searchData[0].id;

    console.log(`🔄 Updating record ${id}...`);
    const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/linkedin_carousels?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'apikey': SUPABASE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            image_urls: [publicUrl],
            updated_at: new Date().toISOString()
        })
    });

    if (updateRes.ok) {
        console.log(`✨ Success!`);
    } else {
        console.error(`❌ Update failed: ${updateRes.statusText}`);
    }
}

async function run() {
    for (const item of mapping) {
        const filePath = path.join(__dirname, '../tmp/march_output', item.file);
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ Local file missing: ${item.file}`);
            continue;
        }

        const fileName = `covers/${item.file}`;
        const publicUrl = await uploadFile(fileName, filePath);

        if (publicUrl) {
            await updateDatabase(item.keyword, publicUrl);
        }
    }
    console.log("🏁 All operations completed.");
}

run();
