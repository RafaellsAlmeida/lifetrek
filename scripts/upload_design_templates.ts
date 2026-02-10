/**
 * Upload Design Templates to Supabase Storage and Catalog
 * 
 * This script:
 * 1. Uploads best marketing assets to carousel-images bucket
 * 2. Creates entries in product_catalog with category 'design_template'
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface DesignTemplate {
    localPath: string;
    name: string;
    description: string;
    style: string;
    promptUsed?: string;
}

const DESIGN_TEMPLATES: DesignTemplate[] = [
    {
        localPath: 'marketing_assets/image copy.png',
        name: 'Nano Banana Editorial - 5 Riscos',
        description: 'Clean editorial style with bold typography, teal overlay on medical manufacturing background. AI-native generation.',
        style: 'editorial',
        promptUsed: 'Professional medical manufacturing facility with teal color overlay, bold white headline typography'
    },
    {
        localPath: 'marketing_assets/generated_content/demo_telenursing_hybrid.png',
        name: 'Glassmorphism Card - Telenursing',
        description: 'Dark blue semi-transparent glassmorphism card with blur effect. Green category label, white headline, gray body text.',
        style: 'glassmorphism',
        promptUsed: 'Glassmorphism card with dark blue background, blur backdrop, medical professional on video screen'
    },
    {
        localPath: 'marketing_assets/generated_content/demo_titanium_machining.png',
        name: 'Glassmorphism Card - Titanium Machining',
        description: 'Glassmorphism card with CNC machining background. Green label, white headline, checkmark highlight.',
        style: 'glassmorphism',
        promptUsed: 'Precision CNC titanium machining with metal chips, glassmorphism text card overlay'
    },
    {
        localPath: 'marketing_assets/linkedin/01_supplier_audit/cover_vA_photographic.png',
        name: 'Satori Programmatic - Supplier Audit',
        description: 'Programmatically rendered with Satori. Photographic background with text overlay card.',
        style: 'programmatic',
        promptUsed: 'N/A - rendered programmatically with Satori'
    }
];

async function uploadAndCatalog() {
    console.log('🚀 Starting design template upload and cataloging...\n');

    for (const template of DESIGN_TEMPLATES) {
        const fullPath = path.resolve(template.localPath);

        if (!fs.existsSync(fullPath)) {
            console.log(`⚠️  File not found: ${fullPath}`);
            continue;
        }

        const fileBuffer = fs.readFileSync(fullPath);
        const fileName = `design-template-${template.style}-${Date.now()}.png`;

        // 1. Upload to Storage
        console.log(`📤 Uploading: ${template.name}`);
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('carousel-images')
            .upload(fileName, fileBuffer, {
                contentType: 'image/png',
                upsert: true
            });

        if (uploadError) {
            console.log(`   ❌ Upload failed: ${uploadError.message}`);
            continue;
        }

        // 2. Get public URL
        const { data: urlData } = supabase.storage
            .from('carousel-images')
            .getPublicUrl(fileName);

        const imageUrl = urlData.publicUrl;
        console.log(`   ✅ Uploaded: ${imageUrl}`);

        // 3. Create catalog entry
        const { error: catalogError } = await supabase
            .from('product_catalog')
            .insert({
                name: template.name,
                category: 'design_template',
                description: template.description,
                image_url: imageUrl,
                metadata: {
                    style: template.style,
                    prompt_used: template.promptUsed,
                    source_file: template.localPath
                }
            });

        if (catalogError) {
            console.log(`   ❌ Catalog failed: ${catalogError.message}`);
        } else {
            console.log(`   ✅ Cataloged as design_template\n`);
        }
    }

    console.log('✅ Done! Design templates are now available for prompt injection.');
}

uploadAndCatalog().catch(console.error);
