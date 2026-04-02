import { useLanguage } from "@/contexts/LanguageContext";
import isoLogo from "@/assets/certifications/iso.webp";
import cleanroom from "@/assets/facility/cleanroom.webp";
import surgicalInstruments from "@/assets/products/surgical-instruments.jpg";
import opticalCnc from "@/assets/metrology/optical-cnc.webp";
import hardnessVickers from "@/assets/metrology/hardness-vickers.webp";
import labOverview from "@/assets/metrology/lab-overview.webp";
import olympusMicroscope from "@/assets/metrology/olympus-microscope.webp";
import zeissContura from "@/assets/metrology/zeiss-contura.png";
import polimento from "@/assets/metrology/polimento.webp";
import cortadora from "@/assets/metrology/cortadora.webp";
import embutidora from "@/assets/metrology/embutidora.webp";
import citizenL20 from "@/assets/equipment/citizen-l20-new.png";
import citizenM32 from "@/assets/equipment/citizen-m32-new.png";
import tornosGT26 from "@/assets/equipment/tornos-g26.png";
import walter from "@/assets/equipment/walter.webp";
import robodrill from "@/assets/equipment/robodrill.webp";
import electropolishLine from "@/assets/equipment/electropolish-line.webp";
import laserMarking from "@/assets/equipment/laser-marking.webp";
import { PullToRefresh } from "@/components/PullToRefresh";
import { ImageGallery } from "@/components/ImageGallery";

