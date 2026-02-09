
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dlflpvmdzkeouhgqwqba.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    const { data: blog, error } = await supabase
        .from('blog_posts')
        .select('id, title, cover_image')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Latest Blog:", blog.title);
        console.log("Cover Image:", blog.cover_image);
        if (blog.cover_image && blog.cover_image.startsWith("http")) {
            console.log("✅ VERIFIED");
        } else {
            console.log("❌ NO IMAGE");
        }
    }
}
main();
