import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import cpmh from "@/assets/clients/cpmh-new.png";
import evolve from "@/assets/clients/evolve-new.png";
import fgm from "@/assets/clients/fgm-new.png";
import gmi from "@/assets/clients/gmi-new.png";
import hcs from "@/assets/clients/hcs-new.png";
import impol from "@/assets/clients/impol-new.png";
import implanfix from "@/assets/clients/implanfix-new.png";
import iol from "@/assets/clients/iol-new.png";
import plenum from "@/assets/clients/plenum-new.png";
import neoortho from "@/assets/clients/neoortho-new.jpg";
import oblDental from "@/assets/clients/obl-dental-new.jpg";
import orthometric from "@/assets/clients/orthometric-new.png";
import ossea from "@/assets/clients/ossea-new.jpg";
import traumec from "@/assets/clients/traumec-new.png";
import razek from "@/assets/clients/razek-new.png";
import react from "@/assets/clients/react-new.png";
import russer from "@/assets/clients/russer-new.png";
import techimport from "@/assets/clients/techimport-new.png";
import toride from "@/assets/clients/toride-new.png";
import ultradent from "@/assets/clients/ultradent-new.png";
import vincula from "@/assets/clients/vincula-new.png";
import vetmaker from "@/assets/clients/vetmaker.png";
import safira from "@/assets/clients/safira-logo.svg";
import kynsan from "@/assets/clients/kynsan.jpg";
import medicalScrewHero from "@/assets/products/medical-screw-hero.webp";
import dentalInstrumentsHero from "@/assets/products/dental-instruments-hero.webp";
import surgicalInstruments from "@/assets/products/surgical-instruments-new.webp";
import veterinaryImplant from "@/assets/products/veterinary-implant-2.jpg";

type Language = "en" | "pt";

type ClientLogo = {
  src: string;
  alt: string;
  scale?: number;
};

