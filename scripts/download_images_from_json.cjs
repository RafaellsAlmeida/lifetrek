
const fs = require('fs');
const path = require('path');
const https = require('https');

const posts = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tmp', 'instagram_posts.json'), 'utf8'));
const baseDir = path.resolve(__dirname, '..', 'marketing-assets', 'instagram-posts');

function slugify(text) {
    return text
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50);
}

function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(destPath, () => { });
            reject(err);
        });
    });
}

async function run() {
    if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
    }

    for (const post of posts) {
        const slug = slugify(post.topic);
        const folderName = `${slug}--${post.id.substring(0, 8)}`;
        const postDir = path.join(baseDir, folderName);

        if (!fs.existsSync(postDir)) {
            fs.mkdirSync(postDir, { recursive: true });
        }

        console.log(`Processing: ${post.topic}`);

        // Save caption
        fs.writeFileSync(path.join(postDir, 'caption.txt'), post.caption || '');

        // Save metadata
        fs.writeFileSync(path.join(postDir, 'metadata.json'), JSON.stringify(post, null, 2));

        // Download images
        const imageUrls = post.image_urls || [];
        for (let i = 0; i < imageUrls.length; i++) {
            const url = imageUrls[i];
            const ext = url.split('.').pop()?.split('?')[0] || 'png';
            const fileName = `slide_${i + 1}.${ext}`;
            const destPath = path.join(postDir, fileName);

            console.log(`  Downloading slide ${i + 1}...`);
            try {
                await downloadFile(url, destPath);
            } catch (err) {
                console.error(`  Error downloading ${url}: ${err.message}`);
            }
        }
    }
    console.log("All downloads complete!");
}

run();
