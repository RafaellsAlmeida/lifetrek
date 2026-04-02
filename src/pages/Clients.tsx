import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
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

export default function Clients() {
  const { t } = useLanguage();
  const logosAnimation = useScrollAnimation();

  const clientLogos = [
    { src: cpmh, alt: "CPMH - Medical device solutions" },
    { src: evolve, alt: "Evolve - Medical technology innovation" },
    { src: fgm, alt: "FGM Dental Group - Dental device manufacturer" },
    { src: gmi, alt: "GMI - Global medical innovation" },
    { src: hcs, alt: "HCS - Healthcare solutions provider" },
    { src: impol, alt: "Impol - Medical instruments manufacturer" },
    { src: implanfix, alt: "Implanfix - Surgical materials provider" },
    { src: iol, alt: "IOL Implantes Ortopédicos - Orthopedic implant manufacturer" },
    { src: plenum, alt: "Plenum - Medical device technology" },
    { src: neoortho, alt: "Neoortho - Orthopedic solutions" },
    { src: oblDental, alt: "OBL Dental - Dental device manufacturer" },
    { src: orthometric, alt: "Orthometric - Medical orthopedic systems" },
    { src: ossea, alt: "Óssea Medical Technology - Orthopedic implant manufacturer" },
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

  const clientTypes = [
    {
      title: t("clients.types.medical.title"),
      description: t("clients.types.medical.description"),
    },
    {
      title: t("clients.types.dental.title"),
      description: t("clients.types.dental.description"),
    },
    {
      title: t("clients.types.veterinary.title"),
      description: t("clients.types.veterinary.description"),
    },
    {
      title: t("clients.types.healthcare.title"),
      description: t("clients.types.healthcare.description"),
    },
    {
      title: t("clients.types.contract.title"),
      description: t("clients.types.contract.description"),
    },
  ];

  const industries = [
    t("clients.industries.orthopedic"),
    t("clients.industries.spinal"),
    t("clients.industries.dental"),
    t("clients.industries.veterinary"),
    t("clients.industries.trauma"),
    t("clients.industries.instrumentation"),
  ];

  return (
    <div className="min-h-screen">
      <div id="top" />
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 animate-fade-in">
            {t("clients.title")}
          </h1>
          <p className="text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed opacity-95">
            {t("clients.intro")}
          </p>
        </div>
      </section>

      {/* Client Logos Section */}
      <section id="client-logos" className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-4 sm:px-6">
          <div
            ref={logosAnimation.elementRef}
            className={`text-center mb-12 sm:mb-16 scroll-reveal ${logosAnimation.isVisible ? 'visible' : ''}`}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-primary">
              {t("clients.partners.title")}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary via-accent to-accent-orange mx-auto mb-4 animate-float"></div>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              {t("clients.partners.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 max-w-7xl mx-auto">
            {clientLogos.map((logo, index) => (
              <div
                key={index}
                className={`flex items-center justify-center p-4 bg-card rounded-lg border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 grayscale hover:grayscale-0 ${logosAnimation.isVisible ? 'animate-fade-in' : 'opacity-0'
                  }`}
                style={{ animationDelay: `${index * 50}ms`, willChange: logosAnimation.isVisible ? 'auto' : 'opacity, transform' }}
              >
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="max-h-12 w-auto object-contain"
                  style={{ transform: (logo as any).scale ? `scale(${(logo as any).scale})` : 'none' }}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Client Types Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4 text-primary">
            {t("clients.types.title")}
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            {t("clients.types.subtitle")}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {clientTypes.map((client, index) => (
              <div
                key={index}
                className="p-6 bg-card rounded-lg border border-border hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <h3 className="text-xl font-bold mb-3">{client.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {client.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Grid */}
      <section className="py-20 bg-gradient-to-b from-background to-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4 text-primary">
            {t("clients.industries.title")}
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            {t("clients.industries.subtitle")}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {industries.map((industry, index) => (
              <div
                key={index}
                className="p-6 bg-card rounded-lg text-center border border-border hover:shadow-md transition-shadow"
              >
                <p className="font-semibold">{industry}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Geographic Reach */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6 text-primary">
              {t("clients.reach.title")}
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              {t("clients.reach.text")}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
              <div className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                <h3 className="text-xl font-bold mb-2 text-primary">
                  {t("clients.reach.certifications.title")}
                </h3>
                <p className="text-muted-foreground">
                  {t("clients.reach.certifications.text")}
                </p>
              </div>
              <div className="p-6 bg-gradient-to-br from-accent/5 to-accent/10 rounded-lg border border-accent/20">
                <h3 className="text-xl font-bold mb-2 text-accent">
                  {t("clients.reach.global.title")}
                </h3>
                <p className="text-muted-foreground">
                  {t("clients.reach.global.text")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-primary-foreground">
            {t("clients.cta.title")}
          </h2>
          <p className="text-xl mb-8 opacity-95 max-w-2xl mx-auto">
            {t("clients.cta.text")}
          </p>
          <Link to="/assessment#top">
            <Button size="lg" variant="secondary">
              {t("clients.cta.button")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
