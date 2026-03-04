const MARKDOWN_TOKENS = /[`*_#>|~]/g;
const ESCAPED_NEWLINES = /\\n|\\r\\n|\\r/g;
const MULTI_SPACE = /\s{2,}/g;

export function normalizeExcerptForCard(text?: string | null, maxWords = 24): string {
  if (!text) return "Sem prévia disponível";

  const cleaned = text
    .replace(ESCAPED_NEWLINES, " ")
    .replace(MARKDOWN_TOKENS, "")
    .replace(MULTI_SPACE, " ")
    .trim();

  const words = cleaned.split(" ").filter(Boolean);
  if (words.length <= maxWords) return cleaned;
  return `${words.slice(0, maxWords).join(" ")}...`;
}

export function detectMixedLanguage(text?: string | null): boolean {
  if (!text) return false;
  const sample = text.toLowerCase();

  const ptHints = [" para ", " com ", " não ", " produção ", " qualidade ", " rastreabilidade "];
  const enHints = [" the ", " and ", " with ", " for ", " quality ", " design ", " manufacturing "];

  const hasPt = ptHints.some((hint) => sample.includes(hint));
  const hasEn = enHints.some((hint) => sample.includes(hint));

  return hasPt && hasEn;
}
