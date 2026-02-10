import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import surgicalInstruments from "@/assets/products/surgical-instruments-new.webp";
import opticalCnc from "@/assets/metrology/optical-cnc.webp";
import opticalManual from "@/assets/metrology/optical-manual.webp";
import hardnessVickers from "@/assets/metrology/hardness-vickers.webp";
import olympusMicroscope from "@/assets/metrology/olympus-microscope.webp";
import labOverview from "@/assets/metrology/lab-overview.webp";
import polimento from "@/assets/metrology/polimento.webp";
import cortadora from "@/assets/metrology/cortadora.webp";
import embutidora from "@/assets/metrology/embutidora.webp";
import doosan from "@/assets/equipment/doosan-new.png";
import citizenM32 from "@/assets/equipment/citizen-new.png";
import citizenL20 from "@/assets/equipment/citizen-l20-new.png";
import tornosGT26 from "@/assets/equipment/tornos-gt26.webp";
import walter from "@/assets/equipment/walter.webp";
import robodrill from "@/assets/equipment/robodrill.webp";
import electropolishLine from "@/assets/equipment/electropolish-line-new.png";
import laserMarking from "@/assets/equipment/laser-marking.webp";
import zeissContura from "@/assets/metrology/zeiss-contura-new.png";

import cleanRoomHero from "@/assets/facility/cleanroom-hero.webp";
import cleanRoom1 from "@/assets/facility/clean-room-1.png";
import cleanRoom2 from "@/assets/facility/clean-room-2.png";
import cleanRoom3 from "@/assets/facility/clean-room-3.png";
import cleanRoom5 from "@/assets/facility/clean-room-5.png";
import cleanRoom6 from "@/assets/facility/clean-room-6.png";
import cleanRoom7 from "@/assets/facility/clean-room-7.png";
import cleanRoomExterior from "@/assets/facility/clean-room-exterior.jpg";

type EquipmentCategory = "Metrology" | "CNC" | "Sample Prep" | "Finishing" | "Clean Room";

interface EquipmentItem {
  image: string;
  title: string;
  subtitle: string;
  category: EquipmentCategory;
  specs?: string[];
}

