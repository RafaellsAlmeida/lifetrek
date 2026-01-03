/**
 * Script to import enriched leads from CSV to Supabase
 *
 * Usage:
 *   npm run import-leads
 *
 * This script reads the MASTER_ENRICHED_LEADS.csv file and imports all leads
 * into the enriched_leads table in Supabase.
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface CSVRow {
  Company: string;
  Website: string;
  Lead_Score: string;
  Email: string;
  Decision_Maker: string;
  Employees: string;
  Years_Active: string;
  City: string;
  State: string;
  FDA_Certified: string;
  CE_Certified: string;
  Products: string;
  LinkedIn_Company: string;
  Perplexity_Segment: string;
  Perplexity_City: string;
  Perplexity_State: string;
  Perplexity_Decision_Makers: string;
  Perplexity_Notes: string;
  Status: string;
  Nome_Empresa: string;
  Address: string;
  Phone: string;
  Source: string;
  Predicted_Score: string;
  V2_Score: string;
  Renner_Score: string;
  Enrichment_Status: string;
  Scraped_Emails: string;
  Decision_Makers_Deep: string;
  LinkedIn_Person: string;
  Confidence_Score: string;
}

interface EnrichedLead {
  company: string;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  decision_maker: string | null;
  decision_makers_deep: any;
  scraped_emails: string | null;
  linkedin_person: string | null;
  lead_score: number | null;
  predicted_score: number | null;
  v2_score: number | null;
  renner_score: number | null;
  confidence_score: number | null;
  employees: number | null;
  years_active: number | null;
  products: string | null;
  fda_certified: boolean;
  ce_certified: boolean;
  linkedin_company: string | null;
  perplexity_segment: string | null;
  perplexity_city: string | null;
  perplexity_state: string | null;
  perplexity_decision_makers: string | null;
  perplexity_notes: string | null;
  status: string | null;
  source: string | null;
  enrichment_status: number;
  nome_empresa: string | null;
}

// Simple CSV parser function
function parseCSV(content: string): CSVRow[] {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];

      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());

    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row as CSVRow);
  }

  return rows;
}

function parseBoolean(value: string): boolean {
  return value?.toLowerCase() === 'true';
}

function parseNumber(value: string): number | null {
  if (!value || value.trim() === '') return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

function parseInt(value: string): number | null {
  if (!value || value.trim() === '') return null;
  const num = Number.parseInt(value);
  return isNaN(num) ? null : num;
}

function parseJSON(value: string): any {
  if (!value || value.trim() === '') return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function transformRow(row: CSVRow): EnrichedLead {
  return {
    company: row.Company || 'Unknown',
    website: row.Website || null,
    address: row.Address || null,
    city: row.City || null,
    state: row.State || null,
    phone: row.Phone || null,
    email: row.Email || null,
    decision_maker: row.Decision_Maker || null,
    decision_makers_deep: parseJSON(row.Decision_Makers_Deep),
    scraped_emails: row.Scraped_Emails || null,
    linkedin_person: row.LinkedIn_Person || null,
    lead_score: parseInt(row.Lead_Score),
    predicted_score: parseNumber(row.Predicted_Score),
    v2_score: parseNumber(row.V2_Score),
    renner_score: parseNumber(row.Renner_Score),
    confidence_score: parseInt(row.Confidence_Score),
    employees: parseInt(row.Employees),
    years_active: parseInt(row.Years_Active),
    products: row.Products || null,
    fda_certified: parseBoolean(row.FDA_Certified),
    ce_certified: parseBoolean(row.CE_Certified),
    linkedin_company: row.LinkedIn_Company || null,
    perplexity_segment: row.Perplexity_Segment || null,
    perplexity_city: row.Perplexity_City || null,
    perplexity_state: row.Perplexity_State || null,
    perplexity_decision_makers: row.Perplexity_Decision_Makers || null,
    perplexity_notes: row.Perplexity_Notes || null,
    status: row.Status || 'Original',
    source: row.Source || null,
    enrichment_status: parseNumber(row.Enrichment_Status) || 0.0,
    nome_empresa: row.Nome_Empresa || null,
  };
}

async function importLeads() {
  console.log('🚀 Starting enriched leads import...\n');

  // Read CSV file
  const csvPath = path.join(process.cwd(), '.tmp', 'MASTER_ENRICHED_LEADS.csv');

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Error: CSV file not found at ${csvPath}`);
    process.exit(1);
  }

  console.log(`📂 Reading CSV from: ${csvPath}`);
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(csvContent);

  console.log(`📊 Found ${rows.length} leads in CSV\n`);

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('🗑️  Clearing existing enriched leads...');
  const { error: deleteError } = await supabase
    .from('enriched_leads')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (deleteError) {
    console.warn('⚠️  Warning: Could not clear existing data:', deleteError.message);
  } else {
    console.log('✅ Existing data cleared\n');
  }

  // Import in batches to avoid timeout
  const BATCH_SIZE = 100;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const transformedBatch = batch.map(transformRow);

    const { data, error } = await supabase
      .from('enriched_leads')
      .insert(transformedBatch)
      .select();

    if (error) {
      console.error(`❌ Error inserting batch ${i / BATCH_SIZE + 1}:`, error.message);
      errorCount += batch.length;
    } else {
      successCount += data.length;
      console.log(`✅ Batch ${i / BATCH_SIZE + 1}: Imported ${data.length} leads (${successCount}/${rows.length})`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`🎉 Import completed!`);
  console.log(`   ✅ Success: ${successCount} leads`);
  console.log(`   ❌ Errors: ${errorCount} leads`);
  console.log('='.repeat(50) + '\n');

  // Show some statistics
  const { data: stats } = await supabase
    .from('enriched_leads')
    .select('lead_score, perplexity_segment');

  if (stats) {
    const highQuality = stats.filter(s => (s.lead_score || 0) >= 70).length;
    const segments = [...new Set(stats.map(s => s.perplexity_segment).filter(Boolean))];

    console.log('📈 Statistics:');
    console.log(`   Total leads: ${stats.length}`);
    console.log(`   High quality (score >= 70): ${highQuality}`);
    console.log(`   Unique segments: ${segments.length}`);
    console.log(`   Top segments: ${segments.slice(0, 5).join(', ')}`);
  }
}

// Run the import
importLeads()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
