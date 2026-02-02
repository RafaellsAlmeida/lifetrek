
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Resolve __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env manually to be sure
const envPath = path.resolve(__dirname, '..', '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

// Merge with process.env
for (const k in envConfig) {
  process.env[k] = envConfig[k]
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing Supabase Credentials");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const resources = [
  {
    title: 'Guia de Precisão: Metrologia 3D e CNC Swiss',
    description: 'Como a integração entre tornos suíços de alta performance e inspeção tridimensional garante zero falhas em implantes complexos.',
    content: '# Guia de Precisão: Metrologia 3D e CNC Swiss\n\nNa manufatura de dispositivos médicos, a precisão não é apenas um diferencial—é um requisito de sobrevivência. Este guia explora a sinergia entre o torneamento suíço e a metrologia avançada.\n\n## 1. O Papel do CNC Swiss\nTornos como o Citizen M32 e L20 permitem a usinagem de peças extremamente esbeltas com tolerâncias na casa dos microns. A tecnologia LFV (Low Frequency Vibration) é essencial para o controle de cavacos em ligas de titânio.\n\n## 2. Metrologia 3D (Zeiss Contura)\nA inspeção não pode ser um gargalo. O uso de máquinas de medir por coordenadas (CMM) com sensores de escaneamento ativo permite:\n- Verificação de perfis complexos.\n- Rastreabilidade total de cada lote.\n- Integração com software de controle estatístico de processo (CEP).\n\n## 3. Benefícios para o Cliente\n- Redução de lead time em 20%.\n- Garantia de montagem perfeita em sistemas modulares.\n- Documentação técnica completa para auditorias ANVISA/FDA.',
    type: 'guide',
    persona: 'Engenharia/Qualidade',
    thumbnail_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop',
    status: 'pending_approval',
    slug: 'guia-metrologia-3d-cnc-swiss',
    metadata: { "tags": ["cnc", "metrologia", "qualidade", "3d"], "premium": true }
  },
  {
    title: 'Guia de Validação de Fadiga',
    description: 'Fluxograma e checklist para validar a fadiga de implantes médicos conforme normas ASTM.',
    content: '# Guia de Validação de Fadiga para Implantes\n\n## Introdução\nA fadiga é a principal causa de falha em implantes metálicos. Este guia cobre os passos essenciais para validação.\n\n## Checklist\n- [ ] Definição de carga cíclica (ASTM F2077)\n- [ ] Seleção do meio de teste (Salina/Soro)\n- [ ] Análise de superfície pós-teste\n\n## Fluxograma\n1. Design Inicial\n2. FEA (Análise de Elementos Finitos)\n3. Prototipagem\n4. Teste de Bancada\n5. Validação Clínica',
    type: 'guide',
    persona: 'Engenharia',
    thumbnail_url: 'https://images.unsplash.com/photo-1530224264768-7ff8c1789d79?q=80&w=2072&auto=format&fit=crop',
    status: 'pending_approval',
    slug: 'guia-validacao-fadiga',
    metadata: { "tags": ["fadiga", "implantes", "validacao", "astm"], "premium": false }
  }
];

console.log(`🚀 Ensuring ${resources.length} resources are in DB...`);

(async () => {
    for (const resource of resources) {
        const { data, error } = await supabase
          .from('resources')
          .upsert(resource, { onConflict: 'slug' })
          .select();

        if (error) {
          console.error(`❌ Error inserting "${resource.title}":`, error);
        } else {
          console.log(`✅ Upserted: "${resource.title}" (ID: ${data[0].id})`);
        }
    }
})();
