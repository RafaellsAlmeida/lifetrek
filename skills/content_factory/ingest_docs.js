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
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPEN_ROUTER_API_KEY; // Fallback to OpenRouter if OpenAI is missing

// Debug: Show what we loaded
console.log('🔧 DEBUG - SUPABASE_URL:', SUPABASE_URL);
console.log('🔧 DEBUG - SERVICE_KEY (first 20 chars):', SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...');
console.log('🔧 DEBUG - OPENAI_KEY (first 20 chars):', OPENAI_API_KEY?.substring(0, 20) + '...');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase Environment Variables!');
    process.exit(1);
}

if (!OPENAI_API_KEY || OPENAI_API_KEY.includes('placeholder')) {
    console.error('❌ Missing or Placeholder OpenAI API Key in .env!');
    console.warn('   Please update OPENAI_API_KEY in your .env file with a valid key.');
    // We can't proceed without an embedding provider
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// --- Helper Functions ---

async function getFiles(dir) {
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(dirents.map((dirent) => {
        const res = path.resolve(dir, dirent.name);
        return dirent.isDirectory() ? getFiles(res) : res;
    }));
    return Array.prototype.concat(...files);
}

function chunkText(text, maxChars = 2000) {
    // Simple chunking by paragraph first, then length
    const chunks = [];
    let currentChunk = "";
    
    const paragraphs = text.split(/\n\s*\n/);
    
    for (const para of paragraphs) {
        if ((currentChunk.length + para.length) > maxChars) {
            chunks.push(currentChunk.trim());
            currentChunk = "";
        }
        currentChunk += (currentChunk ? "\n\n" : "") + para;
    }
    
    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
}

// --- Main Ingestion Logic ---

async function processFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (!['.md', '.txt', '.json', '.csv'].includes(ext)) return;

    console.log(`📄 Processing: ${path.basename(filePath)}`);
    
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        const stats = await fs.stat(filePath);
        
        // Chunking
        const chunks = chunkText(content);
        
        console.log(`   -> Split into ${chunks.length} chunks`);

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            if (!chunk.trim()) continue;

            // Generate Embedding
            const embeddingResponse = await openai.embeddings.create({
                model: "text-embedding-3-small", // 1536 dim (check your DB schema, might be 768 or 1536)
                input: chunk,
            });
            const embedding = embeddingResponse.data[0].embedding;

            // Upsert to Supabase
            // Note: DB Schema for knowledge_base might expect 768 or 1536. 
            // text-embedding-3-small is 1536.
            // If your DB is 768, use 'dimensions: 768' option in OpenAI call if supported or switch model.
            // Let's assume standard 1536 for now, or check schema.
            // User schema 20260116000001_create_knowledge_base.sql said `vector(768)`.
            // WAIT! The user schema specified 768. 
            // OpenAI text-embedding-3-small default is 1536. 
            // We MUST allow dimensionality reduction or use a model that fits.
            // text-embedding-3-small supports dimensions param.
            
            // Re-generating embedding with correct dimensions
             const embeddingResponseCorrect = await openai.embeddings.create({
                model: "text-embedding-3-small", 
                input: chunk,
                dimensions: 768
            });
            const embeddingCorrect = embeddingResponseCorrect.data[0].embedding;

            const { error } = await supabase.from('knowledge_base').upsert({
                id: crypto.randomUUID(), // Or deterministic UUID based on file+chunk
                content: chunk,
                metadata: {
                    source: filePath,
                    filename: path.basename(filePath),
                    chunk_index: i,
                    total_chunks: chunks.length,
                    processed_at: new Date().toISOString()
                },
                embedding: embeddingCorrect,
                source_type: 'local_file',
                source_id: filePath
            });

            if (error) {
                console.error(`   ❌ Failed to insert chunk ${i}:`, error.message);
            }
        }
        console.log(`   ✅ Finished ${path.basename(filePath)}`);
    } catch (err) {
        console.error(`   ❌ Error processing file:`, err.message);
    }
}

async function main() {
    const targetDir = process.argv[2];
    if (!targetDir) {
        console.error("Usage: node skills/content_factory/ingest_docs.js <directory_path>");
        process.exit(1);
    }

    console.log(`🚀 Starting ingestion for: ${targetDir}`);
    
    // Validate connection
    try {
        const { data, error } = await supabase.from('knowledge_base').select('count', { count: 'exact', head: true });
        if (error) {
             console.error("❌ Database Connection Failed:", error.message);
             console.error("   Full Error:", JSON.stringify(error, null, 2));
             process.exit(1);
        }
        console.log("✅ Linked to Supabase Knowledge Base");
    } catch (e) {
        console.error("❌ Database Connection Failed:", e.message);
        console.error("   Error Code:", e.code);
        console.error("   Cause:", e.cause);
        process.exit(1);
    }

    const files = await getFiles(targetDir);
    console.log(`🔍 Found ${files.length} files`);
    
    for (const file of files) {
        await processFile(file);
    }
    
    console.log("\n🎉 Ingestion Complete!");
}

main();
