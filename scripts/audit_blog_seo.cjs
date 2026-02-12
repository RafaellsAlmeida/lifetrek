const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase env vars. Expected SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY or VITE equivalents.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const hasReferencesSection = (content) => {
  if (!content) return false;
  return /refer[eê]ncias/i.test(content);
};

const hasFaqSection = (content) => {
  if (!content) return false;
  return /(perguntas\s+frequentes|faq)/i.test(content);
};

const wordCount = (text) => {
  if (!text) return 0;
  const normalized = String(text).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!normalized) return 0;
  return normalized.split(' ').length;
};

const isHttpUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value);

async function run() {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id,title,slug,status,seo_title,seo_description,keywords,featured_image,metadata,content,created_at,published_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Query error:', error.message);
    process.exit(1);
  }

  const posts = data || [];
  if (posts.length === 0) {
    console.log('No blog posts found.');
    return;
  }

  const byStatus = posts.reduce((acc, post) => {
    acc[post.status || 'unknown'] = (acc[post.status || 'unknown'] || 0) + 1;
    return acc;
  }, {});

  const evaluated = posts.map((post) => {
    const seoTitleLength = (post.seo_title || '').trim().length;
    const seoDescriptionLength = (post.seo_description || '').trim().length;
    const keywords = Array.isArray(post.keywords)
      ? post.keywords.filter((k) => typeof k === 'string' && k.trim().length > 0)
      : [];
    const sources = Array.isArray(post?.metadata?.sources)
      ? post.metadata.sources.filter(isHttpUrl)
      : [];

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      status: post.status,
      metrics: {
        seoTitleLength,
        seoDescriptionLength,
        keywordsCount: keywords.length,
        hasFeaturedImage: Boolean(post.featured_image),
        sourcesCount: sources.length,
        hasReferences: hasReferencesSection(post.content),
        hasFaq: hasFaqSection(post.content),
        wordCount: wordCount(post.content),
      },
      checks: {
        seoTitleRange: seoTitleLength >= 40 && seoTitleLength <= 65,
        seoDescriptionRange: seoDescriptionLength >= 140 && seoDescriptionLength <= 160,
        keywordsMin3: keywords.length >= 3,
        featuredImage: Boolean(post.featured_image),
        sourcesMin4: sources.length >= 4,
        referencesSection: hasReferencesSection(post.content),
        faqSection: hasFaqSection(post.content),
        wordCountRange: wordCount(post.content) >= 900 && wordCount(post.content) <= 2200,
      },
    };
  });

  const score = (row) => Object.values(row.checks).filter(Boolean).length;
  const ranked = [...evaluated].sort((a, b) => score(b) - score(a));

  const aggregate = {
    total: evaluated.length,
    status: byStatus,
    pass: {
      seoTitleRange: evaluated.filter((r) => r.checks.seoTitleRange).length,
      seoDescriptionRange: evaluated.filter((r) => r.checks.seoDescriptionRange).length,
      keywordsMin3: evaluated.filter((r) => r.checks.keywordsMin3).length,
      featuredImage: evaluated.filter((r) => r.checks.featuredImage).length,
      sourcesMin4: evaluated.filter((r) => r.checks.sourcesMin4).length,
      referencesSection: evaluated.filter((r) => r.checks.referencesSection).length,
      faqSection: evaluated.filter((r) => r.checks.faqSection).length,
      wordCountRange: evaluated.filter((r) => r.checks.wordCountRange).length,
    },
  };

  console.log(`SEO Audit - ${new Date().toISOString()}`);
  console.log(`Posts: ${aggregate.total}`);
  console.log('Status:', JSON.stringify(aggregate.status));
  console.log('Pass counts:', JSON.stringify(aggregate.pass));
  console.log('--- Top 10 (highest SEO readiness) ---');

  ranked.slice(0, 10).forEach((row, i) => {
    const s = score(row);
    console.log(`${String(i + 1).padStart(2, '0')}. [${s}/8] ${row.title}`);
  });

  console.log('--- Posts requiring action (score <= 5) ---');
  evaluated
    .filter((row) => score(row) <= 5)
    .forEach((row) => {
      const failed = Object.entries(row.checks)
        .filter(([, ok]) => !ok)
        .map(([k]) => k)
        .join(', ');
      console.log(`- ${row.title} (${row.status}): ${failed}`);
    });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
