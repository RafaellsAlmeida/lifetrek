import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const fullContent = `# Checklist DFM (Design for Manufacturing) para Implantes e Instrumentais

Este checklist essencial foi estruturado a partir das análises de dezenas de projetos que sofreram gargalos produtivos. Ao contemplar os itens abaixo, desenvolvedores reduzem custos e ganham agilidade na produção (Inox, Titânio e Ligas Especiais). 

Aplicar o DFM antes do congelamento do desenho garante não apenas a viabilidade de fabricação, mas também a repetibilidade em escala exigida pelas normas de dispositivos médicos.

Abaixo, apresentamos os 12 pontos críticos de atenção:

### 1. Considere raios de canto internos maiores
Em peças fresadas, cantos vivos ou raios muito pequenos exigem ferramentas especiais de micro-usinagem que são caras, frágeis e desgastam rapidamente. Sempre que possível, aumente os raios internos para permitir o uso de fresas padrão (ex: raios maiores que 1mm).

### 2. Especifique tolerâncias críticas apenas onde necessário
Tolerâncias apertadas em todas as dimensões encarecem drasticamente a peça. Reserve precisões críticas (na casa de micros) apenas para áreas de interface, acoplamento ou funcionamento mecânico direto. Nas áreas "livres", adote tolerâncias padrão.

### 3. Minimize setups de fixação
Projete a peça de modo que o maior número possível de operações de usinagem possa ser feito em uma única fixação na máquina (single setup). Quanto mais vezes a peça precisar ser reposicionada, maior o acúmulo de erro dimensional e o tempo de ciclo.

### 4. Padronize roscas e furos
Evite roscas customizadas ou furos fora do padrão. Utilize dimensões de ferramentas standard (brocas, machos, alargadores) disponíveis facilmente no mercado.

### 5. Evite paredes excessivamente finas
Paredes finas (abaixo de 0.5mm em titânio, por exemplo) tendem a vibrar durante a usinagem (chatter), dificultando o alcance de um bom acabamento superficial e estabilidade dimensional.

### 6. Atenção à relação profundidade/diâmetro em furos
Furos muito profundos (razão L/D > 4) são difíceis de usinar e evacuar cavacos, aumentando o risco de quebra da ferramenta. Caso necessário, considere se o furo pode ser passante ou stepped (escalonado).

### 7. Simplifique superfícies complexas em 3D
Superfícies orgânicas que requerem usinagem em 5 eixos contínuos aumentam absurdamente o tempo de ciclo. Simplifique superfícies não-funcionais substituindo-as por planos inclinados ou chanfros retos que um centro 3 ou 4 eixos resolva rápido.

### 8. Pense no engaste (onde a máquina vai segurar a peça)
Durante o desenvolvimento, já imagine por onde o material bruto será fixado (mordente ou castanha). Prever áreas de 'sacrifício' ou alças no blank facilita a fabricação e melhora a rigidez da usinagem.

### 9. Facilite o Acabamento Superficial (Polimento/Jateamento)
Áreas muito profundas, cavidades e ranhuras fechadas são difíceis de polir manualmente ou eletropolir de forma homogênea. O design deve permitir acesso fácil para as ferramentas de acabamento.

### 10. Selecione o Material Certo para o Processo Certo
Se a geometria for muito complexa, o Titânio G5 pode ser desafiador e lento. O Inox 17-4 PH pode oferecer boas propriedades mecânicas com usinabilidade diferente. Em caso de volumes altíssimos, avalie processos alternativos como MIM (Metal Injection Molding).

### 11. Elimine cantos vivos externos (Chanfros e Raios Básicos)
Por questões de segurança (risco ao cirurgião e ao paciente) e para evitar quebra de ferramentas ao desbastar o contorno, aplique chanfros ou quebra-cantos padronizados em todas as arestas vivas.

### 12. Facilitação de Montagem (Poka-yoke)
Em instrumentais com múltiplas partes (ex: pinças e afastadores), projete geometrias assimétricas ou pinos guias para que as peças só possam ser montadas da maneira correta, evitando erros na linha de montagem e no centro cirúrgico.
`;

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