const pageCopy = {
  en: {
    fitKicker: "Who we serve",
    fitTitle: "Four customer situations where Lifetrek helps best.",
    fitIntro:
      "We support medical device teams when supplier selection depends on technical fit, production discipline, and a clear path from drawings to repeatable supply.",
    customerFits: [
      {
        image: medicalScrewHero,
        alt: "Precision medical screw manufactured for implant systems",
        number: "01",
        title: "Orthopedic and trauma OEMs",
        body:
          "Teams that need repeatable titanium and stainless components for fixation, spine, extremity, and instrument systems.",
        meta: "Screws / plates / spine / extremity",
      },
      {
        image: dentalInstrumentsHero,
        alt: "Dental surgical instruments and implant components",
        number: "02",
        title: "Dental implant system companies",
        body:
          "Brands scaling implant, abutment, drill, and surgical kit production without losing control of surface finish and fit.",
        meta: "Implants / drills / kits / abutments",
      },
      {
        image: surgicalInstruments,
        alt: "Set of precision surgical instruments",
        number: "03",
        title: "Surgical instrument brands",
        body:
          "Manufacturers that need precision tools, cutting instruments, and repeatable geometry across short runs and production batches.",
        meta: "Instruments / drills / handles / guides",
      },
      {
        image: veterinaryImplant,
        alt: "Veterinary implant component for orthopedic applications",
        number: "04",
        title: "Veterinary implant teams",
        body:
          "Specialized companies building reliable orthopedic systems where clinical performance still depends on manufacturing discipline.",
        meta: "Veterinary plates / screws / custom systems",
      },
    ],
    flowKicker: "How the partnership works",
    flowTitle: "From supplier search to production control.",
    flowRows: [
      {
        label: "01",
        title: "Map the technical risk",
        body:
          "We start with drawings, materials, surface requirements, batch volume, and inspection expectations, then identify where manufacturing risk will appear first.",
        meta: "Drawing review / process questions / risk notes",
      },
      {
        label: "02",
        title: "Translate the part into a controlled process",
        body:
          "The route is built around machining, finishing, metrology, and cleanroom needs so the component is not treated as a generic CNC job.",
        meta: "CAM / fixtures / finishing / metrology",
      },
      {
        label: "03",
        title: "Prove repeatability before scaling",
        body:
          "Inspection data, traceability, and operator knowledge are connected early, reducing surprises when the project moves beyond prototypes.",
        meta: "First articles / CMM / batch history",
      },
      {
        label: "04",
        title: "Operate as an extension of the OEM team",
        body:
          "The goal is a supplier relationship that answers engineering, quality, purchasing, and regulatory questions with the same facts.",
        meta: "Engineering / quality / procurement / regulatory",
      },
    ],
    proofKicker: "Proof of fit",
    proofTitle: "Trusted by medical companies that know precision is operational.",
    proofLead:
      "The logo wall belongs after the story: these partners represent the kinds of product teams, quality systems, and supply expectations Lifetrek is designed to support.",
    industryKicker: "Applications",
    industryTitle: "Focused on critical medical manufacturing segments.",
    reachTitle: "Based in Brazil. Built for global expectations.",
    reachText:
      "Lifetrek supports companies that need ISO 13485 discipline, export-capable communication, and a supplier who can hold technical conversations across departments.",
    finalTitle: "Looking for a supplier that can carry the technical load?",
    finalText:
      "Start with a focused assessment of the part, the risk, and the manufacturing path.",
    finalCta: "Schedule an assessment",
  },
  pt: {
    fitKicker: "Quem atendemos",
    fitTitle: "Quatro situações em que a Lifetrek ajuda melhor.",
    fitIntro:
      "Apoiamos empresas de dispositivos médicos quando a escolha do fornecedor depende de aderência técnica, disciplina produtiva e um caminho claro do desenho ao fornecimento repetível.",
    customerFits: [
      {
        image: medicalScrewHero,
        alt: "Parafuso médico de precisão fabricado para sistemas de implantes",
        number: "01",
        title: "OEMs ortopédicos e de trauma",
        body:
          "Times que precisam de componentes repetíveis em titânio e aço inox para sistemas de fixação, coluna, extremidades e instrumentais.",
        meta: "Parafusos / placas / coluna / extremidades",
      },
      {
        image: dentalInstrumentsHero,
        alt: "Instrumentais odontológicos e componentes para implantes",
        number: "02",
        title: "Empresas de sistemas de implantes odontológicos",
        body:
          "Marcas escalando produção de implantes, pilares, brocas e kits cirúrgicos sem perder controle de acabamento superficial e encaixe.",
        meta: "Implantes / brocas / kits / pilares",
      },
      {
        image: surgicalInstruments,
        alt: "Conjunto de instrumentais cirúrgicos de precisão",
        number: "03",
        title: "Marcas de instrumentais cirúrgicos",
        body:
          "Fabricantes que precisam de ferramentas de precisão, instrumentos de corte e geometria repetível em lotes curtos e produtivos.",
        meta: "Instrumentais / brocas / cabos / guias",
      },
      {
        image: veterinaryImplant,
        alt: "Componente de implante veterinário para aplicações ortopédicas",
        number: "04",
        title: "Times de implantes veterinários",
        body:
          "Empresas especializadas construindo sistemas ortopédicos confiáveis onde performance clínica ainda depende de disciplina industrial.",
        meta: "Placas / parafusos / sistemas customizados",
      },
    ],
    flowKicker: "Como a parceria funciona",
    flowTitle: "Da busca de fornecedor ao controle produtivo.",
    flowRows: [
      {
        label: "01",
        title: "Mapear o risco técnico",
        body:
          "Começamos por desenhos, materiais, requisitos de superfície, volume de lote e expectativa de inspeção, identificando onde o risco aparece primeiro.",
        meta: "Revisão de desenho / perguntas de processo / riscos",
      },
      {
        label: "02",
        title: "Traduzir a peça em processo controlado",
        body:
          "A rota considera usinagem, acabamento, metrologia e sala limpa para que o componente não seja tratado como um trabalho CNC genérico.",
        meta: "CAM / dispositivos / acabamento / metrologia",
      },
      {
        label: "03",
        title: "Provar repetibilidade antes de escalar",
        body:
          "Dados de inspeção, rastreabilidade e conhecimento de operação entram cedo, reduzindo surpresas quando o projeto passa de protótipo.",
        meta: "Primeiras peças / CMM / histórico de lote",
      },
      {
        label: "04",
        title: "Operar como extensão do time OEM",
        body:
          "A relação precisa responder engenharia, qualidade, compras e regulatório com os mesmos fatos.",
        meta: "Engenharia / qualidade / compras / regulatório",
      },
    ],
    proofKicker: "Prova de aderência",
    proofTitle: "Confiada por empresas médicas que sabem que precisão é operação.",
    proofLead:
      "A parede de logos aparece depois da história: estes parceiros representam os tipos de produto, sistemas de qualidade e expectativas de fornecimento que a Lifetrek foi criada para apoiar.",
    industryKicker: "Aplicações",
    industryTitle: "Foco em segmentos críticos da manufatura médica.",
    reachTitle: "Base no Brasil. Padrão de expectativa global.",
    reachText:
      "A Lifetrek apoia empresas que precisam de disciplina ISO 13485, comunicação para exportação e um fornecedor capaz de conversar tecnicamente com diferentes áreas.",
    finalTitle: "Procurando um fornecedor que sustente a carga técnica?",
    finalText:
      "Comece com uma avaliação objetiva da peça, do risco e do caminho de manufatura.",
    finalCta: "Agendar avaliação",
  },
} satisfies Record<Language, {
  fitKicker: string;
  fitTitle: string;
  fitIntro: string;
  customerFits: {
    image: string;
    alt: string;
    number: string;
    title: string;
    body: string;
    meta: string;
  }[];
  flowKicker: string;
  flowTitle: string;
  flowRows: {
    label: string;
    title: string;
    body: string;
    meta: string;
  }[];
  proofKicker: string;
  proofTitle: string;
  proofLead: string;
  industryKicker: string;
  industryTitle: string;
  reachTitle: string;
  reachText: string;
  finalTitle: string;
  finalText: string;
  finalCta: string;
}>;

