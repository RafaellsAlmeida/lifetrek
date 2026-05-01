/**
 * Build the May 2026 LinkedIn test deliverables.
 *
 * The script renders 1080x1350 social-ready PNGs from approved Lifetrek
 * workspace assets and writes one folder per post under "May content".
 */

import satori from "npm:satori@0.10.11";
import { Resvg } from "npm:@resvg/resvg-js@2.6.2";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const W = 1080;
const H = 1350;
const OUT_DIR = "May content";

const BRAND = {
  blue: "#004F8F",
  blueDark: "#002D52",
  green: "#1A7A3E",
  orange: "#F07818",
  white: "#FFFFFF",
  textSoft: "rgba(255,255,255,0.82)",
  logo: "public/logo-transparent.png",
};

type Slide = {
  headline: string;
  body: string;
  label: string;
  background: string;
};

type Post = {
  postId: string;
  date: string;
  day: string;
  topic: string;
  topicGroup: "Operations / Capacity" | "Metrology / Validation";
  format: "Image" | "Carousel";
  visualTreatment: "plain_hyperreal_no_overlay" | "minimal_overlay_text";
  background: string;
  caption: string;
  slides?: Slide[];
};

type SatoriNode = Record<string, unknown>;

const posts: Post[] = [
  {
    postId: "2026-05-05-T1-image",
    date: "2026-05-05",
    day: "terca",
    topic: "Capacidade real em manufatura medica nao e numero de maquinas",
    topicGroup: "Operations / Capacity",
    format: "Image",
    visualTreatment: "plain_hyperreal_no_overlay",
    background: "src/assets/facility/production-overview.jpg",
    caption: `Capacidade não é máquina. É hora usinável vezes confiabilidade vezes setup vezes metrologia em fluxo.

OEM que homologa fornecedor pela lista de CNCs mede o indicador errado. O primeiro pico de demanda mostra outra coisa: setup, manutenção, fila de CMM e liberação de qualidade definem a capacidade efetiva.

Na Lifetrek, o parque Citizen L20/M32, Doosan Lynx, FANUC Robodrill e ZEISS Contura é tratado como fluxo integrado, não como vitrine de máquinas.

Para o OEM, isso muda a pergunta: não é quantos tornos existem, é quanto tempo confiável vira lote aprovado.

#ManufaturaMedica #ISO13485 #Metrologia #OEM

Capacidade real aparece no fluxo, não na planilha. ◆`,
  },
  {
    postId: "2026-05-07-T3-image",
    date: "2026-05-07",
    day: "quinta",
    topic: "Validacao de processo nao e inspecao final de peca",
    topicGroup: "Metrology / Validation",
    format: "Image",
    visualTreatment: "plain_hyperreal_no_overlay",
    background: "Stakeholder_Review_Assets/Quality/metrology-overview.png",
    caption: `Validação não é inspeção final. É IQ, OQ e PQ documentados antes do primeiro lote comercial sair.

Relatório dimensional do lote piloto aprova peças, mas não prova estabilidade de processo. Quando a auditoria olha protocolo, capabilidade e variabilidade entre operadores, inspeção final não fecha a lacuna antes de escalar.

A base segura é tratar validação como sistema: equipamento instalado, operação controlada, desempenho acompanhado e metrologia capaz de sustentar decisão técnica.

A Lifetrek ancora esse fluxo em ISO 13485, ANVISA e metrologia com ZEISS Contura.

#ValidacaoDeProcesso #ISO13485 #ANVISA #Metrologia

Validação aprova processo antes de aprovar volume. ◆`,
  },
  {
    postId: "2026-05-12-T2-carousel",
    date: "2026-05-12",
    day: "terca",
    topic: "O gargalo de producao medica raramente esta na usinagem",
    topicGroup: "Operations / Capacity",
    format: "Carousel",
    visualTreatment: "minimal_overlay_text",
    background: "src/assets/facility/production-floor.jpg",
    caption: `O gargalo nem sempre está na usinagem. Está em metrologia, embalagem, lote piloto ou ISO 13485.

A máquina nova pode aumentar CAPEX e ainda não mexer no prazo. Em manufatura médica, o fluxo para onde falta CMM, sala limpa, marcação UDI, aprovação documental ou liberação de qualidade.

Por isso, capacidade precisa ser modelada como cadeia, não como célula CNC isolada. O mapa só fica honesto quando metrologia e documentação entram no mesmo cronograma.

Na Lifetrek, sala limpa ISO Classe 7, ZEISS Contura e laser UDI fazem parte do mesmo fluxo operacional.

#ManufaturaMedica #LeadTime #ISO13485 #UDI

Gargalo é onde o lote para. ◆`,
    slides: [
      {
        label: "HOOK",
        headline: "O gargalo nem sempre está na usinagem",
        body: "Ele aparece onde o fluxo para.",
        background: "src/assets/facility/production-floor.jpg",
      },
      {
        label: "RISCO",
        headline: "CNC não resolve todo gargalo",
        body: "Metrologia, embalagem e liberação documental também consomem lead time.",
        background: "Stakeholder_Review_Assets/Quality/metrology-overview.png",
      },
      {
        label: "FALHA COMUM",
        headline: "Capacidade sem fila crítica vira ilusão",
        body: "CMM, sala limpa e aprovação de qualidade entram no cálculo do fluxo.",
        background: "Product Images/1767376335649-sala-limpa.png",
      },
      {
        label: "EVIDÊNCIA",
        headline: "O fluxo precisa ser integrado",
        body: "Sala limpa ISO Classe 7, ZEISS Contura e marcação UDI no mesmo mapa operacional.",
        background: "Stakeholder_Review_Assets/Manufacturing/laser-marking.png",
      },
      {
        label: "RESULTADO",
        headline: "Mapear fora do CNC muda o prazo",
        body: "O OEM vê o ponto de saturação antes de virar atraso. ◆",
        background: "src/assets/facility/production-overview.jpg",
      },
    ],
  },
  {
    postId: "2026-05-14-T4-carousel",
    date: "2026-05-14",
    day: "quinta",
    topic: "MSA antes de Cpk: por que sua tolerancia pode ser incerta",
    topicGroup: "Metrology / Validation",
    format: "Carousel",
    visualTreatment: "minimal_overlay_text",
    background: "Stakeholder_Review_Assets/Quality/zeiss-contura.webp",
    caption: `Sem MSA, sua tolerância é incerta. Cpk em sistema de medição não validado é número decorativo perigoso.

Cpk alto não salva uma medição fraca. Se o instrumento, o operador ou o método variam demais, parte dessa variação entra no cálculo como se fosse processo.

MSA existe para separar essas fontes antes que o OEM aprove um fornecedor com falsa precisão. Depois disso, a conversa sobre capabilidade fica defensável.

A Lifetrek apoia controle dimensional com ZEISS Contura e metrologia complementar para features críticas.

#MSA #Cpk #Metrologia #ISO13485

Tolerância sem sistema de medição validado é aposta técnica. ◆`,
    slides: [
      {
        label: "HOOK",
        headline: "Sem MSA, sua tolerância é incerta",
        body: "Cpk sem sistema de medição validado pode esconder variabilidade.",
        background: "Stakeholder_Review_Assets/Quality/zeiss-contura.webp",
      },
      {
        label: "RISCO",
        headline: "Cpk alto não basta",
        body: "Sem Gage R&R, o instrumento entra no número como se fosse processo.",
        background: "Stakeholder_Review_Assets/Quality/lab-overview.png",
      },
      {
        label: "FALHA COMUM",
        headline: "A variabilidade muda de lugar",
        body: "MSA separa peça, operador, método e equipamento de medição.",
        background: "Stakeholder_Review_Assets/Quality/olympus-display.png",
      },
      {
        label: "EVIDÊNCIA",
        headline: "ZEISS Contura entra no controle",
        body: "Metrologia 3D dá base para revisão dimensional e decisões de lote.",
        background: "Stakeholder_Review_Assets/Quality/metrology-overview.png",
      },
      {
        label: "RESULTADO",
        headline: "Aceitação precisa de confiança real",
        body: "Menos falsa precisão, mais decisão técnica defensável. ◆",
        background: "Stakeholder_Review_Assets/Quality/metrology-microscope.png",
      },
    ],
  },
  {
    postId: "2026-05-19-T1-carousel",
    date: "2026-05-19",
    day: "terca",
    topic: "Anatomia da capacidade real em manufatura medica",
    topicGroup: "Operations / Capacity",
    format: "Carousel",
    visualTreatment: "plain_hyperreal_no_overlay",
    background: "src/assets/facility/production-overview.jpg",
    caption: `Capacidade não é máquina. É hora usinável vezes confiabilidade vezes setup vezes metrologia em fluxo.

Contar tornos é simples. Prever lead time em manufatura médica exige olhar o que acontece entre troca de setup, manutenção, calibração, fila de CMM e liberação de qualidade.

Quando esses pontos ficam fora do cálculo, o OEM descobre tarde que o pedido dobrou, mas a capacidade real não dobrou junto.

A Lifetrek combina equipamentos Citizen, Doosan, FANUC e ZEISS Contura em um planejamento de fluxo, não em uma soma de máquinas.

#CapacidadeProdutiva #ManufaturaMedica #Metrologia #OEM

Capacidade efetiva é o tempo confiável que vira lote aprovado. ◆`,
    slides: [
      {
        label: "HOOK",
        headline: "Capacidade não é máquina",
        body: "É hora usinável x confiabilidade x setup x metrologia.",
        background: "src/assets/facility/production-overview.jpg",
      },
      {
        label: "RISCO",
        headline: "Contar tornos é insuficiente",
        body: "Lead time real depende das filas que cercam a usinagem.",
        background: "Stakeholder_Review_Assets/AI_Enhanced/1767378400699-torno-cnc-citizen-l20.png",
      },
      {
        label: "FALHA COMUM",
        headline: "Hora usinável é o recurso escasso",
        body: "Manutenção, troca, calibração e CMM reduzem a janela disponível.",
        background: "Stakeholder_Review_Assets/AI_Enhanced/1767378404770-torno-cnc-citizen-m32.png",
      },
      {
        label: "EVIDÊNCIA",
        headline: "O mix precisa operar em fluxo",
        body: "Citizen L20/M32, Doosan, FANUC e ZEISS Contura conectados no planejamento.",
        background: "Stakeholder_Review_Assets/AI_Enhanced/1767378405903-torno-cnc-doosan-lynx-2100w.png",
      },
      {
        label: "RESULTADO",
        headline: "Pedido maior não pode quebrar o prazo",
        body: "Capacidade real aparece antes do lote dobrar. ◆",
        background: "Stakeholder_Review_Assets/Quality/metrology-overview.png",
      },
    ],
  },
  {
    postId: "2026-05-21-T3-carousel",
    date: "2026-05-21",
    day: "quinta",
    topic: "IQ, OQ e PQ: o que o auditor pede que a inspecao nao cobre",
    topicGroup: "Metrology / Validation",
    format: "Carousel",
    visualTreatment: "minimal_overlay_text",
    background: "Stakeholder_Review_Assets/Quality/metrology-overview.png",
    caption: `Validação não é inspeção final. É IQ, OQ e PQ documentados antes do primeiro lote comercial sair.

O lote piloto costuma parecer suficiente porque tem relatório dimensional, peça aprovada e urgência comercial. Mas o auditor procura outra coisa: instalação, operação, desempenho, capabilidade e evidência de estabilidade antes da escala.

Inspeção 100% ainda pode deixar aberta a pergunta sobre variabilidade entre operadores e repetibilidade do sistema de medição.

A Lifetrek sustenta a discussão com ISO 13485, ANVISA e metrologia dimensional com ZEISS Contura.

#ValidacaoDeProcesso #IQOQPQ #ANVISA #ISO13485

Validação documenta o processo que o lote piloto só antecipa. ◆`,
    slides: [
      {
        label: "HOOK",
        headline: "Validação não é inspeção final",
        body: "IQ, OQ e PQ precisam existir antes do lote comercial.",
        background: "Stakeholder_Review_Assets/Quality/metrology-overview.png",
      },
      {
        label: "RISCO",
        headline: "O lote piloto não fecha o risco",
        body: "Relatório dimensional aprova peça; auditor abre protocolo.",
        background: "Stakeholder_Review_Assets/Quality/zeiss-contura.webp",
      },
      {
        label: "FALHA COMUM",
        headline: "Inspeção não prova estabilidade",
        body: "Capabilidade e variabilidade entre operadores precisam aparecer no processo.",
        background: "Stakeholder_Review_Assets/Quality/lab-overview.png",
      },
      {
        label: "EVIDÊNCIA",
        headline: "Evidência precisa estar documentada",
        body: "ISO 13485, ANVISA e ZEISS Contura sustentam a conversa técnica.",
        background: "Product Images/1767376335649-sala-limpa.png",
      },
      {
        label: "RESULTADO",
        headline: "Documentação reduz atrito de auditoria",
        body: "Defesa ANVISA mais objetiva; menor risco de NC por lacuna de processo. ◆",
        background: "Stakeholder_Review_Assets/Quality/olympus-microscope.png",
      },
    ],
  },
  {
    postId: "2026-05-26-T2-image",
    date: "2026-05-26",
    day: "terca",
    topic: "Onde realmente esta o gargalo no seu fornecedor medico",
    topicGroup: "Operations / Capacity",
    format: "Image",
    visualTreatment: "plain_hyperreal_no_overlay",
    background: "Product Images/1767376335649-sala-limpa.png",
    caption: `O gargalo nem sempre está na usinagem. Está em metrologia, embalagem, lote piloto ou ISO 13485.

Dobrar CNC sem mapear o fluxo pode só deslocar a fila. O atraso aparece depois, na CMM, na sala limpa, na marcação UDI ou na liberação documental que o cronograma tratou como detalhe.

Para o OEM, a pergunta certa é onde o lote espera, não onde a máquina é mais cara. Esse ponto define lead time real e prioridade de investimento.

Na Lifetrek, sala limpa ISO Classe 7, ZEISS Contura e laser UDI entram no desenho do processo.

#LeadTime #ManufaturaMedica #UDI #ISO13485

Investimento certo começa no gargalo real. ◆`,
  },
  {
    postId: "2026-05-28-T4-image",
    date: "2026-05-28",
    day: "quinta",
    topic: "Cpk sem MSA e numero decorativo",
    topicGroup: "Metrology / Validation",
    format: "Image",
    visualTreatment: "plain_hyperreal_no_overlay",
    background: "Stakeholder_Review_Assets/Quality/lab-overview.png",
    caption: `Sem MSA, sua tolerância é incerta. Cpk em sistema de medição não validado é número decorativo perigoso.

Aprovar fornecedor pelo Cpk do lote piloto parece objetivo, mas pode esconder variação do instrumento, do operador e do método de medição. Quando a escala entra, a falsa precisão aparece como rejeição, retrabalho ou discussão de recebimento.

MSA antes de Cpk muda a decisão: primeiro valida a régua, depois interpreta o processo.

A Lifetrek apoia esse raciocínio com metrologia dimensional em ZEISS Contura e controle de qualidade alinhado à ISO 13485.

#MSA #Cpk #Metrologia #Qualidade

Cpk sem MSA mede confiança que talvez não exista. ◆`,
  },
];

