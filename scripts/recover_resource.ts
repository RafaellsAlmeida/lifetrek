
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Load env
const env = await load();
const SUPABASE_URL = env["SUPABASE_URL"] || Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = env["SUPABASE_SERVICE_ROLE_KEY"] || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing Supabase Credentials");
  Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const resource = {
  title: 'Guia de Precisão: Metrologia 3D e CNC Swiss',
  description: 'Como a integração entre tornos suíços de alta performance e inspeção tridimensional garante zero falhas em implantes complexos.',
  content: '# Guia de Precisão: Metrologia 3D e CNC Swiss\n\nNa manufatura de dispositivos médicos, a precisão não é apenas um diferencial—é um requisito de sobrevivência. Este guia explora a sinergia entre o torneamento suíço e a metrologia avançada.\n\n## 1. O Papel do CNC Swiss\nTornos como o Citizen M32 e L20 permitem a usinagem de peças extremamente esbeltas com tolerâncias na casa dos microns. A tecnologia LFV (Low Frequency Vibration) é essencial para o controle de cavacos em ligas de titânio.\n\n## 2. Metrologia 3D (Zeiss Contura)\nA inspeção não pode ser um gargalo. O uso de máquinas de medir por coordenadas (CMM) com sensores de escaneamento ativo permite:\n- Verificação de perfis complexos.\n- Rastreabilidade total de cada lote.\n- Integração com software de controle estatístico de processo (CEP).\n\n## 3. Benefícios para o Cliente\n- Redução de lead time em 20%.\n- Garantia de montagem perfeita em sistemas modulares.\n- Documentação técnica completa para auditorias ANVISA/FDA.',
  type: 'guide',
  persona: 'Engenharia/Qualidade',
  thumbnail_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop',
  status: 'pending_approval',
  slug: 'guia-metrologia-3d-cnc-swiss',
  metadata: { "tags": ["cnc", "metrologia", "qualidade", "3d"], "premium": true }
};

console.log(`🚀 Recovering resource: "${resource.title}"...`);

const { data, error } = await supabase
  .from('resources')
  .upsert(resource, { onConflict: 'slug' })
  .select();

if (error) {
  console.error("❌ Error recovering resource:", error);
} else {
  console.log("✅ Resource recovered successfully!");
  console.log("ID:", data[0].id);
}
