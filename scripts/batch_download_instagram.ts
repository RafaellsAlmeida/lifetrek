
import { createClient } from "@supabase/supabase-js";
import fs from 'fs';
import path from 'path';
import axios from 'axios';

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
const supabaseUrl = env.SUPABASE_URL || "https://dlflpvmdzkeouhgqwqba.supabase.co";
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function downloadImage(url: string, filePath: string) {
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`Failed to download image: ${url}`, error.message);
    }
}

async function run() {
    console.log("Fetching latest 8 Instagram posts...");

    const { data: posts, error } = await supabase
        .from('instagram_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8);

    if (error) {
        console.error("Error fetching posts:", error.message);
        return;
    }

    if (!posts || posts.length === 0) {
        console.log("No posts found.");
        return;
    }

    const baseDir = path.resolve(process.cwd(), 'marketing-assets/instagram-posts');
    if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
    }

    for (const post of posts) {
        const slug = post.topic
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50);

        const folderName = `${slug}--${post.id.substring(0, 8)}`;
        const postDir = path.join(baseDir, folderName);

        if (!fs.existsSync(postDir)) {
            fs.mkdirSync(postDir, { recursive: true });
        }

        // Save caption
        fs.writeFileSync(path.join(postDir, 'caption.txt'), post.caption || '');

        // Save metadata
        fs.writeFileSync(path.join(postDir, 'metadata.json'), JSON.stringify({
            id: post.id,
            topic: post.topic,
            status: post.status,
            post_type: post.post_type,
            hashtags: post.hashtags,
            image_urls: post.image_urls
        }, null, 2));

        // Download images
        const imageUrls = Array.isArray(post.image_urls) ? post.image_urls : (post.image_url ? [post.image_url] : []);
        console.log(`Downloading ${imageUrls.length} images for: ${post.topic}`);

        for (let i = 0; i < imageUrls.length; i++) {
            const url = imageUrls[i];
            const ext = url.split('.').pop()?.split('?')[0] || 'png';
            const fileName = `slide_${i + 1}.${ext}`;
            await downloadImage(url, path.join(postDir, fileName));
        }
    }

    console.log("Download complete!");
}

run();