async function imageDataUrl(path: string): Promise<string> {
  const bytes = await Deno.readFile(path);
  const mime = detectMime(bytes, path);
  return `data:${mime};base64,${encodeBase64(bytes)}`;
}

function detectMime(bytes: Uint8Array, path: string): string {
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46
  ) {
    return "image/webp";
  }

  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  return "image/png";
}

async function loadFonts() {
  const [regular, bold, extraBold] = await Promise.all([
    fetch("https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf").then((r) =>
      r.arrayBuffer()
    ),
    fetch("https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf").then((r) =>
      r.arrayBuffer()
    ),
    fetch("https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-800-normal.ttf").then((r) =>
      r.arrayBuffer()
    ),
  ]);

  return { regular, bold, extraBold };
}

function wordCount(text: string): number {
  return text.match(/[#\p{L}\p{N}][#\p{L}\p{N}./:&+-]*/gu)?.length ?? 0;
}

function firstLine(text: string): string {
  return text.trim().split(/\n/)[0].trim();
}

function folderName(post: Post): string {
  return `${post.postId}`;
}

function logoNode(logoData: string): SatoriNode {
  return {
    type: "div",
    props: {
      style: {
        position: "absolute",
        top: "40px",
        right: "42px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "12px",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              width: "236px",
              height: "78px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px 16px",
              backgroundColor: "rgba(255,255,255,0.92)",
              borderRadius: "10px",
            },
            children: {
              type: "img",
              props: {
                src: logoData,
                style: {
                  width: "200px",
                  height: "64px",
                  objectFit: "contain",
                },
              },
            },
          },
        },
        {
          type: "div",
          props: {
            style: {
              width: "180px",
              height: "2px",
              backgroundColor: "rgba(255,255,255,0.9)",
            },
          },
        },
      ],
    },
  };
}

