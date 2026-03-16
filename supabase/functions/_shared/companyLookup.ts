import {
  APPROVED_COMPANIES,
  type ApprovedCompany,
} from "./approvedCompanies.ts";

export interface CompanyLookupResult {
  detectedCompany: string | null;
  matchedCompany: string | null;
  matchSource: "approved_registry" | "company_research" | "contact_leads" | null;
  matchType: "exact" | "fuzzy" | "fallback" | null;
  confidence: number;
  segment: ApprovedCompany["segment"] | null;
  publicRelationshipLabel: string | null;
  lookupSources: string[];
  rawCandidates: string[];
}

function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeForLookup(value: string): string {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function normalizeSearchText(value: string): string {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueNonEmpty(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function levenshteinDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let row = 0; row < rows; row += 1) {
    matrix[row][0] = row;
  }
  for (let col = 0; col < cols; col += 1) {
    matrix[0][col] = col;
  }

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const cost = a[row - 1] === b[col - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
}

function similarityScore(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const distance = levenshteinDistance(a, b);
  return 1 - distance / Math.max(a.length, b.length);
}

export function extractCompanyCandidates(text: string): string[] {
  const raw = text.replace(/\s+/g, " ").trim();
  if (!raw) return [];

  const candidates: string[] = [];
  const cuePatterns = [
    /(?:empresa|marca|cliente|parceiro)\s+([A-Za-zÀ-ÿ0-9&._-]{2,}(?:\s+[A-Za-zÀ-ÿ0-9&._-]{1,}){0,3})/giu,
    /(?:para\s+a\s+empresa|para\s+empresa)\s+([A-Za-zÀ-ÿ0-9&._-]{2,}(?:\s+[A-Za-zÀ-ÿ0-9&._-]{1,}){0,3})/giu,
  ];

  for (const pattern of cuePatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(raw)) !== null) {
      candidates.push(match[1]);
    }
  }

  const quotedMatches = raw.match(/["“'`](.{2,40}?)["”'`]/gu) ?? [];
  for (const match of quotedMatches) {
    candidates.push(match.slice(1, -1));
  }

  const uppercaseMatches = raw.match(/\b[A-Z0-9][A-Z0-9&._-]{2,}\b/g) ?? [];
  candidates.push(...uppercaseMatches);

  if (raw.split(" ").length <= 3) {
    candidates.push(raw);
  }

  return uniqueNonEmpty(candidates);
}

export function findApprovedCompanyMatch(
  candidates: string[],
): CompanyLookupResult | null {
  let bestMatch:
    | (CompanyLookupResult & { normalizedCandidate: string })
    | null = null;

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeForLookup(candidate);
    if (!normalizedCandidate || normalizedCandidate.length < 3) continue;

    for (const company of APPROVED_COMPANIES) {
      const aliases = uniqueNonEmpty([company.canonicalName, ...company.aliases]);
      for (const alias of aliases) {
        const normalizedAlias = normalizeForLookup(alias);
        if (!normalizedAlias) continue;

        if (normalizedCandidate === normalizedAlias) {
          return {
            detectedCompany: candidate.trim(),
            matchedCompany: company.canonicalName,
            matchSource: "approved_registry",
            matchType: "exact",
            confidence: 1,
            segment: company.segment,
            publicRelationshipLabel: company.publicRelationshipLabel,
            lookupSources: ["approved_registry"],
            rawCandidates: candidates,
          };
        }

        const score = similarityScore(normalizedCandidate, normalizedAlias);
        const distance = levenshteinDistance(normalizedCandidate, normalizedAlias);
        const isMinorTypo =
          normalizedCandidate.length >= 6 &&
          normalizedAlias.length >= 6 &&
          score >= 0.87 &&
          distance <= 1;

        if (!isMinorTypo) continue;

        const candidateMatch: CompanyLookupResult & { normalizedCandidate: string } = {
          detectedCompany: candidate.trim(),
          matchedCompany: company.canonicalName,
          matchSource: "approved_registry",
          matchType: "fuzzy",
          confidence: Number(score.toFixed(3)),
          segment: company.segment,
          publicRelationshipLabel: company.publicRelationshipLabel,
          lookupSources: ["approved_registry"],
          rawCandidates: candidates,
          normalizedCandidate,
        };

        if (!bestMatch || candidateMatch.confidence > bestMatch.confidence) {
          bestMatch = candidateMatch;
        }
      }
    }
  }

  if (!bestMatch) return null;

  return {
    detectedCompany: bestMatch.detectedCompany,
    matchedCompany: bestMatch.matchedCompany,
    matchSource: bestMatch.matchSource,
    matchType: bestMatch.matchType,
    confidence: bestMatch.confidence,
    segment: bestMatch.segment,
    publicRelationshipLabel: bestMatch.publicRelationshipLabel,
    lookupSources: bestMatch.lookupSources,
    rawCandidates: bestMatch.rawCandidates,
  };
}

function buildDbFallbackResult(
  candidate: string,
  companyName: string,
  source: "company_research" | "contact_leads",
): CompanyLookupResult {
  return {
    detectedCompany: candidate.trim(),
    matchedCompany: companyName,
    matchSource: source,
    matchType: "fallback",
    confidence: 0.82,
    segment: null,
    publicRelationshipLabel: null,
    lookupSources: [source],
    rawCandidates: [candidate],
  };
}

async function lookupCompanyResearch(
  supabase: any,
  candidate: string,
): Promise<CompanyLookupResult | null> {
  const pattern = `%${normalizeSearchText(candidate)}%`;
  const { data, error } = await supabase
    .from("company_research")
    .select("company_name, domain")
    .ilike("company_name", pattern)
    .limit(3);

  if (error || !data?.length) return null;

  const normalizedCandidate = normalizeForLookup(candidate);
  for (const row of data) {
    const companyName = row.company_name?.trim();
    if (!companyName) continue;
    const normalizedCompany = normalizeForLookup(companyName);
    if (
      normalizedCompany === normalizedCandidate ||
      normalizedCompany.includes(normalizedCandidate)
    ) {
      return buildDbFallbackResult(candidate, companyName, "company_research");
    }
  }

  return null;
}

async function lookupContactLeads(
  supabase: any,
  candidate: string,
): Promise<CompanyLookupResult | null> {
  const pattern = `%${normalizeSearchText(candidate)}%`;
  const { data, error } = await supabase
    .from("contact_leads")
    .select("company")
    .ilike("company", pattern)
    .limit(3);

  if (error || !data?.length) return null;

  const normalizedCandidate = normalizeForLookup(candidate);
  for (const row of data) {
    const companyName = row.company?.trim();
    if (!companyName) continue;
    const normalizedCompany = normalizeForLookup(companyName);
    if (
      normalizedCompany === normalizedCandidate ||
      normalizedCompany.includes(normalizedCandidate)
    ) {
      return buildDbFallbackResult(candidate, companyName, "contact_leads");
    }
  }

  return null;
}

export async function lookupCompany(
  supabase: any,
  inputText: string,
): Promise<CompanyLookupResult> {
  const rawCandidates = extractCompanyCandidates(inputText);
  if (!rawCandidates.length) {
    return {
      detectedCompany: null,
      matchedCompany: null,
      matchSource: null,
      matchType: null,
      confidence: 0,
      segment: null,
      publicRelationshipLabel: null,
      lookupSources: [],
      rawCandidates: [],
    };
  }

  const approvedMatch = findApprovedCompanyMatch(rawCandidates);
  if (approvedMatch) return approvedMatch;

  for (const candidate of rawCandidates) {
    const researchMatch = await lookupCompanyResearch(supabase, candidate);
    if (researchMatch) return researchMatch;

    const leadMatch = await lookupContactLeads(supabase, candidate);
    if (leadMatch) return leadMatch;
  }

  return {
    detectedCompany: rawCandidates[0],
    matchedCompany: null,
    matchSource: null,
    matchType: null,
    confidence: 0,
    segment: null,
    publicRelationshipLabel: null,
    lookupSources: [],
    rawCandidates,
  };
}

export function buildCompanyPromptHint(lookup: CompanyLookupResult): string {
  if (!lookup.matchedCompany || !lookup.matchSource) return "";

  if (lookup.matchSource === "approved_registry") {
    if (lookup.segment === "veterinary") {
      return `A ${lookup.matchedCompany} aparece no portfólio aprovado da Lifetrek na frente veterinária. Não trate isso como confirmação de fabricação ativa agora; use linguagem de portfólio/parceria aprovada.`;
    }

    return `A ${lookup.matchedCompany} aparece no portfólio aprovado da Lifetrek. Use linguagem de portfólio/parceria aprovada, sem afirmar detalhes operacionais não confirmados.`;
  }

  return `Há referência interna à empresa ${lookup.matchedCompany}. Você pode dizer que encontrou referência interna, mas sem inventar detalhes comerciais ou produtivos.`;
}
