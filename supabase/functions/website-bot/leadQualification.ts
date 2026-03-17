export type ContactField = "name" | "email" | "phone";

export type ContactInfo = Partial<Record<ContactField, string>>;

export type LeadQualificationState = {
  wantsCommercialHelp: boolean;
  knownContact: ContactInfo;
  missingFields: ContactField[];
  shouldRequestContact: boolean;
  readyForCommercialFollowUp: boolean;
  lastUserMessageLooksLikeContact: boolean;
};

const COMMERCIAL_TERMS = [
  "comprar",
  "compra",
  "orcamento",
  "orçamento",
  "preco",
  "preço",
  "cotacao",
  "cotação",
  "pedido",
  "adquirir",
  "quero algo",
  "quero comprar",
  "quero cotar",
  "quero orcar",
  "quero orçar",
  "falar com vendas",
  "falar com comercial",
  "contato comercial",
  "time comercial",
  "whatsapp",
];

const NAME_PATTERNS = [
  /(?:me chamo|meu nome e|meu nome é|nome[:\s]+)\s*([^\n,.;:!?]{2,60})/i,
  /(?:sou\s+(?:o|a))\s*([^\n,.;:!?]{2,60})/i,
];

const CONTACT_STOP_WORDS = new Set([
  "email",
  "e-mail",
  "telefone",
  "whatsapp",
  "zap",
  "celular",
  "fone",
  "meu",
  "nome",
  "contato",
  "empresa",
  "sou",
]);

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizePhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 13) return null;
  return digits;
}

function cleanupNameCandidate(value: string): string | null {
  const cleaned = value
    .replace(/\b(email|e-mail|telefone|whatsapp|zap)\b.*/i, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned || /\d/.test(cleaned)) return null;

  const words = cleaned
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!words.length || words.length > 4) return null;
  if (words.some((word) => CONTACT_STOP_WORDS.has(normalizeText(word)))) return null;

  return words.join(" ");
}

export function extractContact(text: string): ContactInfo {
  const result: ContactInfo = {};
  const email = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
  if (email) {
    result.email = email[0].toLowerCase();
  }

  const phoneMatches = text.match(/(?:\+?\d[\d\s().-]{8,}\d)/g) ?? [];
  for (const phoneMatch of phoneMatches) {
    const normalizedPhone = normalizePhone(phoneMatch);
    if (normalizedPhone) {
      result.phone = normalizedPhone;
      break;
    }
  }

  for (const pattern of NAME_PATTERNS) {
    const nameMatch = text.match(pattern);
    if (!nameMatch?.[1]) continue;

    const name = cleanupNameCandidate(nameMatch[1]);
    if (name) {
      result.name = name;
      break;
    }
  }

  return result;
}

export function mergeContactInfo(...sources: ContactInfo[]): ContactInfo {
  return sources.reduce<ContactInfo>((acc, current) => {
    if (current.name) acc.name = current.name;
    if (current.email) acc.email = current.email;
    if (current.phone) acc.phone = current.phone;
    return acc;
  }, {});
}

export function collectKnownContact(messages: string[]): ContactInfo {
  return messages.reduce<ContactInfo>((acc, message) => {
    if (!message.trim()) return acc;
    return mergeContactInfo(acc, extractContact(message));
  }, {});
}

export function wantsCommercialHelp(text: string): boolean {
  const normalized = normalizeText(text);
  return COMMERCIAL_TERMS.some((term) => normalized.includes(normalizeText(term)));
}

