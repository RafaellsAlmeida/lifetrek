import { useLanguage } from "@/contexts/LanguageContext";
import cleanroom from "@/assets/facility/clean-room-5.png";
import reception from "@/assets/facility/office-visit.png";
import citizenL20X from "@/assets/equipment/citizen-l20-x.png";
import citizenL32 from "@/assets/equipment/citizen-l32.png";
import walter from "@/assets/equipment/walter.webp";
import tornosG26 from "@/assets/equipment/tornos-g26.png"; 
import tornosG13 from "@/assets/equipment/tornos-g13.png";
import doosanImg from "@/assets/equipment/doosan-turning.png";
import espritCam from "@/assets/software/esprit-cam.png";
import robodrill from "@/assets/equipment/fanuc-robodrill.png";
import laserMarking from "@/assets/facility/laser-marking.png";
import electropolishLine from "@/assets/facility/electropolish-line-new.jpg";
import waterTreatment from "@/assets/facility/water-treatment.png";
import grindingRoom from "@/assets/facility/grinding-room.jpg";

// Metrology Imports
import zeissContura from "@/assets/metrology/zeiss-contura.png";
import hardnessTester from "@/assets/metrology/hardness-tester.png";
import opticalCnc from "@/assets/metrology/optical-cnc.png";
import microscope from "@/assets/metrology/metrology-microscope.png";
import wireEdm from "@/assets/equipment/wire-edm.jpg";
import cutter from "@/assets/equipment/cutter.png";
import mountingPress from "@/assets/equipment/mounting-press.png";

