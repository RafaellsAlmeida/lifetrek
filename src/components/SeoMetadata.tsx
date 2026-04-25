import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const SITE_URL = "https://www.lifetrek-medical.com";
const PREVIEW_IMAGE = `${SITE_URL}/images/lifetrek-facility-preview.png`;

const routeMetadata = {
  en: {
    "/": {
      title: "Lifetrek Medical - High-Precision Medical Manufacturing | ISO 13485 Certified",
      description:
        "ISO 13485 and ANVISA certified manufacturer of medical, dental, and veterinary implants and instruments with Swiss CNC machining and ISO 7 cleanroom facilities in Brazil.",
    },
    "/about": {
      title: "About Lifetrek Medical | ISO 13485 Medical Manufacturing",
      description:
        "Learn about Lifetrek Medical's precision manufacturing experience, quality standards, and certified medical device production in Brazil.",
    },
    "/what-we-do": {
      title: "What We Do | Medical Device Contract Manufacturing",
      description:
        "Precision CNC machining, ISO 7 cleanroom production, electropolishing, passivation, laser marking, and inspection for medical device companies.",
    },
    "/products": {
      title: "Medical Implants, Dental Components, and Surgical Instruments | Lifetrek Medical",
      description:
        "Precision-manufactured orthopedic, dental, veterinary, and surgical components for medical device companies.",
    },
    "/resources": {
      title: "Technical Resources | Lifetrek Medical",
      description:
        "Technical checklists, guides, and calculators for medical device manufacturing, supply chain, and engineering teams.",
    },
    "/capabilities": {
      title: "Manufacturing Capabilities | Lifetrek Medical",
      description:
        "Certified medical manufacturing capabilities including ISO 7 cleanrooms, Swiss-type CNC equipment, metrology, and medical-grade finishing.",
    },
    "/clients": {
      title: "Who We Work With | Lifetrek Medical",
      description:
        "Lifetrek Medical supports medical, dental, veterinary, orthopedic, and healthcare technology companies with precision manufacturing.",
    },
    "/contact": {
      title: "Contact Lifetrek Medical | Medical Manufacturing Partner",
      description:
        "Contact Lifetrek Medical to discuss precision medical device manufacturing, implants, instruments, cleanroom production, and CNC machining.",
    },
  },
  pt: {
    "/": {
      title: "Lifetrek Medical - Manufatura Médica de Alta Precisão | ISO 13485",
      description:
        "Fabricante certificada ISO 13485 e ANVISA de implantes e instrumentais médicos, odontológicos e veterinários com usinagem CNC suíça e salas limpas ISO 7 no Brasil.",
    },
    "/about": {
      title: "Quem Somos | Lifetrek Medical",
      description:
        "Conheça a experiência, os padrões de qualidade e a produção certificada da Lifetrek Medical para dispositivos médicos no Brasil.",
    },
    "/what-we-do": {
      title: "O que Fazemos | Manufatura de Dispositivos Médicos",
      description:
        "Usinagem CNC de precisão, produção em sala limpa ISO 7, eletropolimento, passivação, gravação a laser e inspeção para empresas de dispositivos médicos.",
    },
    "/products": {
      title: "Implantes, Componentes Odontológicos e Instrumentais | Lifetrek Medical",
      description:
        "Componentes ortopédicos, odontológicos, veterinários e instrumentais cirúrgicos fabricados com precisão para empresas da área médica.",
    },
    "/resources": {
      title: "Recursos Técnicos | Lifetrek Medical",
      description:
        "Checklists, guias e calculadoras para manufatura de dispositivos médicos, supply chain e engenharia.",
    },
    "/capabilities": {
      title: "Capacidades de Manufatura | Lifetrek Medical",
      description:
        "Capacidades certificadas de manufatura médica incluindo salas limpas ISO 7, equipamentos CNC suíços, metrologia e acabamento de grau médico.",
    },
    "/clients": {
      title: "Quem Atendemos | Lifetrek Medical",
      description:
        "A Lifetrek Medical atende empresas médicas, odontológicas, veterinárias, ortopédicas e de tecnologia em saúde com manufatura de precisão.",
    },
    "/contact": {
      title: "Contato | Lifetrek Medical",
      description:
        "Entre em contato com a Lifetrek Medical para discutir manufatura de dispositivos médicos, implantes, instrumentais, sala limpa e usinagem CNC.",
    },
  },
} as const;

export const SeoMetadata = () => {
  const { language } = useLanguage();
  const { pathname } = useLocation();
  const metadata = routeMetadata[language][pathname as keyof typeof routeMetadata.en] ?? routeMetadata[language]["/"];
  const canonicalPath = pathname === "/" ? "" : pathname;
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  const locale = language === "pt" ? "pt_BR" : "en_US";
  const alternateLocale = language === "pt" ? "en_US" : "pt_BR";

  return (
    <Helmet>
      <html lang={language === "pt" ? "pt-BR" : "en-US"} />
      <title>{metadata.title}</title>
      <meta name="description" content={metadata.description} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:title" content={metadata.title} />
      <meta property="og:description" content={metadata.description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:locale" content={locale} />
      <meta property="og:locale:alternate" content={alternateLocale} />
      <meta property="og:image" content={PREVIEW_IMAGE} />
      <meta property="og:image:secure_url" content={PREVIEW_IMAGE} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Lifetrek Medical manufacturing facility exterior in Brazil" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metadata.title} />
      <meta name="twitter:description" content={metadata.description} />
      <meta name="twitter:image" content={PREVIEW_IMAGE} />
    </Helmet>
  );
};
