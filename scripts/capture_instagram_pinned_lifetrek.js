import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputDir = path.resolve(rootDir, 'marketing_assets/instagram/03_pinned_o_que_e_lifetrek');

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1080 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();
  const htmlFiles = fs
    .readdirSync(outputDir)
    .filter((file) => /^slide_\d+\.html$/.test(file))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

  for (const file of htmlFiles) {
    const htmlPath = path.join(outputDir, file);
    const pngPath = htmlPath.replace('.html', '.png');

    console.log(`📸 Capturing ${file}`);
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#slide-capture');
    const el = page.locator('#slide-capture');
    await el.screenshot({ path: pngPath });
    console.log(`✅ Saved ${pngPath}`);
  }

  await browser.close();
  console.log('✨ Instagram pinned carousel capture complete');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
