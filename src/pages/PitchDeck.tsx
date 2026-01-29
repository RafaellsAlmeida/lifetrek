// @ts-nocheck
// Cleaned PitchDeck.tsx
import { useRef, useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  Check,
  CheckCircle,
  ArrowRight,
  AlertTriangle,
  Shield,
  FileX,
  Clock,
  Target,
  Microscope,
  Bone,
  Scissors,
  Smile,
  PawPrint,
  Zap,
  Factory,
  Layers,
  Cog,
  Sparkles,
  Package,
  Info,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { BlobBackground } from "@/components/BlobBackground";
import { StatCard } from "@/components/StatCard";
import { MagneticButton } from "@/components/MagneticButton";
import { toPng } from "html-to-image";
import PptxGenJS from "pptxgenjs";
import { toast } from "sonner";

// Assets
import logo from "@/assets/logo-optimized.webp";
import isoLogo from "@/assets/certifications/iso.webp";
import cleanroomHero from "@/assets/facility/cleanroom-hero.webp";
import factoryExterior from "@/assets/facility/exterior-hero.webp";
import factoryHeroFull from "@/assets/facility/factory-hero-full.svg";

// Equipment
import citizenL20 from "@/assets/equipment/citizen-l20.webp";
import citizenM32 from "@/assets/equipment/citizen-m32-new.png";
import doosanNew from "@/assets/equipment/doosan-new.png";
import robodrill from "@/assets/equipment/robodrill.webp";
import zeissContura from "@/assets/metrology/zeiss-contura.webp";
import opticalCNC from "@/assets/metrology/optical-cnc.webp";
import laserMarking from "@/assets/equipment/laser-marking.webp";
import electropolishLine from "@/assets/equipment/electropolish-line.webp";

// Products
import medicalScrew from "@/assets/products/medical-screw-hero.webp";
import dentalInstruments from "@/assets/products/dental-instruments-hero.webp";
import surgicalDrills from "@/assets/products/surgical-drills-optimized.webp";
import veterinaryImplant1 from "@/assets/products/veterinary-implant-1.jpg";
import labOverview from "@/assets/metrology/lab-overview.webp";

// Clients
import cpmhNew from "@/assets/clients/cpmh-new.png";
import evolveNew from "@/assets/clients/evolve-new.png";
import fgmNew from "@/assets/clients/fgm-new.png";
import gmiNew from "@/assets/clients/gmi-new.png";
import hcsNew from "@/assets/clients/hcs-new.png";
import impolNew from "@/assets/clients/impol-new.png";
import implanfixNew from "@/assets/clients/implanfix-new.png";
import iolNew from "@/assets/clients/iol-new.png";
import plenumNew from "@/assets/clients/plenum-new.png";
import neoorthoNew from "@/assets/clients/neoortho-new.jpg";
import oblDentalNew from "@/assets/clients/obl-dental-new.jpg";
import orthometricNew from "@/assets/clients/orthometric-new.png";
import osseaNew from "@/assets/clients/ossea-new.jpg";
import traumecNew2 from "@/assets/clients/traumec-new-2.png";
import razekNew from "@/assets/clients/razek-new.png";
import reactNew from "@/assets/clients/react-new.png";
import russerNew from "@/assets/clients/russer-new.png";
import techimportNew from "@/assets/clients/techimport-new.png";
import torideNew from "@/assets/clients/toride-new.png";
import ultradentNew from "@/assets/clients/ultradent-new.png";
import vinculaNew from "@/assets/clients/vincula-new.png";

// Glass Card Component
const GlassCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`bg-background/50 backdrop-blur-2xl border border-border/20 rounded-2xl shadow-[0_8px_16px_-4px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] group hover:scale-[1.01] hover:-translate-y-1 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] transition-all duration-700 ${className}`}
  >
    {children}
  </div>
);

