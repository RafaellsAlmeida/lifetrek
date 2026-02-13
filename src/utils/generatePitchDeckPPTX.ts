// @ts-nocheck
import pptxgen from "pptxgenjs";

// Brand colors
const BRAND_COLORS = {
  primary: "003A5D",
  accent: "1E6F50",
  accentOrange: "EF7737",
  white: "FFFFFF",
  dark: "1A1A1A",
  muted: "6B7280",
  background: "F8FAFC"
};

interface SlideData {
  title: string;
  subtitle?: string;
  content?: string[];
  items?: { title: string; desc: string }[];
  quote?: string;
  type: "cover" | "content" | "grid" | "quote" | "clients" | "cta";
}

const slidesData: SlideData[] = [
  {
    type: "cover",
    title: "Lifetrek Medical",
    subtitle: "Manufatura Contratada ISO 13485 para Implantes e Instrumentos Cirúrgicos",
    content: ["Do CAD ao componente embalado em sala limpa, com qualidade zero-defeito e rastreabilidade regulatória completa."]
  },
  {
    type: "content",
    title: "Para Quem Fabricamos",
    subtitle: "Parceiros que não podem comprometer a vida dos seus pacientes",
    items: [
      { title: "OEMs de Implantes Ortopédicos", desc: "Trauma, coluna, extremidades superiores e inferiores" },
      { title: "Fabricantes de Dispositivos Dentais", desc: "Implantes, instrumentos e componentes protéticos" },
      { title: "Empresas de Implantes Veterinários", desc: "Dispositivos ortopédicos para animais de grande e pequeno porte" },
      { title: "Hospitais e Sistemas de Saúde", desc: "Instrumentos cirúrgicos customizados e ferramentas específicas" },
      { title: "Parceiros OEM / Contract Manufacturing", desc: "Empresas que precisam de capacidade de manufatura certificada ISO 13485" }
    ],
    quote: "Se seu produto entra em um corpo humano ou animal, nós fabricamos como se nossa própria vida dependesse disso."
  },
  {
    type: "grid",
    title: "O Problema",
    subtitle: "Desafios comuns na manufatura de dispositivos médicos",
    items: [
      { title: "Qualidade Inconsistente", desc: "Tolerâncias que variam entre lotes, causando recalls e custos ocultos de retrabalho." },
      { title: "Documentação Fraca", desc: "Falta de rastreabilidade lote-a-lote e registros auditáveis para reguladores." },
      { title: "Atrasos em Lançamentos", desc: "Lead times imprevisíveis que atrasam estudos clínicos e aprovações de mercado." },
      { title: "Riscos de Contaminação", desc: "Oficinas sem ambiente controlado que comprometem a esterilidade do produto final." },
      { title: "Fornecedores sem ISO 13485", desc: "Parceiros que não entendem requisitos médicos e não têm sistemas de qualidade certificados." },
      { title: "Um Lote Ruim = Dano Permanente", desc: "Reputação destruída, confiança de médicos perdida e processos legais custosos." }
    ]
  },
  {
    type: "content",
    title: "Nossa Promessa",
    subtitle: "Lifetrek Medical = Manufatura \"sem surpresas\"",
    items: [
      { title: "Foco Exclusivo Médico", desc: "30+ anos exclusivamente em implantes e instrumentos cirúrgicos. Não fazemos automotive, aerospace ou consumer. Apenas medical." },
      { title: "QMS Certificado", desc: "ISO 13485:2016 completo, com auditorias anuais. Sistemas de qualidade que funcionam de verdade." },
      { title: "Mentalidade Zero-Defeito", desc: "CMM ZEISS 3D, inspeção óptica automatizada, análise de dureza e rugosidade. Medimos tudo, documentamos tudo." },
      { title: "Pronto Para Auditoria", desc: "Rastreabilidade completa desde matéria-prima até embalagem final. Seus auditores vão adorar nossos arquivos." }
    ]
  },
  {
    type: "grid",
    title: "O Que Fazemos",
    items: [
      { title: "Implantes Ortopédicos", desc: "Placas e parafusos de trauma, sistemas de fusão espinhal, implantes de membros superiores/inferiores, fixação craniana." },
      { title: "Instrumentos Cirúrgicos", desc: "Brocas, fresas, alargadores, guides de perfuração, instrumentais para cirurgias complexas e ferramentas customizadas." },
      { title: "Dispositivos Dentais", desc: "Implantes dentários, pilares protéticos, componentes para sistemas de fixação e instrumentos específicos." },
      { title: "Implantes Veterinários", desc: "Dispositivos ortopédicos para animais de grande e pequeno porte, placas, parafusos e sistemas de fixação veterinários." }
    ]
  },
  {
    type: "content",
    title: "Como Fazemos",
    subtitle: "Do desenho a componentes sterile-ready em 6 etapas controladas",
    items: [
      { title: "1. Engenharia de Valor", desc: "Revisão DFM, otimização para manufaturabilidade, seleção de materiais" },
      { title: "2. Programação CAM", desc: "Estratégias de usinagem, simulação de colisão, validação de ferramentas" },
      { title: "3. Usinagem de Precisão", desc: "Swiss-type, 5-axis, multi-tasking com controle SPC em tempo real" },
      { title: "4. Acabamento de Superfície", desc: "Eletropolimento, passivação, anodização, laser marking" },
      { title: "5. Inspeção e Metrologia", desc: "CMM 3D, óptica automatizada, testes de dureza e rugosidade" },
      { title: "6. Embalagem Sterile-Ready", desc: "Sala limpa ISO 8, embalagem validada, rotulagem rastreável" }
    ]
  },
  {
    type: "grid",
    title: "Equipamentos de Manufatura",
    subtitle: "Tecnologia de ponta para precisão micrométrica",
    items: [
      { title: "Citizen L20", desc: "Swiss-type CNC para peças de alta precisão até Ø20mm" },
      { title: "Citizen M32", desc: "Multi-tasking para geometrias complexas até Ø32mm" },
      { title: "Doosan Lynx", desc: "Torneamento CNC de alta velocidade e rigidez" },
      { title: "FANUC Robodrill", desc: "Centro de usinagem 5-axis para instrumentos e componentes" }
    ]
  },
  {
    type: "grid",
    title: "Laboratório de Metrologia",
    subtitle: "Precisão certificada em cada medição",
    items: [
      { title: "ZEISS Contura CMM", desc: "Máquina de medição por coordenadas 3D com precisão micrométrica" },
      { title: "Inspeção Óptica CNC", desc: "Sistema automatizado de medição óptica para controle dimensional" },
      { title: "Análise de Rugosidade", desc: "Perfilômetros para caracterização de superfície Ra, Rz, Rmax" },
      { title: "Dureza e Metalografia", desc: "Testes Rockwell, Vickers e análise microestrutural" }
    ]
  },
  {
    type: "content",
    title: "Cleanrooms ISO 8",
    subtitle: "Ambiente controlado para embalagem sterile-ready",
    items: [
      { title: "Classificação ISO 8", desc: "Ambiente com controle de partículas, temperatura e umidade" },
      { title: "Fluxo Laminar", desc: "Estações de trabalho com ar filtrado HEPA para operações críticas" },
      { title: "Embalagem Validada", desc: "Processos de selagem validados para esterilização terminal" },
      { title: "Rastreabilidade Total", desc: "Cada componente rastreável desde matéria-prima até embalagem final" }
    ]
  },
  {
    type: "clients",
    title: "Nossos Clientes",
    subtitle: "Parceiros que confiam em nossa qualidade",
    content: [
      "CPMH", "Evolve", "FGM", "GMI", "HCS", "Impol", "Implanfix", "IOL",
      "Plenum", "Neoortho", "OBL Dental", "Orthometric", "Óssea",
      "Traumec", "Razek", "React", "Russer", "TechImport", "Toride", "Ultradent", "Vincula"
    ]
  },
  {
    type: "content",
    title: "Piloto de Baixo Risco",
    subtitle: "Comece pequeno, escale com confiança",
    items: [
      { title: "Lote Piloto", desc: "10-50 peças para validação de processo e aprovação de amostras" },
      { title: "Documentação Completa", desc: "PPAP, FAI, certificados de material e relatórios dimensionais" },
      { title: "Feedback Rápido", desc: "Iterações ágeis para otimização de design e processo" },
      { title: "Transição Suave", desc: "Escalada para produção sem requalificação de processo" }
    ]
  },
  {
    type: "cta",
    title: "Próximos Passos",
    subtitle: "Vamos conversar sobre seu projeto",
    items: [
      { title: "1. Reunião Técnica", desc: "Discussão de requisitos, volumes e cronograma" },
      { title: "2. Cotação Detalhada", desc: "Proposta com breakdown de custos e lead times" },
      { title: "3. Lote Piloto", desc: "Validação de processo com peças reais" },
      { title: "4. Produção", desc: "Fornecimento contínuo com qualidade garantida" }
    ],
    content: [
      "vmartin@lifetrek-medical.com",
      "+55 (47) 3333-0000",
      "www.lifetrek-medical.com"
    ]
  }
];

