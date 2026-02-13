export interface OutreachTemplate {
  linkedin_intro: string;
  linkedin_followup: string;
  email_outreach: string;
}

export interface TemplatesData {
  orthopedic: OutreachTemplate;
  dental: OutreachTemplate;
  veterinary: OutreachTemplate;
  hospital: OutreachTemplate;
  oem: OutreachTemplate;
}

export const TEMPLATES_DATA: TemplatesData = {
  orthopedic: {
    linkedin_intro: `Olá [Nome],

Vi que a [Empresa] fabrica dispositivos ortopédicos aqui no Brasil.

Somos parceiros de manufatura para fabricantes que querem internalizar componentes críticos — usinagem suíça (Citizen), metrologia Zeiss, sala limpa ISO 7.

A ideia não é substituir sua operação, mas complementar com etapas específicas enquanto você mantém controle total do registro ANVISA.

Faz sentido trocar uma ideia?`,
    linkedin_followup: `[Nome],

Só para contextualizar: atendemos fabricantes com planta no Brasil que querem reduzir dependência de importação em componentes críticos.

Nossa fábrica em Indaiatuba tem ISO 13485 e entregamos protótipos em 10 dias.

Se a [Empresa] tem interesse em internalizar algum SKU, posso enviar nosso roteiro de 90 dias?`,
    email_outreach: `Assunto: Parceria de Manufatura para Componentes Críticos - [Empresa]

Olá [Nome],

Fabricantes de dispositivos ortopédicos com planta no Brasil frequentemente enfrentam um dilema: depender de importação com lead time de 90+ dias ou investir em capacidade interna para cada componente.

Na Lifetrek Medical, oferecemos uma terceira via: parceria de manufatura para etapas específicas, onde você mantém controle total do registro ANVISA.

Nossa capacidade inclui:
- Tornos Suíços Citizen (L20/M32) para geometrias complexas
- Metrologia 100% automatizada (Zeiss Contura)
- Acabamento interno (eletropolimento, passivação, marcação a laser)
- Sala limpa ISO 7 para montagem de kits

Gostaria de agendar 15 minutos para entender se há fit com algum SKU crítico da [Empresa]?

Atenciosamente,`
  },
  dental: {
    linkedin_intro: `Olá [Nome],

Vi seu trabalho na [Empresa] com implantes dentários.

Na Lifetrek, fabricamos componentes de titânio com tolerâncias de 5 mícrons usando tecnologia suíça.

Teria interesse em conhecer nossa capacidade para abutments e parafusos?`,
    linkedin_followup: `[Nome],

Apenas um follow-up: nossa capacidade produtiva inclui acabamento superficial Ra < 0.1 e limpeza em sala limpa ISO 7.

Podemos agendar uma breve conversa?`,
    email_outreach: `Assunto: Precisão Suíça para Implantes - [Empresa]

Olá [Nome],

A precisão na conexão hex é crítica para a longevidade do implante.

Na Lifetrek, garantimos essa precisão com:
- Tornos Citizen de última geração.
- Controle de qualidade Zeiss.
- Rastreabilidade total de lote.

Temos capacidade aberta para novos projetos de implantes e componentes protéticos.

Podemos conversar na próxima terça-feira?`
  },
  veterinary: {
    linkedin_intro: `Olá [Nome],

Vi que a [Empresa] está inovando em ortopedia veterinária.

Fabricamos placas TPLO e parafusos com a mesma qualidade humana (ISO 13485), mas com custos competitivos no Brasil.

Faz sentido conectar?`,
    linkedin_followup: `[Nome],

Apenas lembrando: temos flexibilidade para lotes menores, ideais para o mercado veterinário.

Gostaria de enviar nosso book de equipamentos.`,
    email_outreach: `Assunto: Manufatura de Placas TPLO e Implantes - [Empresa]

Olá [Nome],

O mercado veterinário exige qualidade humana com custos viáveis.

Na Lifetrek, oferecemos:
- Placas e parafusos em Titânio/Inox.
- Usinagem de alta precisão.
- Agilidade na entrega (fábrica em SP).

Gostaria de comparar nossos custos com seus fornecedores atuais?`
  },
  hospital: {
    linkedin_intro: `Olá [Nome],

Vi que você coordena compras em [Hospital/Empresa].

Fornecemos instrumentais cirúrgicos e componentes de dispositivos médicos para hospitais brasileiros, com certificação ANVISA.

Posso enviar nosso catálogo de capacidades?`,
    linkedin_followup: `[Nome],

Seguindo: temos experiência com contratos de fornecimento contínuo e rastreabilidade completa por lote.

Faz sentido agendar uma conversa breve?`,
    email_outreach: `Assunto: Fornecimento Local de Instrumentais - [Hospital]

Olá [Nome],

A dependência de importação pode impactar prazos e custos em compras hospitalares.

Na Lifetrek Medical, fabricamos:
- Instrumentais cirúrgicos em inox e titânio.
- Componentes para equipamentos médicos.
- Peças de reposição com agilidade.

Gostaria de conhecer nossas condições de fornecimento?

Atenciosamente,`
  },
  oem: {
    linkedin_intro: `Olá [Nome],

Vi que a [Empresa] desenvolve e fabrica dispositivos médicos no Brasil.

Na Lifetrek, somos parceiros de manufatura para OEMs que querem terceirizar etapas específicas (usinagem, acabamento, montagem) mantendo controle total do registro ANVISA.

Faz sentido conversarmos sobre como podemos complementar sua operação?`,
    linkedin_followup: `[Nome],

Só para esclarecer nosso modelo: atendemos fabricantes com planta no Brasil que precisam de capacidade adicional ou especializada.

Você mantém o registro, nós executamos as etapas acordadas com rastreabilidade total.

Posso enviar nosso roteiro de 90 dias para internalização de SKUs?`,
    email_outreach: `Assunto: Parceria de Manufatura para Componentes - [Empresa]

Olá [Nome],

Fabricantes de dispositivos médicos com operação no Brasil frequentemente precisam de parceiros especializados para etapas específicas do processo produtivo.

Na Lifetrek, oferecemos:
- Usinagem de precisão (CNC suíço Citizen)
- Metrologia avançada (CMM Zeiss)
- Acabamento (eletropolimento, passivação, marcação a laser)
- Montagem em sala limpa ISO 7
- Prototipagem rápida (10 dias)

Importante: trabalhamos como extensão da sua fábrica. Você mantém controle total do registro ANVISA e do processo produtivo.

Gostaria de explorar se há fit para algum componente crítico?

Atenciosamente,`
  }
};

export type SegmentKey = keyof typeof TEMPLATES_DATA;

export const SEGMENT_LABELS: Record<SegmentKey, string> = {
  orthopedic: "Ortopedia",
  dental: "Odontologia",
  veterinary: "Veterinária",
  hospital: "Hospitalar",
  oem: "OEM / Fabricante",
};