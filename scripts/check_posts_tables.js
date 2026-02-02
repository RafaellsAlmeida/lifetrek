
import { createClient } from "@supabase/supabase-js";
import fs from 'fs';
import path from 'path';

function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (!fs.existsSync(envPath)) return {};
        const envFile = fs.readFileSync(envPath, 'utf8');
        const envVars = {};
        envFile.split('\n').forEach(line => {
            const trimmedLine = line.trim();
            if(!trimmedLine || trimmedLine.startsWith('#')) return;
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                let value = parts.slice(1).join('=').trim();
                if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                envVars[key] = value;
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
    console.log("Skipping check: Credentials not found.");
    process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking tables...");
  
  const { count: postsCount, error: postsError } = await supabase.from('linkedin_posts').select('*', { count: 'exact', head: true });
  console.log('linkedin_posts count:', postsCount, 'error:', postsError ? postsError.message : 'none');

  const { count: carouselsCount, error: carouselsError } = await supabase.from('linkedin_carousels').select('*', { count: 'exact', head: true });
  console.log('linkedin_carousels count:', carouselsCount, 'error:', carouselsError ? carouselsError.message : 'none');
}

check();
