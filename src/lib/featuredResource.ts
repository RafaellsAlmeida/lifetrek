export type FeaturedResource = {
  slug: string;
  title: string;
  description: string;
  cta: string;
};

const FEATURED_RESOURCES: FeaturedResource[] = [
  {
    slug: "scorecard-risco-supply-chain-2026",
    title: "Scorecard de Risco de Supply Chain 2026",
    description:
      "Avalie rapidamente exposição a lead time, câmbio e risco de requalificação em componentes médicos.",
    cta: "Baixar scorecard",
  },
  {
    slug: "checklist-transferencia-npi-producao",
    title: "Checklist de Transferência NPI -> Produção",
    description:
      "Checklist prático para reduzir risco técnico e operacional na passagem de protótipo para série.",
    cta: "Abrir checklist NPI",
  },
  {
    slug: "checklist-producao-local",
    title: "Checklist: Quando Faz Sentido Produzir Local",
    description:
      "Estrutura de decisão para priorizar itens de importação que merecem migração para produção local.",
    cta: "Abrir checklist local",
  },
];

const RESOURCE_KEYWORDS: Record<string, string[]> = {
  "scorecard-risco-supply-chain-2026": [
    "supply chain",
    "fornecedor",
    "lead time",
    "sourcing",
    "cambio",
    "frete",
    "custo total",
  ],
  "checklist-transferencia-npi-producao": [
    "npi",
    "transferencia",
    "escala",
    "industrializacao",
    "producao",
    "ramp-up",
  ],
  "checklist-producao-local": [
    "nearshore",
    "importacao",
    "producao local",
    "oem",
    "compliance",
    "risco regulatorio",
  ],
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function getFeaturedResourceForBlog(text: string): FeaturedResource | null {
  const normalizedText = normalize(text);
  const scored = FEATURED_RESOURCES.map((resource) => {
    const keywords = RESOURCE_KEYWORDS[resource.slug] || [];
    const hits = keywords.reduce((count, keyword) => {
      return normalizedText.includes(normalize(keyword)) ? count + 1 : count;
    }, 0);
    return { resource, hits };
  }).sort((a, b) => b.hits - a.hits);

  if (!scored[0] || scored[0].hits === 0) return null;
  return scored[0].resource;
}
