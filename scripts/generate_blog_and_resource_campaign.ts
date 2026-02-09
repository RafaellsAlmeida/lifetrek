
import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

// HARDCODED CREDENTIALS (Local Dev)
const SUPABASE_URL = "https://dlflpvmdzkeouhgqwqba.supabase.co";
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
        slug: 'checklist-auditoria-iso-13485-v2', // v2 to avoid unique violation if mismatch
        thumbnail_url: null,
        content: '# Checklist Auditoria\n\n1. Gestão da Qualidade\n2. Controle de Documentos\n3. Gestão de Recursos'
    }
];

async function generateCoverImage(id: string, tableName: string) {
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
            console.log(`✅ Image Generated:`, data);
        }
    } catch (e) {
        console.error(`❌ Image Gen Exception:`, e);
    }
}

async function main() {
    console.log("🚀 Starting Blog & Resource Campaign + Auto-Image Generation...");

    // 1. Generate Blogs
    console.log("\n📝 Generating Blogs...");
    for (const item of BLOG_TOPICS) {
        console.log(`\nProcessing Blog: ${item.topic}`);

        try {
            // Call generate-blog-post
            const { data: blogResult, error: blogError } = await supabase.functions.invoke('generate-blog-post', {
                body: {
                    topic: item.topic,
                    category: item.category,
                    skipImage: true
                }
            });

            if (blogError) {
                console.error(`❌ Blog Gen Failed:`, blogError);
                // Continue? Maybe we can insert manual one for testing
            }

            // If success, insert manually
            if (blogResult && !blogResult.error) {
                const { data: insertedBlog, error: insertError } = await supabase
                    .from('blog_posts')
                    .insert({
                        title: blogResult.title,
                        content: blogResult.content,
                        excerpt: blogResult.excerpt,
                        slug: blogResult.slug + '-' + Date.now(),
                        status: 'pending_approval',
                        author_id: '15d3325e-3c9d-4351-9e7f-613271501530', // Rafael's ID from user info or hardcoded known ID
                        category_id: null
                    })
                    .select()
                    .single();

                if (insertError) {
                    console.error(`❌ DB Insert Failed:`, insertError);
                } else if (insertedBlog) {
                    console.log(`✅ Blog Inserted (ID: ${insertedBlog.id})`);
                    await generateCoverImage(insertedBlog.id, 'blog_posts');
                }
            }

        } catch (e) {
            console.error(`❌ Exception processing blog:`, e);
        }
    }

    // 2. Generate Resources
    console.log("\n📚 Generating Resources...");
    for (const res of RESOURCES) {
        console.log(`\nProcessing Resource: ${res.title}`);

        const { data: insertedRes, error: insertError } = await supabase
            .from('resources')
            .upsert(res, { onConflict: 'slug' })
            .select()
            .single();

        if (insertError) {
            console.error(`❌ Resource Insert Failed:`, insertError);
        } else if (insertedRes) {
            console.log(`✅ Resource Inserted (ID: ${insertedRes.id})`);
            await generateCoverImage(insertedRes.id, 'resources');
        }
    }

    console.log("\n✨ Campaign Complete.");
}

main();