// Heading Variations
const HeadingGradient = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent ${className}`}>
    {children}
  </h2>
);

const HeadingWithLine = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-6xl font-bold text-primary relative inline-block ${className}`}>
    {children}
    {/* Solid color segments for PDF compatibility */}
    <div className="absolute -bottom-2 left-0 flex h-1">
      <div className="w-12 bg-accent-orange" />
      <div className="w-16 bg-accent" />
      <div className="w-12 bg-accent/50" />
    </div>
  </h2>
);

const PitchDeck = () => {
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const slideRef = useRef<HTMLDivElement | null>(null);

  const clientLogos = [
    { src: cpmhNew, name: "CPMH" },
    { src: evolveNew, name: "Evolve" },
    { src: fgmNew, name: "FGM" },
    { src: gmiNew, name: "GMI" },
    { src: hcsNew, name: "HCS" },
    { src: impolNew, name: "Impol" },
    { src: implanfixNew, name: "Implanfix" },
    { src: iolNew, name: "IOL" },
    { src: plenumNew, name: "Plenum" },
    { src: neoorthoNew, name: "Neoortho" },
    { src: oblDentalNew, name: "OBL Dental" },
    { src: orthometricNew, name: "Orthometric" },
    { src: osseaNew, name: "Óssea" },
    { src: traumecNew2, name: "Traumec" },
    { src: razekNew, name: "Razek" },
    { src: reactNew, name: "React" },
    { src: russerNew, name: "Russer" },
    { src: techimportNew, name: "TechImport" },
    { src: torideNew, name: "Toride" },
    { src: ultradentNew, name: "Ultradent" },
    { src: vinculaNew, name: "Vincula" },
  ];

  const slides = [
    // Slide 1 - Cover Premium
    {
      id: 1,
      content: (
        <div data-slide className="relative h-screen min-h-[800px] w-full flex flex-col items-center justify-center overflow-hidden page-break-after-always">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${factoryHeroFull})` }} />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/80 to-primary-dark/95" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          <div className="relative z-10 text-center space-y-8 px-16 max-w-7xl animate-in fade-in duration-700">
            <h1 className="text-7xl font-bold mb-6 tracking-tight text-white relative">
              Lifetrek Medical
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-accent-orange/60 to-transparent" />
            </h1>
            <h2 className="text-3xl font-light max-w-4xl mx-auto leading-relaxed text-white">
              Manufatura Contratada ISO 13485 para Implantes e Instrumentos Cirúrgicos
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
              Do CAD ao componente embalado em sala limpa, com qualidade zero-defeito.
            </p>
          </div>
        </div>
      ),
    },
    // Slide 2 - Para Quem Fabricamos
    {
      id: 2,
      content: (
        <div data-slide className="h-screen min-h-[800px] w-full bg-background overflow-hidden relative page-break-after-always">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="relative max-w-7xl mx-auto px-16 py-16 h-full flex flex-col justify-center">
            <HeadingWithLine className="mb-4">Para Quem Fabricamos</HeadingWithLine>
            <p className="text-xl text-muted-foreground mb-10 mt-2">Parceiros que não podem comprometer a vida dos seus pacientes</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              <div className="space-y-6">
                {[
                  { title: "OEMs de Implantes Ortopédicos", desc: "Trauma, coluna, extremidades superiores e inferiores" },
                  { title: "Fabricantes de Dispositivos Dentais", desc: "Implantes, instrumentos e componentes protéticos" },
                  { title: "Empresas de Implantes Veterinários", desc: "Dispositivos ortopédicos para animais de grande e pequeno porte" }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 group relative">
                    <Check className="text-accent-orange w-6 h-6 mt-1 flex-shrink-0" strokeWidth={1.5} />
                    <div className="border-l-2 border-primary/10 pl-4">
                      <h3 className="text-2xl font-semibold mb-2 text-foreground">{item.title}</h3>
                      <p className="text-lg text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-6">
                {[
                  { title: "Hospitais e Sistemas de Saúde", desc: "Instrumentos cirúrgicos customizados e ferramentas específicas" },
                  { title: "Parceiros OEM / Contract Manufacturing", desc: "Empresas que precisam de capacidade de manufatura certificada ISO 13485" }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 group relative">
                    <Check className="text-accent w-6 h-6 mt-1 flex-shrink-0" strokeWidth={1.5} />
                    <div className="border-l-2 border-accent/10 pl-4">
                      <h3 className="text-2xl font-semibold mb-2 text-foreground">{item.title}</h3>
                      <p className="text-lg text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <GlassCard className="p-8 border-l-4 border-primary">
              <p className="text-2xl font-semibold text-foreground leading-relaxed">
                "Se seu produto entra em um corpo humano ou animal, nós fabricamos como se nossa própria vida dependesse disso."
              </p>
            </GlassCard>
          </div>
        </div>
      ),
    },
    // Slide 3 - O Problema
    {
      id: 3,
      content: (
        <div data-slide className="h-full min-h-[800px] max-h-[800px] w-full bg-gradient-to-br from-secondary/30 via-background to-background relative overflow-hidden page-break-after-always">
          <div className="relative max-w-7xl mx-auto px-16 py-16 h-full flex flex-col justify-center">
            <HeadingWithLine className="mb-4">O Problema</HeadingWithLine>
            <p className="text-xl text-muted-foreground mb-10 mt-2">Desafios comuns na manufatura de dispositivos médicos</p>
            <div className="grid grid-cols-2 gap-6">
              {[
                { Icon: AlertTriangle, title: "Qualidade Inconsistente", desc: "Tolerâncias que variam entre lotes, causando recalls e custos ocultos." },
                { Icon: FileX, title: "Documentação Fraca", desc: "Falta de rastreabilidade lote-a-lote e registros auditáveis." },
                { Icon: Clock, title: "Atrasos em Lançamentos", desc: "Lead times imprevisíveis que atrasam aprovações de mercado." },
                { Icon: Shield, title: "Riscos de Contaminação", desc: "Oficinas sem ambiente controlado que comprometem esterilidade." },
                { Icon: FileX, title: "Fornecedores sem ISO 13485", desc: "Parceiros que não entendem requisitos médicos." },
                { Icon: AlertTriangle, title: "Um Lote Ruim = Dano Permanente", desc: "Reputação destruída e processos legais custosos." }
              ].map((item, i) => (
                <div key={i} className="bg-card/50 backdrop-blur-sm border border-border/20 rounded-2xl p-8 hover:border-primary/30 transition-all duration-500">
                  <h3 className="text-2xl font-bold mb-3 text-foreground">{item.title}</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    // Slide 4 - Nossa Promessa
    {
      id: 4,
      content: (
        <div data-slide className="relative h-full min-h-[800px] max-h-[800px] w-full bg-background overflow-hidden page-break-after-always">
          <div className="absolute inset-0 bg-cover bg-center opacity-[0.08]" style={{ backgroundImage: `url(${labOverview})` }} />
          <div className="relative z-10 max-w-7xl mx-auto px-16 py-16 h-full flex flex-col justify-center">
            <HeadingGradient className="mb-4">Nossa Promessa</HeadingGradient>
            <p className="text-2xl font-light text-muted-foreground mb-12 mt-2">Lifetrek Medical = Manufatura "sem surpresas"</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { Icon: Target, title: "Foco Exclusivo Médico", desc: "30+ anos exclusivamente em implantes e instrumentos cirúrgicos." },
                { Icon: CheckCircle, title: "QMS Certificado", desc: "ISO 13485:2016 completo, com auditorias anuais." },
                { Icon: Microscope, title: "Mentalidade Zero-Defeito", desc: "CMM ZEISS 3D, inspeção óptica automatizada." },
                { Icon: Shield, title: "Pronto Para Auditoria", desc: "Rastreabilidade completa desde matéria-prima até embalagem final." }
              ].map((item, i) => (
                <GlassCard key={i} className="p-10">
                  <item.Icon className="w-12 h-12 text-primary mb-6" strokeWidth={1.5} />
                  <h3 className="text-3xl font-bold mb-4 text-foreground">{item.title}</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">{item.desc}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    // Slide 5 - O Que Fazemos
    {
      id: 5,
      content: (
        <div data-slide className="h-full min-h-[800px] max-h-[800px] w-full bg-background page-break-after-always">
          <div className="max-w-7xl mx-auto px-16 py-16 h-full flex flex-col justify-center">
            <HeadingWithLine className="mb-12">O Que Fazemos</HeadingWithLine>
            <div className="grid grid-cols-2 gap-6 mt-4">
              {[
                { bg: medicalScrew, title: "Implantes Ortopédicos", desc: "Placas e parafusos de trauma, sistemas de fusão espinhal." },
                { bg: surgicalDrills, title: "Instrumentos Cirúrgicos", desc: "Brocas, fresas, guides de perfuração." },
                { bg: dentalInstruments, title: "Dispositivos Dentais", desc: "Implantes dentários, pilares protéticos." },
                { bg: veterinaryImplant1, title: "Implantes Veterinários", desc: "Dispositivos ortopédicos para animais." }
              ].map((item, i) => (
                <GlassCard key={i} className="p-10 relative overflow-hidden border-l-4 border-primary/20">
                  <div 
                    className="absolute inset-0 bg-cover bg-center" 
                    style={{ 
                      backgroundImage: `url(${item.bg})`,
                      maskImage: 'linear-gradient(to right, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0.15) 100%)',
                      WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0.15) 100%)'
                    }} 
                  />
                  <h3 className="relative z-10 text-3xl font-bold mb-4 text-foreground">{item.title}</h3>
                  <p className="relative z-10 text-lg text-muted-foreground leading-relaxed">{item.desc}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    // Slide 6 - Como Fazemos
    {
      id: 6,
      content: (
        <div data-slide className="h-full min-h-[800px] max-h-[800px] w-full bg-background relative overflow-hidden page-break-after-always">
          <div className="relative max-w-7xl mx-auto px-16 py-12 h-full flex flex-col justify-center">
            <HeadingGradient className="mb-3">Como Fazemos</HeadingGradient>
            <p className="text-xl text-muted-foreground mb-8 mt-2">Do desenho a componentes sterile-ready em 6 etapas</p>
            <div className="grid grid-cols-6 gap-3">
              {[
                { num: 1, title: "DFM & Análise", desc: "CAD/CAM review" },
                { num: 2, title: "Usinagem CNC", desc: "Swiss-type e multi-axis" },
                { num: 3, title: "Tratamento Térmico", desc: "Fornos controlados" },
                { num: 4, title: "Acabamento", desc: "Electropolish" },
                { num: 5, title: "Metrologia", desc: "CMM 3D e óptica" },
                { num: 6, title: "Embalagem", desc: "ISO 7 sterile-ready" }
              ].map((item, i) => (
                <div key={i} className="relative z-10 group">
                  <GlassCard className="p-4 h-full border border-border/20 hover:border-primary/20 transition-all duration-500">
                    <div className="w-10 h-10 rounded-full bg-primary/5 border border-primary/20 flex items-center justify-center mb-3 mx-auto">
                      <span className="text-lg font-bold text-primary">{item.num}</span>
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-1 text-center">{item.title}</h3>
                    <p className="text-xs text-muted-foreground text-center">{item.desc}</p>
                  </GlassCard>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    // Slide 7 - Equipamentos de Manufatura
    {
      id: 7,
      content: (
        <div data-slide className="h-full min-h-[800px] max-h-[800px] w-full bg-background page-break-after-always">
          <div className="max-w-7xl mx-auto px-16 py-10 h-full flex flex-col justify-center">
            <HeadingWithLine className="mb-2">Equipamentos de Manufatura</HeadingWithLine>
            <p className="text-lg text-muted-foreground mb-4 mt-2">Tecnologia Swiss e Multi-axis para precisão micrométrica</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { img: citizenL20, name: "Citizen Swiss L20", desc: "Tornos Swiss-type 7 eixos" },
                { img: citizenM32, name: "Citizen Cincom M32", desc: "Alta precisão até 32mm" },
                { img: doosanNew, name: "Doosan DNM 400", desc: "Centro 5 eixos" },
                { img: robodrill, name: "FANUC Robodrill", desc: "Alta velocidade" },
                { img: zeissContura, name: "ZEISS Contura", desc: "CMM 3D 0.001mm" },
                { img: electropolishLine, name: "Linha Electropolish", desc: "Acabamento e passivação" }
              ].map((item, i) => (
                <GlassCard key={i} className="p-2 flex gap-3 items-center">
                  <div className="bg-card/50 rounded-lg h-24 w-32 flex-shrink-0 overflow-hidden">
                    <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-foreground truncate">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    // Slide 8 - Parque CNC
    {
      id: 8,
      content: (
        <div data-slide className="h-full min-h-[800px] max-h-[800px] w-full bg-background page-break-after-always">
          <div className="max-w-7xl mx-auto px-16 py-16 h-full flex flex-col justify-center">
            <HeadingGradient className="mb-4">Parque CNC</HeadingGradient>
            <p className="text-xl text-muted-foreground mb-10 mt-2">15+ máquinas de alta precisão</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <GlassCard className="p-10 border-l-4 border-primary/20">
                <h3 className="text-3xl font-bold mb-6 text-foreground">Swiss-Type CNC</h3>
                <ul className="space-y-4">
                  {["Citizen Cincom L20 (7 eixos)", "Citizen Cincom L32", "Citizen Cincom M32", "Tornos GT26 e GT13"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-lg text-muted-foreground">
                      <Check className="text-accent w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
              <GlassCard className="p-10 border-l-4 border-accent/20">
                <h3 className="text-3xl font-bold mb-6 text-foreground">Multi-Axis & Suporte</h3>
                <ul className="space-y-4">
                  {["Doosan DNM 400 (5 eixos)", "FANUC Robodrill", "Retíficas Walter", "Laser Marking fibra"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-lg text-muted-foreground">
                      <Check className="text-accent w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </div>
            <div className="mt-8 grid grid-cols-4 gap-6">
              {[citizenL20, citizenM32, doosanNew, robodrill].map((img, i) => (
                <div key={i} className="bg-card/30 rounded-xl p-4 border border-border/20">
                  <img src={img} alt="Equipment" className="w-full h-24 object-contain" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    // Slide 9 - Laboratório de Metrologia
    {
      id: 9,
      content: (
        <div data-slide className="h-full min-h-[800px] max-h-[800px] w-full bg-background page-break-after-always">
          <div className="max-w-7xl mx-auto px-16 py-16 h-full flex flex-col justify-center">
            <HeadingWithLine className="mb-4">Laboratório de Metrologia</HeadingWithLine>
            <p className="text-xl text-muted-foreground mb-10 mt-2">100m² dedicados à inspeção dimensional</p>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <GlassCard className="p-8 border-t-4 border-primary/30">
                <h3 className="text-2xl font-bold mb-4 text-foreground">CMM 3D</h3>
                <p className="text-muted-foreground mb-4">ZEISS Contura com precisão de <span className="text-primary font-bold">0.001mm</span></p>
                <img src={zeissContura} alt="ZEISS" className="w-full h-32 object-contain rounded-lg bg-card/50 p-3 border border-border/20" />
              </GlassCard>
              <GlassCard className="p-8 border-t-4 border-accent/30">
                <h3 className="text-2xl font-bold mb-4 text-foreground">Inspeção Óptica</h3>
                <p className="text-muted-foreground mb-4">CNC e manual para geometrias complexas</p>
                <img src={opticalCNC} alt="Optical" className="w-full h-32 object-contain rounded-lg bg-card/50 p-3 border border-border/20" />
              </GlassCard>
              <GlassCard className="p-8 border-t-4 border-accent-orange/30">
                <h3 className="text-2xl font-bold mb-4 text-foreground">Análise de Material</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-accent" />Dureza Vickers</li>
                  <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-accent" />Rugosidade</li>
                  <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-accent" />Perfil de superfície</li>
                </ul>
              </GlassCard>
            </div>
          </div>
        </div>
      ),
    },
    // Slide 10 - Sala Limpa ISO 7
    {
      id: 10,
      content: (
        <div data-slide className="relative h-full min-h-[800px] max-h-[800px] w-full bg-background overflow-hidden page-break-after-always">
          <div className="absolute inset-0 bg-cover bg-center opacity-[0.15]" style={{ backgroundImage: `url(${cleanroomHero})` }} />
          <div className="relative z-10 max-w-7xl mx-auto px-16 py-16 h-full flex flex-col justify-center">
            <HeadingGradient className="mb-4">Sala Limpa ISO 7</HeadingGradient>
            <p className="text-xl text-muted-foreground mb-10 mt-4">60m² dedicados à embalagem sterile-ready</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <GlassCard className="p-10 border-l-4 border-accent/30">
                <h3 className="text-3xl font-bold mb-6 text-foreground">Especificações</h3>
                <ul className="space-y-4">
                  {["Classificação ISO 7 (Classe 10.000)", "Controle de temperatura e umidade", "Pressão positiva constante", "Monitoramento de partículas 24/7"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-lg text-muted-foreground">
                      <Check className="text-accent w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
              <GlassCard className="p-10 border-l-4 border-primary/30">
                <h3 className="text-3xl font-bold mb-6 text-foreground">Capacidades</h3>
                <ul className="space-y-4">
                  {["Embalagem primária e secundária", "Selagem de blisters e pouches", "Rotulagem e serialização", "Prontos para esterilização EtO ou Gamma"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-lg text-muted-foreground">
                      <Check className="text-primary w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </div>
          </div>
        </div>
      ),
    },
    // Slide 11 - Clientes
    {
      id: 11,
      content: (
        <div data-slide className="h-full min-h-[800px] max-h-[800px] w-full bg-background relative overflow-hidden page-break-after-always">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="relative z-10 max-w-7xl mx-auto px-16 py-16 h-full flex flex-col justify-center">
            <HeadingGradient className="mb-10">Confiança de Líderes do Mercado</HeadingGradient>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-6 mb-10 mt-4">
              {clientLogos.map((logo, index) => (
                <div key={index} className="flex items-center justify-center group">
                  <img src={logo.src} alt={logo.name} className="h-12 w-auto object-contain filter grayscale group-hover:grayscale-0 opacity-60 group-hover:opacity-100 transition-all duration-500" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-6">
              {[
                { num: "30+", label: "Clientes Médicos Ativos" },
                { num: "30+", label: "Anos de Experiência" },
                { num: "100%", label: "Produtos com Qualidade Assegurada" }
              ].map((item, i) => (
                <GlassCard key={i} className="p-10 text-center">
                  <div className="text-7xl font-bold text-primary mb-4">{item.num}</div>
                  <p className="text-lg text-muted-foreground font-medium">{item.label}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    // Slide 12 - Comece com Baixo Risco
    {
      id: 12,
      content: (
        <div data-slide className="h-full min-h-[800px] max-h-[800px] w-full bg-background page-break-after-always">
          <div className="max-w-7xl mx-auto px-16 py-16 h-full flex flex-col justify-center">
            <HeadingWithLine className="mb-4">Comece com Baixo Risco</HeadingWithLine>
            <h3 className="text-3xl text-primary mb-10 mt-2">Célula Piloto de Manufatura</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              <div className="space-y-6">
                {[
                  { title: "1-3 componentes críticos", desc: "Escolha as peças mais desafiadoras do seu portfólio" },
                  { title: "Processo completo", desc: "Usinagem → acabamento → metrologia → embalagem" },
                  { title: "Documentação completa", desc: "Toda documentação para seu arquivo regulatório (DHF/DMR)" }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 group">
                    <Check className="text-accent w-7 h-7 mt-1 flex-shrink-0" strokeWidth={1.5} />
                    <div className="border-l border-accent/10 pl-3">
                      <h4 className="text-2xl font-bold mb-2 text-foreground">{item.title}</h4>
                      <p className="text-lg text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <GlassCard className="p-10 bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20">
                <h4 className="text-3xl font-bold mb-6 text-foreground">Garantia de Resultado</h4>
                <p className="text-xl text-muted-foreground leading-relaxed mb-6">Se não atingirmos suas especificações no piloto, você sai com:</p>
                <ul className="space-y-3 text-lg text-muted-foreground">
                  {["Toda documentação de processo", "Relatórios completos de medição", "Lições aprendidas e recomendações"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3"><CheckCircle className="text-accent w-6 h-6 flex-shrink-0" />{item}</li>
                  ))}
                </ul>
              </GlassCard>
            </div>
          </div>
        </div>
      ),
    },
    // Slide 13 - Próximos Passos
    {
      id: 13,
      content: (
        <div data-slide className="h-full min-h-[800px] max-h-[800px] w-full bg-background page-break-after-always">
          <div className="max-w-7xl mx-auto px-16 py-16 h-full flex flex-col justify-center">
            <HeadingGradient className="mb-12">Próximos Passos</HeadingGradient>
            <div className="space-y-10 mb-12 mt-4">
              {[
                { num: "1", title: "Assinar NDA", desc: "Confidencialidade garantida para todas as informações técnicas" },
                { num: "2", title: "Compartilhar Requisitos", desc: "Desenhos técnicos, volumes estimados, especificações" },
                { num: "3", title: "Receber DFM + Cotação", desc: "Análise de manufaturabilidade e proposta comercial em 5-7 dias" },
                { num: "4", title: "Aprovar Piloto → Escalar", desc: "Validação de processo e transição para produção seriada" }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-8 relative">
                  <div className={`text-6xl font-bold ${i === 3 ? 'text-accent/40' : 'text-primary/20'} absolute -left-4`}>{item.num}</div>
                  <div className="ml-20 border-l-4 border-primary/30 pl-8">
                    <h3 className="text-3xl font-bold mb-2 text-foreground">{item.title}</h3>
                    <p className="text-xl text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
  ];

  const nextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide(prev => prev + 1);
    }
  }, [currentSlide, slides.length]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(prev => prev - 1);
    }
  }, [currentSlide]);

  const goToSlide = useCallback((index: number) => {
    if (index !== currentSlide && index >= 0 && index < slides.length) {
      setDirection(index > currentSlide ? 1 : -1);
      setCurrentSlide(index);
    }
  }, [currentSlide, slides.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 1000 : -1000, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 1000 : -1000, opacity: 0 }),
  };
  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity;
  const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  const waitForImages = async (node: HTMLElement) => {
    const images = Array.from(node.querySelectorAll("img"));
    await Promise.all(
      images.map((img) => {
        if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      }),
    );
    if (document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch {
        /* no-op */
      }
    }
  };

  const getNodeSize = () => {
    const node = slideRef.current;
    if (!node) return { width: 1920, height: 1080 };
    const rect = node.getBoundingClientRect();
    return { width: Math.round(rect.width || 1920), height: Math.round(rect.height || 1080) };
  };

  const captureAllSlides = async () => {
    const original = currentSlide;
    const images: string[] = [];
    let exportWidth = 1920;
    let exportHeight = 1080;

    try {
      for (let i = 0; i < slides.length; i++) {
        if (currentSlide !== i) {
          setCurrentSlide(i);
          await nextFrame();
        }

        const node = slideRef.current;
        if (!node) continue;

        await waitForImages(node);

        const { width, height } = getNodeSize();
        exportWidth = width;
        exportHeight = height;

        const dataUrl = await toPng(node, {
          cacheBust: true,
          pixelRatio: 2,
          width,
          height,
          style: { width: `${width}px`, height: `${height}px` },
        });
        images.push(dataUrl);
      }
    } finally {
      setCurrentSlide(original);
      await nextFrame();
    }

    return { images, width: exportWidth, height: exportHeight };
  };

  const downloadPptx = async () => {
    if (isExporting) return;
    try {
      setIsExporting(true);
      setExportMessage("Rendering slides...");
      const { images, width, height } = await captureAllSlides();
      if (!images.length) return;

      setExportMessage("Building PPTX...");
      const aspect = width / height;
      const baseWidth = 13.33; // widescreen in inches
      const pptx = new PptxGenJS();
      pptx.defineLayout({ name: "WIDESCREEN_EXPORT", width: baseWidth, height: baseWidth / aspect });
      pptx.layout = "WIDESCREEN_EXPORT";

      images.forEach((img) => {
        const slide = pptx.addSlide();
        slide.addImage({ data: img, x: 0, y: 0, w: "100%", h: "100%" });
      });

      await pptx.writeFile({ fileName: "pitch-deck.pptx" });
    } catch (err) {
      console.error("PPTX export failed", err);
    } finally {
      setExportMessage(null);
      setIsExporting(false);
    }
  };

  const downloadPdf = async () => {
    setIsPrinting(true);
    // Give time for state to update and render the list view
    setTimeout(() => {
        window.print();
        // Reset after print dialog triggers (or closes on some browsers, but purely triggering is enough usually)
        // Ideally we listen for `afterprint` event but that's browser specific. 
        // A manual close button or auto-reset after a delay is safer.
        // For better UX during "Saving", we can keep it open or just rely on the modal blocking.
        // Actually, window.print() is blocking in many browsers.
    }, 100);
  };
  
  // Listen for print completion to exit print mode
  useEffect(() => {
    const handleAfterPrint = () => setIsPrinting(false);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  if (isPrinting) {
     return (
         <div className="w-full bg-background print-container">
             {slides.map((slide) => (
                 <div key={slide.id} className="w-full h-screen overflow-hidden page-break-after-always" style={{ breakAfter: 'always', pageBreakAfter: 'always' }}>
                     {slide.content}
                 </div>
             ))}
         </div>
     );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border px-8 py-4 no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Lifetrek" className="h-8" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sales Pitch Deck</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Use arrow keys or swipe to navigate slides.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" disabled={isExporting}><Share2 className="w-4 h-4 mr-2" />Share</Button>
            <Button variant="outline" size="sm" onClick={downloadPdf} disabled={isExporting}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="default" size="sm" onClick={downloadPptx} disabled={isExporting}>
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? "Rendering…" : "Download PPTX"}
            </Button>
          </div>
        </div>
      </div>
      {/* Progress Bar */}
      <div className="fixed bottom-0 left-0 h-1 bg-muted w-full z-50 no-print">
        <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }} />
      </div>
      <div className="pt-20 h-screen no-print">
        <div className="h-[calc(100vh-8rem)] relative overflow-hidden">
          <AnimatePresence initial={!isExporting} custom={direction} mode="wait">
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.3 },
                    }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = swipePower(offset.x, velocity.x);
                if (swipe < -swipeConfidenceThreshold && currentSlide < slides.length - 1) {
                  nextSlide();
                } else if (swipe > swipeConfidenceThreshold && currentSlide > 0) {
                  prevSlide();
                }
              }}
              className="absolute inset-0"
              ref={slideRef}
            >
              {slides[currentSlide].content}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border px-8 py-4 no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button variant="outline" size="lg" onClick={prevSlide} disabled={currentSlide === 0}>← Previous</Button>
          <div className="flex items-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide ? "w-8 bg-primary" : "w-2 bg-muted hover:bg-muted-foreground/50"}`}
              />
            ))}
          </div>
          <Button variant="outline" size="lg" onClick={nextSlide} disabled={currentSlide === slides.length - 1}>Next →</Button>
        </div>
      </div>

      {isExporting && (
        <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center no-print">
          <div className="bg-card border border-border rounded-xl px-6 py-4 shadow-lg flex items-center gap-3 text-foreground">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <span>{exportMessage || "Exporting deck..."}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PitchDeck;