function baseBackground(bgData: string, overlay: "plain" | "text"): SatoriNode[] {
  const overlayCss = overlay === "plain"
    ? "linear-gradient(180deg, rgba(0,36,70,0.08) 0%, rgba(0,36,70,0.18) 48%, rgba(0,36,70,0.55) 100%)"
    : "linear-gradient(135deg, rgba(0,28,58,0.76) 0%, rgba(0,79,143,0.54) 48%, rgba(0,20,42,0.88) 100%)";

  return [
    {
      type: "img",
      props: {
        src: bgData,
        style: {
          position: "absolute",
          left: "0",
          top: "0",
          width: `${W}px`,
          height: `${H}px`,
          objectFit: "cover",
        },
      },
    },
    {
      type: "div",
      props: {
        style: {
          position: "absolute",
          left: "0",
          top: "0",
          width: `${W}px`,
          height: `${H}px`,
          background: overlayCss,
        },
      },
    },
  ];
}

function brandFooter(post: Post, slideIndex?: number, totalSlides?: number): SatoriNode {
  return {
    type: "div",
    props: {
      style: {
        position: "absolute",
        left: "0",
        bottom: "0",
        width: `${W}px`,
        height: "126px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 54px",
        background:
          "linear-gradient(90deg, rgba(0,79,143,0.96) 0%, rgba(0,79,143,0.76) 55%, rgba(26,122,62,0.82) 100%)",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              color: BRAND.white,
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    fontSize: "18px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.72)",
                  },
                  children: post.topicGroup,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    fontSize: "24px",
                    fontWeight: 700,
                    color: BRAND.white,
                  },
                  children: `${post.date} · ${post.format}`,
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: {
              fontSize: "28px",
              fontWeight: 700,
              color: BRAND.white,
            },
            children: slideIndex && totalSlides ? `${slideIndex} de ${totalSlides}` : "◆",
          },
        },
      ],
    },
  };
}

