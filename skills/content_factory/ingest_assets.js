import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// --- Configuration ---
// --- Configuration ---
// Manually parse .env file to avoid dependencies
import fs from 'fs/promises';
import path from 'path';

async function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        const envFile = await fs.readFile(envPath, 'utf-8');
        envFile.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            }
        });
        console.log('✅ Loaded .env file');
    } catch (e) {
        console.log('ℹ️  No .env file found or failed to read it');
    }
}

// Ensure env is loaded before access
await loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPEN_ROUTER_API_KEY;
const BUCKET_NAME = 'content_assets'; // Ensure this bucket exists and is public

// Determine which provider to use (prefer OpenRouter if OpenAI quota issues)
const USE_OPENROUTER = process.env.USE_OPENROUTER === 'true' || process.argv.includes('--openrouter');
const API_KEY = USE_OPENROUTER ? OPENROUTER_API_KEY : OPENAI_API_KEY;
const BASE_URL = USE_OPENROUTER ? 'https://openrouter.ai/api/v1' : undefined;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase Environment Variables!');
    process.exit(1);
}

if (!API_KEY || API_KEY.includes('placeholder')) {
    console.error(`❌ Missing API Key for ${USE_OPENROUTER ? 'OpenRouter' : 'OpenAI'}!`);
    console.warn('   Run with --openrouter flag to use OpenRouter instead.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Configure OpenAI client (works with OpenRouter via baseURL)
const openai = new OpenAI({
    apiKey: API_KEY,
    baseURL: BASE_URL,
    defaultHeaders: USE_OPENROUTER ? {
        'HTTP-Referer': 'https://lifetrek.com.br',
        'X-Title': 'LifeTrek Content Factory'
    } : undefined
});

console.log(`🔧 Using ${USE_OPENROUTER ? 'OpenRouter' : 'OpenAI'} for AI services`);

// --- Helper Functions ---

async function getFiles(dir) {
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(dirents.map((dirent) => {
        const res = path.resolve(dir, dirent.name);
        return dirent.isDirectory() ? getFiles(res) : res;
    }));
    return Array.prototype.concat(...files);
}

async function analyzeImage(imageUrl) {
    // Use different models for OpenRouter vs OpenAI
    const visionModel = USE_OPENROUTER ? "google/gemini-flash-1.5" : "gpt-4o";

    try {
        const response = await openai.chat.completions.create({
            model: visionModel,
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Describe this image for a database of medical manufacturing assets. Include key objects, machines (e.g., CNC, 3D Printer), materials (Titanium, PEEK), cleanliness (Clean Room), and visual style (Professional, Industrial, Close-up)." },
                        { type: "image_url", image_url: { url: imageUrl } },
                    ],
                },
            ],
            max_tokens: 300,
        });
        return response.choices[0].message.content;
    } catch (e) {
        console.error(`   ❌ Vision Analysis Failed (${visionModel}):`, e.message);
        return null;
    }
}

// --- Main Ingestion Logic ---

async function processAsset(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return;

    const fileName = path.basename(filePath);
    console.log(`🖼️  Processing: ${fileName}`);

    try {
        const fileBuffer = await fs.readFile(filePath);
        
        // 1. Upload to Supabase Storage
        // Use a clean path in storage
        const storagePath = `ingested/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '')}`;
        
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from(BUCKET_NAME)
            .upload(storagePath, fileBuffer, {
                contentType: `image/${ext.replace('.', '')}`,
                upsert: true
            });

        if (uploadError) {
            console.error(`   ❌ Upload Failed:`, uploadError.message);
            // Check if bucket exists
            if (uploadError.message.includes("Bucket not found")) {
                console.error("      (Ensure 'content_assets' bucket is created and public)");
            }
            return;
        }

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from(BUCKET_NAME)
            .getPublicUrl(storagePath);

        console.log(`   -> Uploaded: ${publicUrl}`);

        // 3. Analyze with Vision AI
        console.log("   -> Analyzing with GPT-4o Vision...");
        const description = await analyzeImage(publicUrl);
        
        if (!description) {
            console.log("   -> Skipping embedding (no description generated).");
            return;
        }
        
        console.log(`   -> Description: ${description.substring(0, 50)}...`);

        // 4. Generate Embedding for Description
        // IMPORTANT: using default 1536 dim to match product_catalog schema
        // OpenRouter uses "openai/" prefix for OpenAI models
        const embeddingModel = USE_OPENROUTER ? "openai/text-embedding-3-small" : "text-embedding-3-small";
        const embeddingResponse = await openai.embeddings.create({
            model: embeddingModel,
            input: description,
        });
        const embedding = embeddingResponse.data[0].embedding;

        // 5. Upsert to product_catalog
        // Schema: id, name, description, category, image_url, metadata, embedding
        // Detect category from folder path (facility, equipment, product, etc.)
        const folderName = path.dirname(filePath).split(path.sep).pop().toLowerCase();
        const categoryMap = {
            'facility': 'facility',
            'equipment': 'equipment',
            'products': 'product',
            'product': 'product',
            'metrology': 'equipment',
            'certifications': 'asset',
            'branding': 'asset',
            'clients': 'asset'
        };
        const category = categoryMap[folderName] || 'asset';

        const { error: dbError } = await supabase.from('product_catalog').upsert({
            id: crypto.randomUUID(),
            name: fileName,
            description: description,
            category: category,
            image_url: publicUrl,
            metadata: {
                original_path: filePath,
                ingested_at: new Date().toISOString(),
                vision_model: USE_OPENROUTER ? "google/gemini-flash-1.5" : "gpt-4o",
                provider: USE_OPENROUTER ? "openrouter" : "openai",
                source_folder: folderName
            },
            embedding: embedding,
        });

        if (dbError) {
            console.error(`   ❌ Database Insert Failed:`, dbError.message);
        } else {
            console.log(`   ✅ Successfully Indexed`);
        }

    } catch (err) {
        console.error(`   ❌ Error processing file:`, err.message);
    }
}

async function main() {
    const targetDir = process.argv[2];
    if (!targetDir) {
        console.error("Usage: node skills/content_factory/ingest_assets.js <directory_path>");
        process.exit(1);
    }

    console.log(`🚀 Starting Asset Ingestion for: ${targetDir}`);
    
    // Check Storage Bucket Access
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
         console.error("❌ Storage Connection Failed:", bucketError.message);
         process.exit(1);
    }
    const bucketExists = buckets.find(b => b.name === BUCKET_NAME);
    if (!bucketExists) {
        console.warn(`⚠️  Bucket '${BUCKET_NAME}' not found. Please create it first.`);
        // Try creating? (Only possible if service role has permissions, usually needs SQL or Dashboard)
        try {
            await supabase.storage.createBucket(BUCKET_NAME, { public: true });
             console.log(`   -> Created '${BUCKET_NAME}' bucket.`);
        } catch (e) {
             console.error(`   -> Failed to create bucket: ${e.message}`);
        }
    }

    const files = await getFiles(targetDir);
    console.log(`🔍 Found ${files.length} files`);
    
    for (const file of files) {
        await processAsset(file);
    }
    
    console.log("\n🎉 Asset Ingestion Complete!");
}

main();
