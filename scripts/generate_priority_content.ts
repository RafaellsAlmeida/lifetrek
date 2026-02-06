
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Credentials from .env
const SUPABASE_URL = "https://dlflpvmdzkeouhgqwqba.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const tierOneContent = [
    {
        topic: "Checklist: Auditoria de Fornecedores de Dispositivos Médicos",
        targetAudience: "Quality Managers and Lead Auditors",
        painPoint: "High risk of non-compliance and audit failures in supplier management",
        desiredOutcome: "Audit-ready, robust, and compliant supplier validation and audit process",
        proofPoints: ["Lifetrek ISO 13485 Compliance", "Extensive experience in ANVISA audits", "Risk-based supplier scoring model"],
        ctaAction: "Comment 'AUDIT' to get the full checklist and avoid non-conformities",
        profileType: "company",
        researchLevel: "light"
    },
    {
        topic: "Checklist DFM para Implantes e Instrumentais",
        targetAudience: "Design Engineers and R&D Teams",
        painPoint: "Design-for-manufacturing gaps leading to production delays and high costs",
        desiredOutcome: "Optimized, manufacturable designs that reduce time-to-market and waste",
        proofPoints: ["Precision machining expertise (Citizen M32/L20)", "DFM integration at the design stage", "Reduced prototyping cycles"],
        ctaAction: "Comment 'DFM' to access the checklist and streamline your product development",
        profileType: "company",
        researchLevel: "light"
    },
    {
        topic: "Roadmap de 90 Dias para Migrar 1–3 SKUs para Produção Local",
        targetAudience: "Supply Chain Directors and Operations Managers",
        painPoint: "Over-reliance on imports causing supply chain vulnerability and high logistics costs",
        desiredOutcome: "Clear, actionable path to localizing production and enhancing supply chain resilience",
        proofPoints: ["Proven migration success cases", "30-day local production vs 90-day lead times", "Integrated finishing and metrology"],
        ctaAction: "Download the Roadmap and start your localization strategy today",
        profileType: "company",
        researchLevel: "light"
    },
    {
        topic: "O Custo Real da Importação vs. Fabricação Local de Dispositivos Médicos",
        targetAudience: "Finance Directors, CFOs, and Procurement Teams",
        painPoint: "Opaque 'hidden' costs in importing medical devices (taxes, logistics, inventory holding)",
        desiredOutcome: "Transparent Total Cost of Ownership (TCO) comparison favoring domestic production",
        proofPoints: ["Detailed cost analysis reports", "Avoidance of currency exchange risks", "Optimized inventory levels"],
        ctaAction: "Request a TCO analysis for your current SKUs",
        profileType: "company",
        researchLevel: "light"
    },
    {
        topic: "Scorecard de Risco de Supply Chain 2026: Sua Cadeia está Segura?",
        targetAudience: "Supply Chain Managers and Compliance Officers",
        painPoint: "Unforeseen supply chain disruptions in a volatile global market",
        desiredOutcome: "Standardized tool for assessing and mitigating supplier and logistics risks",
        proofPoints: ["Advanced risk scoring methodologies", "Data-driven supply chain insights", "Strategic secondary sourcing planning"],
        ctaAction: "Comment 'RISK' to get the 2026 Scorecard template",
        profileType: "company",
        researchLevel: "light"
    },
    {
        topic: "Checklist: Quando Faz Sentido Produzir Localmente vs. Importar?",
        targetAudience: "CEO, COO, and Strategic Business Developers",
        painPoint: "Indecision on the best manufacturing strategy for new or existing product lines",
        desiredOutcome: "Definitive decision-making framework based on volume, complexity, and lead time",
        proofPoints: ["Strategic advisory for medical device OEMs", "Flexible production scales", "ANVISA regulatory alignment"],
        ctaAction: "Book a strategic consultation for your portfolio",
        profileType: "company",
        researchLevel: "light"
    },
    {
        topic: "Checklist de Auditoria ISO 13485 focado em Usinagem de Dispositivos Médicos",
        targetAudience: "Quality Assurance Professionals and Production Managers",
        painPoint: "Difficulty maintaining high-standard quality control in complex machining processes",
        desiredOutcome: "Comprehensive guide to achieving zero-defect production under ISO 13485",
        proofPoints: ["Micron-level precision (Zeiss CMM)", "Zero-non-conformity production history", "Full traceability and documentation"],
        ctaAction: "Get the ISO 13485 Machining Checklist",
        profileType: "company",
        researchLevel: "light"
    },
    {
        topic: "Deep Dive: Fluxo de Validação de Fadiga para Implantes Ortopédicos",
        targetAudience: "R&D Engineers, Biomechanical Specialists, and Regulatory Affairs",
        painPoint: "Lengthy and complex fatigue testing protocols required for regulatory submission",
        desiredOutcome: "Streamlined validation flow that ensures reliability and regulatory acceptance",
        proofPoints: ["State-of-the-art testing equipment", "Regulatory submission support", "Deep material science expertise (Titanium/PEEK)"],
        ctaAction: "Learn about our fatigue testing and validation services",
        profileType: "company",
        researchLevel: "light"
    }
];

async function generatePriorityContent() {
    console.log("🚀 Starting Priority Tier 1 Content Generation...");
    console.log(`🔗 Target: ${SUPABASE_URL}`);

    let successCount = 0;

    for (const content of tierOneContent) {
        console.log(`\n--------------------------------------------------`);
        console.log(`🎯 Topic: ${content.topic}`);
        console.log(`👤 Audience: ${content.targetAudience}`);

        try {
            const payload = {
                ...content,
                profileType: "company",
                format: "carousel",
                researchLevel: "light"
            };

            const functionUrl = `${SUPABASE_URL}/functions/v1/generate-linkedin-carousel`;
            const response = await fetch(functionUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${SUPABASE_KEY}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const text = await response.text();
                console.error(`❌ Generation Failed (${response.status}): ${text.substring(0, 200)}`);
            } else {
                const data = await response.json();
                // The edge function should already save the carousel to the DB
                // Based on the code in generate-linkedin-carousel/index.ts
                if (data.success) {
                    console.log(`✅ Success! Quality Score: ${data.quality_score}`);
                    successCount++;
                } else {
                    console.warn(`⚠️ Function returned success=false: ${data.error}`);
                }
            }
        } catch (err) {
            console.error("❌ Exception during generation:", err);
        }

        // Wait 5 seconds between calls to avoid rate limits and heavy load
        console.log("⏳ Cooling down for 5s...");
        await new Promise(r => setTimeout(r, 5000));
    }

    console.log(`\n✨ Finished. Successfully triggered ${successCount}/${tierOneContent.length} generations.`);
}

generatePriorityContent();
