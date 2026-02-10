/**
 * Export Social Content Locally (from MCP SQL dump files)
 * 
 * Reads the JSON data exported via Supabase MCP SQL,
 * downloads all slide images, saves captions, and organizes
 * into a marketing-assets folder structure.
 * 
 * Usage: node scripts/export_social_content.cjs
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..', 'marketing-assets');

// Paths to MCP sql dump files (in user home ~/.gemini dir)
const BRAIN_DIR = '/Users/rafaelalmeida/.gemini/antigravity/brain/27922c9b-416f-4013-8824-5384ca3a1f85';
const LINKEDIN_DUMP = path.join(BRAIN_DIR, '.system_generated', 'steps', '583', 'output.txt');
const INSTAGRAM_DUMP = path.join(BRAIN_DIR, '.system_generated', 'steps', '584', 'output.txt');

// ── Helpers ──────────────────────────────────────────────────────────────

function slugify(text) {
    return text
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

function extractJsonFromMcpDump(filePath) {
    let raw = fs.readFileSync(filePath, 'utf-8');

    // Unescape outer JSON string wrapper
    try { raw = JSON.parse(raw); } catch (e) { }

    // Regex to find the JSON array inside tags.
    const match = raw.match(/<untrusted-data-[^>]+>\s*(\[[\s\S]*?\])\s*<\/untrusted-data/);

    let content;
    if (match) {
        content = match[1];
    } else {
        // Fallback: greedy match for array
        const arrFull = raw.match(/\[[\s\S]*\]/);
        if (!arrFull) throw new Error(`Could not extract JSON from ${filePath}`);
        content = arrFull[0];
    }

    // Sanitize: Convert logical newlines back to escaped newlines
    content = content.replace(/\r\n/g, '\\n')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '')
        .replace(/\t/g, '\\t');

    return JSON.parse(content);
}

function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        if (!url || url.includes('placehold.co')) {
            resolve(false);
            return;
        }

        const protocol = url.startsWith('https') ? https : http;
        const req = protocol.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
                return;
            }
            if (res.statusCode !== 200) {
                resolve(false);
                return;
            }
            const file = fs.createWriteStream(destPath);
            res.pipe(file);
            file.on('finish', () => { file.close(); resolve(true); });
            file.on('error', (err) => { fs.unlink(destPath, () => { }); reject(err); });
        });
        req.on('error', () => resolve(false));
        req.setTimeout(60000, () => { req.destroy(); resolve(false); });
    });
}

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function unescapeCaption(caption) {
    if (!caption) return '';
    return caption
        .replace(/\\\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
}

// ── Export LinkedIn ─────────────────────────────────────────────────────

async function exportLinkedInCarousels() {
    console.log('\n📥 Loading LinkedIn Carousels from MCP dump...');
    const rawData = extractJsonFromMcpDump(LINKEDIN_DUMP);
    // rawData is [{data: [...]}] from json_agg
    const data = rawData[0]?.data || rawData;
    console.log(`   Found ${data.length} carousels`);

    const linkedinDir = path.join(BASE_DIR, 'linkedin-carousels');
    ensureDir(linkedinDir);

    const indexLines = ['id,topic,status,slides_count,folder'];

    for (const carousel of data) {
        const slug = slugify(carousel.topic || carousel.id);
        const folderName = `${slug}--${carousel.id.slice(0, 8)}`;
        const carouselDir = path.join(linkedinDir, folderName);
        ensureDir(carouselDir);

        // Save caption
        if (carousel.caption) {
            fs.writeFileSync(
                path.join(carouselDir, 'caption.txt'),
                unescapeCaption(carousel.caption),
                'utf-8'
            );
        }

        // Save metadata
        fs.writeFileSync(
            path.join(carouselDir, 'metadata.json'),
            JSON.stringify({
                id: carousel.id,
                topic: carousel.topic,
                status: carousel.status,
                slides_count: carousel.slides?.length || 0,
            }, null, 2),
            'utf-8'
        );

        // Download slide images
        const slides = carousel.slides || [];
        let downloadedCount = 0;
        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            const imageUrl = slide.imageUrl || slide.image_url;
            if (imageUrl && !imageUrl.includes('placehold.co')) {
                try {
                    const ext = path.extname(new URL(imageUrl).pathname) || '.png';
                    const filename = `slide-${i + 1}-${slide.type || 'content'}${ext}`;
                    const destPath = path.join(carouselDir, filename);
                    if (!fs.existsSync(destPath)) {
                        const ok = await downloadFile(imageUrl, destPath);
                        if (ok) downloadedCount++;
                    } else {
                        downloadedCount++;
                    }
                } catch (e) { }
            }
        }

        indexLines.push(`${carousel.id},"${(carousel.topic || '').replace(/"/g, '""')}",${carousel.status},${slides.length},${folderName}`);
        console.log(`   ✅ ${carousel.topic} (${carousel.status}) — ${downloadedCount}/${slides.length} images`);
    }

    fs.writeFileSync(path.join(linkedinDir, 'index.csv'), indexLines.join('\n'), 'utf-8');
    console.log(`   📋 Index: ${path.join(linkedinDir, 'index.csv')}`);
    return data.length;
}

// ── Export Instagram ────────────────────────────────────────────────────

async function exportInstagramPosts() {
    console.log('\n📥 Loading Instagram Posts from MCP dump...');
    const rawData = extractJsonFromMcpDump(INSTAGRAM_DUMP);
    const data = rawData[0]?.data || rawData;
    console.log(`   Found ${data.length} posts`);

    const instaDir = path.join(BASE_DIR, 'instagram-posts');
    ensureDir(instaDir);

    const indexLines = ['id,topic,status,post_type,folder'];

    for (const post of data) {
        const slug = slugify(post.topic || post.id);
        const folderName = `${slug}--${post.id.slice(0, 8)}`;
        const postDir = path.join(instaDir, folderName);
        ensureDir(postDir);

        // Save caption
        if (post.caption) {
            fs.writeFileSync(
                path.join(postDir, 'caption.txt'),
                unescapeCaption(post.caption),
                'utf-8'
            );
        }

        // Save metadata
        fs.writeFileSync(
            path.join(postDir, 'metadata.json'),
            JSON.stringify({
                id: post.id,
                topic: post.topic,
                status: post.status,
                post_type: post.post_type,
            }, null, 2),
            'utf-8'
        );

        let downloadedCount = 0;

        // Download from slides
        const slides = post.slides || [];
        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            const imageUrl = slide.imageUrl || slide.image_url;
            if (imageUrl && !imageUrl.includes('placehold.co')) {
                try {
                    const ext = path.extname(new URL(imageUrl).pathname) || '.png';
                    const filename = `slide-${i + 1}${ext}`;
                    const destPath = path.join(postDir, filename);
                    if (!fs.existsSync(destPath)) {
                        const ok = await downloadFile(imageUrl, destPath);
                        if (ok) downloadedCount++;
                    } else { downloadedCount++; }
                } catch (e) { }
            }
        }

        // Download from image_urls
        const imageUrls = post.image_urls || [];
        for (let i = 0; i < imageUrls.length; i++) {
            const url = imageUrls[i];
            if (url && !url.includes('placehold.co')) {
                try {
                    const ext = path.extname(new URL(url).pathname) || '.png';
                    const filename = `image-${i + 1}${ext}`;
                    const destPath = path.join(postDir, filename);
                    if (!fs.existsSync(destPath)) {
                        const ok = await downloadFile(url, destPath);
                        if (ok) downloadedCount++;
                    } else { downloadedCount++; }
                } catch (e) { }
            }
        }

        indexLines.push(`${post.id},"${(post.topic || '').replace(/"/g, '""')}",${post.status},${post.post_type || 'unknown'},${folderName}`);
        console.log(`   ✅ ${post.topic} (${post.status}) — ${downloadedCount} images`);
    }

    fs.writeFileSync(path.join(instaDir, 'index.csv'), indexLines.join('\n'), 'utf-8');
    console.log(`   📋 Index: ${path.join(instaDir, 'index.csv')}`);
    return data.length;
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
    console.log('🚀 Exporting Social Content to marketing-assets/');
    console.log('='.repeat(60));
    ensureDir(BASE_DIR);

    const linkedinCount = await exportLinkedInCarousels();
    const instaCount = await exportInstagramPosts();

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Export complete!`);
    console.log(`   LinkedIn Carousels: ${linkedinCount}`);
    console.log(`   Instagram Posts: ${instaCount}`);
    console.log(`   Output: ${BASE_DIR}`);
}

main().catch(err => {
    console.error('❌ Export failed:', err);
    process.exit(1);
});
