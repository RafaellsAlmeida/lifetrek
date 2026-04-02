import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { CHECKLIST_DFM_IMPLANTES_FULL_MARKDOWN } from '../src/constants/checklistDfmImplantesFullContent.js';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const fullContent = CHECKLIST_DFM_IMPLANTES_FULL_MARKDOWN;

async function updateResource() {
  const { data, error } = await supabase
    .from('resources')
    .update({ content: fullContent })
    .eq('slug', 'checklist-dfm-implantes')
    .select();

  if (error) {
    console.error("Error updating resource:", error);
  } else {
    console.log("Successfully updated checklist DFM with full 12-point content!");
    console.log(data);
  }
}

updateResource();
