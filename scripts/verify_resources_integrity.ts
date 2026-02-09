
import { createClient } from "npm:@supabase/supabase-js@2";
import "jsr:@std/dotenv/load";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing Supabase credentials in .env");
    Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TARGET_TITLES = [
    "Guia Técnico: Salas Limpas em Dispositivos Médicos",
    "Checklist: Auditoria de Fornecedores de Dispositivos Médicos",
    "Whitepaper: Usinagem Suíça para Dispositivos Médicos - Guia Técnico",
    "Guia: Sala Limpa ISO 7 e Montagem de Kits",
    "Checklist DFM para Implantes e Instrumentais",
    "Checklist de Auditoria Interna ISO 13485",
    "Manual de Metrologia e Inspeção de Alta Precisão",
    "Checklist de Auditoria ISO 13485 para Usinagem",
    "Checklist: Quando Faz Sentido Produzir Local",
    "Roadmap de 90 Dias para Migrar 1-3 SKUs",
    "Scorecard de Risco de Supply Chain 2026",
    "Fluxo de Validacao de Fadiga"
];

async function verifyResources() {
    console.log("Verifying Resources...");

    // 1. Check Resources Table
    const { data: resources, error } = await supabase
        .from("resources")
        .select("id, title, slug, content, created_at, status");

    if (error) {
        console.error("Error fetching resources:", error);
        return;
    }

    console.log(`Found ${resources?.length || 0} resources.`);

    const foundTitles = new Set(resources?.map(r => r.title));
    const missing = TARGET_TITLES.filter(t => !foundTitles.has(t));

    if (missing.length > 0) {
        console.log("\n❌ MISSING RESOURCES:");
        missing.forEach(t => console.log(`  - ${t}`));
    } else {
        console.log("\n✅ ALL TARGET RESOURCES FOUND.");
    }

    // 2. Check for Table Formatting Issues
    console.log("\nChecking for potential table formatting issues (missing remark-gfm)...");
    const tableRegex = /\|.*\|.*\|/;
    resources?.forEach(r => {
        if (tableRegex.test(r.content || "")) {
            console.log(`  ℹ️  Resource "${r.title}" contains markdown tables. Needs remark-gfm.`);
        }
    });

    // 3. Check Contact Leads (Auth/Gating)
    console.log("\nVerifying Lead Capture (Auth)...");
    const { count, error: leadError } = await supabase
        .from("contact_leads")
        .select("*", { count: 'exact', head: true });

    if (leadError) {
        console.error("❌ Error accessing contact_leads table:", leadError);
    } else {
        console.log(`✅ contact_leads table exists and accessible. Total leads: ${count}`);
    }

    // 4. Check recent leads to confirm active saving
    const { data: recentLeads } = await supabase
        .from("contact_leads")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1);

    if (recentLeads && recentLeads.length > 0) {
        console.log(`   Last lead captured at: ${new Date(recentLeads[0].created_at).toLocaleString()}`);
    } else {
        console.log("   No leads found yet.");
    }
}

verifyResources();
