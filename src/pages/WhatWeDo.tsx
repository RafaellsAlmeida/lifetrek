import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import citizenM32 from "@/assets/equipment/citizen-m32-new.png";
import qualityLab from "@/assets/metrology/lab-overview.webp";
import electropolishLine from "@/assets/facility/electropolish-line-new.jpg";
import cleanroomHero from "@/assets/facility/cleanroom-hero.webp";
import laserMarking from "@/assets/equipment/laser-marking.png";

type Language = "en" | "pt";

type Capability = {
  alt: string;
  body: string;
  image: string;
  label: string;
  number: string;
  points: string[];
  title: string;
};

const pageCopy = {
  en: {
    kicker: "What we do",
    title: "Manufacturing services built around controlled medical parts.",
    intro:
      "Lifetrek combines CNC machining, finishing, inspection, cleanroom resources, and traceability into one production path for implants, instruments, and precision components.",
    note:
      "The service is strongest when the part needs more than machining: it needs process discipline, documented inspection, and a supplier who can answer technical questions clearly.",
    flowKicker: "Manufacturing flow",
    flowTitle: "From drawing review to batch release.",
    flowIntro:
      "Each project is translated into a controlled route before volume production starts, so technical risk is visible early.",
    steps: [
      "Drawing and requirement review",
      "CNC route and fixture planning",
      "Surface finishing and passivation",
      "Metrology and inspection records",
      "Cleanroom handling and batch documentation",
    ],
    capabilityKicker: "Core services",
    capabilities: [
      {
        number: "01",
        label: "CNC machining",
        title: "Swiss-type turning and precision milling for medical geometry.",
        body:
          "We machine small, complex components where dimensional repeatability, burr control, and material behavior matter as much as cycle time.",
        points: ["Multi-axis turning", "Precision milling", "Implants and instruments"],
        image: citizenM32,
        alt: "Citizen CNC equipment used for precision medical machining",
      },
      {
        number: "02",
        label: "Surface treatment",
        title: "Finishing routes that support corrosion resistance and biocompatibility.",
        body:
          "Electropolishing, passivation, and controlled finishing steps are planned with the part function, material, and inspection criteria in mind.",
        points: ["Electropolishing", "Passivation", "Finish consistency"],
        image: electropolishLine,
        alt: "Electropolishing and passivation line at Lifetrek",
      },
      {
        number: "03",
        label: "Quality control",
        title: "Inspection connected to the drawing, process, and batch history.",
        body:
          "Metrology is part of the manufacturing route, not a separate checkpoint. We connect CMM, optical inspection, and lab records to the part requirements.",
        points: ["3D CMM", "Optical inspection", "Traceable records"],
        image: qualityLab,
        alt: "Lifetrek metrology laboratory with ZEISS inspection equipment",
      },
      {
        number: "04",
        label: "Cleanroom handling",
        title: "Controlled environments for final handling, assembly, and packaging.",
        body:
          "Cleanroom resources support parts that need controlled handling after machining and finishing, with batch traceability maintained through release.",
        points: ["ISO 7 cleanroom", "Assembly support", "Batch traceability"],
        image: cleanroomHero,
        alt: "Lifetrek cleanroom facility for medical device handling",
      },
      {
        number: "05",
        label: "Laser marking",
        title: "Permanent identification that supports traceability and release.",
        body:
          "Laser marking is integrated into the production route so part identification, lot control, and documentation stay aligned.",
        points: ["Part identification", "Lot control", "Release documentation"],
        image: laserMarking,
        alt: "Laser marking equipment used for medical part traceability",
      },
    ],
    proofTitle: "Why teams bring these services together.",
    proofItems: [
      "Fewer supplier handoffs between machining, finishing, inspection, and controlled handling.",
      "Cleaner technical conversations across engineering, quality, purchasing, and regulatory teams.",
      "A production route that can be audited against the drawing, process, and batch record.",
    ],
    finalTitle: "Need a manufacturing path for a medical component?",
    finalText:
      "Start with the part, the drawing, and the risk. We will help define the route before quoting volume production.",
    finalCta: "Schedule assessment",
    secondaryCta: "View capabilities",
  },
  pt: {
    kicker: "O que fazemos",
    title: "Serviços de manufatura construídos em torno de peças médicas controladas.",
    intro:
      "A Lifetrek combina usinagem CNC, acabamento, inspeção, recursos de sala limpa e rastreabilidade em uma rota produtiva para implantes, instrumentais e componentes de precisão.",
    note:
      "O serviço faz mais sentido quando a peça precisa de mais do que usinagem: precisa de disciplina de processo, inspeção documentada e um fornecedor que responda tecnicamente com clareza.",
    flowKicker: "Fluxo de manufatura",
    flowTitle: "Da revisão do desenho à liberação do lote.",
    flowIntro:
      "Cada projeto é traduzido em uma rota controlada antes da produção em volume, para que o risco técnico fique visível cedo.",
    steps: [
      "Revisão de desenho e requisitos",
      "Rota CNC e planejamento de dispositivos",
      "Acabamento superficial e passivação",
      "Metrologia e registros de inspeção",
      "Sala limpa e documentação de lote",
    ],
    capabilityKicker: "Serviços principais",
    capabilities: [
      {
        number: "01",
        label: "Usinagem CNC",
        title: "Torneamento suíço e fresamento de precisão para geometrias médicas.",
        body:
          "Usinamos componentes pequenos e complexos onde repetibilidade dimensional, controle de rebarba e comportamento do material importam tanto quanto tempo de ciclo.",
        points: ["Torneamento multi-eixos", "Fresamento de precisão", "Implantes e instrumentais"],
        image: citizenM32,
        alt: "Equipamento CNC Citizen usado para usinagem médica de precisão",
      },
      {
        number: "02",
        label: "Tratamento de superfície",
        title: "Rotas de acabamento que apoiam resistência à corrosão e biocompatibilidade.",
        body:
          "Eletropolimento, passivação e etapas controladas de acabamento são planejadas conforme função da peça, material e critérios de inspeção.",
        points: ["Eletropolimento", "Passivação", "Consistência de acabamento"],
        image: electropolishLine,
        alt: "Linha de eletropolimento e passivação da Lifetrek",
      },
      {
        number: "03",
        label: "Controle de qualidade",
        title: "Inspeção conectada ao desenho, ao processo e ao histórico do lote.",
        body:
          "A metrologia faz parte da rota de fabricação, não apenas de um checkpoint separado. Conectamos CMM, inspeção óptica e registros de laboratório aos requisitos da peça.",
        points: ["CMM 3D", "Inspeção óptica", "Registros rastreáveis"],
        image: qualityLab,
        alt: "Laboratório de metrologia da Lifetrek com equipamento ZEISS",
      },
      {
        number: "04",
        label: "Sala limpa",
        title: "Ambientes controlados para manuseio final, montagem e embalagem.",
        body:
          "Recursos de sala limpa apoiam peças que exigem manuseio controlado após usinagem e acabamento, mantendo rastreabilidade de lote até a liberação.",
        points: ["Sala limpa ISO 7", "Suporte de montagem", "Rastreabilidade de lote"],
        image: cleanroomHero,
        alt: "Instalação de sala limpa da Lifetrek para manuseio de dispositivos médicos",
      },
      {
        number: "05",
        label: "Gravação a laser",
        title: "Identificação permanente para apoiar rastreabilidade e liberação.",
        body:
          "A gravação a laser entra na rota produtiva para manter identificação da peça, controle de lote e documentação alinhados.",
        points: ["Identificação da peça", "Controle de lote", "Documentação de liberação"],
        image: laserMarking,
        alt: "Equipamento de gravação a laser usado para rastreabilidade de peças médicas",
      },
    ],
    proofTitle: "Por que reunir esses serviços em uma só rota.",
    proofItems: [
      "Menos trocas de fornecedor entre usinagem, acabamento, inspeção e manuseio controlado.",
      "Conversas técnicas mais claras entre engenharia, qualidade, compras e regulatório.",
      "Uma rota produtiva auditável contra desenho, processo e registro de lote.",
    ],
    finalTitle: "Precisa definir a rota de fabricação de um componente médico?",
    finalText:
      "Comece pela peça, pelo desenho e pelo risco. Ajudamos a definir o caminho antes de cotar produção em volume.",
    finalCta: "Agendar avaliação",
    secondaryCta: "Ver capacidades",
  },
} satisfies Record<
  Language,
  {
    capabilities: Capability[];
    capabilityKicker: string;
    finalCta: string;
    finalText: string;
    finalTitle: string;
    flowIntro: string;
    flowKicker: string;
    flowTitle: string;
    intro: string;
    kicker: string;
    note: string;
    proofItems: string[];
    proofTitle: string;
    secondaryCta: string;
    steps: string[];
    title: string;
  }
