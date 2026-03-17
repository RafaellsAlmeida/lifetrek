import {
  buildLeadCaptureReply,
  buildPostCaptureReply,
  extractContact,
  inferLeadQualification,
} from "./leadQualification.ts";

Deno.test("pede nome, email e telefone quando o usuario quer comprar sem dados", () => {
  const state = inferLeadQualification({
    userMessages: ["oi", "quero comprar algo"],
    lastUserMessage: "quero comprar algo",
    conversationText: "oi quero comprar algo",
  });

  if (!state.shouldRequestContact) {
    throw new Error("Era esperado entrar no fluxo de captura de lead.");
  }

  const reply = buildLeadCaptureReply({
    state,
    interest: "Geral",
    detectedCompany: null,
  });

  if (!reply.includes("nome, email e telefone ou WhatsApp")) {
    throw new Error(`Resposta nao pediu os campos corretos: ${reply}`);
  }
});

Deno.test("consolida contato completo ao longo da conversa", () => {
  const state = inferLeadQualification({
    userMessages: [
      "quero cotar uma solucao",
      "meu nome e Rafael Almeida",
      "rafa@empresa.com",
      "11 94533-6226",
    ],
    lastUserMessage: "11 94533-6226",
    conversationText: "quero cotar uma solucao meu nome e Rafael Almeida rafa@empresa.com 11 94533-6226",
  });

  if (!state.readyForCommercialFollowUp) {
    throw new Error("Era esperado que o lead estivesse pronto para follow-up comercial.");
  }

  if (state.knownContact.name !== "Rafael Almeida") {
    throw new Error(`Nome inesperado: ${state.knownContact.name}`);
  }

  if (state.knownContact.email !== "rafa@empresa.com") {
    throw new Error(`Email inesperado: ${state.knownContact.email}`);
  }

  if (state.knownContact.phone !== "11945336226") {
    throw new Error(`Telefone inesperado: ${state.knownContact.phone}`);
  }
});

Deno.test("gera resposta pos-captura quando a ultima mensagem e so contato", () => {
  const state = inferLeadQualification({
    userMessages: [
      "quero comprar um componente",
      "meu nome e Rafael Almeida, rafa@empresa.com, 11 94533-6226",
    ],
    lastUserMessage: "meu nome e Rafael Almeida, rafa@empresa.com, 11 94533-6226",
    conversationText: "quero comprar um componente meu nome e Rafael Almeida, rafa@empresa.com, 11 94533-6226",
  });

  const reply = buildPostCaptureReply({
    state,
    interest: "Geral",
  });

  if (!reply?.includes("Já anotei seu nome, email e telefone")) {
    throw new Error(`Resposta pos-captura inesperada: ${reply}`);
  }
});

Deno.test("extrai email, telefone e nome com texto livre", () => {
  const contact = extractContact("Meu nome é Rafael Almeida. Email rafa@empresa.com e WhatsApp +55 11 94533-6226.");

  if (contact.name !== "Rafael Almeida") {
    throw new Error(`Nome inesperado: ${contact.name}`);
  }

  if (contact.email !== "rafa@empresa.com") {
    throw new Error(`Email inesperado: ${contact.email}`);
  }

  if (contact.phone !== "5511945336226") {
    throw new Error(`Telefone inesperado: ${contact.phone}`);
  }
});
