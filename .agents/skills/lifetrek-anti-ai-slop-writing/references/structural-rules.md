# Structural Rules — How AI-Generated Text Is Detected by Shape

These rules cover the patterns readers and detection tools flag even when vocabulary is clean. They apply to PT-BR and EN equally.

## 1. No Default Rule of Three

AI defaults to lists of three. It is the highest-probability count for both English and Portuguese training corpora.

**Rule:** Use two, four, one, or five. Three is allowed only when the content genuinely contains three items (three production shifts, three ISO clauses being cited, three machines on the shop floor).

**Examples of the AI default to break:**

- "Rápido, confiável e escalável." → "Rápido e confiável." or "Rápido, confiável, auditável e barato — escolha dois."
- "We help OEMs design, prototype, and manufacture parts." → "We help OEMs go from RFQ to validated first article."

## 2. No Three Consecutive Same-Length Sentences

This is the single most measurable AI signal. Human writing has high sentence-length variance. AI clusters sentences around 15–22 words.

**Rule:** Mix 4-word sentences with 30-word ones. Never three consecutive sentences within ±3 words of each other.

**Bad (uniform):**
> Reduzimos o lead time em 60%. Aumentamos a precisão para 5 µm. Validamos a sala limpa em três meses.

**Good (varied):**
> Reduzimos o lead time em 60%. A precisão subiu para 5 µm — e isso só foi possível depois que refizemos o setup do CMM, calibramos contra padrão NIST e treinamos dois operadores adicionais. Três meses pra validar a sala limpa.

## 3. No Parataxis

Parataxis is the AI default: short sentence. Then another. Then another. It reads like a poem and signals AI authorship instantly.

**Rule:** Connect related thoughts with subordinate clauses, conjunctions, semicolons, or commas. Show how ideas relate — causation, contrast, qualification — instead of a series of blunt declarations.

**Bad (parataxis):**
> A peça falhou na inspeção. O lote inteiro foi rejeitado. O cliente ficou bravo. Refizemos a programação. Tudo ok no segundo lote.

**Good (connected):**
> A peça falhou na inspeção e o lote inteiro foi pro descarte, o que custou caro com o cliente; depois que refizemos a programação do 5 eixos e ajustamos a estratégia de fixação, o segundo lote passou no primeiro CMM.

Three or more short declaratives in a row is the threshold. Two is fine if intentional.

## 4. No Hedging Seesaw

AI loves "on one hand... on the other hand..." It gives every counterpoint equal weight to sound balanced. The result reads as having no opinion.

**Rule:** Pick a side. State it plainly. Acknowledge counterpoints in one sentence max — never with equal weight.

**Bad:**
> Existem prós e contras na verticalização. Por um lado, ganhos em controle de qualidade. Por outro lado, custo de capital alto. Cada empresa precisa avaliar seu próprio caso.

**Good:**
> Verticalização vale a pena pra OEM com volume acima de [N] peças/ano. Abaixo disso, terceirizar é mais barato e mais rápido — e resolve auditoria com fornecedor certificado.

## 5. No Corporate Pep Talk

AI outputs the cheerleader version of every topic. Real engineering writing includes the parts that broke, the assumptions that didn't hold, the trade-offs that were uncomfortable.

**Rule:** Write as someone with scars, not as someone selling. Include friction, doubt, and mess. Sanitized copy reads as marketing.

## 6. No Identical Paragraph Templates

AI follows: topic sentence → explanation → example → transition. Every paragraph the same shape.

**Rule:** Vary opening shape. Some paragraphs start with a question. Some start with a blunt statement. Some are one sentence. Some end without a transition. Some end abruptly.

## 7. No Excessive Bullet Points

**Rule:** Use sparingly. When you do, make them uneven — some long, some short. Never more than 5–7 in a row. If a thought fits in a sentence, use a sentence.

For Lifetrek copy specifically:
- LinkedIn captions: max 1 short bullet block per caption.
- Newsletter editions: max 1 checklist of 2–4 items.
- Blog posts: bullets allowed for genuinely enumerable items (steps, machine specs, ISO clauses).

## 8. No "Como [Cargo], Eu..." / "As [Role], I..." Openers

**Rule:** Real people just say the thing. AI announces credentials before content.

**Bad:** "Como engenheiro de manufatura com 15 anos de experiência, eu posso afirmar que..."
**Good:** "A torre que importei em 2018 ainda dá menos refugo que as duas que compramos no ano passado. E elas custaram o triplo."

## 9. No Parallel Structure Across Sections

**Rule:** Different points need different treatment. Vary section lengths and shapes. If two sections are 4 paragraphs each with bulleted summaries, that pattern reads as AI.

## 10. Active Voice as Default

**Rule:** Avoid passive constructions ("foi realizado", "is being done", "was found to be") unless the subject is genuinely unknown or irrelevant. AI defaults to passive to sound measured; it sounds dead instead.

**Bad:** "A inspeção foi realizada e o lote foi aprovado."
**Good:** "A inspeção aprovou o lote."
**Better (if relevant):** "O CMM da segunda inspeção aprovou o lote depois que ajustamos o fixture do 5 eixos."

## 11. Paragraph Endings

**Rule:** Not every paragraph needs a wrap-up sentence or transition into the next. Sometimes just stop. Let the reader move on.

The AI default is to end every paragraph with "This means that..." or "Isto significa que..." or "Portanto..." — that is the cleanest tell of all, because human writers trust the reader to make the connection.

## 12. Em-Dash Discipline

**Rule:** Maximum one em-dash (—) per 500 words. The single most cited AI tell.

When you reach for an em-dash, prefer in this order:

1. A comma (if the aside is short).
2. A semicolon (if the second clause stands on its own).
3. A colon (if what follows delivers on a setup).
4. Parentheses (if the aside is genuinely parenthetical).
5. A new sentence.

PT-BR note: PT writers use em-dashes less than EN writers historically, so AI overusing them in PT is even more obvious.

## 13. Reach Past the First-Token Word

**Rule:** AI defaults to the highest-probability synonym. When writing, reach past the first word that comes to mind. Pick the second or third option, especially for verbs.

**Examples:**
- "implementar" → "rodar", "colocar em produção", "subir", "ligar"
- "otimizar" → "afinar", "reduzir [coisa específica]", "cortar [problema específico]"
- "facilitar" → "tirar do caminho", "destravar [coisa específica]", "evitar [bloqueador específico]"
- "garantir" → "comprovar", "auditar", "documentar", "deixar rastreável"

## 14. Sentence-Shape Diagnostic

After drafting, scan each paragraph and answer:

- Are the first 3 sentences within ±3 words of each other? → Rewrite at least one to be much shorter or much longer.
- Does the paragraph follow topic→explain→example→transition? → Break the shape.
- Did I use an em-dash? → Did I already use one in the previous 500 words? If yes, replace.
- Is there a list of three? → Is the content genuinely three items? If not, change the count.
- Did I open with a banned token from `banned-words-pt.md` or `banned-words-en.md`? → Replace.

If any answer is yes, rewrite and re-run the diagnostic.
