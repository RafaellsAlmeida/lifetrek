
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

files.forEach(file => {
    // Expected format: topic_slide_N_timestamp.png
    // e.g. cnc_slide_1_1771461933618.png

    // Find which topic matches the start of the filename
    const topic = topics.find(t => file.startsWith(t + '_'));

    if (!topic) {
        console.warn(`Could not identify topic for file: ${file}`);
        return;
    }

    // Extract slide number
    // Split by '_' -> [topic, 'slide', '1', 'timestamp.png']
    const parts = file.split('_');
    const slideIndex = parts.indexOf('slide');
    if (slideIndex === -1 || parts.length <= slideIndex + 1) {
        console.warn(`Could not parse slide number: ${file}`);
        return;
    }

    const slideNum = parts[slideIndex + 1];

    const destPath = path.join(DEST_DIR, topic, `slide_${slideNum}.png`);

    // Copy file (don't move, to keep artifact reference if needed, or move to clean up? Copy is safer)
    // User asked to "save those locally", copy is fine.
    fs.copyFileSync(path.join(BRAIN_DIR, file), destPath);
    console.log(`Saved: ${topic}/slide_${slideNum}.png`);
});

console.log('Organization complete.');
