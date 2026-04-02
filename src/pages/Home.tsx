import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Suspense, lazy } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const DNA3D = lazy(() => import("@/components/3d/DNA3D").then(module => ({ default: module.DNA3D })));
import medicalImplantsDiagram from "@/assets/products/medical-implants-diagram.webp";
import dentalImplantsDiagram from "@/assets/products/dental-implants-diagram.webp";
import factoryHeroFull from "@/assets/facility/factory-hero-full.svg";
import isoLogo from "@/assets/certifications/iso.webp";
import surgicalInstruments from "@/assets/products/surgical-instruments-new.webp";
import orthopedicScrews from "@/assets/products/orthopedic-screws.png";
import opticalCnc from "@/assets/metrology/optical-cnc.webp";
import opticalManual from "@/assets/metrology/optical-manual.webp";
import olympusMicroscope from "@/assets/metrology/olympus-microscope.webp";
import hardnessVickers from "@/assets/metrology/hardness-vickers.webp";
import labOverview from "@/assets/metrology/lab-overview.webp";
import polimento from "@/assets/metrology/polimento.webp";
import cortadora from "@/assets/metrology/cortadora.webp";
import embutidora from "@/assets/metrology/embutidora.webp";
import { useEffect } from "react";
// DNA3D now lazy loaded at top of file
// Lazy load 3D components for better mobile performance
const MedicalGlobe = lazy(() => import("@/components/3d/MedicalGlobe").then(module => ({ default: module.MedicalGlobe })));
import { EquipmentCarousel } from "@/components/EquipmentCarousel";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useStaggerAnimation } from "@/hooks/useStaggerAnimation";
import { StatCard } from "@/components/StatCard";
import { ManufacturingTimeline } from "@/components/ManufacturingTimeline";
import { InteractiveCapabilities } from "@/components/InteractiveCapabilities";
import { MagneticButton } from "@/components/MagneticButton";
import { BlobBackground } from "@/components/BlobBackground";
import { ClientCarousel } from "@/components/ClientCarousel";
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
import vetmaker from "@/assets/clients/vetmaker-new.png";
import safira from "@/assets/clients/safira-logo.svg";
import kynsan from "@/assets/clients/kynsan.jpg";

