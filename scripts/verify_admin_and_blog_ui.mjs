import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "output", "playwright", "2026-02-13");

function mustEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

async function assertNoPlaceholders(page) {
  const bad = await page.evaluate(() => {
    const text = document.body?.innerText || "";
    const hits = [];
    for (const token of ["blog.title", "blog.readMore"]) {
      if (text.includes(token)) hits.push(token);
    }
    return hits;
  });
  if (bad.length) throw new Error(`Found i18n placeholders in UI: ${bad.join(", ")}`);
}

async function screenshot(page, name) {
  const p = path.join(OUT_DIR, name);
  // Prefer element screenshots; they're more reliable than page screenshots
  // when pages have complex layout/scroll/async fonts.
  await page.locator("body").screenshot({
    path: p,
    timeout: 60_000,
    animations: "disabled",
    caret: "hide",
  });
  return p;
}

async function run() {
  ensureDir(OUT_DIR);

  const baseUrl = process.env.BASE_URL || "http://localhost:8080";
  const email = mustEnv("ADMIN_EMAIL");
  const password = mustEnv("ADMIN_PASSWORD");

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // Admin login
  await page.goto(`${baseUrl}/admin/login`, { waitUntil: "networkidle" });
  await page.getByRole("textbox", { name: /admin email address/i }).fill(email);
  await page.getByRole("textbox", { name: /admin password/i }).fill(password);
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForURL(/\/admin(\/)?$/, { timeout: 30_000 });
  await page.waitForTimeout(500);
  await screenshot(page, "admin_dashboard.png");

  // Admin blog list
  await page.goto(`${baseUrl}/admin/blog`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await screenshot(page, "admin_blog_list.png");

  // Admin content calendar
  await page.goto(`${baseUrl}/admin/content-calendar`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await screenshot(page, "admin_content_calendar.png");

  // Content approval (shows pending items; should include IG + blogs)
  await page.goto(`${baseUrl}/admin/content-approval`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await screenshot(page, "admin_content_approval.png");

  // Social workspace calendar tab (in-app scheduling)
  await page.goto(`${baseUrl}/admin/social?tab=calendar`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await screenshot(page, "admin_social_calendar.png");

  // Public blog list + first post
  await page.goto(`${baseUrl}/blog`, { waitUntil: "networkidle" });
  await assertNoPlaceholders(page);
  await page.waitForTimeout(500);
  await screenshot(page, "public_blog_list.png");

  // Click first "Ler mais"
  const readMore = page.getByRole("link", { name: /ler mais/i }).first();
  if (await readMore.count()) {
    await readMore.click();
    await page.waitForURL(/\/blog\/[^/]+$/, { timeout: 30_000 });
    await assertNoPlaceholders(page);
    await page.waitForTimeout(500);
    await screenshot(page, "public_blog_post.png");
  }

  await browser.close();
  console.log(`OK: screenshots saved to ${OUT_DIR}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
