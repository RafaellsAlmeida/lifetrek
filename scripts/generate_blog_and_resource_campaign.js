
import { createClient } from "@supabase/supabase-js";

// HARDCODED CREDENTIALS (Local Dev)
const SUPABASE_URL = "https://dlflpvmdzkeouhgqwqba.supabase.co";
// Service Role Key from SETUP_GUIDE.md
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Campaign Data
const BLOG_TOPICS = [
    {
        topic: "A Nova Era da Manufatura de Dispositivos Médicos no Brasil",
        category: "Indústria",
        persona: "CEO de Empresas de Dispositivos Médicos"
    }
];

const RESOURCES = [
    {
        title: 'Checklist: Auditoria de Fornecedores ISO 13485',
        description: 'Garanta que seus fornecedores atendem a todos os requisitos da norma ISO 13485 com este checklist prático.',
        type: 'checklist',
        persona: 'Gestores da Qualidade',
        status: 'pending_approval',
        slug: 'checklist-auditoria-iso-13485-' + Date.now(),
        thumbnail_url: null,
        content: '# Checklist Auditoria\n\n1. Gestão da Qualidade\n2. Controle de Documentos'
    }
];

async function generateCoverImage(id, tableName) {
    if (tableName === 'resources') {
        console.warn(`⚠️ Skipping Resource Image Gen (Requires Deployment of updated Edge Function).`);
        return;
    }

    console.log(`🎨 Generating Cover Image for ${tableName} ID: ${id}...`);
    try {
        const { data, error } = await supabase.functions.invoke('regenerate-carousel-images', {
            body: {
                carousel_id: id,
                table_name: tableName
            }
        });

        if (error) {
            console.error(`❌ Image Gen Error:`, error);
        } else {
            console.log(`✅ Image Generated!`);
        }
    } catch (e) {
        console.error(`❌ Image Gen Exception:`, e);
    }
}

async function getAdminUser() {
    // Try to list users via admin api
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error || !users || users.length === 0) {
        console.error("❌ Could not list users:", error);
        return '00000000-0000-0000-0000-000000000000';
    }
    return users[0].id;
}

async function handleBlog(blog, userId) {
    console.log(`📝 Generating Blog Text for: ${blog.topic}`);

    // Call generate-blog-post
    const { data: blogResult, error: blogError } = await supabase.functions.invoke('generate-blog-post', {
        body: {
            topic: blog.topic,
            category: blog.category,
            skipImage: true
        }
    });

    let content = blogResult?.content || "<h1>Generated Content</h1><p>Placeholder content.</p>";
    let title = blogResult?.title || blog.topic;
    let excerpt = blogResult?.excerpt || "Auto-generated blog post.";

    // Insert
    const { data: inserted, error: insertError } = await supabase
        .from('blog_posts')
        .insert({
            title,
            content,
            excerpt,
            slug: (blogResult?.slug || 'slug') + '-' + Date.now(),
            status: 'pending_approval',
            author_id: userId,
            category_id: null
        })
        .select()
        .single();

    if (insertError) {
        console.error("❌ Blog Insert Failed:", insertError);
        return;
    }

    if (inserted) {
        console.log(`✅ Blog Inserted: ${inserted.title}`);
        await generateCoverImage(inserted.id, 'blog_posts');
    }
}

async function main() {
    console.log("🚀 Starting Automation Script (Blogs Only + Resource Placeholders)...");

    const userId = await getAdminUser();
    console.log(`👤 Using Author ID: ${userId}`);

    for (const b of BLOG_TOPICS) await handleBlog(b, userId);

    for (const r of RESOURCES) {
        console.log(`Processing Resource: ${r.title}`);
        const { data: inserted, error: upsertError } = await supabase
            .from('resources')
            .upsert(r, { onConflict: 'slug' })
            .select()
            .single();

        if (upsertError) console.error("Resource Upsert Failed:", upsertError);
        else if (inserted) await generateCoverImage(inserted.id, 'resources');
    }

    console.log("✨ Done");
}

main();