const clientLogos: ClientLogo[] = [
  { src: cpmh, alt: "CPMH - Medical device solutions" },
  { src: evolve, alt: "Evolve - Medical technology innovation" },
  { src: fgm, alt: "FGM Dental Group - Dental device manufacturer" },
  { src: gmi, alt: "GMI - Global medical innovation" },
  { src: hcs, alt: "HCS - Healthcare solutions provider" },
  { src: impol, alt: "Impol - Medical instruments manufacturer" },
  { src: implanfix, alt: "Implanfix - Surgical materials provider" },
  { src: iol, alt: "IOL Implantes Ortopedicos - Orthopedic implant manufacturer" },
  { src: plenum, alt: "Plenum - Medical device technology" },
  { src: neoortho, alt: "Neoortho - Orthopedic solutions" },
  { src: oblDental, alt: "OBL Dental - Dental device manufacturer" },
  { src: orthometric, alt: "Orthometric - Medical orthopedic systems" },
  { src: ossea, alt: "Ossea Medical Technology - Orthopedic implant manufacturer" },
  { src: traumec, alt: "Traumec Health Technology - Medical equipment client" },
  { src: razek, alt: "Razek - Medical device solutions client" },
  { src: react, alt: "React - Creation in health medical technology" },
  { src: russer, alt: "Russer - Medical equipment manufacturer" },
  { src: techimport, alt: "TechImport - Medical technology client" },
  { src: toride, alt: "Toride - Medical manufacturing client" },
  { src: ultradent, alt: "Ultradent Products - Dental device manufacturer" },
  { src: vincula, alt: "Vincula - Medical device manufacturer client" },
  { src: vetmaker, alt: "Vetmaker Facilities - Veterinary orthopedic implants", scale: 1.5 },
  { src: safira, alt: "Safira client logo" },
  { src: kynsan, alt: "Kynsan client logo" },
];

