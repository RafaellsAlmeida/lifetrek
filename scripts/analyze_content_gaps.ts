
import { createClient } from "npm:@supabase/supabase-js@2";
import "jsr:@std/dotenv/load";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing Supabase credentials in .env");
    Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function analyzeContentStatus() {
    console.log("Analyzing Content Status...\n");

    // 1. Check LinkedIn Carousels
    const { data: carousels, error } = await supabase
        .from("linkedin_carousels")
        .select("id, topic, status, pdf_url, image_urls, slides");

    if (error) {
        console.error("Error fetching LinkedIn Carousels:", error);
    } else {
        console.log(`\n--- LinkedIn Carousels (${carousels?.length || 0}) ---`);
        carousels?.forEach(c => {
            const hasPDF = !!c.pdf_url;
            const hasImages = c.image_urls && c.image_urls.length > 0;
            const slideCount = Array.isArray(c.slides) ? c.slides.length : 0;
            console.log(`[${c.status}] ${c.topic.substring(0, 40)}...`);
            console.log(`    Slides: ${slideCount} | PDF: ${hasPDF ? '✅' : '❌'} | Images: ${hasImages ? `✅ (${c.image_urls.length})` : '❌'}`);
        });
    }

    // 2. Check Resources (for metadata completeness)
    const { data: resources, error: resError } = await supabase
        .from("resources")
        .select("title, slug, status, content");

    if (resError) {
        console.error("Error fetching Resources:", resError);
    } else {
        console.log(`\n--- Resources (${resources?.length || 0}) ---`);
        resources?.forEach(r => {
            const contentLength = r.content ? r.content.length : 0;
            const hasTable = r.content && r.content.includes('|');
            console.log(`[${r.status}] ${r.title.substring(0, 40)}...`);
            console.log(`    Slug: ${r.slug} | Content Length: ${contentLength} | Has Table: ${hasTable ? '✅' : '❌'}`);
        });
    }
}

analyzeContentStatus();
