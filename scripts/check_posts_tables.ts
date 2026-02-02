
import { createClient } from "@supabase/supabase-js";
import fs from 'fs';
import path from 'path';

// Manual .env parsing
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const envVars: Record<string, string> = {};
        envFile.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                let value = valueParts.join('=');
                // Remove quotes if present
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                envVars[key.trim()] = value.trim();
            }
        });
        return envVars;
    } catch (e) {
        return {};
    }
}

const env = loadEnv();
const supabaseUrl = process.env.SUPABASE_URL || env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials. Checked SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    // Try to proceed with what we have, maybe it works if pre-configured?
}

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function check() {
  console.log("Checking tables...");
  
  const { count: postsCount, error: postsError } = await supabase.from('linkedin_posts').select('*', { count: 'exact', head: true });
  console.log('linkedin_posts count:', postsCount, 'error:', postsError?.message);

  const { count: carouselsCount, error: carouselsError } = await supabase.from('linkedin_carousels').select('*', { count: 'exact', head: true });
  console.log('linkedin_carousels count:', carouselsCount, 'error:', carouselsError?.message);
}

check();