function singleImageNode(post: Post, bgData: string, logoData: string): SatoriNode {
  return {
    type: "div",
    props: {
      style: {
        width: `${W}px`,
        height: `${H}px`,
        position: "relative",
        display: "flex",
        overflow: "hidden",
        fontFamily: "Inter",
        backgroundColor: BRAND.blueDark,
      },
      children: [
        ...baseBackground(bgData, "plain"),
        logoNode(logoData),
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              left: "54px",
              bottom: "168px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              color: BRAND.white,
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    fontSize: "22px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.84)",
                  },
                  children: post.topicGroup,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    width: "180px",
                    height: "6px",
                    backgroundColor: post.topicGroup === "Operations / Capacity"
                      ? BRAND.green
                      : BRAND.orange,
                  },
                },
              },
            ],
          },
        },
        brandFooter(post),
      ],
    },
  };
}

function carouselSlideNode(
  post: Post,
  slide: Slide,
  slideIndex: number,
  totalSlides: number,
  bgData: string,
  logoData: string,
): SatoriNode {
  const compact = post.visualTreatment === "plain_hyperreal_no_overlay";
  const headlineSize = slideIndex === 1 ? (compact ? 68 : 76) : (compact ? 56 : 62);
  const bodySize = compact ? 32 : 34;

  return {
    type: "div",
    props: {
      style: {
        width: `${W}px`,
        height: `${H}px`,
        position: "relative",
        display: "flex",
        overflow: "hidden",
        fontFamily: "Inter",
        backgroundColor: BRAND.blueDark,
      },
      children: [
        ...baseBackground(bgData, "text"),
        logoNode(logoData),
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              left: "68px",
              right: "76px",
              bottom: "210px",
              display: "flex",
              flexDirection: "column",
              gap: compact ? "20px" : "24px",
              color: BRAND.white,
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    alignSelf: "flex-start",
                    padding: "12px 18px",
                    backgroundColor: "rgba(0,79,143,0.76)",
                    color: BRAND.white,
                    border: `2px solid ${post.topicGroup === "Operations / Capacity" ? BRAND.green : BRAND.orange}`,
                    borderRadius: "999px",
                    fontSize: "20px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  },
                  children: slide.label,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    fontSize: `${headlineSize}px`,
                    lineHeight: 1.04,
                    fontWeight: 800,
                    color: BRAND.white,
                    maxWidth: "900px",
                    textWrap: "balance",
                  },
                  children: slide.headline,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    width: compact ? "160px" : "220px",
                    height: compact ? "6px" : "8px",
                    backgroundColor: post.topicGroup === "Operations / Capacity"
                      ? BRAND.green
                      : BRAND.orange,
                  },
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    fontSize: `${bodySize}px`,
                    lineHeight: 1.18,
                    fontWeight: 400,
                    color: BRAND.textSoft,
                    maxWidth: compact ? "830px" : "860px",
                  },
                  children: slide.body,
                },
              },
            ],
          },
        },
        brandFooter(post, slideIndex, totalSlides),
      ],
    },
  };
}

