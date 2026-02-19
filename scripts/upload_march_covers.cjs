
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = "https://dlflpvmdzkeouhgqwqba.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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

async function uploadAndUpdate() {
    console.log("🚀 Starting upload process...");

    for (const item of mapping) {
        const filePath = path.join(__dirname, '../tmp/march_output', item.file);
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ File not found: ${item.file}`);
            continue;
        }

        const fileBuffer = fs.readFileSync(filePath);
        const fileName = `covers/${item.file}`;

        console.log(`📤 Uploading ${item.file}...`);
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('public_assets') // or 'assets' or whatever public bucket exists
            .upload(fileName, fileBuffer, {
                contentType: 'image/png',
                upsert: true
            });

        if (uploadError) {
            console.error(`❌ Upload failed for ${item.file}:`, uploadError.message);
            // Try 'assets' bucket as fallback
            const { data: uploadData2, error: uploadError2 } = await supabase
                .storage
                .from('assets')
                .upload(fileName, fileBuffer, {
                    contentType: 'image/png',
                    upsert: true
                });

            if (uploadError2) {
                console.error(`❌ Fallback upload failed too:`, uploadError2.message);
                continue;
            }
        }

        const { data: publicUrlData } = supabase
            .storage
            .from('public_assets') // Ensure this matches the successful upload bucket
            .getPublicUrl(fileName);

        const publicUrl = publicUrlData.publicUrl;
        console.log(`✅ Uploaded: ${publicUrl}`);

        // Update DB
        console.log(`🔄 Updating DB record for "${item.keyword}"...`);

        // Find ID first
        const { data: records, error: searchError } = await supabase
            .from('linkedin_carousels')
            .select('id')
            .ilike('topic', `%${item.keyword}%`)
            .limit(1);

        if (searchError || !records?.length) {
            console.warn(`⚠️ Could not find record for "${item.keyword}"`);
            continue;
        }

        const id = records[0].id;

        const { error: updateError } = await supabase
            .from('linkedin_carousels')
            .update({
                image_urls: [publicUrl], // Set as the first image
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateError) {
            console.error(`❌ DB Update failed:`, updateError.message);
        } else {
            console.log(`✨ DB Updated!`);
        }
    }
}

uploadAndUpdate();
