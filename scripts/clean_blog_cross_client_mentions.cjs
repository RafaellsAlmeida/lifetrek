const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function sanitize(text) {
  if (!text) return text;
  return String(text)
    .replace(/amorim\s*stout\s*consulting\s*\(asc\)/gi, 'Lifetrek Medical')
    .replace(/amorim\s*stout\s*consulting/gi, 'Lifetrek Medical')
    .replace(/\bmetodologia\s*4p\s*da\s*asc\b/gi, 'abordagem de 4 pilares da Lifetrek Medical')
    .replace(/\bframework\s*4p\b/gi, 'framework técnico de 4 pilares')
    .replace(/\bna\s+asc\b/gi, 'na Lifetrek Medical')
    .replace(/\bda\s+asc\b/gi, 'da Lifetrek Medical')
    .replace(/\ba\s+asc\b/gi, 'a Lifetrek Medical')
    .replace(/\bASC\b/g, 'Lifetrek Medical');
}

function clamp(str, max) {
  const s = String(str || '').replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trim()}…`;
}

function defaultSeoTitle(title) {
  const sanitized = sanitize(title || '');
  if (/transformaç[aã]o estratégica/i.test(sanitized)) {
    return 'Manufatura Médica: Estratégia e Crescimento Sustentável';
  }
  if (/otimizaç[aã]o/i.test(sanitized)) {
    return 'Otimização na Manufatura de Dispositivos Médicos';
  }
  return clamp(sanitized, 60);
}

function defaultSeoDescription(excerpt, content) {
  const source = sanitize(excerpt || content || '');
  const plain = source.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return clamp(plain, 160);
}

function defaultKeywords(title) {
  const t = (title || '').toLowerCase();
  if (t.includes('otimização')) {
    return ['manufatura médica', 'otimização de processos', 'dispositivos médicos'];
  }
  return ['manufatura médica', 'dispositivos médicos', 'qualidade na fabricação'];
}

(async () => {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id,title,excerpt,seo_title,seo_description,keywords,content,metadata,status')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error(error);
    process.exit(1);
  }

  const flagged = (data || []).filter((post) => /amorim|stout|\basc\b/i.test(post.content || '') || /amorim|stout|\basc\b/i.test(post.title || ''));

  if (flagged.length === 0) {
    console.log('No cross-client mentions found.');
    return;
  }

  for (const post of flagged) {
    const cleanTitle = sanitize(post.title || '');
    const cleanExcerpt = sanitize(post.excerpt || '');
    const cleanContent = sanitize(post.content || '');
    const payload = {
      title: cleanTitle,
      excerpt: cleanExcerpt,
      content: cleanContent,
      seo_title: sanitize(post.seo_title || '') || defaultSeoTitle(cleanTitle),
      seo_description: sanitize(post.seo_description || '') || defaultSeoDescription(cleanExcerpt, cleanContent),
      keywords: Array.isArray(post.keywords) && post.keywords.length > 0 ? post.keywords : defaultKeywords(cleanTitle),
      metadata: {
        ...(post.metadata || {}),
        cleaned_cross_client_mentions_at: new Date().toISOString(),
      },
    };

    const { error: updateError } = await supabase.from('blog_posts').update(payload).eq('id', post.id);
    if (updateError) {
      console.error(`Failed to update ${post.id}:`, updateError.message);
      continue;
    }
    console.log(`Updated ${post.id} (${post.status}) -> ${cleanTitle}`);
  }
})();
