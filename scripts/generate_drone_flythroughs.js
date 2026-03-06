import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';
import RunwayML from '@runwayml/sdk';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;

if (!RUNWAY_API_KEY) {
    console.error('❌ RUNWAY_API_KEY not found in .env');
    process.exit(1);
}

const client = new RunwayML({ apiKey: RUNWAY_API_KEY });

const DRONE_TASKS = [
    {
        id: 'sala-limpa-3-drone',
        imagePath: 'public/remotion/assets/images/sala_limpa_3_upscaled.png',
        prompt: 'Cinematic drone fly-through moving slowly forward through a high-tech sterile cleanroom, laboratory equipment, bright white surgical lighting, 4k, smooth motion --style cinematic',
        duration: 5,
    },
    {
        id: 'sala-limpa-6-drone',
        imagePath: 'public/remotion/assets/images/sala_limpa_6.png',
        prompt: 'Cinematic drone fly-through soaring through a modern medical manufacturing cleanroom, technicians in hazmat suits, precision equipment, bright sterile environment, 4k, smooth motion --style cinematic',
        duration: 5,
    }
];

async function imageToBase64(imagePath) {
    const fullPath = path.resolve(__dirname, '..', imagePath);
    if (!fs.existsSync(fullPath)) {
        throw new Error(`File not found: ${fullPath}`);
    }
    const imageBuffer = fs.readFileSync(fullPath);
    const base64 = imageBuffer.toString('base64');
    const ext = path.extname(imagePath).toLowerCase();
    const mimeType = ext === '.webp' ? 'image/webp' : ext === '.png' ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${base64}`;
}

async function generateDroneVideo(taskData) {
    console.log(`\n🎬 Generating: ${taskData.id}`);

    try {
        const imageDataUri = await imageToBase64(taskData.imagePath);
        console.log(`📦 Image loaded: ${taskData.imagePath}`);

        const task = await client.imageToVideo.create({
            model: 'gen3a_turbo',
            promptImage: imageDataUri,
            promptText: taskData.prompt,
            duration: taskData.duration,
            ratio: '1280:768',
        });

        console.log(`⏳ Task created: ${task.id}`);

        let result = await client.tasks.retrieve(task.id);
        let attempts = 0;
        while ((result.status === 'PENDING' || result.status === 'RUNNING') && attempts < 60) {
            process.stdout.write('.');
            await new Promise(resolve => setTimeout(resolve, 5000));
            result = await client.tasks.retrieve(task.id);
            attempts++;
        }
        console.log('');

        if (result.status === 'SUCCEEDED' && result.output) {
            const videoUrl = Array.isArray(result.output) ? result.output[0] : result.output;
            const videoResponse = await fetch(videoUrl);
            const videoBuffer = await videoResponse.arrayBuffer();
            const outputPath = path.resolve(__dirname, `../public/remotion/assets/runway/${taskData.id}.mp4`);

            const dir = path.dirname(outputPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            fs.writeFileSync(outputPath, Buffer.from(videoBuffer));
            console.log(`✅ Saved: ${outputPath}`);
            return outputPath;
        } else {
            console.error(`❌ Task failed: ${result.status}`);
            return null;
        }
    } catch (error) {
        console.error(`❌ Error generating ${taskData.id}:`, error.message || error);
        return null;
    }
}

async function main() {
    for (const task of DRONE_TASKS) {
        await generateDroneVideo(task);
    }
}

main().catch(console.error);