>;

export default function WhatWeDo() {
  const { language } = useLanguage();
  const copy = pageCopy[language as Language] ?? pageCopy.en;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div id="top" />

      <section className="border-b border-primary/10 bg-[#f7fbff] px-4 py-20 sm:px-6 lg:py-24">
        <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.22em] text-accent">
              {copy.kicker}
            </p>
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-primary sm:text-5xl lg:text-6xl">
              {copy.title}
            </h1>
          </div>
          <div className="max-w-[66ch] text-base leading-8 text-slate-600 lg:justify-self-end sm:text-lg">
            <p>{copy.intro}</p>
            <p className="mt-7 border-l-2 border-accent pl-5 italic text-primary/75">
              {copy.note}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 pb-10 pt-16 sm:px-6 lg:pb-12 lg:pt-24">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <p className="mb-5 font-mono text-xs uppercase tracking-[0.22em] text-accent">
                {copy.flowKicker}
              </p>
              <h2 className="text-3xl font-semibold leading-tight text-primary sm:text-4xl lg:text-5xl">
                {copy.flowTitle}
              </h2>
            </div>
            <p className="max-w-[62ch] text-base leading-8 text-slate-600 lg:justify-self-end">
              {copy.flowIntro}
            </p>
          </div>

          <div className="mt-12 grid border-l border-t border-primary/15 sm:grid-cols-2 lg:grid-cols-5">
            {copy.steps.map((step, index) => (
              <article
                key={step}
                className="min-h-[150px] border-b border-r border-primary/15 bg-white p-5 transition-colors duration-300 hover:bg-[#f7fbff]"
              >
                <div className="font-mono text-3xl italic leading-none text-accent">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <p className="mt-8 text-sm font-semibold leading-6 text-primary">
                  {step}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 pb-20 pt-10 sm:px-6 lg:pb-28 lg:pt-12">
        <div className="mx-auto max-w-[1280px]">
          <p className="mb-12 font-mono text-xs uppercase tracking-[0.22em] text-accent">
            {copy.capabilityKicker}
          </p>

          <div className="space-y-20">
            {copy.capabilities.map((capability, index) => (
              <article
                key={capability.number}
                className="grid gap-10 border-t border-primary/10 pt-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center"
              >
                <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                  <div className="mb-8 flex items-baseline gap-5">
                    <span className="font-mono text-5xl italic leading-none text-accent sm:text-6xl">
                      {capability.number}
                    </span>
                    <span className="font-mono text-xs uppercase tracking-[0.18em] text-primary/55">
                      {capability.label}
                    </span>
                  </div>
                  <h2 className="max-w-3xl text-3xl font-semibold leading-tight text-primary sm:text-4xl">
                    {capability.title}
                  </h2>
                  <p className="mt-6 max-w-[68ch] text-base leading-8 text-slate-600">
                    {capability.body}
                  </p>
                  <div className="mt-8 grid gap-3 border-t border-primary/10 pt-5 sm:grid-cols-3">
                    {capability.points.map((point) => (
                      <p
                        key={point}
                        className="font-mono text-xs uppercase tracking-[0.13em] text-primary/65"
                      >
                        {point}
                      </p>
                    ))}
                  </div>
                </div>

                <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                  <div className="overflow-hidden rounded-xl border border-primary/10 bg-[#f7fbff] shadow-[var(--shadow-soft)]">
                    <img
                      src={capability.image}
                      alt={capability.alt}
                      className="aspect-[16/10] w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-primary/10 bg-[#f7fbff] px-4 py-20 sm:px-6 lg:py-24">
        <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <h2 className="text-3xl font-semibold leading-tight text-primary sm:text-4xl lg:text-5xl">
            {copy.proofTitle}
          </h2>
          <div className="divide-y divide-primary/15 border-y border-primary/15">
            {copy.proofItems.map((item) => (
              <p key={item} className="py-6 text-base leading-8 text-slate-600">
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary px-4 py-20 text-primary-foreground sm:px-6 lg:py-28">
        <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h2 className="max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl">
              {copy.finalTitle}
            </h2>
            <p className="mt-6 max-w-[62ch] text-base leading-8 text-primary-foreground/75 sm:text-lg">
              {copy.finalText}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Link to="/assessment#top">
              <Button className="h-12 rounded-md bg-accent px-5 text-accent-foreground shadow-none transition-transform hover:-translate-y-0.5 hover:bg-accent/90 active:translate-y-0">
                {copy.finalCta}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link
              to="/capabilities#top"
              className="inline-flex h-12 items-center justify-center rounded-md border border-primary-foreground/25 px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
            >
              {copy.secondaryCta}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
