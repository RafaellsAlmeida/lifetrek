
import { createClient } from "npm:@supabase/supabase-js@2";
import { parse } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { join, resolve } from "https://deno.land/std@0.224.0/path/mod.ts";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";

async function run() {
    console.log("Loading environment...");
    const env = await parse({ allowEmptyValues: true });

    const supabaseUrl = env.SUPABASE_URL || "https://dlflpvmdzkeouhgqwqba.supabase.co";
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseKey) {
        console.error("Missing SUPABASE_SERVICE_ROLE_KEY in .env");
        Deno.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

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

    const baseDir = resolve(Deno.cwd(), 'marketing-assets/instagram-posts');
    await ensureDir(baseDir);

    for (const post of posts) {
        const slug = post.topic
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50);

        const folderName = `${slug}--${post.id.substring(0, 8)}`;
        const postDir = join(baseDir, folderName);

        await ensureDir(postDir);

        // Save caption
        await Deno.writeTextFile(join(postDir, 'caption.txt'), post.caption || '');

        // Save metadata
        await Deno.writeTextFile(join(postDir, 'metadata.json'), JSON.stringify({
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
            const filePath = join(postDir, fileName);

            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Status ${response.status}`);
                const blob = await response.blob();
                const buffer = await blob.arrayBuffer();
                await Deno.writeFile(filePath, new Uint8Array(buffer));
            } catch (err) {
                console.error(`Failed to download ${url}: ${err.message}`);
            }
        }
    }

    console.log("Download complete!");
}

run();
