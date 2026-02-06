import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupTable(tableName: string, uniqueField: string) {
    console.log(`Checking ${tableName} for duplicates on ${uniqueField}...`);

    const { data, error } = await supabase
        .from(tableName)
        .select(`id, ${uniqueField}, created_at`);

    if (error) {
        console.error(`Error fetching ${tableName}:`, error);
        return;
    }

    if (!data || data.length === 0) {
        console.log(`No data in ${tableName}.`);
        return;
    }

    const groups: Record<string, any[]> = {};
    data.forEach(item => {
        const key = item[uniqueField];
        if (!key) return; // Skip if key is null
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
    });

    let removedCount = 0;

    for (const key in groups) {
        const items = groups[key];
        if (items.length > 1) {
            // Sort by created_at desc (keep newest)
            items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            const toKeep = items[0];
            const toRemove = items.slice(1);

            console.log(`Found ${toRemove.length} duplicates for "${key}". Keeping ID: ${toKeep.id}`);

            const idsToRemove = toRemove.map(i => i.id);

            const { error: deleteError } = await supabase
                .from(tableName)
                .delete()
                .in('id', idsToRemove);

            if (deleteError) {
                console.error(`Error deleting duplicates for ${key}:`, deleteError);
            } else {
                removedCount += idsToRemove.length;
            }
        }
    }

    console.log(`Removed ${removedCount} duplicates from ${tableName}.`);
}

async function main() {
    await cleanupTable('instagram_posts', 'headline');
    await cleanupTable('linkedin_carousels', 'topic');
    await cleanupTable('resources', 'title');
    await cleanupTable('blog_posts', 'title');
}

main();