const getEquipmentItems = (t: (key: string) => string): EquipmentItem[] => [
  { 
    image: zeissContura, 
    title: t("equipment.name.zeiss"), 
    subtitle: t("equipment.subtitle.zeiss"),
    category: "Metrology",
    specs: [
      t("equipment.specs.zeiss.accuracy"),
      t("equipment.specs.zeiss.measuring"),
      t("equipment.specs.zeiss.automated")
    ]
  },
  { 
    image: doosan, 
    title: t("equipment.name.doosan"), 
    subtitle: t("equipment.subtitle.doosan"),
    category: "CNC",
    specs: [
      t("equipment.specs.doosan.diameter"),
      t("equipment.specs.doosan.length"),
      t("equipment.specs.doosan.tooling")
    ]
  },
  { 
    image: opticalCnc, 
    title: t("equipment.name.opticalcnc"), 
    subtitle: t("equipment.subtitle.opticalcnc"),
    category: "Metrology",
    specs: [
      t("equipment.specs.opticalcnc.readout"),
      t("equipment.specs.opticalcnc.magnification"),
      t("equipment.specs.opticalcnc.profile")
    ]
  },
  { 
    image: hardnessVickers, 
    title: t("equipment.name.vickers"), 
    subtitle: t("equipment.subtitle.vickers"),
    category: "Metrology",
    specs: [
      t("equipment.specs.vickers.range"),
      t("equipment.specs.vickers.display"),
      t("equipment.specs.vickers.automated")
    ]
  },
  { 
    image: laserMarking, 
    title: t("equipment.name.laser"), 
    subtitle: t("equipment.subtitle.laser"),
    category: "Finishing",
    specs: [
      t("equipment.specs.laser.fiber"),
      t("equipment.specs.laser.permanent"),
      t("equipment.specs.laser.contrast")
    ]
  },
  { 
    image: olympusMicroscope, 
    title: t("equipment.name.olympus"), 
    subtitle: t("equipment.subtitle.olympus"),
    category: "Metrology",
    specs: [
      t("equipment.specs.olympus.magnification"),
      t("equipment.specs.olympus.imaging"),
      t("equipment.specs.olympus.grain")
    ]
  },
  { 
    image: polimento, 
    title: t("equipment.name.polishing"), 
    subtitle: t("equipment.subtitle.polishing"),
    category: "Sample Prep",
    specs: [
      t("equipment.specs.polishing.speed"),
      t("equipment.specs.polishing.wheels"),
      t("equipment.specs.polishing.finish")
    ]
  },
  { 
    image: cortadora, 
    title: t("equipment.name.cutting"), 
    subtitle: t("equipment.subtitle.cutting"),
    category: "Sample Prep",
    specs: [
      t("equipment.specs.cutting.blade"),
      t("equipment.specs.cutting.coolant"),
      t("equipment.specs.cutting.precision")
    ]
  },
  { 
    image: embutidora, 
    title: t("equipment.name.mounting"), 
    subtitle: t("equipment.subtitle.mounting"),
    category: "Sample Prep",
    specs: [
      t("equipment.specs.mounting.hot"),
      t("equipment.specs.mounting.cycle"),
      t("equipment.specs.mounting.results")
    ]
  },
  { 
    image: citizenM32, 
    title: t("equipment.name.citizenm32"), 
    subtitle: t("equipment.subtitle.citizenm32"),
    category: "CNC",
    specs: [
      t("equipment.specs.citizenm32.capacity"),
      t("equipment.specs.citizenm32.axis"),
      t("equipment.specs.citizenm32.machining")
    ]
  },
  { 
    image: citizenL20, 
    title: "Citizen L20", 
    subtitle: "Swiss-Type CNC Lathe",
    category: "CNC",
    specs: [
      "Diâmetro máximo: 20mm",
      "Controle de 9 eixos",
      "Usinagem de alta velocidade"
    ]
  },
  { 
    image: tornosGT26, 
    title: t("equipment.name.tornos"), 
    subtitle: t("equipment.subtitle.tornos"),
    category: "CNC",
    specs: [
      t("equipment.specs.tornos.capacity"),
      t("equipment.specs.tornos.spindle"),
      t("equipment.specs.tornos.geometries")
    ]
  },
  { 
    image: walter, 
    title: t("equipment.name.walter"), 
    subtitle: t("equipment.subtitle.walter"),
    category: "CNC",
    specs: [
      t("equipment.specs.walter.grinding"),
      t("equipment.specs.walter.precision"),
      t("equipment.specs.walter.automated")
    ]
  },
  { 
    image: robodrill, 
    title: t("equipment.name.robodrill"), 
    subtitle: t("equipment.subtitle.robodrill"),
    category: "CNC",
    specs: [
      t("equipment.specs.robodrill.spindle"),
      t("equipment.specs.robodrill.precision"),
      t("equipment.specs.robodrill.toolchange")
    ]
  },
  { 
    image: electropolishLine, 
    title: t("equipment.name.electropolish"), 
    subtitle: t("equipment.subtitle.electropolish"),
    category: "Finishing",
    specs: [
      t("equipment.specs.electropolish.finish"),
      t("equipment.specs.electropolish.biocompatible"),
      t("equipment.specs.electropolish.corrosion")
    ]
  },
  { 
    image: labOverview, 
    title: t("equipment.name.lab"), 
    subtitle: t("equipment.subtitle.lab"),
    category: "Metrology",
    specs: [
      t("equipment.specs.lab.climate"),
      t("equipment.specs.lab.iso"),
      t("equipment.specs.lab.comprehensive")
    ]
  },
  {
    image: cleanRoomExterior,
    title: "Módulos de Sala Limpa",
    subtitle: "Estrutura Dedicada ISO 7",
    category: "Clean Room",
    specs: [
      "4 Módulos Independentes",
      "Sistema HVAC Dedicado",
      "Área Total: 200m²"
    ]
  },
  {
    image: cleanRoomHero,
    title: "Sala Limpa ISO 7",
    subtitle: "Ambiente Controlado Certificado",
    category: "Clean Room",
    specs: [
      "Certificação ISO 14644",
      "Monitoramento Contínuo",
      "Pressão Positiva"
    ]
  },
  {
    image: cleanRoom2,
    title: "Corredor de Acesso",
    subtitle: "Área de Transição Controlada",
    category: "Clean Room",
    specs: [
      "Antecâmara Pressurizada",
      "Piso Epóxi Antiestático",
      "Iluminação LED Cleanroom"
    ]
  },
  {
    image: cleanRoom6,
    title: "Área de Trabalho",
    subtitle: "Estações de Embalagem Estéreis",
    category: "Clean Room",
    specs: [
      "Mesas Inox 316L",
      "Fluxo Laminar Classe 100",
      "Zona de Embalagem Primária"
    ]
  },
  {
    image: cleanRoom7,
    title: "Airlock de Entrada",
    subtitle: "Sistema de Descontaminação",
    category: "Clean Room",
    specs: [
      "Pass-through Interlocked",
      "Chuveiro de Ar",
      "Protocolo de Paramentação"
    ]
  },
  {
    image: cleanRoom1,
    title: "Isoladores e Pass-Through",
    subtitle: "Sistemas de Transferência Estéril",
    category: "Clean Room",
    specs: [
      "Isoladores Classe A",
      "Pass-Through com Intertravamento",
      "Esterilização por Peróxido"
    ]
  },
  {
    image: cleanRoom5,
    title: "Antecâmaras",
    subtitle: "Sistema de Portas Interlocked",
    category: "Clean Room",
    specs: [
      "Portas com Intertravamento",
      "Diferencial de Pressão",
      "Monitoramento Digital"
    ]
  },
  {
    image: cleanRoom3,
    title: "Sistema HVAC",
    subtitle: "Infraestrutura de Climatização",
    category: "Clean Room",
    specs: [
      "Filtros HEPA H14",
      "20 Trocas de Ar/Hora",
      "Controle de Umidade"
    ]
  },
];

