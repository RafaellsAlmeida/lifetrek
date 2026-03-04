export type WebsiteIcpCode = "MI" | "OD" | "VT" | "HS" | "CM";

export interface IcpAudience {
  code: WebsiteIcpCode;
  label: string;
  websiteSegment: string;
  primaryBuyer: string;
  successMetric: string;
}

export interface IcpExperimentPost {
  id: string;
  icpCode: WebsiteIcpCode;
  topic: string;
  targetAudience: string;
  painPoint: string;
  desiredOutcome: string;
  proofPoints: string[];
  ctaAction: string;
  visualDirection: "machine_or_product" | "facility_or_process";
  copyDensity: "low_text" | "medium_text";
  slideBucket: "1" | "2-4" | "5+";
  hypothesis: string;
  selectedEquipment?: string[];
}

export const WEBSITE_ICP_AUDIENCES: IcpAudience[] = [
  {
    code: "MI",
    label: "Implantes e Instrumentais",
    websiteSegment: "Fabricantes de Implantes, Instrumentos Cirúrgicos",
    primaryBuyer: "Engenharia + Qualidade",
    successMetric: "Reações qualificadas por 1.000 impressões",
  },
  {
    code: "OD",
    label: "Equipamentos Odontológicos",
    websiteSegment: "Empresas de Equipamentos Odontológicos",
    primaryBuyer: "P&D + Operações",
    successMetric: "CTR para páginas de capacidade técnica",
  },
  {
    code: "VT",
    label: "Veterinário",
    websiteSegment: "Empresas Veterinárias",
    primaryBuyer: "P&D + Compras técnicas",
    successMetric: "Comentários com intenção de projeto",
  },
  {
    code: "HS",
    label: "Instituições de Saúde",
    websiteSegment: "Instituições de Saúde",
    primaryBuyer: "Liderança clínica + suprimentos",
    successMetric: "Compartilhamentos e salvamentos",
  },
  {
    code: "CM",
    label: "OEM / Manufatura Contratada",
    websiteSegment: "Parceiros de Manufatura Contratada",
    primaryBuyer: "Supply chain + diretoria",
    successMetric: "Leads iniciados por CTA técnico",
  },
];

