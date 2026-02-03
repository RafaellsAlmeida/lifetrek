import { createClient } from "@supabase/supabase-js";
import fs from 'fs';
import path from 'path';

// Manual .env parsing
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const envVars: Record<string, string> = {};
        envFile.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                let value = valueParts.join('=');
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                envVars[key.trim()] = value.trim();
            }
        });
        return envVars;
    } catch (e) {
        return {};
    }
}

const env = loadEnv();
const supabaseUrl = process.env.SUPABASE_URL || env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function analyze() {
    console.log("=== SOCIAL MEDIA CONTENT ANALYSIS ===\n");

    // 1. LinkedIn Carousels (former linkedin_posts)
    console.log("--- LINKEDIN CAROUSELS ---");
    const { data: carousels, error: carouselErr } = await supabase
        .from('linkedin_carousels')
        .select('id, title, status, post_type, scheduled_for, created_at, published_at')
        .order('created_at', { ascending: false })
        .limit(20);

    if (carouselErr) {
        console.log('linkedin_carousels error:', carouselErr.message);
    } else if (carousels && carousels.length > 0) {
        console.log(`Found ${carousels.length} LinkedIn carousel(s):\n`);
        carousels.forEach((c, i) => {
            console.log(`${i + 1}. "${c.title || 'Untitled'}"`);
            console.log(`   Status: ${c.status} | Type: ${c.post_type || 'N/A'}`);
            console.log(`   Created: ${c.created_at} | Published: ${c.published_at || 'Not published'}`);
            console.log(`   Scheduled: ${c.scheduled_for || 'Not scheduled'}`);
            console.log('');
        });
    } else {
        console.log("No LinkedIn carousels found.\n");
    }

    // 2. Resources (could include IG posts)
    console.log("--- RESOURCES (All platforms) ---");
    const { data: resources, error: resourceErr } = await supabase
        .from('resources')
        .select('id, title, status, platform, resource_type, scheduled_for, created_at')
        .order('created_at', { ascending: false })
        .limit(30);

    if (resourceErr) {
        console.log('resources error:', resourceErr.message);
    } else if (resources && resources.length > 0) {
        console.log(`Found ${resources.length} resource(s):\n`);
        
        // Group by platform
        const byPlatform: Record<string, typeof resources> = {};
        resources.forEach(r => {
            const p = r.platform || 'unknown';
            if (!byPlatform[p]) byPlatform[p] = [];
            byPlatform[p].push(r);
        });

        Object.entries(byPlatform).forEach(([platform, items]) => {
            console.log(`\n  [${platform.toUpperCase()}] - ${items.length} item(s)`);
            items.forEach((r, i) => {
                console.log(`    ${i + 1}. "${r.title || 'Untitled'}" | Status: ${r.status} | Type: ${r.resource_type || 'N/A'}`);
            });
        });
    } else {
        console.log("No resources found.\n");
    }

    // 3. Check content_posts table if exists
    console.log("\n--- CONTENT POSTS ---");
    const { data: contentPosts, error: contentErr } = await supabase
        .from('content_posts')
        .select('id, title, status, platform, post_type, scheduled_for, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

    if (contentErr) {
        console.log('content_posts error:', contentErr.message);
    } else if (contentPosts && contentPosts.length > 0) {
        console.log(`Found ${contentPosts.length} content post(s):\n`);
        
        const byPlatform: Record<string, typeof contentPosts> = {};
        contentPosts.forEach(p => {
            const plat = p.platform || 'unknown';
            if (!byPlatform[plat]) byPlatform[plat] = [];
            byPlatform[plat].push(p);
        });

        Object.entries(byPlatform).forEach(([platform, items]) => {
            console.log(`  [${platform.toUpperCase()}] - ${items.length} item(s)`);
            items.forEach((p, i) => {
                console.log(`    ${i + 1}. "${p.title || 'Untitled'}" | Status: ${p.status} | Type: ${p.post_type || 'N/A'}`);
            });
        });
    } else {
        console.log("No content_posts or table doesn't exist.\n");
    }

    // 4. Summary stats
    console.log("\n=== SUMMARY ===");
    
    // LinkedIn stats
    if (carousels) {
        const published = carousels.filter(c => c.status === 'published').length;
        const pending = carousels.filter(c => c.status === 'pending_approval' || c.status === 'pending').length;
        const approved = carousels.filter(c => c.status === 'approved').length;
        console.log(`LinkedIn: ${published} published, ${approved} approved, ${pending} pending approval`);
    }

    // Resources by platform
    if (resources) {
        const igResources = resources.filter(r => r.platform?.toLowerCase().includes('instagram'));
        const liResources = resources.filter(r => r.platform?.toLowerCase().includes('linkedin'));
        console.log(`Resources - LinkedIn: ${liResources.length}, Instagram: ${igResources.length}`);
        
        const pendingIg = igResources.filter(r => r.status === 'pending_approval' || r.status === 'pending' || r.status === 'draft');
        if (pendingIg.length > 0) {
            console.log(`\nInstagram content NOT approved yet (${pendingIg.length}):`);
            pendingIg.forEach(r => console.log(`  - "${r.title}" [${r.status}]`));
        }
    }
}

analyze().catch(console.error);