async function renderPng(
  node: SatoriNode,
  fonts: { regular: ArrayBuffer; bold: ArrayBuffer; extraBold: ArrayBuffer },
): Promise<Uint8Array> {
  const svg = await satori(node as never, {
    width: W,
    height: H,
    fonts: [
      { name: "Inter", data: fonts.regular, weight: 400, style: "normal" },
      { name: "Inter", data: fonts.bold, weight: 700, style: "normal" },
      { name: "Inter", data: fonts.extraBold, weight: 800, style: "normal" },
    ],
  });
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: W } });
  return resvg.render().asPng();
}

async function renderPost(
  post: Post,
  fonts: { regular: ArrayBuffer; bold: ArrayBuffer; extraBold: ArrayBuffer },
  logoData: string,
) {
  const dir = `${OUT_DIR}/${folderName(post)}`;
  await Deno.mkdir(dir, { recursive: true });

  await Deno.writeTextFile(`${dir}/caption.txt`, `${post.caption.trim()}\n`);

  if (post.format === "Image") {
    const bg = await imageDataUrl(post.background);
    const png = await renderPng(singleImageNode(post, bg, logoData), fonts);
    await Deno.writeFile(`${dir}/image.png`, png);
  } else {
    if (!post.slides || post.slides.length !== 5) {
      throw new Error(`${post.postId} must have exactly 5 slides.`);
    }

    for (let index = 0; index < post.slides.length; index += 1) {
      const slide = post.slides[index];
      const bg = await imageDataUrl(slide.background);
      const png = await renderPng(
        carouselSlideNode(post, slide, index + 1, post.slides.length, bg, logoData),
        fonts,
      );
      await Deno.writeFile(`${dir}/slide-${String(index + 1).padStart(2, "0")}.png`, png);
    }
    await Deno.copyFile(`${dir}/slide-01.png`, `${dir}/image.png`);
  }

  const metadata = {
    post_id: post.postId,
    date: post.date,
    day: post.day,
    post_class: "editorial",
    topic: post.topic,
    topic_group: post.topicGroup,
    format_target: post.format,
    visual_treatment: post.visualTreatment,
    hook: firstLine(post.caption),
    hook_length_chars: firstLine(post.caption).length,
    caption_word_count: wordCount(post.caption),
    image_dimensions: `${W}x${H}`,
    background_source: post.background,
    source_plan: "docs/strategy/linkedin-test-may-2026-execution-plan.md",
    claim_guardian_note:
      "Claims were kept to approved public language where possible; quantified or guarantee-style outcomes were softened.",
  };

  await Deno.writeTextFile(`${dir}/metadata.json`, `${JSON.stringify(metadata, null, 2)}\n`);
  return metadata;
}

