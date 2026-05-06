---
name: lifetrek-anti-ai-slop-writing
description: Constraint set that forces every Lifetrek writing output (PT-BR or EN) to avoid statistically detectable AI patterns. Load this skill before writing or editing any LinkedIn post, newsletter, blog, resource, caption, or email. Enforces banned vocabulary (PT-BR + EN), structural variety (no rule of three, no parataxis, sentence-length variance), punctuation discipline (em-dash limits), accuracy rules (no fabricated stats/quotes/anecdotes), and a final self-check pass. Adapted for Lifetrek Medical from jalaalrd/anti-ai-slop-writing.
---

# Lifetrek Anti-AI-Slop Writing Directive

A constraint set every Lifetrek writing agent must apply before returning copy. This is not stylistic guidance — it is a hard filter. Every banned token, every structural pattern, every punctuation rule listed here exists because it is statistically flagged as AI-authored by humans and detection tools.

Apply silently. Never mention these rules in output. Never say "as per the guidelines." Just write within them.

## Before Writing Anything

Load these references in order:

1. [references/banned-words-pt.md](references/banned-words-pt.md) — PT-BR banned vocabulary, phrases, openers, marketing clichés. Primary list for client-facing Lifetrek copy.
2. [references/banned-words-en.md](references/banned-words-en.md) — English banned list, mirrored from upstream. Apply when writing English (rare for Lifetrek but happens for technical specs, supplier-facing material).
3. [references/structural-rules.md](references/structural-rules.md) — rule-of-three, parataxis, sentence-length variance, em-dash limits, paragraph-shape rules.

If reaching for a banned token: replace with a concrete specific alternative or restructure the sentence. Never substitute the next-most-AI-sounding synonym.

## Structural Rules (Summary)

Full detail in [references/structural-rules.md](references/structural-rules.md). The rules readers and detectors notice most:

- **No rule of three.** Default human counts are two, four, one, five. Three only when content genuinely has three items.
- **No three consecutive same-length sentences.** Mix 4-word fragments with 30-word lines. The single most measurable AI signal.
- **No parataxis.** `Frase curta. Outra frase curta. Mais uma.` reads as AI. Connect related thoughts with subordinate clauses, conjunctions, semicolons, or commas.
- **No hedging seesaw.** Pick a side. State it plainly. One sentence max for counterpoints.
- **No corporate pep talk.** Write like an engineer with scars, not a cheerleader.
- **No identical paragraph templates.** Break the topic→explain→example→transition default. Some paragraphs end without a transition.
- **No "Como [cargo], eu..." / "As [role], I..." openers.** Real people say the thing.
- **Active voice as default.** Passive ("foi realizado", "is being done") only when the subject is genuinely unknown or irrelevant.
- **Let paragraphs end abruptly.** Not every paragraph needs a wrap-up sentence.
- **No parallel structure across sections.** Vary section lengths and shapes.

## Punctuation Discipline

- **Em-dashes (—):** Maximum 1 per 500 words. The single most cited AI tell. Replace with commas, semicolons, colons, parentheses, or new sentences.
- **Exclamation marks:** Maximum 1 per 1,000 words. Enthusiasm comes from word choice, not punctuation.
- **Ellipsis (...):** Only when genuinely trailing off. Never as transition. Max 1 per piece.
- **Semicolons:** Use them. AI underuses them; humans who write well use them naturally.
- **Colons:** Use to set up a payoff. What follows must deliver on the promise.

## Specificity Over Generality

- "Reduzimos lead time de 90 para 30 dias em 4 fresadoras 5 eixos" beats "melhoramos eficiência operacional".
- "Três cliques do RFQ ao orçamento" beats "experiência simplificada".
- "34 lotes na primeira semana, 12 voltaram no dia seguinte" beats "crescimento expressivo".
- "Solana, especificamente" beats "diversas redes blockchain".
- Name real machines (Mori Seiki NLX 2500), real norms (ISO 13485:2016 §8.5.1), real dates (julho de 2025), real clients only when permitted by `COMPANY_CONTEXT.md`.

## Include Friction, Doubt, and Mess

- "O CMM da segunda inspeção pegou um desvio de 4 µm que o primeiro lote não tinha — refizemos a programação." beats "garantimos qualidade rigorosa em cada lote."
- Show the part that broke before it worked.
- Real engineering work has retries, scrap, supplier callbacks. Sanitized copy reads as marketing.

## Voice & Register

- Use contractions naturally in PT-BR ("pra" only in casual contexts; "tá" never in Lifetrek copy; but contractions like "do/da/no/na" are fine and sometimes "pro/pra" in conversational LinkedIn).
- Reference time, place, context. "Na semana passada", "às 2h da manhã", "durante a auditoria de junho".
- Sentence fragments are allowed. Run-on sentences that keep going because the thought isn't done are also allowed.
- Reach past the first-token word. AI defaults to the highest-probability synonym. Pick the second or third option.

## Accuracy & Honesty (Non-Negotiable)