function stripDetectedContact(text: string): string {
  return text
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, " ")
    .replace(/(?:\+?\d[\d\s().-]{8,}\d)/g, " ")
    .replace(/\b(me chamo|meu nome e|meu nome é|nome|sou o|sou a)\b/gi, " ")
    .replace(/[,:;|/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeContactPayload(lastUserMessage: string): boolean {
  const parsed = extractContact(lastUserMessage);
  const contactSignals = [parsed.name, parsed.email, parsed.phone].filter(Boolean).length;

  if (!contactSignals) return false;

  const stripped = stripDetectedContact(lastUserMessage);
  if (!stripped) return true;

  const remainingWords = stripped.split(" ").filter(Boolean);
  return remainingWords.length <= 6;
}

export function inferLeadQualification(params: {
  userMessages: string[];
  lastUserMessage: string;
  conversationText: string;
}): LeadQualificationState {
  const { userMessages, lastUserMessage, conversationText } = params;
  const knownContact = collectKnownContact(userMessages);
  const wantsLeadFlow = wantsCommercialHelp(conversationText);
  const missingFields = (["name", "email", "phone"] as ContactField[]).filter(
    (field) => !knownContact[field],
  );

  return {
    wantsCommercialHelp: wantsLeadFlow,
    knownContact,
    missingFields,
    shouldRequestContact: wantsLeadFlow && missingFields.length > 0,
    readyForCommercialFollowUp: wantsLeadFlow && missingFields.length === 0,
    lastUserMessageLooksLikeContact: looksLikeContactPayload(lastUserMessage),
  };
}

function formatMissingFields(fields: ContactField[]): string {
  const labels = fields.map((field) => {
    if (field === "phone") return "telefone ou WhatsApp";
    if (field === "email") return "email";
    return "nome";
  });

  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} e ${labels[1]}`;

  return `${labels[0]}, ${labels[1]} e ${labels[2]}`;
}

function describeLeadScope(interest: string, detectedCompany: string | null): string {
  if (detectedCompany) {
    return `sobre ${detectedCompany}`;
  }

  if (interest === "Dental") return "sobre o seu projeto dental";
  if (interest === "Veterinario") return "sobre o seu projeto veterinário";
  if (interest === "Ortopedia") return "sobre o seu projeto de ortopedia";
  if (interest === "OEM") return "sobre o seu projeto OEM";
  if (interest === "Certificacoes") return "sobre a sua demanda regulatória";

  return "sobre o que você quer comprar ou cotar";
}

export function buildLeadCaptureReply(params: {
  state: LeadQualificationState;
  interest: string;
  detectedCompany: string | null;
}): string {
  const { state, interest, detectedCompany } = params;
  const fields = formatMissingFields(state.missingFields);
  const scope = describeLeadScope(interest, detectedCompany);

  return `Consigo te ajudar com isso. Para eu te atender direito ${scope} e encaminhar para o comercial, me passe ${fields}. Se quiser, já pode me dizer também qual produto, componente ou projeto você quer cotar.`;
}

export function buildLeadReadyPromptHint(params: {
  state: LeadQualificationState;
  interest: string;
  detectedCompany: string | null;
}): string {
  const { state, interest, detectedCompany } = params;

  if (!state.readyForCommercialFollowUp) return "";

  const details = [
    state.knownContact.name ? `nome: ${state.knownContact.name}` : null,
    state.knownContact.email ? `email: ${state.knownContact.email}` : null,
    state.knownContact.phone ? `telefone: ${state.knownContact.phone}` : null,
    detectedCompany ? `empresa: ${detectedCompany}` : null,
    interest !== "Geral" ? `interesse: ${interest}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return `

Contexto comercial:
- O usuário demonstrou intenção de compra/orçamento.
- Dados já coletados: ${details || "lead qualificado"}.
- Agradeça pelos dados em uma frase curta e siga a conversa sem pedir nome, email ou telefone novamente.
- Responda com base no contexto recuperado do banco.
- Se ainda faltar saber o produto, componente ou projeto, peça isso em uma pergunta objetiva.
- Nunca devolva um CTA seco de WhatsApp.`;
}

export function buildPostCaptureReply(params: {
  state: LeadQualificationState;
  interest: string;
}): string | null {
  const { state, interest } = params;

  if (!state.readyForCommercialFollowUp || !state.lastUserMessageLooksLikeContact) {
    return null;
  }

  const greeting = state.knownContact.name ? `Perfeito, ${state.knownContact.name}.` : "Perfeito.";
  const capability =
    interest === "Dental"
      ? " A Lifetrek atua com implantes, componentes e instrumentais odontológicos de precisão."
      : interest === "Veterinario"
        ? " A Lifetrek atua com implantes e componentes veterinários, inclusive em manufatura contratada."
        : interest === "Ortopedia"
          ? " A Lifetrek atua com implantes e componentes ortopédicos de precisão."
          : interest === "OEM"
            ? " A Lifetrek atua com projetos OEM e manufatura contratada."
            : "";

  return `${greeting} Já anotei seu nome, email e telefone.${capability} Para eu te orientar com base no nosso portfólio e encaminhar certo, me diga qual produto, componente ou projeto você quer comprar ou cotar.`;
}
