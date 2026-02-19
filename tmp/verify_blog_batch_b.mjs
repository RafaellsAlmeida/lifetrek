import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const OUT='output/playwright/2026-02-19-batch-b';
fs.mkdirSync(OUT,{recursive:true});

const base='http://localhost:8080';
const email='rafacrvg@icloud.com';
const password='Lifetrek2026';

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900}});

await context.route('**/*', route => {
  const url = route.request().url();
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com') || /\.(woff2?|ttf|otf)(\?|$)/i.test(url)) {
    return route.abort();
  }
  return route.continue();
});

const page=await context.newPage();

await page.goto(`${base}/admin/login`,{waitUntil:'domcontentloaded'});
await page.getByRole('textbox', { name: /admin email address/i }).fill(email);
await page.getByRole('textbox', { name: /admin password/i }).fill(password);
await page.getByRole('button', { name: /login/i }).click();
await page.waitForURL(/\/admin(\/)?$/,{timeout:30000});
await page.waitForTimeout(800);
await page.screenshot({path:path.join(OUT,'admin-dashboard.png')});

await page.goto(`${base}/admin/blog`,{waitUntil:'domcontentloaded'});
await page.waitForTimeout(800);
await page.screenshot({path:path.join(OUT,'admin-blog.png')});

await page.goto(`${base}/blog`,{waitUntil:'domcontentloaded'});
await page.waitForTimeout(1000);
await page.screenshot({path:path.join(OUT,'public-blog-list.png')});

const first = page.getByRole('link', { name: /ler mais/i }).first();
if (await first.count()) {
  await first.click();
  await page.waitForURL(/\/blog\//,{timeout:30000});
  await page.waitForTimeout(1000);
  await page.screenshot({path:path.join(OUT,'public-blog-post.png'), fullPage:false});
}

await browser.close();
console.log('OK screenshots in',OUT);