export default function Clients() {
  const { language, t } = useLanguage();
  const copy = pageCopy[language as Language] ?? pageCopy.en;
  const industries = [
    t("clients.industries.orthopedic"),
    t("clients.industries.spinal"),
    t("clients.industries.dental"),
    t("clients.industries.veterinary"),
    t("clients.industries.trauma"),
    t("clients.industries.instrumentation"),
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div id="top" />

      <section className="border-b border-primary/10 bg-[#f7fbff] px-4 py-20 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-16 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="mb-5 font-mono text-xs uppercase tracking-[0.22em] text-accent">
                {copy.fitKicker}
              </p>
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-primary sm:text-5xl lg:text-6xl">
                {copy.fitTitle}
              </h1>
            </div>
            <p className="max-w-[58ch] text-base leading-8 text-slate-600 lg:justify-self-end">
              {copy.fitIntro}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {copy.customerFits.map((client) => (
              <article
                key={client.number}
                className="group overflow-hidden rounded-xl border border-primary/10 bg-white shadow-[var(--shadow-soft)] transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="grid min-h-full grid-cols-1 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="relative min-h-[260px] overflow-hidden bg-secondary">
                    <img
                      src={client.image}
                      alt={client.alt}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex flex-col p-6 sm:p-8">
                    <div className="mb-8 font-mono text-5xl italic leading-none text-accent sm:text-6xl">
                      {client.number}
                    </div>
                    <h3 className="text-2xl font-semibold leading-tight text-primary">
                      {client.title}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      {client.body}
                    </p>
                    <div className="mt-auto border-t border-primary/10 pt-5 font-mono text-xs uppercase tracking-[0.14em] text-slate-500">
                      {client.meta}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-24 text-primary sm:px-6 lg:py-32">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-16 max-w-4xl">
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.22em] text-accent">
              {copy.flowKicker}
            </p>
            <h2 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              {copy.flowTitle}
            </h2>
          </div>

          <div className="border-t border-primary/15">
            {copy.flowRows.map((row) => (
              <article
                key={row.label}
                className="grid gap-5 border-b border-primary/15 py-10 md:grid-cols-[160px_1fr]"
              >
                <div className="font-mono text-5xl italic leading-none text-accent sm:text-6xl">
                  {row.label}
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-primary">
                    {row.title}
                  </h3>
                  <p className="mt-4 max-w-[70ch] text-base leading-8 text-slate-600">
                    {row.body}
                  </p>
                  <div className="mt-5 font-mono text-xs uppercase tracking-[0.16em] text-primary/45">
                    {row.meta}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="client-logos" className="bg-white px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div
            className="mb-14 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end"
          >
            <div>
              <p className="mb-5 font-mono text-xs uppercase tracking-[0.22em] text-accent">
                {copy.proofKicker}
              </p>
              <h2 className="max-w-3xl text-4xl font-semibold leading-tight text-primary sm:text-5xl lg:text-6xl">
                {copy.proofTitle}
              </h2>
            </div>
            <p className="max-w-[62ch] text-base leading-8 text-slate-600 lg:justify-self-end">
              {copy.proofLead}
            </p>
          </div>

          <div className="grid grid-cols-2 border-l border-t border-primary/15 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {clientLogos.map((logo) => (
              <div
                key={logo.alt}
                className="flex min-h-[128px] items-center justify-center border-b border-r border-primary/15 bg-white p-5 transition-colors duration-300 hover:bg-[#f7fbff]"
              >
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="max-h-12 w-auto object-contain"
                  style={{ transform: logo.scale ? `scale(${logo.scale})` : "none" }}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-primary/10 bg-[#f7fbff] px-4 py-24 sm:px-6 lg:py-28">
        <div className="mx-auto grid max-w-[1280px] gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.22em] text-accent">
              {copy.industryKicker}
            </p>
            <h2 className="text-3xl font-semibold leading-tight text-primary sm:text-4xl lg:text-5xl">
              {copy.industryTitle}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-0 border-t border-primary/15 sm:grid-cols-2">
            {industries.map((industry) => (
              <div
                key={industry}
                className="border-b border-primary/15 py-5 font-mono text-sm uppercase tracking-[0.12em] text-primary/75 sm:odd:border-r sm:odd:pr-6 sm:even:pl-6"
              >
                {industry}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-24 sm:px-6 lg:py-32">
        <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-xl border border-primary/10 bg-white p-8 shadow-[var(--shadow-soft)] sm:p-10">
            <p className="mb-6 font-mono text-xs uppercase tracking-[0.18em] text-accent">
              {t("clients.reach.title")}
            </p>
            <h2 className="text-3xl font-semibold leading-tight text-primary sm:text-4xl">
              {copy.reachTitle}
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              {copy.reachText}
            </p>
          </div>
          <div className="grid gap-4">
            <div className="rounded-xl border border-primary/10 bg-[#f7fbff] p-6">
              <div className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
                {t("clients.reach.certifications.title")}
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {t("clients.reach.certifications.text")}
              </p>
            </div>
            <div className="rounded-xl border border-primary/10 bg-[#f7fbff] p-6">
              <div className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
                {t("clients.reach.global.title")}
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {t("clients.reach.global.text")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary px-4 py-24 text-primary-foreground sm:px-6 lg:py-32">
        <div className="mx-auto max-w-[980px] text-center">
          <h2 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
            {copy.finalTitle}
          </h2>
          <p className="mx-auto mt-6 max-w-[58ch] text-base leading-8 text-primary-foreground/75 sm:text-lg">
            {copy.finalText}
          </p>
          <div className="mt-10">
            <Link to="/assessment#top">
              <Button className="h-12 rounded-md bg-accent px-5 text-accent-foreground shadow-none transition-transform hover:-translate-y-0.5 hover:bg-accent/90 active:translate-y-0">
                {copy.finalCta}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