export default function Home() {
  const {
    t
  } = useLanguage();
  const benefitsAnimation = useScrollAnimation();
  const clientsAnimation = useScrollAnimation();
  const productsAnimation = useScrollAnimation();
  const capabilitiesAnimation = useScrollAnimation();
  const benefitsStagger = useStaggerAnimation(3, {
    staggerDelay: 150
  });
  const clientLogos = [{
    src: cpmh,
    alt: "CPMH - Medical device solutions",
    width: 128,
    height: 64
  }, {
    src: evolve,
    alt: "Evolve - Medical technology innovation",
    width: 128,
    height: 64
  }, {
    src: fgm,
    alt: "FGM Dental Group - Dental device manufacturer",
    width: 128,
    height: 64
  }, {
    src: gmi,
    alt: "GMI - Global medical innovation",
    width: 128,
    height: 64
  }, {
    src: hcs,
    alt: "HCS - Healthcare solutions provider",
    width: 128,
    height: 64
  }, {
    src: impol,
    alt: "Impol - Medical instruments manufacturer",
    width: 128,
    height: 64
  }, {
    src: implanfix,
    alt: "Implanfix - Surgical materials provider",
    width: 128,
    height: 64
  }, {
    src: iol,
    alt: "IOL Implantes Ortopédicos - Orthopedic implant manufacturer",
    width: 128,
    height: 64
  }, {
    src: plenum,
    alt: "Plenum - Medical device technology",
    width: 128,
    height: 64
  }, {
    src: neoortho,
    alt: "Neoortho - Orthopedic solutions",
    width: 128,
    height: 64
  }, {
    src: oblDental,
    alt: "OBL Dental - Dental device manufacturer",
    width: 128,
    height: 64
  }, {
    src: orthometric,
    alt: "Orthometric - Medical orthopedic systems",
    width: 128,
    height: 64
  }, {
    src: ossea,
    alt: "Óssea Medical Technology - Orthopedic implant manufacturer",
    width: 128,
    height: 64
  }, {
    src: traumec,
    alt: "Traumec Health Technology - Medical equipment client",
    width: 128,
    height: 64
  }, {
    src: razek,
    alt: "Razek - Medical device solutions client",
    width: 128,
    height: 64
  }, {
    src: react,
    alt: "React - Creation in health medical technology",
    width: 128,
    height: 64
  }, {
    src: russer,
    alt: "Russer - Medical equipment manufacturer",
    width: 128,
    height: 64
  }, {
    src: techimport,
    alt: "TechImport - Medical technology client",
    width: 128,
    height: 64
  }, {
    src: toride,
    alt: "Toride - Medical manufacturing client",
    width: 128,
    height: 64
  }, {
    src: ultradent,
    alt: "Ultradent Products - Dental device manufacturer",
    width: 128,
    height: 64
  }, {
    src: vincula,
    alt: "Vincula - Medical device manufacturer client",
    width: 128,
    height: 64
  }, {
    src: vetmaker,
    alt: "Vetmaker Facilities - Veterinary orthopedic implants",
    width: 128,
    height: 64
  }, {
    src: safira,
    alt: "Safira client logo",
    width: 128,
    height: 64
  }, {
    src: kynsan,
    alt: "Kynsan client logo",
    width: 128,
    height: 64
  }];
  
  useEffect(() => {
    // Performance monitoring
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark('hero-loaded');
    }
  }, []);
  
  return <div className="min-h-screen">
      <div id="top" />
      {/* Hero Section - Factory Exterior Background */}
      <section className="relative h-[600px] sm:h-[700px] lg:h-[800px] overflow-hidden">
        {/* Factory Photo Background */}
        <div className="absolute inset-0">
          <img 
            src={factoryHeroFull} 
            alt="Lifetrek Medical factory exterior - Modern industrial facility" 
            className="w-full h-full object-cover object-center"
          />
        </div>
        
        {/* Blue Gradient Overlay - Left to Right */}
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--primary))]/80 via-[hsl(var(--primary))]/35 to-transparent" />
        
        <div className="relative container mx-auto px-4 sm:px-6 h-full flex items-center">
          <div className="max-w-2xl z-10 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight text-primary-foreground drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)] [text-shadow:_1px_1px_4px_rgb(0_0_0_/_40%)]">
              {t("home.hero.title")}
            </h1>
            <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-primary-foreground drop-shadow-[0_1.5px_5px_rgba(0,0,0,0.35)] [text-shadow:_0.5px_0.5px_3px_rgb(0_0_0_/_35%)]">
              {t("home.hero.subtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* Statistics Section - Moved from hero */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="glass-card-strong p-8 rounded-xl text-center transform transition-all duration-700 hover:scale-105">
              <div className="text-5xl md:text-6xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-pulse-glow">
                30+
              </div>
              <div className="text-base md:text-lg font-semibold text-foreground">
                {t("home.stats.experience")}
              </div>
            </div>
            
            <div className="glass-card-strong p-8 rounded-xl text-center transform transition-all duration-700 hover:scale-105" style={{
            animationDelay: "200ms"
          }}>
              <div className="text-5xl md:text-6xl font-bold mb-3 bg-gradient-to-r from-accent to-accent-orange bg-clip-text text-transparent animate-pulse-glow">
                30+
              </div>
              <div className="text-base md:text-lg font-semibold text-foreground">
                {t("home.stats.partners")}
              </div>
            </div>
            
            <div className="glass-card-strong p-8 rounded-xl text-center transform transition-all duration-700 hover:scale-105" style={{
            animationDelay: "400ms"
          }}>
              <div className="text-5xl md:text-6xl font-bold mb-3 bg-gradient-to-r from-accent-orange to-primary bg-clip-text text-transparent animate-pulse-glow">
                100%
              </div>
              <div className="text-base md:text-lg font-semibold text-foreground">
                {t("home.stats.quality")}
              </div>
            </div>
          </div>
          
          <div className="mt-6 max-w-3xl mx-auto">
            <div className="glass-card-strong p-6 rounded-xl text-center">
              <div className="text-sm md:text-base font-medium text-foreground">
                {t("home.stats.certified")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Clients Section with Carousel */}
      <section className="py-16 sm:py-20 md:py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div ref={clientsAnimation.elementRef} className={`text-center mb-12 sm:mb-16 scroll-reveal ${clientsAnimation.isVisible ? 'visible' : ''}`}>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-primary">{t("home.clients.title")}</h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              {t("home.clients.subtitle")}
            </p>
          </div>
          
          <ClientCarousel clients={clientLogos} />
          
          <div className="text-center mt-10">
            <Link to="/clients#client-logos">
              <MagneticButton variant="outline" size="lg">
                {t("home.clients.cta")}
              </MagneticButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-background to-secondary/10 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div ref={benefitsAnimation.elementRef} className={`text-center mb-12 sm:mb-16 scroll-reveal ${benefitsAnimation.isVisible ? 'visible' : ''}`}>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-primary">{t("home.whyChoose.title")}</h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              {t("home.whyChoose.subtitle")}
            </p>
          </div>
          <div ref={benefitsStagger.containerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className={`relative bg-gradient-to-b from-card via-card to-secondary/30 text-center p-10 rounded-3xl shadow-[var(--shadow-elevated)] border border-border/20 hover:-translate-y-1 transition-all duration-500 group stagger-item ${benefitsStagger.visibleItems[0] ? 'visible' : ''}`}>
              {/* Accent segment with glow */}
              <div className="absolute top-0 left-8 w-20 h-1.5 rounded-b-full bg-gradient-to-r from-primary via-primary to-primary/60"></div>
              <div className="absolute top-0 left-8 w-20 h-3 rounded-b-full bg-primary/40 blur-md"></div>
              <h3 className="text-xl font-semibold mb-3 mt-4 group-hover:text-primary transition-colors">{t("home.benefits.speed")}</h3>
              <p className="text-muted-foreground leading-relaxed">{t("home.benefits.speed.text")}</p>
            </div>

            <div className={`relative bg-gradient-to-b from-card via-card to-secondary/30 text-center p-10 rounded-3xl shadow-[var(--shadow-elevated)] border border-border/20 hover:-translate-y-1 transition-all duration-500 group stagger-item ${benefitsStagger.visibleItems[1] ? 'visible' : ''}`}>
              {/* Accent segment with glow */}
              <div className="absolute top-0 left-8 w-20 h-1.5 rounded-b-full bg-gradient-to-r from-accent via-accent to-accent/60"></div>
              <div className="absolute top-0 left-8 w-20 h-3 rounded-b-full bg-accent/40 blur-md"></div>
              <h3 className="text-xl font-semibold mb-3 mt-4 group-hover:text-accent transition-colors">{t("home.benefits.compliance")}</h3>
              <p className="text-muted-foreground leading-relaxed">{t("home.benefits.compliance.text")}</p>
            </div>

            <div className={`relative bg-gradient-to-b from-card via-card to-secondary/30 text-center p-10 rounded-3xl shadow-[var(--shadow-elevated)] border border-border/20 hover:-translate-y-1 transition-all duration-500 group stagger-item ${benefitsStagger.visibleItems[2] ? 'visible' : ''}`}>
              {/* Accent segment with glow */}
              <div className="absolute top-0 left-8 w-20 h-1.5 rounded-b-full bg-gradient-to-r from-[#E65100] via-[#E65100] to-[#E65100]/60"></div>
              <div className="absolute top-0 left-8 w-20 h-3 rounded-b-full bg-[#E65100]/40 blur-md"></div>
              <h3 className="text-xl font-semibold mb-3 mt-4 group-hover:text-accent-orange transition-colors">{t("home.benefits.precision")}</h3>
              <p className="text-muted-foreground leading-relaxed">{t("home.benefits.precision.text")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Preview Section */}
      <section className="py-24 sm:py-32 md:py-40 bg-gradient-to-b from-secondary/5 to-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div ref={productsAnimation.elementRef} className={`text-center mb-16 sm:mb-20 md:mb-24 scroll-reveal ${productsAnimation.isVisible ? 'visible' : ''}`}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-primary">{t("products.title")}</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary via-accent to-accent-orange mx-auto mb-4 animate-float"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 sm:gap-12 max-w-7xl mx-auto mb-16 sm:mb-20 md:mb-24">
            <div className="group relative overflow-hidden rounded-2xl shadow-2xl hover:shadow-primary/20 transition-all hover:-translate-y-2">
              <img src={surgicalInstruments} alt="Precision surgical instruments manufactured with advanced CNC technology" className="w-full h-64 sm:h-80 object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" width="400" height="320" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/70 to-transparent flex items-end p-8">
                <h3 className="text-xl font-bold text-primary-foreground group-hover:scale-105 transition-transform">{t("products.instruments.title")}</h3>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl shadow-2xl hover:shadow-accent/20 transition-all hover:-translate-y-2">
              <img src={medicalImplantsDiagram} alt="Medical orthopedic implants and surgical instruments product range" className="w-full h-64 sm:h-80 object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" width="400" height="320" />
              <div className="absolute inset-0 bg-gradient-to-t from-accent via-accent/70 to-transparent flex items-end p-8">
                <h3 className="text-xl font-bold text-primary-foreground group-hover:scale-105 transition-transform">{t("products.dental.title")}</h3>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl shadow-2xl hover:shadow-accent-orange/20 transition-all hover:-translate-y-2">
              <img src={dentalImplantsDiagram} alt="Dental implants and prosthetic components for dental applications" className="w-full h-64 sm:h-80 object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" width="400" height="320" />
              <div className="absolute inset-0 bg-gradient-to-t from-accent-orange via-accent-orange/70 to-transparent flex items-end p-8">
                <h3 className="text-xl font-bold text-primary-foreground group-hover:scale-105 transition-transform">{t("products.dental.title")}</h3>
              </div>
            </div>
          </div>

          <div className="text-center pt-4">
            <Link to="/products#top">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary-hover shadow-[var(--shadow-elevated)] rounded-xl px-10 py-6 text-lg">
                {t("nav.products")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Equipment Carousel Section */}
      <EquipmentCarousel />

      {/* Capabilities Preview Section */}
      

      {/* Interactive Capabilities Section */}
      <InteractiveCapabilities />

      {/* Manufacturing Timeline */}
      <ManufacturingTimeline />

      {/* Final CTA Section with 3D Globe */}
      <section className="relative py-16 sm:py-20 bg-gradient-to-br from-primary via-primary-hover to-accent text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-accent-orange rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent rounded-full blur-3xl"></div>
        </div>
        <div className="relative container mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
            <div className="text-center lg:text-left">
              <div className="w-24 h-1 bg-gradient-to-r from-accent-orange via-primary-foreground to-accent mb-6 mx-auto lg:mx-0"></div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 text-primary-foreground">
                {t("home.finalCta.title")}
              </h2>
              <p className="text-lg sm:text-xl mb-8 opacity-95">
                {t("home.finalCta.subtitle")}
              </p>
              <Link to="/contact#top">
                <MagneticButton size="lg" variant="secondary" className="shadow-xl" strength={30}>
                  {t("contact.title")}
                </MagneticButton>
              </Link>
            </div>
            <div className="hidden lg:block">
              <ErrorBoundary>
                <Suspense fallback={<div className="w-full h-[400px] bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg animate-pulse" />}>
                  <MedicalGlobe />
                </Suspense>
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </section>
    </div>;
}
