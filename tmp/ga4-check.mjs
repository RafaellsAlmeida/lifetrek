import { chromium } from '@playwright/test';

const baseUrl = 'http://localhost:8080';
const email = 'rafacrvg@icloud.com';
const password = 'Lifetrek2026';

const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error(`[browser][error] ${msg.text()}`);
    }
  });

  await page.goto(`${baseUrl}/admin/login`, { waitUntil: 'networkidle' });

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Admin password').fill(password);
  await page.getByRole('button', { name: /login/i }).click();

  await page.waitForURL('**/admin', { timeout: 30000 });
  await page.goto(`${baseUrl}/admin/analytics`, { waitUntil: 'networkidle' });

  // Wait for analytics header to ensure page is loaded
  await page.getByRole('heading', { name: 'Analytics' }).waitFor({ timeout: 30000 });

  await page.screenshot({ path: 'tmp/ga4-analytics.png', fullPage: true });

  await browser.close();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
