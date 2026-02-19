const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("=== INSPECTING CONTENT ===");

    try {
        const { data: blogs } = await supabase.from('blog_posts').select('id, title, status').limit(40);
        console.log("\nBLOGS (limit 40):", blogs?.map(b => (`[${b.status}] ${b.title}`)));

        const { data: linkedin } = await supabase.from('linkedin_carousels').select('id, topic, status, slides').limit(50);
        console.log("\nLINKEDIN (limit 50):", linkedin?.map(l => ({
            topic: l.topic,
            status: l.status,
            has_image: Array.isArray(l.slides) ? l.slides.some((s) => s.image_url || s.imageUrl) : false
        })));

        const { data: instagram } = await supabase.from('instagram_posts').select('id, topic, status, caption').limit(50);
        console.log("\nINSTAGRAM (limit 50):", instagram?.map(i => ({
            topic: i.topic,
            status: i.status
        })));

        const { data: approvedIG } = await supabase.from('instagram_posts').select('*').eq('status', 'approved').limit(10);
        console.log("\nAPPROVED IG (for inspiration):", JSON.stringify(approvedIG, null, 2));
    } catch (err) {
        console.error("Error during inspection:", err);
    }
}

run();
