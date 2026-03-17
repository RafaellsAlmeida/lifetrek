import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dlflpvmdzkeouhgqwqba.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DFM_CAROUSEL_ID = "05ebeff0-834c-48c3-ac06-3ce483600fbf";

const newSlides = [
    {
        headline: "Padrão é suficiente para todos os pacientes?",
        body: "Em casos complexos, implantes e instrumentais genéricos começam a falhar – clínica e mecanicamente.",
        type: "hook",
        order: 1
    },
    {
        headline: "Onde o genérico não acompanha",
        body: "Deformidades, revisões, anatomias fora da curva e protocolos cirúrgicos específicos exigem soluções sob medida – ou o cirurgião precisa improvisar em campo.",
        type: "content",
        order: 2
    },
    {
        headline: "Personalização séria começa no projeto",
        body: "Trabalhamos com times clínicos e de P&D para traduzir necessidades cirúrgicas em desenhos usináveis, com materiais de grau implante e critérios claros de validação mecânica.",
        type: "content",
        order: 3
    },
    {
        headline: "Do conceito ao implante em mãos",
        body: "Usinagem CNC de precisão, metrologia 3D e, quando necessário, sala limpa ISO 7. Cada caso recebe plano de processo, medição e rastreabilidade completos.",
        type: "content",
        order: 4
    },
    {
        headline: "Tem um caso que o “padrão” não resolve?",
        body: "Se você é OEM ou cirurgião e tem um cenário onde o catálogo não atende, podemos ajudar a avaliar viabilidade técnica e rota regulatória para uma solução personalizada. 👉 Comente “PERSONALIZADO” ou fale com nossa equipe.",
        type: "cta",
        order: 5
    }
];

async function run() {
    console.log("Updating database with new slides...");
    const { error } = await supabase
        .from("linkedin_carousels")
        .update({
            slides: newSlides,
            updated_at: new Date().toISOString()
        })
        .eq("id", DFM_CAROUSEL_ID);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Successfully updated slides in database!");
    }
}

run();