function validatePlanShape() {
  const failures: string[] = [];
  if (posts.length !== 8) {
    failures.push(`Expected 8 posts, got ${posts.length}.`);
  }

  for (const post of posts) {
    const hookLength = firstLine(post.caption).length;
    const words = wordCount(post.caption);
    if (hookLength < 95 || hookLength > 125) {
      failures.push(`${post.postId} hook length ${hookLength} is outside 95-125.`);
    }
    if (words < 95 || words > 115) {
      failures.push(`${post.postId} caption word count ${words} is outside 95-115.`);
    }
    if (!post.caption.trim().endsWith("◆")) {
      failures.push(`${post.postId} caption must end with diamond sparkle.`);
    }
    if (post.format === "Carousel" && post.slides?.length !== 5) {
      failures.push(`${post.postId} carousel must have exactly 5 slides.`);
    }
  }

  if (failures.length > 0) {
    throw new Error(failures.join("\n"));
  }
}

async function main() {
  validatePlanShape();
  await Deno.mkdir(OUT_DIR, { recursive: true });

  const fonts = await loadFonts();
  const logoData = await imageDataUrl(BRAND.logo);
  const manifest = [];

  for (const post of posts) {
    manifest.push(await renderPost(post, fonts, logoData));
  }

  await Deno.writeTextFile(
    `${OUT_DIR}/manifest.json`,
    `${JSON.stringify({ generated_at: new Date().toISOString(), posts: manifest }, null, 2)}\n`,
  );

  console.table(
    manifest.map((item) => ({
      post_id: item.post_id,
      format: item.format_target,
      hook_chars: item.hook_length_chars,
      words: item.caption_word_count,
    })),
  );
}

if (import.meta.main) {
  await main();
}
