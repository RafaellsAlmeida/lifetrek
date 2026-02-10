import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env vars manually since .env.local might have issues or just use process.env if available
// We will try to read .env.local content and parse it if possible, or just expect env vars.
// Actually, let's just try to read the file directly.

const envPath = path.resolve(process.cwd(), '.env.local');
let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
// Note: Anon key might not have permission to update if RLS is strict. 
// We usually need SERVICE_ROLE_KEY for admin updates.
// Let's check if we can find SERVICE_ROLE_KEY in .env

try {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    supabaseUrl = envConfig.VITE_SUPABASE_URL || supabaseUrl;
    supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || envConfig.VITE_SUPABASE_ANON_KEY || supabaseKey;
} catch (e) {
    console.error("Could not read .env.local", e);
}

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const content = `# Roadmap de Nacionalização em 90 Dias: O Caminho Seguro
**De "Refém da Importação" para "Controle Total da Produção"**

## Proposta de Valor
Este não é apenas um cronograma. É um protocolo de mitigação de risco para transferir a fabricação de componentes críticos (Implantes e Instrumentais) da Europa/EUA para o Brasil (Indaiatuba), mantendo a qualidade Suíça.

---

## Fase 1: Diagnóstico e Segurança (Semanas 1-2)
*O objetivo é garantir que a mudança é tecnicamente viável e financeiramente vantajosa antes de cortar qualquer metal.*

*   **O que nós fazemos:**
    *   **Análise de Viabilidade Técnica (DFM):** Revisamos seus desenhos 3D para garantir que podem ser usinados em nossos Tornos Suíços CNC sem perda de precisão.
    *   **Engenharia Reversa (se necessário):** Se você não tem o desenho, nós criamos a partir da peça física com metrologia óptica.
*   **O que você recebe:**
    *   Relatório de "Custo Landed" (Importado vs. Nacional).
    *   Confirmação de Tolerâncias (Garantimos ±0.005mm?).
*   **Decisão:** Go / No-Go.

## Fase 2: Prototipagem e Validação (Semanas 3-6)
*Aqui eliminamos o risco de qualidade. Você verá a peça física, idêntica à importada.*

*   **O que nós fazemos:**
    *   Setup de Máquina dedicado.
    *   Usinagem de lote piloto (5-10 peças).
    *   **Validação Cruzada:** Medimos em nossa CMM (Zeiss) e enviamos laudo.
*   **O que você recebe:**
    *   Amostras físicas para validação da sua Engenharia/Qualidade.
    *   Laudo Dimensional Completo.
    *   Certificado de Matéria-Prima (Rastreabilidade Total).

## Fase 3: Lote Piloto e Ajuste Fino (Semanas 7-8)
*Preparação para escala. Testamos o fluxo de produção real.*

*   **O que nós fazemos:**
    *   Produção de pequeno lote (50-100 peças).
    *   Teste de acabamento superficial e tratamentos (passivação/anodização).
*   **O que você recebe:**
    *   Entrega parcial para abastecer seu estoque imediatamente.
    *   Validação do processo de embalagem e logística.

## Fase 4: Produção em Escala e Entrega Contínua (Semanas 9-12)
*A virada de chave. Sua supply chain agora é local.*

*   **O que nós fazemos:**
    *   Programação de entregas mensais (Contrato Guarda-Chuva).
    *   Estoque de segurança mantido na Lifetrek (Indaiatuba).
*   **O que você recebe:**
    *   **Lead Time reduzido:** De 90 dias (China/Europa) para **entrega imediata** ou 15 dias.
    *   **Fluxo de Caixa:** Pague em Reais, sem fechar câmbio antecipado, e receba fracionado conforme sua demanda.

---

## Por que fazer isso agora?
1.  **Dólar Volátil:** Proteja sua margem eliminando a variação cambial.
2.  **Capital de Giro:** Pare de pagar 100% antecipado e esperar 3 meses.
3.  **Resposta Rápida:** Ocorreu um pico de vendas? Nós entregamos mais peças em dias, não meses.

## Próximo Passo: Análise de Viabilidade Gratuita
Não precisa commitar nada agora. Mande **um desenho técnico** (PDF/STEP) de um item crítico.

**Nós te entregamos em 48h:**
1.  Análise de viabilidade técnica.
2.  Estimativa de custo e prazo.
3.  Comparativo de economia anual.`;

async function updateResource() {
    const { data, error } = await supabase
        .from('resources')
        .update({ content: content, updated_at: new Date().toISOString() })
        .eq('slug', 'roadmap-90-dias-migracao-skus')
        .select();

    if (error) {
        console.error("Error updating resource:", error);
    } else {
        console.log("Resource updated successfully:", data);
    }
}

updateResource();
