// scripts/generate_video_assets.ts
// Uses RunwayML API (Gen-3 Alpha) to generate the planned A-roll assets for the Lifetrek showcase
// Note: Requires RUNWAY_API_KEY env var.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RUNWAY_API_KEY = Deno.env.get("RUNWAY_API_KEY");

// Prompts aligned with the storyboarded scenes for the showcase (Full AI Generation Coverage)
const PROMPTS = [
  // Scene 1: Factory Exterior (AI to replace missing Drone footage)
  {
    id: "scene-1a-drone",
    name: "broll_01_drone_rise",
    prompt: "Cinematic FPV drone shot flying fast towards a futuristic white medical manufacturing factory, modern architecture, glass windows, sunny day, lens flare, 8k, photorealistic."
  },
  {
    id: "scene-1b-facade",
    name: "broll_02_facade_push",
    prompt: "Smooth gimbal push-in toward a modern factory entrance, glass and metal architecture, minimal signage (no readable text), clean and premium look, soft blue-gray color grade."
  },

  // Scene 4: CNC Machining
  {
    id: "scene-4a-cnc-action",
    name: "broll_04_cnc",
    prompt: "Macro close-up of a Swiss-type CNC machine machining a small titanium medical component, precision movement, coolant mist, no sparks, ultra clean environment, premium lighting."
  },

  // Scene 5: Metrology
  {
    id: "scene-5a-metrology-action",
    name: "broll_05_metrology",
    prompt: "Extreme close-up macro shot of a ruby-tipped CMM probe gently touching a silver titanium dental implant screw, measuring it, blue laser light scanning, depth of field, 8k."
  },
  {
    id: "scene-5c-laser",
    name: "broll_07_laser",
    prompt: "High speed laser marking machine etching a datamatrix code onto a stainless steel surgical instrument, sparks of blue light, macro shot, high tech."
  },

  // Scene 6: Finishing
  {
    id: "scene-6d-electropolish",
    name: "broll_06_electropolish",
    prompt: "Medical-grade electropolishing line with stainless steel tanks, robotic arm lowering parts into solution, soft highlights reflecting on polished surfaces, cleanroom adjacent, no visible brand text."
  },
  
  // Scene 6a: Product Reveal (AI Product Shot)
  {
    id: "scene-6a-product",
    name: "product_reveal_implant",
    prompt: "Studio product shot of a medical spinal implant made of titanium, rotating slowly on a dark reflective surface, dramatic rim lighting, premium look, 8k."
  }
];

async function generateVideo(promptObj: {name: string, prompt: string}) {
    console.log(`🎬 Generating: ${promptObj.name}...`);
    
    if (!RUNWAY_API_KEY) {
        console.warn("⚠️  RUNWAY_API_KEY not found. Skipping generation. (Mock Mode)");
        // In real app, we would return the cloud URL here.
        return `https://mock-storage.lifetrek.app/videos/${promptObj.name}_gen3.mp4`;
    }

    try {
        const response = await fetch("https://api.runwayml.com/v1/inference/run", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${RUNWAY_API_KEY}`,
                "Content-Type": "application/json",
                "X-Runway-Version": "2024-09-26",
            },
            body: JSON.stringify({
                taskType: "text_to_video",
                model: "gen3a_turbo",
                promptText: promptObj.prompt,
                ratio: "16:9"
            })
        });

        if (!response.ok) {
            throw new Error(`Runway API Error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`   ↳ Task ID: ${data.id}. Queued.`);
        return data.id;

    } catch (e) {
        console.error(`   ❌ Failed to generate ${promptObj.name}:`, e);
        return null;
    }
}

async function main() {
    console.log("🚀 Starting Video Asset Generation (Aligned with VideoStudioPlan)...");
    
    for (const prompt of PROMPTS) {
        await generateVideo(prompt);
    }
    
    console.log("🏁 Batch Queued.");
}

main();