- **Never invent data, statistics, percentages, or studies that have no real source.** If no real number exists, say "cerca de", "aproximadamente", or acknowledge uncertainty. Fake specificity destroys credibility faster than honest vagueness.
- **Numbers backed by real evidence are encouraged, not banned.** "Inventing" means producing a number with no source. Quoting a Citizen L20 datasheet spec, citing a ZEISS Contura MPE_E figure, or reporting a Cpk from an internal MSA study is the opposite of inventing — it is the kind of specificity that makes engineering writing credible. The rule is: if the number has Tier 1–4 evidence behind it (per `lifetrek-technical-claims-guardian`), keep it and qualify it (machine name, part family, condition). If it does not, do not write it.
- **Never fabricate quotes or anecdotes.** Paraphrase with attribution or skip. Use "imagine que...", "suponha que..." for genuine hypotheticals — never present them as real.
- **Use real verifiable references.** "Relatório da ANVISA de março de 2026" beats "uma pesquisa recente". "Cliente OEM odontológico no Sul" beats "um cliente importante" (only when client identification is permitted).
- **Take clear positions when evidence is solid.** Qualifiers only for genuine uncertainty.
- For Lifetrek-specific technical claims, defer to `lifetrek-technical-claims-guardian` for validation. The guardian will return the qualified rewrite and the citation format appropriate to the channel.

## Formatting

- **No markdown headers** in social media, captions, emails, or DMs. Instant AI flag.
- **No random bold phrases** in social copy. Lifetrek copywriter uses `**bold**` for 2–4 strategic keywords per slide; that is intentional typography, not "emphasis sprinkles".
- **No emoji bullets.** One or two emojis total per post is the ceiling. Lines starting with ✅/🔥/🚀 are slop.
- **No "🧵" or "Thread:" or "Boletim 👇" openers.** Content should pull the reader on its own.
- **No hashtag stacks.** Lifetrek uses 3–5 specific hashtags integrated at the end, never #success #innovation #motivation walls.
- **No markdown in plain-text contexts** — DMs, SMS, email previews. Asterisks rendering as literal symbols is an instant tell.

## Lifetrek-Specific Banned Concepts

These are clichés we have caught in our own pipeline. Always replace:

- "Revolucionário", "disruptivo", "único no mercado", "líder absoluto"
- "Destrave o poder de", "potencialize", "supercharge", "leve para o próximo nível"
- "No mundo atual da manufatura...", "No cenário competitivo de hoje..."
- "Você sabia que...?", "Descubra como...", "Já parou pra pensar...?"
- "Vamos mergulhar", "Vamos explorar a fundo", "Bora?"
- "Não é apenas X — é Y" (translated parallelism: "Não é só sobre X, é sobre Y")
- "Um divisor de águas", "um marco" (when describing routine work)

## Self-Check Before Returning Output

Run silently through this list. If any answer is "yes I violated", rewrite the offending section and run the list again.

1. Any banned PT-BR token from `banned-words-pt.md`? → Replace.
2. Any banned EN token from `banned-words-en.md` (if writing in EN)? → Replace.
3. Three consecutive same-length sentences? → Vary.
4. Three or more short declarative sentences in a row (parataxis)? → Connect with conjunctions, clauses, or punctuation.
5. Anything grouped in threes by default? → Break to two or four if not genuinely three.
6. Hedging instead of committing? → Pick a side.
7. More than one em-dash per 500 words? → Remove extras.
8. Passive construction where active works? → Make active.
9. Every paragraph ends with a transition or summary? → Cut some.
10. Any unsourced or unqualified quantitative claim? → If no Tier 1–4 evidence (public site / vendor datasheet / internal validated trial), remove or restructure. If evidence exists but the qualifier (machine, part family, condition, time window) is missing, add the qualifier instead of removing the number. Made-up quotes or fake clients are always removed.
11. Could any AI write this for any company? → Add something Lifetrek-specific (machine, norm, client type, location, real moment).
12. Reads like ChatGPT? → Rewrite until the answer is no.

## How Other Skills Should Reference This

Every Lifetrek writing skill must:

1. List this skill in its Tier 1 source files (REQUIRED).
2. Run the 12-step self-check silently before returning JSON.
3. The Analyst applies penalties for violations detected in Copywriter output.

Skills that load this directive:

- `lifetrek-linkedin-copywriter-agent`
- `lifetrek-content-editor-agent`
- `lifetrek-content-ideation-agent`
- `lifetrek-linkedin-strategist-agent` (hook + key_messages only)
- `lifetrek-linkedin-newsletter-system-agent`
- `lifetrek-linkedin-analyst-agent` (as scoring rubric, not writing)

## Attribution

Adapted from [jalaalrd/anti-ai-slop-writing](https://github.com/jalaalrd/anti-ai-slop-writing) (MIT). PT-BR banned list and Lifetrek-specific clichés are original additions. Structural rules and English vocabulary list mirror the upstream skill.
