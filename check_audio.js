
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'public/remotion/voiceover.mp3');
const stats = fs.statSync(filePath);
console.log(`File size: ${stats.size} bytes`);

// Estimate duration for 128kbps mp3
// 128 kbps = 16 KB/s
const durationSeconds = stats.size / 16000;
console.log(`Estimated duration (assuming 128kbps): ${durationSeconds.toFixed(2)} seconds`);
console.log(`Estimated duration (assuming 192kbps): ${(stats.size / 24000).toFixed(2)} seconds`);
