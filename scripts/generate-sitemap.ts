/**
 * Build-time sitemap generator.
 *
 * Run this script before deploy (or on a schedule) to keep dynamic blog/resource URLs fresh:
 *   npx tsx scripts/generate-sitemap.ts
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnv } from "vite";
import { createClient } from "@supabase/supabase-js";

const SITE_URL = "https://lifetrek-medical.com";

type SitemapEntry = {
  path: string;
  changefreq: "daily" | "weekly" | "monthly";
  priority: string;
  lastmod?: string;
};

const STATIC_PAGES: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/what-we-do", changefreq: "monthly", priority: "0.9" },
  { path: "/products", changefreq: "weekly", priority: "0.9" },
  { path: "/capabilities", changefreq: "monthly", priority: "0.8" },
  { path: "/clients", changefreq: "monthly", priority: "0.7" },
  { path: "/contact", changefreq: "monthly", priority: "0.8" },
  { path: "/calculator", changefreq: "monthly", priority: "0.7" },
  { path: "/assessment", changefreq: "monthly", priority: "0.7" },
  { path: "/product-catalog", changefreq: "weekly", priority: "0.8" },
  { path: "/blog", changefreq: "daily", priority: "0.9" },
];

const formatDate = (value?: string | null) =>
  value ? new Date(value).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

async function main() {
  const env = {
    ...loadEnv("", process.cwd(), ""),
    ...process.env,
  };

  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY).");
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const [{ data: blogRows, error: blogError }, { data: resourceRows, error: resourceError }] = await Promise.all([
    supabase
      .from("blog_posts")
      .select("slug, updated_at")
      .eq("status", "published")
      .not("slug", "is", null),
    supabase
      .from("resources")
      .select("slug, updated_at")
      .eq("status", "published")
      .not("slug", "is", null),
  ]);

  if (blogError) throw blogError;
  if (resourceError) throw resourceError;

  const blogEntries: SitemapEntry[] = (blogRows || [])
    .filter((row) => typeof row.slug === "string" && row.slug.trim().length > 0)
    .map((row) => ({
      path: `/blog/${row.slug}`,
      changefreq: "weekly",
      priority: "0.8",
      lastmod: formatDate(row.updated_at),
    }))
    .sort((a, b) => a.path.localeCompare(b.path));

  const resourceEntries: SitemapEntry[] = (resourceRows || [])
    .filter((row) => typeof row.slug === "string" && row.slug.trim().length > 0)
    .map((row) => ({
      path: `/resources/${row.slug}`,
      changefreq: "weekly",
      priority: "0.8",
      lastmod: formatDate(row.updated_at),
    }))
    .sort((a, b) => a.path.localeCompare(b.path));

  const staticEntries = STATIC_PAGES.map((entry) => ({
    ...entry,
    lastmod: formatDate(),
  }));

  const allEntries = [...staticEntries, ...blogEntries, ...resourceEntries];

  const xmlBody = allEntries
    .map(
      (entry) => `  <url>
    <loc>${escapeXml(`${SITE_URL}${entry.path}`)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlBody}
</urlset>
`;

  writeFileSync(resolve(process.cwd(), "public/sitemap.xml"), xml, "utf-8");

  console.log(
    `Sitemap generated with ${staticEntries.length} static pages, ${blogEntries.length} blog posts, and ${resourceEntries.length} resources.`
  );
}

main().catch((error) => {
  console.error("Failed to generate sitemap:", error);
  process.exit(1);
});
