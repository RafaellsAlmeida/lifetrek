
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import satori from "https://esm.sh/satori@0.10.11";
import { ensureDir } from "https://deno.land/std@0.208.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.208.0/path/mod.ts";

const SUPABASE_URL = "https://dlflpvmdzkeouhgqwqba.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Font cache
let fontData: ArrayBuffer | null = null;
let fontDataRegular: ArrayBuffer | null = null;

async function loadFonts() {
    if (fontData && fontDataRegular) return;
    console.log("📥 Loading fonts...");
    [fontData, fontDataRegular] = await Promise.all([
        fetch("https://github.com/google/fonts/raw/main/ofl/inter/Inter-Bold.ttf").then((res) => res.arrayBuffer()),
        fetch("https://github.com/google/fonts/raw/main/ofl/inter/Inter-Regular.ttf").then((res) => res.arrayBuffer())
    ]);
}

const logoUrl = "https://dlflpvmdzkeouhgqwqba.supabase.co/storage/v1/object/public/assets/logo.png";
const isoUrl = "https://dlflpvmdzkeouhgqwqba.supabase.co/storage/v1/object/public/assets/iso.jpg";

async function fetchAsBase64(url: string): Promise<string | null> {
    try {
        const res = await fetch(url);
        if (res.ok) {
            const buf = await res.arrayBuffer();
            const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
            return `data:image/${url.endsWith('png') ? 'png' : 'jpeg'};base64,${b64}`;
        }
    } catch (e) {
        console.warn(`⚠️ Failed to fetch asset ${url}:`, e);
    }
    return null;
}

async function exportCarousels() {
    await loadFonts();
    const [logoBase64, isoBase64] = await Promise.all([
        fetchAsBase64(logoUrl),
        fetchAsBase64(isoUrl)
    ]);

    console.log("🔍 Fetching March carousels from DB...");
    const { data: carousels, error } = await supabase
        .from("linkedin_carousels")
        .select("*")
        .gt("scheduled_date", "2026-03-01");

    if (error) {
        console.error("❌ Error fetching carousels:", error);
        return;
    }

    console.log(`🚀 Processing ${carousels.length} carousels...`);

    await ensureDir("tmp/march_output");

    for (const carousel of carousels) {
        const topicSlug = carousel.topic.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30);
        const carouselDir = join("tmp/march_output", topicSlug);
        await ensureDir(carouselDir);

        console.log(`📦 Exporting: ${carousel.topic}`);

        for (let i = 0; i < carousel.slides.length; i++) {
            const slide = carousel.slides[i];
            // Use a high-quality medical background placeholder
            const bgUrl = "https://images.unsplash.com/photo-1579154261226-42925edf216b?auto=format&fit=crop&q=80&w=1000&h=1000";

            const element = {
                type: 'div',
                props: {
                    style: {
                        display: 'flex',
                        height: '1000px',
                        width: '1000px',
                        backgroundImage: `url(${bgUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        fontFamily: 'Inter',
                        position: 'relative',
                    },
                    children: [
                        // Glass Card
                        {
                            type: 'div',
                            props: {
                                style: {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    position: 'absolute',
                                    left: '50px',
                                    top: '100px',
                                    width: '500px',
                                    backgroundColor: 'rgba(0, 79, 143, 0.9)',
                                    borderRadius: '24px',
                                    padding: '60px',
                                    color: 'white',
                                },
                                children: [
                                    {
                                        type: 'div',
                                        props: {
                                            style: { color: '#4ade80', fontWeight: 700, fontSize: '18px', marginBottom: '10px' },
                                            children: `SLIDE ${i + 1}`,
                                        },
                                    },
                                    {
                                        type: 'h1',
                                        props: {
                                            style: { fontSize: '44px', lineHeight: 1.1, marginBottom: '20px', fontWeight: 800 },
                                            children: slide.headline,
                                        },
                                    },
                                    {
                                        type: 'p',
                                        props: {
                                            style: { fontSize: '22px', lineHeight: 1.4, color: 'rgba(255,255,255, 0.9)' },
                                            children: slide.body,
                                        },
                                    },
                                ],
                            },
                        },
                        // Branding Line
                        {
                            type: 'div',
                            props: {
                                style: { position: 'absolute', bottom: 0, left: 0, width: '100%', height: '12px', background: 'linear-gradient(90deg, #004F8F 0%, #1A7A3E 100%)' },
                            },
                        },
                        // Logo & ISO
                        {
                            type: 'div',
                            props: {
                                style: { position: 'absolute', top: '40px', right: '40px', display: 'flex', alignItems: 'center', gap: '20px' },
                                children: [
                                    isoBase64 ? { type: 'img', props: { src: isoBase64, height: 50, style: { objectFit: 'contain' } } } : null,
                                    {
                                        type: 'div',
                                        props: {
                                            style: { backgroundColor: 'white', padding: '10px 20px', borderRadius: '12px' },
                                            children: logoBase64 ? [{ type: 'img', props: { src: logoBase64, width: 120, style: { objectFit: 'contain' } } }] : null
                                        }
                                    }
                                ].filter(Boolean)
                            }
                        }
                    ],
                },
            };

            const svg = await satori(element, {
                width: 1000,
                height: 1000,
                fonts: [
                    { name: 'Inter', data: fontData!, weight: 800, style: 'normal' },
                    { name: 'Inter', data: fontDataRegular!, weight: 400, style: 'normal' },
                ],
            });

            await Deno.writeTextFile(join(carouselDir, `slide_${i + 1}.svg`), svg);
        }
    }
    console.log("✅ All carousels exported (as SVGs) to tmp/march_output/");
}

exportCarousels();
