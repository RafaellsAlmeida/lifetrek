
const fs = require('fs');
const path = require('path');

const BRAIN_DIR = '/Users/rafaelalmeida/.gemini/antigravity/brain/04c9f21b-dc85-4bfa-a9cb-5e9b97f752c4';
const DEST_DIR = path.join(__dirname, '../march_2026_deliverables');

const topics = ['cnc', 'iso', 'swiss', 'tm30', 'dfm', 'zeiss', 'local', 'tco'];

// Ensure dest dir exists
if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
}

// Create topic subdirs
topics.forEach(topic => {
    const dir = path.join(DEST_DIR, topic);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
});

// List files in brain dir
const files = fs.readdirSync(BRAIN_DIR).filter(f => f.includes('_slide_') && f.endsWith('.png'));

console.log(`Found ${files.length} slide images.`);


// Group files by key "topic_slide_N" to find the latest version
const latestFiles = {};

files.forEach(file => {
    // Find which topic matches the start of the filename
    const topic = topics.find(t => file.startsWith(t + '_'));
    if (!topic) return;

    // Extract slide number
    const parts = file.split('_');
    const slideIndex = parts.indexOf('slide');
    if (slideIndex === -1 || parts.length <= slideIndex + 1) return;
    const slideNum = parts[slideIndex + 1];

    // Extract timestamp (last part before extension)
    const lastPart = parts[parts.length - 1];
    const timestamp = parseInt(lastPart.split('.')[0]);

    if (isNaN(timestamp)) return;

    const key = `${topic}_slide_${slideNum}`;

    if (!latestFiles[key] || timestamp > latestFiles[key].timestamp) {
        latestFiles[key] = {
            file: file,
            topic: topic,
            slideNum: slideNum,
            timestamp: timestamp
        };
    }
});

console.log(`Identified ${Object.keys(latestFiles).length} unique latest slides.`);

Object.values(latestFiles).forEach(item => {
    const destPath = path.join(DEST_DIR, item.topic, `slide_${item.slideNum}.png`);
    fs.copyFileSync(path.join(BRAIN_DIR, item.file), destPath);
    console.log(`Saved: ${item.topic}/slide_${item.slideNum}.png (from ${item.file})`);
});


console.log('Organization complete.');