export const EquipmentCarousel = () => {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<EquipmentCategory>("CNC");

  const categories: EquipmentCategory[] = ["CNC", "Metrology", "Sample Prep", "Finishing", "Clean Room"];
  const equipmentItems = getEquipmentItems(t);

  const filteredItems = equipmentItems.filter(item => item.category === selectedCategory);

  const getCategoryLabel = (category: EquipmentCategory) => {
    const labels: Record<EquipmentCategory, string> = {
      "Metrology": t("equipment.category.metrology"),
      "CNC": t("equipment.category.cnc"),
      "Sample Prep": t("equipment.category.sampleprep"),
      "Finishing": t("equipment.category.finishing"),
      "Clean Room": "Sala Limpa",
    };
    return labels[category];
  };

  return (
    <div className="relative py-24 sm:py-32 overflow-hidden bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(var(--primary-hover))] to-[hsl(var(--accent))]">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-accent-orange/20 blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
      </div>
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-6 text-white">
          {t("equipment.title")}
        </h2>
        <p className="text-lg sm:text-xl text-center text-white/90 max-w-3xl mx-auto mb-12">
          {t("equipment.subtitle")}
        </p>
        
        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? "bg-primary text-primary-foreground shadow-lg scale-105"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {getCategoryLabel(category)}
            </button>
          ))}
        </div>

        {/* Equipment Carousel */}
        <Carousel
          opts={{
            align: "start",
            loop: filteredItems.length > 3,
            dragFree: true,
            containScroll: "trimSnaps",
          }}
          className="w-full max-w-7xl mx-auto"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {filteredItems.map((item, index) => (
              <CarouselItem key={index} className="pl-2 md:pl-4 basis-[85%] sm:basis-[70%] md:basis-1/2 lg:basis-1/3">
                <div className="group h-full">
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-white shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-[1.02]">
                    <img
                      src={item.image}
                      alt={`${item.title} - ${item.subtitle}`}
                      className="w-full h-full object-contain p-8 group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      decoding="async"
                      width="400"
                      height="400"
                    />
                    
                    {/* Specifications Overlay */}
                    {item.specs && (
                      <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--primary))] via-[hsl(var(--primary))]/98 to-[hsl(var(--primary))]/95 text-white p-8 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <h4 className="font-bold text-xl mb-4">{item.title}</h4>
                        <ul className="space-y-2">
                          {item.specs.map((spec, i) => (
                            <li key={i} className="text-sm flex items-start">
                              <span className="mr-2 text-accent">•</span>
                              <span>{spec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-12 bg-white/90 hover:bg-white" />
          <CarouselNext className="hidden md:flex -right-12 bg-white/90 hover:bg-white" />
        </Carousel>
      </div>
    </div>
  );
};