export const generatePitchDeckPPTX = async () => {
  const pres = new pptxgen();
  
  // Set presentation properties
  pres.author = "Lifetrek Medical";
  pres.title = "Lifetrek Medical - Sales Pitch Deck";
  pres.subject = "Manufatura Contratada ISO 13485";
  pres.company = "Lifetrek Medical";
  
  // Define master slide layouts
  pres.defineSlideMaster({
    title: "LIFETREK_MASTER",
    background: { color: BRAND_COLORS.background },
    objects: [
      { rect: { x: 0, y: 0, w: "100%", h: 0.1, fill: { color: BRAND_COLORS.primary } } },
      { text: { text: "Lifetrek Medical", options: { x: 0.5, y: 7.2, w: 3, h: 0.3, fontSize: 10, color: BRAND_COLORS.muted } } }
    ]
  });

  // Generate each slide
  slidesData.forEach((slideData, index) => {
    const slide = pres.addSlide({ masterName: index === 0 ? undefined : "LIFETREK_MASTER" });
    
    if (slideData.type === "cover") {
      // Cover slide with gradient background
      slide.background = { color: BRAND_COLORS.primary };
      
      slide.addText(slideData.title, {
        x: 0.5,
        y: 2.5,
        w: 9,
        h: 1.2,
        fontSize: 54,
        fontFace: "Arial",
        bold: true,
        color: BRAND_COLORS.white,
        align: "center"
      });
      
      if (slideData.subtitle) {
        slide.addText(slideData.subtitle, {
          x: 0.5,
          y: 3.8,
          w: 9,
          h: 0.8,
          fontSize: 24,
          fontFace: "Arial",
          color: BRAND_COLORS.white,
          align: "center"
        });
      }
      
      if (slideData.content?.[0]) {
        slide.addText(slideData.content[0], {
          x: 1,
          y: 4.8,
          w: 8,
          h: 0.6,
          fontSize: 14,
          fontFace: "Arial",
          color: BRAND_COLORS.white,
          align: "center"
        });
      }
      
      // Add accent line
      slide.addShape(pres.ShapeType.rect, {
        x: 3.5,
        y: 5.8,
        w: 3,
        h: 0.05,
        fill: { color: BRAND_COLORS.accentOrange }
      });
      
    } else if (slideData.type === "content" || slideData.type === "grid") {
      // Title
      slide.addText(slideData.title, {
        x: 0.5,
        y: 0.4,
        w: 9,
        h: 0.8,
        fontSize: 36,
        fontFace: "Arial",
        bold: true,
        color: BRAND_COLORS.primary
      });
      
      // Accent line under title
      slide.addShape(pres.ShapeType.rect, {
        x: 0.5,
        y: 1.1,
        w: 2,
        h: 0.04,
        fill: { color: BRAND_COLORS.accentOrange }
      });
      
      // Subtitle
      if (slideData.subtitle) {
        slide.addText(slideData.subtitle, {
          x: 0.5,
          y: 1.2,
          w: 9,
          h: 0.5,
          fontSize: 16,
          fontFace: "Arial",
          color: BRAND_COLORS.muted
        });
      }
      
      // Items
      if (slideData.items) {
        const startY = slideData.subtitle ? 1.9 : 1.5;
        const isGrid = slideData.type === "grid";
        const cols = isGrid ? 2 : 1;
        const itemsPerCol = Math.ceil(slideData.items.length / cols);
        
        slideData.items.forEach((item, i) => {
          const col = isGrid ? Math.floor(i / itemsPerCol) : 0;
          const row = isGrid ? i % itemsPerCol : i;
          const x = 0.5 + (col * 4.8);
          const y = startY + (row * (isGrid ? 1.4 : 0.9));
          const w = isGrid ? 4.3 : 9;
          
          slide.addText(item.title, {
            x,
            y,
            w,
            h: 0.4,
            fontSize: 14,
            fontFace: "Arial",
            bold: true,
            color: BRAND_COLORS.dark
          });
          
          slide.addText(item.desc, {
            x,
            y: y + 0.35,
            w,
            h: 0.5,
            fontSize: 11,
            fontFace: "Arial",
            color: BRAND_COLORS.muted
          });
        });
      }
      
      // Quote
      if (slideData.quote) {
        slide.addShape(pres.ShapeType.rect, {
          x: 0.5,
          y: 6.2,
          w: 9,
          h: 0.8,
          fill: { color: BRAND_COLORS.primary },
          line: { color: BRAND_COLORS.accentOrange, width: 2, dashType: "solid" }
        });
        
        slide.addText(`"${slideData.quote}"`, {
          x: 0.7,
          y: 6.3,
          w: 8.6,
          h: 0.6,
          fontSize: 12,
          fontFace: "Arial",
          italic: true,
          color: BRAND_COLORS.white,
          align: "center"
        });
      }
      
    } else if (slideData.type === "clients") {
      // Title
      slide.addText(slideData.title, {
        x: 0.5,
        y: 0.4,
        w: 9,
        h: 0.8,
        fontSize: 36,
        fontFace: "Arial",
        bold: true,
        color: BRAND_COLORS.primary
      });
      
      slide.addShape(pres.ShapeType.rect, {
        x: 0.5,
        y: 1.1,
        w: 2,
        h: 0.04,
        fill: { color: BRAND_COLORS.accentOrange }
      });
      
      if (slideData.subtitle) {
        slide.addText(slideData.subtitle, {
          x: 0.5,
          y: 1.2,
          w: 9,
          h: 0.5,
          fontSize: 16,
          fontFace: "Arial",
          color: BRAND_COLORS.muted
        });
      }
      
      // Client names in grid
      if (slideData.content) {
        const clients = slideData.content;
        const cols = 4;
        clients.forEach((client, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          slide.addText(client, {
            x: 0.5 + (col * 2.4),
            y: 2 + (row * 0.7),
            w: 2.2,
            h: 0.5,
            fontSize: 12,
            fontFace: "Arial",
            color: BRAND_COLORS.dark,
            align: "center",
            fill: { color: "FFFFFF" },
            line: { color: BRAND_COLORS.primary, width: 0.5 }
          });
        });
      }
      
    } else if (slideData.type === "cta") {
      slide.background = { color: BRAND_COLORS.primary };
      
      slide.addText(slideData.title, {
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 0.8,
        fontSize: 36,
        fontFace: "Arial",
        bold: true,
        color: BRAND_COLORS.white
      });
      
      slide.addShape(pres.ShapeType.rect, {
        x: 0.5,
        y: 1.2,
        w: 2,
        h: 0.04,
        fill: { color: BRAND_COLORS.accentOrange }
      });
      
      if (slideData.subtitle) {
        slide.addText(slideData.subtitle, {
          x: 0.5,
          y: 1.4,
          w: 9,
          h: 0.5,
          fontSize: 18,
          fontFace: "Arial",
          color: BRAND_COLORS.white
        });
      }
      
      // Steps
      if (slideData.items) {
        slideData.items.forEach((item, i) => {
          const y = 2.2 + (i * 1.1);
          slide.addText(item.title, {
            x: 0.5,
            y,
            w: 9,
            h: 0.4,
            fontSize: 16,
            fontFace: "Arial",
            bold: true,
            color: BRAND_COLORS.white
          });
          slide.addText(item.desc, {
            x: 0.5,
            y: y + 0.4,
            w: 9,
            h: 0.4,
            fontSize: 12,
            fontFace: "Arial",
            color: BRAND_COLORS.white
          });
        });
      }
      
      // Contact info
      if (slideData.content) {
        slideData.content.forEach((line, i) => {
          slide.addText(line, {
            x: 0.5,
            y: 6.5 + (i * 0.35),
            w: 9,
            h: 0.3,
            fontSize: 12,
            fontFace: "Arial",
            color: BRAND_COLORS.accentOrange,
            align: "center"
          });
        });
      }
    }
  });

  // Download the file
  await pres.writeFile({ fileName: "Lifetrek_Medical_Pitch_Deck.pptx" });
};
