import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { BlobBackground } from "@/components/BlobBackground";
import { MagneticButton } from "@/components/MagneticButton";
import { Link } from "react-router-dom";
import reception from "@/assets/facility/reception.webp";
import factoryHero from "@/assets/facility/factory-hero-full.svg";
export default function About() {
  const {
    t
  } = useLanguage();
  const missionAnimation = useScrollAnimation();
  const valuesAnimation = useScrollAnimation();
  const ctaAnimation = useScrollAnimation();
  const visionPoints = [
    t("about.vision.quality"),
    t("about.vision.innovation"),
    t("about.vision.partnerships")
  ];
  const values = [{
    title: t("about.values.excellence"),
    description: t("about.values.excellence.text"),
    borderColor: "border-primary",
    iconBg: "bg-primary",
    textColor: "text-primary"
  }, {
    title: t("about.values.innovation"),
    description: t("about.values.innovation.text"),
    borderColor: "border-accent-orange",
    iconBg: "bg-accent-orange",
    textColor: "bg-gradient-to-r from-accent-orange to-accent-orange bg-clip-text text-transparent"
  }, {
    title: t("about.values.ethics"),
    description: t("about.values.ethics.text"),
    borderColor: "border-green-600",
    iconBg: "bg-green-600",
    textColor: "bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent"
  }, {
    title: t("about.values.respect"),
    description: t("about.values.respect.text"),
    borderColor: "border-primary",
    iconBg: "bg-primary",
    textColor: "text-primary"
  }];
  return <div className="min-h-screen">
      <div id="top" />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[image:var(--gradient-hero)] text-primary-foreground py-5 sm:py-8 md:py-10">
        <BlobBackground />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-bold mb-6 animate-fade-in">
              {t("about.title")}
            </h1>
            <p className="text-xl md:text-2xl leading-relaxed animate-fade-in animate-delay-200 opacity-95 mb-8">
              {t("about.intro")}
            </p>
            
          </div>
        </div>
      </section>

      {/* Mission & Vision with Images */}
      <section ref={missionAnimation.elementRef} className="py-20 sm:py-32 relative overflow-hidden">
        <BlobBackground />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          {/* Mission */}
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-32 scroll-reveal ${missionAnimation.isVisible ? 'visible' : ''}`}>
            <div>
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">{t("about.mission.title")}</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                {t("about.mission.text")}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-6 rounded-xl text-center">
                  <div className="text-3xl font-bold text-primary mb-2">30+</div>
                  <div className="text-sm text-muted-foreground">{t("about.stats.years")}</div>
                </div>
                <div className="glass-card p-6 rounded-xl text-center">
                  <div className="text-3xl font-bold text-accent mb-2">ISO</div>
                  <div className="text-sm text-muted-foreground">{t("about.stats.iso")}</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <img src={reception} alt="Lifetrek Medical modern facility reception" className="rounded-2xl shadow-[var(--shadow-premium)] hover:scale-105 transition-transform duration-500" loading="lazy" />
            </div>
          </div>

          {/* Vision */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="order-2 lg:order-1 relative">
              <img src={factoryHero} alt="Lifetrek Medical manufacturing facility exterior" className="rounded-2xl shadow-[var(--shadow-premium)] hover:scale-105 transition-transform duration-500" loading="lazy" />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">{t("about.vision.title")}</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                {t("about.vision.text")}
              </p>
              <ul className="list-none space-y-3">
                {visionPoints.map((point, index) => <li key={index} className="text-muted-foreground leading-relaxed">
                    {point}
                  </li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section ref={valuesAnimation.elementRef} className="py-20 sm:py-32 bg-background relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className={`text-center mb-16 scroll-reveal ${valuesAnimation.isVisible ? 'visible' : ''}`}>
            <h2 className="font-bold mb-6 bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
              {t("about.values.title")}
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              {t("about.values.intro")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => <div key={index} className={`glass-card p-10 rounded-xl hover:scale-105 transition-all duration-500 border-l-4 ${value.borderColor} scroll-reveal ${valuesAnimation.isVisible ? 'visible' : ''}`} style={{
            transitionDelay: `${index * 100}ms`
          }}>
                <h3 className={`text-2xl font-bold mb-4 ${value.textColor}`}>{value.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-lg">{value.description}</p>
              </div>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section ref={ctaAnimation.elementRef} className="py-20 sm:py-32 bg-gradient-to-br from-primary via-primary-hover to-accent text-primary-foreground relative overflow-hidden">
        <BlobBackground />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className={`max-w-4xl mx-auto text-center scroll-reveal ${ctaAnimation.isVisible ? 'visible' : ''}`}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-primary-foreground">
              {t("about.cta.title")}
            </h2>
            <p className="text-xl mb-8 opacity-95">
              {t("about.cta.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/capabilities#top">
                <MagneticButton size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 border-white text-white shadow-xl">
                  {t("about.cta.explore")}
                </MagneticButton>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>;
}