export const ICP_EXPERIMENT_POSTS: IcpExperimentPost[] = [
  {
    id: "mi-1",
    icpCode: "MI",
    topic: "Tolerância real em implantes: onde 5 mícrons mudam o risco clínico",
    targetAudience: "Engenheiros de produto e qualidade em implantes ortopédicos",
    painPoint: "Desvios dimensionais em features críticas elevam risco de NC e retrabalho",
    desiredOutcome: "Plano de controle dimensional orientado por risco funcional",
    proofPoints: [
      "CMM ZEISS Contura",
      "Inspeção 100% de dimensões críticas",
      "Rastreabilidade por lote",
    ],
    ctaAction: "Comente TOLERANCIA para receber a matriz de controle crítico",
    visualDirection: "machine_or_product",
    copyDensity: "low_text",
    slideBucket: "2-4",
    hypothesis: "Imagem de peça + CMM gera reação rápida de engenharia.",
    selectedEquipment: ["ZEISS Contura", "Implantes de titânio"],
  },
  {
    id: "mi-2",
    icpCode: "MI",
    topic: "DFM para implantes: 3 decisões que evitam atraso na primeira amostra",
    targetAudience: "Times de engenharia e NPI em dispositivos implantáveis",
    painPoint: "Projeto aprovado no CAD falha na industrialização",
    desiredOutcome: "Checklist prático para reduzir iteração e acelerar validação",
    proofPoints: [
      "Usinagem Swiss-type",
      "Fluxo protótipo para escala",
      "ISO 13485",
    ],
    ctaAction: "Comente DFM para receber o checklist de pré-cotação",
    visualDirection: "facility_or_process",
    copyDensity: "medium_text",
    slideBucket: "5+",
    hypothesis: "Post educacional aumenta CTR por curiosidade técnica.",
    selectedEquipment: ["Citizen M32", "Citizen L20"],
  },
  {
    id: "od-1",
    icpCode: "OD",
    topic: "Odonto sem retrabalho: como estabilizar lotes de componentes críticos",
    targetAudience: "P&D e operações em equipamentos odontológicos",
    painPoint: "Variação de processo impacta montagem e desempenho em campo",
    desiredOutcome: "Repetibilidade dimensional e documentação pronta para auditoria",
    proofPoints: [
      "Controle estatístico de processo",
      "Metrologia óptica + CMM",
      "Histórico de fabricação odontológica",
    ],
    ctaAction: "Comente ODONTO para receber template de plano de inspeção",
    visualDirection: "machine_or_product",
    copyDensity: "low_text",
    slideBucket: "2-4",
    hypothesis: "Produtos odontológicos em close aumentam reação inicial.",
    selectedEquipment: ["ZEISS Contura", "Instrumentais odontológicos"],
  },
  {
    id: "od-2",
    icpCode: "OD",
    topic: "Do protótipo ao lote odontológico: fluxo técnico sem perder conhecimento",
    targetAudience: "Líderes de engenharia em empresas odontológicas",
    painPoint: "Troca de fornecedor na transição para escala quebra continuidade técnica",
    desiredOutcome: "Mesma base técnica do protótipo ao lote comercial",
    proofPoints: [
      "Processo sob o mesmo teto",
      "Documentação técnica completa",
      "Validação em ambiente controlado",
    ],
    ctaAction: "Comente ESCALA para receber roteiro de handoff técnico",
    visualDirection: "facility_or_process",
    copyDensity: "medium_text",
    slideBucket: "5+",
    hypothesis: "Narrativa de processo gera mais cliques que reações.",
    selectedEquipment: ["Sala Limpa ISO 7", "Citizen M32"],
  },
  {
    id: "vt-1",
    icpCode: "VT",
    topic: "Implantes veterinários sem improviso: como garantir consistência dimensional",
    targetAudience: "P&D e qualidade em fabricantes veterinários",
    painPoint: "Variação anatômica e baixa previsibilidade de componentes",
    desiredOutcome: "Processo repetível para peças críticas veterinárias",
    proofPoints: [
      "Usinagem de precisão em Ti",
      "Controle dimensional por feature crítica",
      "Rastreabilidade completa",
    ],
    ctaAction: "Comente VET para receber critérios de validação por família de peça",
    visualDirection: "machine_or_product",
    copyDensity: "low_text",
    slideBucket: "2-4",
    hypothesis: "Fotos de produto veterinário tendem a gerar reação direta.",
    selectedEquipment: ["Citizen L20", "Implantes veterinários"],
  },
  {
    id: "vt-2",
    icpCode: "VT",
    topic: "Personalização veterinária com processo industrial: mito ou prática?",
    targetAudience: "Líderes técnicos em dispositivos veterinários",
    painPoint: "Casos especiais viram exceção cara e difícil de rastrear",
    desiredOutcome: "Fluxo padronizado para demandas de personalização",
    proofPoints: [
      "DFM para lotes pequenos",
      "Controle de versão e lote",
      "Critérios de validação mecânica",
    ],
    ctaAction: "Comente PERSONALIZADO para receber framework de decisão",
    visualDirection: "facility_or_process",
    copyDensity: "medium_text",
    slideBucket: "5+",
    hypothesis: "Tema conceitual aumenta comentários de discussão.",
    selectedEquipment: ["Sala Limpa ISO 7", "ZEISS Contura"],
  },
  {
    id: "hs-1",
    icpCode: "HS",
    topic: "Segurança de cadeia para instituições de saúde: o que precisa estar auditável",
    targetAudience: "Lideranças clínicas e suprimentos hospitalares",
    painPoint: "Risco de falta, desvio de qualidade e baixa rastreabilidade",
    desiredOutcome: "Checklist de fornecimento auditável para itens críticos",
    proofPoints: [
      "ISO 13485",
      "Rastreabilidade de lote e processo",
      "Ambiente de produção controlado",
    ],
    ctaAction: "Comente AUDITORIA para receber checklist de risco de fornecimento",
    visualDirection: "facility_or_process",
    copyDensity: "medium_text",
    slideBucket: "5+",
    hypothesis: "Conteúdo de risco e compliance aumenta salvamentos.",
    selectedEquipment: ["Sala Limpa ISO 7"],
  },
  {
    id: "hs-2",
    icpCode: "HS",
    topic: "ISO 7 na prática: impacto real no risco de contaminação de instrumentais",
    targetAudience: "Qualidade hospitalar e gestores de suprimentos",
    painPoint: "Ambiente não controlado compromete integridade até a esterilização",
    desiredOutcome: "Critérios objetivos para avaliar parceiro de manufatura",
    proofPoints: [
      "Salas limpas ISO 7 validadas",
      "Fluxo de materiais com pass-through",
      "Integração com requisitos regulatórios",
    ],
    ctaAction: "Comente ISO7 para receber critérios mínimos de ambiente controlado",
    visualDirection: "machine_or_product",
    copyDensity: "low_text",
    slideBucket: "2-4",
    hypothesis: "Visual de sala limpa e processo gera reações mais rápidas.",
    selectedEquipment: ["Sala Limpa ISO 7"],
  },
  {
    id: "cm-1",
    icpCode: "CM",
    topic: "Roadmap de 90 dias para migrar 1-3 SKUs para produção local",
    targetAudience: "Diretores de supply chain e operações em OEMs",
    painPoint: "Dependência de importação e lead time imprevisível",
    desiredOutcome: "Plano acionável de migração com risco controlado",
    proofPoints: [
      "Produção local em padrão global",
      "Redução de lead time",
      "Qualidade auditável desde o setup",
    ],
    ctaAction: "Comente ROADMAP para receber o plano de 90 dias",
    visualDirection: "facility_or_process",
    copyDensity: "medium_text",
    slideBucket: "5+",
    hypothesis: "Post de framework tende a elevar CTR e comentários de diagnóstico.",
    selectedEquipment: ["Citizen M32", "ZEISS Contura", "Sala Limpa ISO 7"],
  },
  {
    id: "cm-2",
    icpCode: "CM",
    topic: "Custo real importado vs local: onde sua margem está vazando",
    targetAudience: "C-level, supply chain e compras estratégicas",
    painPoint: "Decisão por preço unitário ignora estoque, câmbio e retrabalho",
    desiredOutcome: "Comparar TCO com variáveis operacionais relevantes",
    proofPoints: [
      "Lead time local reduzido",
      "Menor capital parado em estoque",
      "Menos NC por controle de processo",
    ],
    ctaAction: "Comente CUSTO REAL para receber matriz de comparação TCO",
    visualDirection: "machine_or_product",
    copyDensity: "low_text",
    slideBucket: "2-4",
    hypothesis: "Produto/maquinário com claim financeiro aumenta reação e clique.",
    selectedEquipment: ["Citizen L20", "ZEISS Contura"],
  },
];
