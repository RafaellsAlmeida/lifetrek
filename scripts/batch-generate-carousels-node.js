import fs from 'fs';
import path from 'path';

/**
 * Node.js Batch LinkedIn Carousel Generator
 * 
 * Usage:
 *   node scripts/batch-generate-carousels-node.js ./tmp/march_plan.json
 */

const SUPABASE_URL = process.env.SUPABASE_URL || "https://iijkbhiqcsvtnfernrbs.supabase.co";
let SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Simple .env loader
function loadEnv(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            console.log(`📡 Carregando variáveis de ${filePath}`);
            const content = fs.readFileSync(filePath, 'utf8');
            content.split('\n').forEach(line => {
                const parts = line.split('=');
                if (parts.length === 2) {
                    const key = parts[0].trim();
                    const value = parts[1].trim().replace(/^["']|["']$/g, '');
                    process.env[key] = value;
                    if (key === 'SUPABASE_SERVICE_ROLE_KEY') SUPABASE_SERVICE_ROLE_KEY = value;
                }
            });
        }
    } catch (e) {
        console.warn(`⚠️  Aviso: Não foi possível carregar ${filePath}: ${e.message}`);
    }
}

loadEnv('.env');
loadEnv('.env.local');

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
    process.exit(1);
}

async function generateCarousel(config, index, total) {
    console.log(`\n🎯 [${index + 1}/${total}] Gerando: "${config.topic.substring(0, 50)}..."`);

    try {
        const startTime = Date.now();

        const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-linkedin-carousel`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                "apikey": SUPABASE_SERVICE_ROLE_KEY,
            },
            body: JSON.stringify({
                topic: config.topic,
                targetAudience: config.targetAudience || "Geral",
                painPoint: config.painPoint || "",
                desiredOutcome: config.desiredOutcome || "",
                ctaAction: config.ctaAction || "",
                postType: config.postType || "value",
                format: config.format || "carousel",
                selectedEquipment: config.selectedEquipment || [],
                referenceImage: config.referenceImage || "",
                scheduledDate: config.scheduledDate || null,
                numberOfCarousels: 1,
                stream: false,
                batchMode: true,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`   ❌ Erro HTTP ${response.status}: ${errorText.substring(0, 200)}`);
            return false;
        }

        const data = await response.json();
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        if (data.carousel || data.carousels?.[0]) {
            const carousel = data.carousel || data.carousels[0];
            const slideCount = carousel.slides?.length || 0;
            console.log(`   ✅ Sucesso! ${slideCount} slides gerados em ${elapsed}s`);
            console.log(`   📝 ID: ${carousel.id || "auto-saved"}`);
            return true;
        } else {
            console.error(`   ❌ Resposta inválida:`, JSON.stringify(data).substring(0, 200));
            return false;
        }
    } catch (error) {
        console.error(`   ❌ Erro: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log("🚀 Node.js Batch LinkedIn Carousel Generator");
    console.log("====================================\n");

    const inputFile = process.argv[2];
    if (!inputFile) {
        console.error("❌ Por favor, forneça um arquivo JSON como argumento.");
        process.exit(1);
    }

    let topics;
    try {
        const fileContent = fs.readFileSync(path.resolve(inputFile), 'utf8');
        topics = JSON.parse(fileContent);
        console.log(`📄 Carregados ${topics.length} tópicos de ${inputFile}`);
    } catch (e) {
        console.error(`❌ Erro ao ler arquivo: ${e.message}`);
        process.exit(1);
    }

    console.log(`\n⏱️  Iniciando geração de ${topics.length} carrosséis...\n`);

    let success = 0;
    let failed = 0;

    for (let i = 0; i < topics.length; i++) {
        const result = await generateCarousel(topics[i], i, topics.length);
        if (result) {
            success++;
        } else {
            failed++;
        }

        if (i < topics.length - 1) {
            console.log("   ⏳ Aguardando 3s antes do próximo...");
            await new Promise(r => setTimeout(r, 3000));
        }
    }

    console.log("\n====================================");
    console.log(`✅ Sucesso: ${success}/${topics.length}`);
    console.log(`❌ Falhas: ${failed}/${topics.length}`);
    console.log("====================================\n");

    if (failed > 0) {
        process.exit(1);
    }
}

main();
