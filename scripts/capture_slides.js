import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const slidesDir = path.join(rootDir, 'generated_content');

async function captureSlides() {
    console.log('🚀 Starting Slide Capture with Playwright...');

    const browser = await chromium.launch();
    const context = await browser.newContext({
        viewport: { width: 1080, height: 1350 },
        deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    const files = fs
        .readdirSync(slidesDir)
        .filter((file) => /^slide_[1-5]\.html$/.test(file))
        .sort((a, b) => {
            const aNum = Number(a.match(/^slide_(\d+)\.html$/)[1]);
            const bNum = Number(b.match(/^slide_(\d+)\.html$/)[1]);
            return aNum - bNum;
        });

    for (const file of files) {
        const filePath = path.join(slidesDir, file);
        const pngPath = filePath.replace('.html', '.png');

        console.log(`📸 Capturing ${file}...`);

        await page.goto(`file://${filePath}`, { waitUntil: 'networkidle' });
        await page.waitForSelector('#slide-capture');
        await page.evaluate(() => document.fonts?.ready ?? Promise.resolve());
        const slideElement = page.locator('#slide-capture');
        await slideElement.screenshot({ path: pngPath });
        console.log(`   ✅ Saved to: ${pngPath}`);
    }

    await browser.close();
    console.log('\n✨ Slide capture complete!');
}

captureSlides().catch(console.error);