export default function Capabilities() {
  const { t } = useLanguage();

  const handleRefresh = async () => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    window.location.reload();
  };

  const capabilities = [
    {
      title: t("capabilities.cleanrooms.title"),
      benefit: t("capabilities.cleanrooms.benefit"),
      description: t("capabilities.cleanrooms.text"),
      image: cleanroom,
    },
    {
      title: t("capabilities.metrology.title"),
      benefit: t("capabilities.metrology.benefit"),
      description: t("capabilities.metrology.text"),
      image: labOverview,
    },
    {
      title: t("capabilities.equipment.title"),
      benefit: t("capabilities.equipment.benefit"),
      description: t("capabilities.equipment.text"),
      image: citizenM32,
    },
    {
      title: t("capabilities.finishing.title"),
      benefit: t("capabilities.finishing.benefit"),
      description: t("capabilities.finishing.text"),
      image: electropolishLine,
    },
  ];

  const cncMachines = [
    { image: citizenL20, name: "Citizen L20-VIII LFV", category: t("equipment.category.swiss") },
    { image: citizenM32, name: "Citizen M32", category: t("equipment.category.swiss") },
    { image: tornosGT26, name: "Tornos GT-26", category: t("equipment.category.swiss") },
    { image: walter, name: "Walter Helitronic", category: t("equipment.category.grinder") },
    { image: robodrill, name: "FANUC Robodrill", category: t("equipment.category.machining") },
  ];

  const metrologyEquipment = [
    { image: zeissContura, name: "Zeiss Contura", category: t("equipment.category.measurement") },
    { image: opticalCnc, name: t("equipment.name.optical"), category: t("equipment.category.measurement") },
    { image: hardnessVickers, name: t("equipment.name.hardness"), category: t("equipment.category.testing") },
    { image: olympusMicroscope, name: t("equipment.name.microscope"), category: t("equipment.category.analysis") },
  ];

  const labEquipment = [
    { image: polimento, name: t("equipment.name.polishing"), category: t("equipment.category.sampleprep") },
    { image: cortadora, name: t("equipment.name.cutting"), category: t("equipment.category.sampleprep") },
    { image: embutidora, name: t("equipment.name.mounting"), category: t("equipment.category.sampleprep") },
  ];

  const finishingEquipment = [
    { image: electropolishLine, name: t("equipment.name.electropolish"), category: t("equipment.category.surface") },
    { image: laserMarking, name: t("equipment.name.laser"), category: t("equipment.category.identification") },
  ];

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen">
      <div id="top" />
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-8 sm:py-10 md:py-12">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 animate-fade-in max-w-4xl mx-auto">
            {t("capabilities.title")}
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed opacity-95">
            {t("capabilities.subtitle")}
          </p>
        </div>
      </section>

      {/* Certifications & Quality */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-background via-secondary/10 to-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-primary">{t("capabilities.certifications")}</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary via-accent to-accent-orange mx-auto mb-6"></div>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Qualidade certificada internacionalmente e capacidade de exportação para mercados globais
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* ISO Certification Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-card to-accent/5 p-8 border border-border/50 shadow-[var(--shadow-elevated)] hover:shadow-[var(--shadow-premium)] transition-all duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-accent/10 to-transparent rounded-tr-full" />

              <div className="relative z-10">
                <div className="mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Qualidade Certificada</h3>
                    <p className="text-sm text-muted-foreground">Padrão internacional</p>
                  </div>
                </div>

                <div className="flex items-center justify-center p-6 bg-white rounded-xl shadow-sm mb-6">
                  <img
                    src={isoLogo}
                    alt="ISO 13485:2016 medical device quality management"
                    className="h-20 object-contain"
                    loading="lazy"
                  />
                </div>

                <h4 className="font-bold text-lg mb-2">{t("capabilities.iso")}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Sistema de gestão de qualidade para dispositivos médicos, garantindo conformidade regulatória e rastreabilidade completa.
                </p>
              </div>
            </div>

            {/* Export Capability Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/5 via-card to-accent-orange/5 p-8 border border-border/50 shadow-[var(--shadow-elevated)] hover:shadow-[var(--shadow-premium)] transition-all duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-accent/10 to-transparent rounded-bl-full" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-accent-orange/10 to-transparent rounded-tr-full" />

              <div className="relative z-10">
                <div className="mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Capacidade de Exportação</h3>
                    <p className="text-sm text-muted-foreground">Mercados globais</p>
                  </div>
                </div>

                <div className="flex items-center justify-center p-6 bg-gradient-to-br from-accent/5 to-accent-orange/5 rounded-xl mb-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold bg-gradient-to-r from-accent to-accent-orange bg-clip-text text-transparent mb-1">
                      Global
                    </div>
                    <p className="text-sm text-muted-foreground">Alcance Internacional</p>
                  </div>
                </div>

                <h4 className="font-bold text-lg mb-2">Exportação Internacional</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Experiência comprovada em exportação para América Latina, Europa e América do Norte, atendendo às normas regulatórias de cada mercado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-background to-secondary/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="space-y-16 sm:space-y-20 md:space-y-24">
            {capabilities.map((capability, index) => (
              <div
                key={index}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center ${
                  index % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
              >
                <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 text-primary">{capability.title}</h2>
                  <p className="text-lg sm:text-xl font-semibold text-primary mb-4">{capability.benefit}</p>
                  <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                    {capability.description}
                  </p>
                </div>
                
                <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                  <img
                    src={capability.image}
                    alt={`${capability.title} facility`}
                    className="w-full rounded-2xl shadow-2xl hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    width="600"
                    height="400"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipment Showcase */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          {/* CNC Machines */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-12 text-primary">
              {t("capabilities.equipment.cnc.title")}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {cncMachines.map((machine, index) => (
                <div key={index} className="bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="aspect-square bg-secondary/30 flex items-center justify-center p-4">
                    <img
                      src={machine.image}
                      alt={machine.name}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-sm mb-1">{machine.name}</h3>
                    <p className="text-xs text-muted-foreground">{machine.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Metrology Equipment */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-12 text-primary">
              {t("capabilities.equipment.metrology.title")}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {metrologyEquipment.map((equipment, index) => (
                <div key={index} className="bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="aspect-square bg-secondary/30 flex items-center justify-center p-4">
                    <img
                      src={equipment.image}
                      alt={equipment.name}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-sm mb-1">{equipment.name}</h3>
                    <p className="text-xs text-muted-foreground">{equipment.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sample Prep Equipment */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-primary">
              {t("capabilities.equipment.sample.title")}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {labEquipment.map((equipment, index) => (
                <div key={index} className="bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="aspect-square bg-secondary/30 flex items-center justify-center p-4">
                    <img
                      src={equipment.image}
                      alt={equipment.name}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-sm mb-1">{equipment.name}</h3>
                    <p className="text-xs text-muted-foreground">{equipment.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Finishing Equipment */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-primary">
              {t("capabilities.equipment.finishing.title")}
            </h2>
            <div className="grid grid-cols-2 gap-6 max-w-3xl mx-auto">
              {finishingEquipment.map((equipment, index) => (
                <div key={index} className="bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="aspect-video bg-secondary/30 flex items-center justify-center p-4">
                    <img
                      src={equipment.image}
                      alt={equipment.name}
                      className="w-full h-full object-cover rounded"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-sm mb-1">{equipment.name}</h3>
                    <p className="text-xs text-muted-foreground">{equipment.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
    </PullToRefresh>
  );
}
