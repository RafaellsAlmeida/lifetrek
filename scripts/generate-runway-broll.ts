/**
 * Generate B-roll footage using Runway Gen-3 API
 *
 * Usage: npx ts-node scripts/generate-runway-broll.ts
 *
 * Requires: RUNWAY_API_KEY in .env
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import RunwayML from '@runwayml/sdk';

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;

if (!RUNWAY_API_KEY) {
  console.error('❌ RUNWAY_API_KEY not found in .env');
  process.exit(1);
}

const client = new RunwayML({ apiKey: RUNWAY_API_KEY });

// B-roll prompts using existing images as input
// B-roll prompts using existing images as input
const BROLL_PROMPTS = [
  {
    id: '3b-cleanroom-entry',
    imagePath: 'src/assets/facility/cleanroom.webp',
    prompt: 'Professional engineer putting on a cleanroom mask and hood, close up, slow motion, sterile white environment, bright lighting, high detail eye contact --style realistic',
    duration: 5,
  },
  {
    id: '4a-cnc-internal',
    imagePath: 'src/assets/equipment/citizen-l32.webp',
    prompt: 'Macro shot inside a CNC machine, cutting titanium metal, cooling fluid spraying, sparks, detailed texture of metal, 4k, slow motion --style cinematic',
    duration: 5,
  },
  {
    id: '4b-metal-shavings',
    imagePath: 'src/assets/equipment/citizen-l20.webp',
    prompt: 'Close up of shiny metal shavings spiraling off a lathe, cooling liquid splashing, glistening metal texture, industrial aesthetic, slow motion',
    duration: 5,
  },
];

async function imageToBase64(imagePath: string): Promise<string> {
  const fullPath = path.join(__dirname, '..', imagePath);
  const imageBuffer = fs.readFileSync(fullPath);
  const base64 = imageBuffer.toString('base64');
  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = ext === '.webp' ? 'image/webp' : ext === '.png' ? 'image/png' : 'image/jpeg';
  return `data:${mimeType};base64,${base64}`;
}

async function generateBroll(prompt: typeof BROLL_PROMPTS[0]) {
  console.log(`\n🎬 Generating: ${prompt.id}`);
  console.log(`📷 Image: ${prompt.imagePath}`);
  console.log(`📝 Prompt: ${prompt.prompt.substring(0, 80)}...`);

  try {
    // Convert image to base64 data URI
    const imageDataUri = await imageToBase64(prompt.imagePath);
    console.log(`📦 Image loaded (${(imageDataUri.length / 1024).toFixed(0)} KB base64)`);

    // Create image-to-video task with image input
    // Note: Runway only supports 1280:768 (landscape) or 768:1280 (portrait)
    const task = await client.imageToVideo.create({
      model: 'gen3a_turbo',
      promptImage: imageDataUri,
      promptText: prompt.prompt,
      duration: prompt.duration,
      ratio: '1280:768',
    });

    console.log(`⏳ Task created: ${task.id}`);

    // Poll for completion
    let result = await client.tasks.retrieve(task.id);
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max

    while ((result.status === 'PENDING' || result.status === 'RUNNING') && attempts < maxAttempts) {
      console.log(`   Status: ${result.status}... (${attempts * 5}s)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      result = await client.tasks.retrieve(task.id);
      attempts++;
    }

    if (result.status === 'SUCCEEDED' && result.output) {
      const videoUrl = Array.isArray(result.output) ? result.output[0] : result.output;

      // Download video
      const videoResponse = await fetch(videoUrl);
      const videoBuffer = await videoResponse.arrayBuffer();

      const outputPath = path.join(__dirname, `../remotion/assets/runway/${prompt.id}.mp4`);
      fs.writeFileSync(outputPath, Buffer.from(videoBuffer));

      console.log(`✅ Saved: ${outputPath}`);
      console.log(`📊 Size: ${(videoBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`);

      return outputPath;
    } else {
      console.error(`❌ Task failed: ${result.status}`);
      if (result.failure) console.error(`   Reason: ${result.failure}`);
      return null;
    }
  } catch (error: any) {
    console.error(`❌ Error generating ${prompt.id}:`, error.message || error);
    return null;
  }
}

async function main() {
  console.log('🎬 Runway Gen-3 B-roll Generator (Image-to-Video)');
  console.log('=================================================\n');

  const results: string[] = [];

  for (const prompt of BROLL_PROMPTS) {
    const result = await generateBroll(prompt);
    if (result) results.push(result);

    // Rate limiting - wait between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n=================================================');
  console.log(`✅ Generated ${results.length}/${BROLL_PROMPTS.length} videos`);
  results.forEach(r => console.log(`   - ${r}`));
}

main().catch(console.error);
