
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dlflpvmdzkeouhgqwqba.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateRoadmapClean() {
    try {
        // Reading from artifacts directly
        const slide1Buffer = fs.readFileSync('/Users/rafaelalmeida/.gemini/antigravity/brain/9b69d090-b767-4e7a-b0b0-477b0356526c/roadmap_slide_1_clean_1770649125323.png');
        const slide2Buffer = fs.readFileSync('/Users/rafaelalmeida/.gemini/antigravity/brain/9b69d090-b767-4e7a-b0b0-477b0356526c/roadmap_slide_2_clean_1770649142417.png');

        const slide1Base64 = `data:image/png;base64,${slide1Buffer.toString('base64')}`;
        const slide2Base64 = `data:image/png;base64,${slide2Buffer.toString('base64')}`;

        console.log("Updating Roadmap carousel with clean images...");

        const slides = [
            {
                type: "image",
                url: slide1Base64,
                alt: "Roadmap Slide 1",
                title: "Roteiro de 90 Dias"
            },
            {
                type: "image",
                url: slide2Base64,
                alt: "Roadmap Slide 2",
                title: "Próximo Passo"
            }
        ];

        const { error } = await supabase
            .from('linkedin_carousels')
            .update({
                slides: slides,
                image_urls: [slide1Base64, slide2Base64], // Update preview as well
                status: 'pending_approval'
            })
            .eq('topic', 'Roadmap de 90 Dias');

        if (error) throw error;
        console.log("Success! Roadmap carousel updated with clean images.");

    } catch (err) {
        console.error("Error updating roadmap:", err);
    }
}

updateRoadmapClean();
