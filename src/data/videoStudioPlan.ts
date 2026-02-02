export type VideoScene = {
  id: string;
  label: string;
  kind: "broll" | "image" | "solid";
  durationSeconds: number;
  asset: string;
  notes: string;
  fallbackAsset?: string;
  optional?: boolean;
  altAssets?: string[];
  onScreen?: string;
  // For solid background scenes (carousels, stats)
  backgroundColor?: string;
  overlayImages?: string[];
};

export type VideoPrompt = {
  id: string;
  label: string;
  durationSeconds: number;
  prompt: string;
};

export const videoStudioPlan = {
  title: "Master Showcase Lifetrek - Storytelling Version",
  headline:
    "Cada micrômetro importa. Engenharia de precisão que protege vidas.",
  linkedinLine:
    "Um desvio mínimo pode significar uma cirurgia de revisão. Por isso há mais de 30 anos transformamos precisão em segurança para implantes e instrumentais.",
  language: "pt-BR",
  targetDurationSeconds: 89,
  tone: "storytelling, patient-focused, technical proof, professional",
  script:
    "Do lado de fora, parece apenas uma fábrica.\n" +
    "Mas aqui dentro, cada micrômetro importa.\n" +
    "Um desvio mínimo pode comprometer uma cirurgia.\n\n" +
    "Há mais de 30 anos, a Lifetrek Medical transforma engenharia de precisão em segurança para implantes usados no mundo todo.\n\n" +
    "Somos ISO 13485 e ANVISA.\n" +
    "Isso significa rastreabilidade total e controle rigoroso em cada lote que sai das nossas salas limpas.\n\n" +
    "Em células CNC avançadas, usinamos titânio e PEEK com tolerância de mícron.\n" +
    "Implantes e instrumentais feitos para resistir.\n\n" +
    "Nossa metrologia não só confere a peça.\n" +
    "Ela documenta cada dimensão crítica para seus registros regulatórios.\n\n" +
    "Da matéria-prima à embalagem estéril, reduzimos seu risco e seu lead time.\n\n" +
    "Não somos apenas fornecedores.\n" +
    "Trabalhamos com seu P&D para validar processos e acelerar lançamentos.\n\n" +
    "Lifetrek Medical.\n" +
    "Precisão e parceria para quem impacta vidas.\n" +
    "Fale conosco e vamos criar o futuro da saúde.",

  // Scenes aligned with storytelling voiceover (~85 seconds total)
  scenes: [
    // CENA 1 - Drone / Vista aérea (8s)
    // VO: "Do lado de fora, parece apenas mais uma fábrica..."
    {
      id: "scene-1a-drone",
      label: "Vista aérea - Abertura",
      kind: "broll",
      durationSeconds: 5,
      asset: "/remotion/broll/broll-01-drone-rise.mp4",
      notes: "Abertura com drone subindo, estabelece escala. Texto: risco do desvio.",
      onScreen: "Cada micrômetro importa",
    },
    {
      id: "scene-1b-facade",
      label: "Aproximação fachada",
      kind: "broll",
      durationSeconds: 3,
      asset: "/remotion/broll/broll-02-facade-push.mp4",
      notes: "Push-in na fachada. Transição de 'fábrica comum' para interior.",
    },

    // CENA 2 - Recepção / Logo (6s)
    // VO: "Há mais de 30 anos, a Lifetrek Medical transforma..."
    {
      id: "scene-2-reception",
      label: "Recepção e marca",
      kind: "image",
      durationSeconds: 4,
      asset: "/src/assets/facility/reception-hero.webp",
      notes: "Interior premium, logo visível. Prova de permanência.",
      onScreen: "30+ anos transformando precisão em segurança",
    },
    {
      id: "scene-2b-stats",
      label: "Stats - Prova social",
      kind: "solid",
      durationSeconds: 3,
      asset: "",
      backgroundColor: "#004F8F",
      notes: "Fundo sólido azul corporativo com stats animados.",
      onScreen: "30+ anos • 30+ clientes • 100% comprometimento",
    },

    // CENA 3 - Salas limpas (8s) - Premium cleanroom carousel
    // VO: "Somos certificados ISO 13485 e aprovados pela ANVISA..."
    {
      id: "scene-3a-cleanroom-carousel",
      label: "Salas limpas - Carrossel",
      kind: "solid",
      durationSeconds: 5,
      asset: "",
      backgroundColor: "#0a0d12",
      notes: "Carrossel de 3 imagens de sala limpa premium com Ken Burns suave.",
      overlayImages: [
        "/src/assets/facility/cleanroom-wide.png",
        "/src/assets/facility/cleanroom-corridor.png",
        "/src/assets/facility/cleanroom-entrance.png",
      ],
      onScreen: "ISO 13485 • ANVISA",
    },
    {
      id: "scene-3b-cleanroom-detail",
      label: "Sala limpa - Corredor",
      kind: "image",
      durationSeconds: 3,
      asset: "/src/assets/facility/cleanroom-corridor.png",
      notes: "Vista do corredor com mesas de inox e janelas de inspeção.",
      onScreen: "Rastreabilidade • Controle • Consistência",
    },

    // CENA 4 - CNC / Máquinas (10s)
    // VO: "Em células CNC de última geração, usinamos titânio..."
    {
      id: "scene-4a-cnc-action",
      label: "CNC em operação",
      kind: "broll",
      durationSeconds: 4,
      asset: "/remotion/broll/broll-04-cnc.mp4",
      notes: "Macro de usinagem, coolant, precisão em ação.",
      fallbackAsset: "/src/assets/equipment/citizen-l32.webp",
    },
    {
      id: "scene-4b-machines-carousel",
      label: "Carrossel de máquinas",
      kind: "solid",
      durationSeconds: 6,
      asset: "",
      backgroundColor: "#0a1628",
      notes: "Fundo escuro premium. Carrossel rápido: Citizen, Tornos, Doosan, Robodrill, Walter, Zeiss. 1s cada.",
      overlayImages: [
        "/src/assets/equipment/citizen-new.png",
        "/src/assets/equipment/citizen-l20-new.png",
        "/src/assets/equipment/tornos-gt26.webp",
        "/src/assets/equipment/doosan-new.png",
        "/src/assets/equipment/robodrill.webp",
        "/src/assets/equipment/walter.webp",
      ],
      onScreen: "Tecnologia CNC de última geração",
    },

    // CENA 5 - Metrologia (8s)
    // VO: "Nossa metrologia avançada não 'confere' a peça..."
    {
      id: "scene-5a-metrology-action",
      label: "Metrologia em ação",
      kind: "broll",
      durationSeconds: 4,
      asset: "/remotion/broll/broll-05-metrology.mp4",
      notes: "CMM escaneando, precisão documentada.",
      fallbackAsset: "/src/assets/metrology/zeiss-contura-new.png",
    },
    {
      id: "scene-5b-metrology-detail",
      label: "Lab de metrologia",
      kind: "image",
      durationSeconds: 2,
      asset: "/src/assets/metrology/lab-overview.webp",
      notes: "Visão geral do laboratório.",
      onScreen: "Cada dimensão crítica documentada",
    },
    {
      id: "scene-5c-laser",
      label: "Marcação laser UDI",
      kind: "broll",
      durationSeconds: 3,
      asset: "/remotion/broll/broll-07-laser.mp4",
      notes: "Laser marking para rastreabilidade permanente.",
      fallbackAsset: "/src/assets/equipment/laser-marking.webp",
    },

    // CENA 6 - Produtos (10s)
    // VO: "Da barra de material à embalagem em sala limpa ISO 7..."
    {
      id: "scene-6a-surgical",
      label: "Instrumentais cirúrgicos",
      kind: "image",
      durationSeconds: 3,
      asset: "/src/assets/products/surgical-instruments-new.webp",
      notes: "Instrumentais premium, qualidade clínica.",
    },
    {
      id: "scene-6b-orthopedic",
      label: "Implantes ortopédicos",
      kind: "image",
      durationSeconds: 2.5,
      asset: "/src/assets/products/orthopedic-screws-optimized.webp",
      notes: "Parafusos pediculares, precisão visível.",
      onScreen: "Milhões de ciclos de carga",
    },
    {
      id: "scene-6c-spinal",
      label: "Sistemas espinhais",
      kind: "image",
      durationSeconds: 2.5,
      asset: "/src/assets/products/spinal-implants-optimized.webp",
      notes: "Cages e sistemas espinhais.",
    },
    {
      id: "scene-6d-electropolish",
      label: "Eletropolimento",
      kind: "broll",
      durationSeconds: 3,
      asset: "/remotion/broll/broll-06-electropolish.mp4",
      notes: "Linha de eletropolimento, acabamento médico.",
      fallbackAsset: "/src/assets/equipment/electropolish-line-new.png",
      onScreen: "Acabamento para implantes",
    },

    // CENA 7 - Parceria / Clientes (6s)
    // VO: "Por isso, não nos vemos como simples fornecedores..."
    {
      id: "scene-7a-partnership",
      label: "Parceria técnica",
      kind: "image",
      durationSeconds: 3,
      asset: "/src/assets/facility/reception-hero.webp",
      notes: "Ambiente profissional, parceria visual.",
      onScreen: "Junto com seu P&D e Qualidade",
    },
    {
      id: "scene-7b-clients",
      label: "Clientes - Logo parade",
      kind: "solid",
      durationSeconds: 4,
      asset: "",
      backgroundColor: "#ffffff",
      notes: "Fundo branco clean. Logos dos clientes em grid ou scroll.",
      onScreen: "Parceiros que confiam",
    },

    // CENA 8 - Fechamento (9s)
    // VO: "Lifetrek Medical. Precisão, qualidade e parceria..."
    {
      id: "scene-8a-certifications",
      label: "Certificações",
      kind: "image",
      durationSeconds: 3,
      asset: "/src/assets/facility/cleanroom-hero.webp",
      notes: "Background cleanroom com badges ISO + ANVISA overlay.",
      onScreen: "ISO 13485 • ANVISA",
    },
    {
      id: "scene-8b-exterior-closing",
      label: "Fechamento - Fachada",
      kind: "image",
      durationSeconds: 4,
      asset: "/src/assets/facility/exterior-hero.webp",
      notes: "Vista exterior, CTA final.",
      onScreen: "Vamos desenhar o próximo avanço juntos",
    },
    {
      id: "scene-8c-logo-final",
      label: "Logo final",
      kind: "solid",
      durationSeconds: 3,
      asset: "",
      backgroundColor: "#004F8F",
      notes: "Fundo azul corporativo, logo grande, tagline.",
      onScreen: "Lifetrek Medical • Precisão que protege vidas",
    },
  ],

  // VEO/Runway prompts for B-roll generation
  veoPrompts: [
    {
      id: "veo-drone",
      label: "Drone panoramico",
      durationSeconds: 6,
      prompt:
        "Slow cinematic drone approach to a modern medical manufacturing facility at sunrise, clean industrial campus, soft morning haze, subtle blue tone, ultra-clean, no logos, no text, no people.",
    },
    {
      id: "veo-facade",
      label: "Fachada com push-in",
      durationSeconds: 6,
      prompt:
        "Smooth gimbal push-in toward a modern factory entrance, glass and metal architecture, minimal signage (no readable text), clean and premium look, soft blue-gray color grade.",
    },
    {
      id: "veo-cleanroom",
      label: "Corredor de sala limpa",
      durationSeconds: 6,
      prompt:
        "Slow dolly shot through a bright ISO cleanroom corridor, technicians in white PPE suits and masks, stainless surfaces, soft clinical lighting, sterile and precise, no brand logos.",
    },
    {
      id: "veo-cnc",
      label: "CNC macro",
      durationSeconds: 6,
      prompt:
        "Macro close-up of a CNC machine machining a small titanium medical component, precision movement, coolant mist, no sparks, ultra clean environment, premium lighting.",
    },
    {
      id: "veo-metrology",
      label: "Metrologia",
      durationSeconds: 6,
      prompt:
        "Close-up of a coordinate measuring machine (CMM) scanning a metal component in a metrology lab, blue indicator lights, precise robotic motion, clinical, clean.",
    },
    {
      id: "veo-electropolish",
      label: "Eletropolimento",
      durationSeconds: 6,
      prompt:
        "Medical-grade electropolishing line with stainless steel tanks, parts being lowered into solution, soft highlights reflecting on polished surfaces, cleanroom adjacent, no visible brand text.",
    },
  ],
};
