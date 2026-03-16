export type ApprovedCompanySegment =
  | "medical"
  | "dental"
  | "veterinary"
  | "contract"
  | "healthcare";

export interface ApprovedCompany {
  canonicalName: string;
  aliases: string[];
  segment: ApprovedCompanySegment;
  publicRelationshipLabel: string;
}

export const APPROVED_COMPANIES: ApprovedCompany[] = [
  { canonicalName: "CPMH", aliases: ["cpmh"], segment: "medical", publicRelationshipLabel: "portfólio aprovado" },
  { canonicalName: "Evolve", aliases: ["evolve"], segment: "medical", publicRelationshipLabel: "portfólio aprovado" },
  { canonicalName: "FGM Dental Group", aliases: ["fgm", "fgm dental", "fgm dental group"], segment: "dental", publicRelationshipLabel: "portfólio aprovado" },
  { canonicalName: "GMI", aliases: ["gmi", "global medical innovation"], segment: "medical", publicRelationshipLabel: "portfólio aprovado" },
  { canonicalName: "HCS", aliases: ["hcs", "healthcare solutions"], segment: "healthcare", publicRelationshipLabel: "portfólio aprovado" },
  { canonicalName: "Impol", aliases: ["impol"], segment: "medical", publicRelationshipLabel: "portfólio aprovado" },
  { canonicalName: "Implanfix", aliases: ["implanfix"], segment: "medical", publicRelationshipLabel: "portfólio aprovado" },
  { canonicalName: "IOL Implantes Ortopédicos", aliases: ["iol", "iol implantes ortopedicos", "iol implantes ortopédicos"], segment: "medical", publicRelationshipLabel: "portfólio aprovado" },
  { canonicalName: "Plenum", aliases: ["plenum"], segment: "medical", publicRelationshipLabel: "portfólio aprovado" },
  { canonicalName: "Neoortho", aliases: ["neoortho", "neortho"], segment: "medical", publicRelationshipLabel: "portfólio aprovado" },
  { canonicalName: "OBL Dental", aliases: ["obl", "obl dental"], segment: "dental", publicRelationshipLabel: "portfólio aprovado" },
  { canonicalName: "Orthometric", aliases: ["orthometric"], segment: "medical", publicRelationshipLabel: "portfólio aprovado" },
  { canonicalName: "Óssea Medical Technology", aliases: ["ossea", "óssea", "ossea medical technology", "óssea medical technology"], segment: "medical", publicRelationshipLabel: "portfólio aprovado" },
  { canonicalName: "Traumec Health Technology", aliases: ["traumec", "traumec health technology"], segment: "medical", publicRelationshipLabel: "portfólio aprovado" },
  { canonicalName: "Razek", aliases: ["razek"], segment: "medical", publicRelationshipLabel: "portfólio aprovado" },
  { canonicalName: "React", aliases: ["react", "react health"], segment: "healthcare", publicRelationshipLabel: "portfólio aprovado" },
  { canonicalName: "Russer", aliases: ["russer"], segment: "medical", publicRelationshipLabel: "portfólio aprovado" },
  { canonicalName: "TechImport", aliases: ["techimport", "tech import"], segment: "medical", publicRelationshipLabel: "portfólio aprovado" },
  { canonicalName: "Toride", aliases: ["toride"], segment: "medical", publicRelationshipLabel: "portfólio aprovado" },
  { canonicalName: "Ultradent Products", aliases: ["ultradent", "ultradent products"], segment: "dental", publicRelationshipLabel: "portfólio aprovado" },
  { canonicalName: "Vincula", aliases: ["vincula"], segment: "medical", publicRelationshipLabel: "portfólio aprovado" },
  { canonicalName: "Vetmaker", aliases: ["vetmaker", "vet maker"], segment: "veterinary", publicRelationshipLabel: "portfólio aprovado" },
  { canonicalName: "Medens", aliases: ["medens"], segment: "medical", publicRelationshipLabel: "portfólio aprovado" },
];

export function buildApprovedCompaniesKnowledgeText(): string {
  const currentClients = APPROVED_COMPANIES.map((company) => company.canonicalName).join(", ");
  return `# Lifetrek Medical - Client Portfolio

Current Clients / Approved Portfolio:
${currentClients}.

Strategic Messaging by Avatar:
- OEMs: "Eliminate supplier risks. ISO 13485 certified quality system."
- R&D: "Accelerate product development. From ESD prototypes to mass production."
- Proof Points: 30+ years experience, 100% Quality Board, In-House Finishing.`;
}