export default function Infrastructure() {
  const { t } = useLanguage();

  const cncMachines = [
    {
      image: doosanImg,
      name: "Doosan Lynx 2100",
      category: "CNC Turning Center",
    },
    {
      image: citizenL32,
      name: "Citizen L32",
      category: "Swiss-Type CNC Lathe (High Capacity)",
    },
    {
      image: citizenL20X,
      name: "Citizen L20-X",
      category: "Swiss-Type CNC Lathe (5-Axis)",
    },
    {
      image: tornosG26,
      name: "Tornos Swiss GT 26",
      category: "Swiss-Type CNC Lathe",
    },
    {
      image: tornosG13,
      name: "Tornos Swiss GT 13",
      category: "Swiss-Type CNC Lathe",
    },
    {
      image: walter,
      name: "Walter Helitronic",
      category: "Tool Grinding Machine",
    },
    {
      image: robodrill,
      name: "FANUC Robodrill",
      category: "CNC Machining Center",
    },
    {
      image: grindingRoom,
      name: "Grinding Center",
      category: "Sala de Retíficas Precision Grinding",
    },
    {
      image: wireEdm,
      name: "Wire EDM",
      category: "Electrical Discharge Machining",
    },
  ];

  const metrology = [
      {
        image: zeissContura,
        name: "Zeiss Contura",
        category: "CMM Bridge Machine",
      },
      {
          image: opticalCnc,
          name: "Optical Measurement CNC",
          category: "Vision System",
      },
      {
          image: hardnessTester,
          name: "Hardness Tester",
          category: "Material Validation",
      },
      {
          image: microscope,
          name: "High-Res Microscope",
          category: "Visual Inspection",
      },
      {
          image: cutter,
          name: "Precision Cutter",
          category: "Metallography Prep",
      },
      {
          image: mountingPress,
          name: "Mounting Press",
          category: "Metallography Prep",
      },
  ];

  const software = [
    {
      image: espritCam,
      name: "ESPRIT CAM System",
      category: "CAD/CAM Software",
    },
  ];

  const finishingEquipment = [
    {
      image: electropolishLine,
      name: "Electropolish Line",
      category: "Surface Treatment System",
    },
    {
      image: waterTreatment,
      name: "Water Treatment",
      category: "Industrial Water Filtration",
    },
    {
      image: laserMarking,
      name: "Laser Marking",
      category: "Product Identification System",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[image:var(--gradient-hero)] text-primary-foreground py-11 sm:py-13 md:py-21">
        <div className="absolute inset-0 bg-[image:var(--gradient-subtle)] opacity-30" />
        <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center">
          <h1 className="font-bold animate-fade-in">
            {t("infrastructure.title")}
          </h1>
        </div>
      </section>

      {/* Cleanrooms */}
      <section className="py-16 sm:py-20 md:py-32">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-center mb-16 sm:mb-20 lg:mb-32">
            <div>
              <div className="h-1 w-16 bg-gradient-to-r from-accent to-accent/50 mb-8 rounded-full" />
              <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-primary">
                Fabricação em Sala Limpa ISO 7
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Duas salas limpas de 60m² entre as mais avançadas do Brasil—garantindo produção de componentes para implantes e instrumentos críticos.
              </p>
            </div>
            <div>
              <img
                src={cleanroom}
                alt="ISO 7 certified cleanroom for medical device manufacturing"
                className="rounded-2xl shadow-[var(--shadow-premium)] hover:scale-105 transition-transform duration-500"
                loading="lazy"
                width="600"
                height="400"
              />
            </div>
          </div>

          {/* Equipment */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <img
                src={reception}
                alt="Modern medical manufacturing facility reception and offices"
                className="rounded-2xl shadow-[var(--shadow-premium)] hover:scale-105 transition-transform duration-500"
                loading="lazy"
                width="600"
                height="400"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="h-1 w-16 bg-gradient-to-r from-primary to-primary/50 mb-8 rounded-full" />
              <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-primary">
                {t("infrastructure.equipment.title")}
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                {t("infrastructure.equipment.text")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Highlights */}
      <section className="py-32 bg-[image:var(--gradient-premium)]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-10 lg:p-12 bg-card rounded-2xl shadow-[var(--shadow-elevated)] hover:shadow-[var(--shadow-premium)] transition-all duration-500 hover:-translate-y-1 border border-border/50">
              <div className="h-1 w-12 bg-gradient-to-r from-primary to-primary/50 mx-auto mb-6 rounded-full" />
              <h3 className="text-2xl font-bold mb-4">
                {t("infrastructure.technology")}
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {t("infrastructure.technology.text")}
              </p>
            </div>

            <div className="text-center p-10 lg:p-12 bg-card rounded-2xl shadow-[var(--shadow-elevated)] hover:shadow-[var(--shadow-premium)] transition-all duration-500 hover:-translate-y-1 border border-border/50">
              <div className="h-1 w-12 bg-gradient-to-r from-accent to-accent/50 mx-auto mb-6 rounded-full" />
              <h3 className="text-2xl font-bold mb-4">
                {t("infrastructure.team")}
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {t("infrastructure.team.text")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CNC Machines */}
      <section className="py-32 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="font-bold text-center mb-6 text-primary">
            {t("infrastructure.cnc.title")}
          </h2>
          <p className="text-center text-muted-foreground text-lg md:text-xl mb-20 max-w-3xl mx-auto leading-relaxed">
            {t("infrastructure.cnc.subtitle")}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {cncMachines.map((machine, index) => (
              <div
                key={index}
                className="group bg-card rounded-2xl overflow-hidden shadow-[var(--shadow-elevated)] hover:shadow-[var(--shadow-premium)] transition-all duration-500 hover:-translate-y-2 border border-border/50"
              >
                <div className="aspect-square bg-gradient-to-br from-secondary/50 to-secondary/20 flex items-center justify-center p-6">
                  <img
                    src={machine.image}
                    alt={machine.name}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{machine.name}</h3>
                  <p className="text-sm text-muted-foreground">{machine.category}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Metrology (New Section) */}
          <h3 className="text-2xl font-bold text-center mb-8">
            Advanced Metrology & Quality Control
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20 max-w-6xl mx-auto">
            {metrology.map((item, index) => (
              <div
                key={index}
                className="bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="aspect-square bg-secondary/30 flex items-center justify-center p-6">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.category}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Software */}
          <h3 className="text-2xl font-bold text-center mb-8">
            {t("infrastructure.software.title")}
          </h3>
          
          <div className="grid grid-cols-1 max-w-md mx-auto mb-12">
            {software.map((item, index) => (
              <div
                key={index}
                className="bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="aspect-video bg-secondary/30 flex items-center justify-center p-6">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.category}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Finishing Equipment */}
          <h3 className="text-2xl font-bold text-center mb-8">
            {t("infrastructure.finishing.title")}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {finishingEquipment.map((item, index) => (
              <div
                key={index}
                className="bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="aspect-video bg-secondary/30 flex items-center justify-center p-6">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
