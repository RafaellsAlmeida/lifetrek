
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Credentials from .env
const SUPABASE_URL = "https://dlflpvmdzkeouhgqwqba.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const tierOneContent = [
    {
        topic: "Checklist: Auditoria de Fornecedores de Dispositivos Médicos",
        targetAudience: "Quality Managers and Lead Auditors",
        painPoint: "Alto risco de não conformidade e falhas em auditorias de terceiros",
        desiredOutcome: "Processo de validação de fornecedores robusto, auditável e em conformidade com RDC/ISO",
        proofPoints: ["Certificação ISO 13485 Recente", "Experiência em auditorias ANVISA", "Modelo de pontuação de risco validado"],
        ctaAction: "Comente 'AUDITORIA' para receber o checklist completo",
        profileType: "company",
        researchLevel: "light"
    },
    {
        topic: "Checklist DFM (Design for Manufacturing) para Implantes e Instrumentais",
        targetAudience: "Engenheiros de P&D e Gerentes de Produto",
        painPoint: "Gargalos de produção e custos elevados devido a desenhos não otimizados para usinagem",
        desiredOutcome: "Designs otimizados que reduzem o tempo de ciclo e o desperdício de material (Titânio/Inox)",
        proofPoints: ["Expertise em usinagem de precisão (Citizen/Swiss)", "Integração DFM desde a fase de projeto", "Redução comprovada de ciclos de prototipagem"],
        ctaAction: "Comente 'DFM' para baixar o guia de otimização",
        profileType: "company",
        researchLevel: "light"
    },
    {
        topic: "Roadmap de 90 Dias para Migrar 1–3 SKUs para Produção Local",
        targetAudience: "Diretores de Supply Chain e Gerentes de Operações",
        painPoint: "Dependência de importação, variação cambial e longos lead times (90+ dias)",
        desiredOutcome: "Plano claro para nacionalizar a produção com qualidade equivalente ou superior",
        proofPoints: ["Casos de sucesso em migração de importados", "Redução de lead time para 30 dias", "Acabamento e metrologia integrados"],
        ctaAction: "Baixe o Roadmap e inicie sua estratégia de nacionalização",
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
