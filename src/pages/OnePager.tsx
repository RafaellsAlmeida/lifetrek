import { Button } from "@/components/ui/button";
import { Download, Linkedin, Facebook, Instagram, MapPin, Globe, Mail, Phone, CheckCircle2, Languages } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import logo from "@/assets/logo-optimized.webp";
import isoLogo from "@/assets/certifications/iso.webp";
import factoryExterior from "@/assets/facility/exterior-hero.webp";
import cleanroomHero from "@/assets/facility/clean-room-1.png"; // Updated for better visual
import receptionHero from "@/assets/facility/reception-hero.png"; // Using the high-quality PNG
import citizenL20 from "@/assets/equipment/citizen-l20.webp";
import citizenL20X from "@/assets/equipment/citizen-l20-x.png";
import citizenL32 from "@/assets/equipment/citizen-l32.png";
import citizenM32 from "@/assets/equipment/citizen-m32-new.png";
import doosanNew from "@/assets/equipment/doosan-turning.png";
import electropolishLine from "@/assets/facility/electropolish-line-new.jpg";
import fanucRobodrill from "@/assets/equipment/fanuc-robodrill.png";
import tornosG26 from "@/assets/equipment/tornos-g26.png";
import zeissContura from "@/assets/metrology/zeiss-contura.png";
import laserMarking from "@/assets/facility/laser-marking.png";
import productionFloor from "@/assets/facility/production-floor.jpg";
import grindingRoom from "@/assets/facility/grinding-room.jpg"; // New addition

// Products
import spinalImplants from "@/assets/products/spinal-implants-optimized.webp";
import dentalImplants from "@/assets/products/dental-implante-optimized.png";
import instrumental from "@/assets/products/dental-instrumentos-optimized.png";

// Client logos
import cpmhNew from "@/assets/clients/cpmh-new.png";
import fgmNew from "@/assets/clients/fgm-new.png";
import traumecNew2 from "@/assets/clients/traumec-new-2.png";
import iolNew from "@/assets/clients/iol-new.png";
import osseaNew from "@/assets/clients/ossea-new.jpg";
import orthometricNew from "@/assets/clients/orthometric-new.png";

const OnePager = () => {
  const { t, language, setLanguage } = useLanguage();

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-primary/10">
      {/* Download Button - Print only */}
      <div className="fixed top-4 right-4 z-50 no-print flex gap-2">
        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm border shadow-lg rounded-full p-1 mr-2">
          <button
            onClick={() => setLanguage("en")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${language === "en"
              ? "bg-primary text-white"
              : "text-slate-600 hover:text-primary"
              }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage("pt")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${language === "pt"
              ? "bg-primary text-white"
              : "text-slate-600 hover:text-primary"
              }`}
          >
            PT
          </button>
        </div>
        <Button onClick={handleDownloadPDF} className="bg-primary hover:bg-primary-dark shadow-xl hover:shadow-2xl transition-all h-10 px-6 font-bold">
          <Download className="w-4 h-4 mr-2" />
          {t("onepager.button.download")}
        </Button>
      </div>

      <style>
        {`
          @media print {
            @page { margin: 0; size: A4; }
            body { background: white; -webkit-print-color-adjust: exact; }
            .no-print { display: none !important; }
            /* Hide generic admin layout wrapper padding/margins if any */
            main { padding: 0 !important; margin: 0 !important; }
            /* Force exact A4 dimensions */
            .print-page {
                width: 210mm;
                height: 297mm;
                margin: 0;
                padding: 12mm;
                page-break-after: always;
                position: relative;
                overflow: hidden;
            }
            .print-page:last-child {
                page-break-after: auto;
            }
          }
        `}
      </style>

      {/* --- PAGE 1 --- */}
      <div className="max-w-[210mm] mx-auto p-12 min-h-[297mm] flex flex-col relative bg-white shadow-2xl my-8 print-page print:shadow-none print:my-0">

        {/* Header - Reduced MB */}
        <div className="flex items-center justify-between mb-8 border-b-2 border-primary pb-4">
          <img src={logo} alt="Lifetrek Medical" className="h-14" />
          <img src={isoLogo} alt="ISO 13485:2016" className="h-16" />
        </div>

        {/* Hero Title - Reduced MB */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-primary mb-2 tracking-tight">
            {t("onepager.hero.title")}
          </h1>
          <p className="text-lg text-slate-500 font-medium">
            {t("onepager.hero.subtitle")}
          </p>
        </div>

        {/* Stats Row - Reduced MB */}
        <div className="flex justify-between px-10 mb-10">
          <div className="text-center">
            <div className="text-4xl font-extrabold text-primary mb-1">30+</div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">{t("onepager.stats.experience")}</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-extrabold text-green-600 mb-1">30+</div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">{t("onepager.stats.clients")}</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-extrabold text-accent-orange mb-1">±0.005mm</div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">{t("onepager.stats.tolerance")}</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-extrabold text-primary mb-1">100%</div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">{t("onepager.stats.traceability")}</div>
          </div>
        </div>

        {/* Main Grid content - Reduced Gap */}
        <div className="grid grid-cols-2 gap-8 flex-1">

          {/* Left Column - Reduced Gap */}
          <div className="flex flex-col gap-8">
            {/* Por que a Lifetrek? */}
            <div>
              <h2 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-3">
                {t("onepager.why.title")}
              </h2>
              <ul className="space-y-3">
                {[
                  { label: t("onepager.why.leadtime.label"), text: t("onepager.why.leadtime.text") },
                  { label: t("onepager.why.compliance.label"), text: t("onepager.why.compliance.text") },
                  { label: t("onepager.why.nearshoring.label"), text: t("onepager.why.nearshoring.text") },
                  { label: t("onepager.why.metrology.label"), text: t("onepager.why.metrology.text") }
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-slate-900 block">{item.label}:</strong>
                      <span className="text-slate-600 text-sm leading-tight block">{item.text}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Produtos */}
            <div>
              <h2 className="text-xl font-bold text-primary mb-4 border-l-4 border-green-600 pl-3">
                {t("onepager.products.title")}
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center group">
                  <div className="bg-slate-50 rounded-lg p-2 mb-2 h-20 flex items-center justify-center border border-slate-100 group-hover:border-primary/20 transition-colors">
                    <img src={spinalImplants} alt={t("onepager.products.spinal")} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">{t("onepager.products.spinal")}</span>
                </div>
                <div className="text-center group">
                  <div className="bg-slate-50 rounded-lg p-2 mb-2 h-20 flex items-center justify-center border border-slate-100 group-hover:border-primary/20 transition-colors">
                    <img src={dentalImplants} alt={t("onepager.products.dental")} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">{t("onepager.products.dental")}</span>
                </div>
                <div className="text-center group">
                  <div className="bg-slate-50 rounded-lg p-2 mb-2 h-20 flex items-center justify-center border border-slate-100 group-hover:border-primary/20 transition-colors">
                    <img src={instrumental} alt={t("onepager.products.instrumental")} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">{t("onepager.products.instrumental")}</span>
                </div>
              </div>
            </div>

            {/* Contato & Redes */}
            <div>
              <h2 className="text-xl font-bold text-primary mb-4 border-l-4 border-accent-orange pl-3">
                {t("onepager.connect.title")}
              </h2>
              <div className="flex flex-col gap-3">
                <a href="https://www.lifetrek-medical.com" target="_blank" className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-lg border border-slate-100 hover:border-primary/30 transition-colors group no-underline text-slate-800">
                  <div className="text-accent-orange bg-white p-1.5 rounded-md shadow-sm group-hover:scale-110 transition-transform"><Globe className="w-5 h-5" /></div>
                  <span className="font-bold text-sm group-hover:text-primary">www.lifetrek-medical.com</span>
                </a>

                <div className="grid grid-cols-2 gap-3">
                  <a href="https://instagram.com/lifetrekmedical" target="_blank" className="flex items-center gap-2 bg-slate-50 px-3 py-3 rounded-lg border border-slate-100 hover:border-pink-200 hover:bg-pink-50 transition-colors group no-underline text-slate-700">
                    <div className="text-pink-600 bg-white p-1 rounded shadow-sm"><Instagram className="w-4 h-4" /></div>
                    <span className="font-bold text-xs group-hover:text-pink-700">@lifetrekmedical</span>
                  </a>
                  <a href="https://www.linkedin.com/company/lifetrek-medical" target="_blank" className="flex items-center gap-2 bg-slate-50 px-3 py-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-colors group no-underline text-slate-700">
                    <div className="text-blue-700 bg-white p-1 rounded shadow-sm"><Linkedin className="w-4 h-4" /></div>
                    <span className="font-bold text-xs group-hover:text-blue-800">Lifetrek Medical</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Visuals - Compacted */}
          <div className="flex flex-col gap-4">
            {/* FACTORY BLOCK */}
            <div className="rounded-xl overflow-hidden shadow-lg border border-primary/20 bg-primary group relative">
              <img
                src={factoryExterior}
                alt={t("onepager.factory.exterior")}
                className="w-full h-40 object-cover"
              />
              <div className="bg-primary text-white py-2 px-4 text-center text-sm font-bold">
                {t("onepager.factory.exterior")}
              </div>
            </div>

            {/* CLEAN ROOM */}
            <div className="rounded-xl overflow-hidden shadow-lg border border-green-600/20 group">
              <img src={cleanroomHero} alt={t("onepager.cleanroom.title")} className="w-full h-40 object-cover" />
              <div className="bg-green-600 text-white py-2 px-4 text-center text-sm font-bold">
                {t("onepager.cleanroom.title")}
              </div>
            </div>

            {/* RECEPTION - Fixed height to avoid cut */}
            <div className="rounded-xl overflow-hidden shadow-lg border border-slate-200 group flex-1 bg-slate-100 flex flex-col h-full min-h-0">
              <div className="flex-1 relative overflow-hidden">
                <img src={receptionHero} alt={t("onepager.reception.title")} className="w-full h-full object-cover absolute inset-0" />
              </div>
              <div className="bg-slate-100 text-slate-600 py-2 px-4 text-center text-sm font-bold border-t border-slate-200 z-10 relative">
                {t("onepager.reception.title")}
              </div>
            </div>
          </div>

        </div>

        {/* Footer Page 1 */}
        <div className="mt-auto pt-8 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400 font-medium">
          <span>© 2026 Lifetrek Medical</span>
          <span className="text-primary font-bold">{t("onepager.footer.tagline")}</span>
          <span>{t("onepager.footer.page")} 1/2</span>
        </div>
      </div>

      {/* --- PAGE 2 --- */}
      <div className="max-w-[210mm] mx-auto p-12 min-h-[297mm] h-[297mm] flex flex-col bg-white shadow-2xl mb-8 print-page print:shadow-none print:my-0">
        {/* ... (Previous Page 2 Header/Content remains same until footer) ... */
          /* Note: I need to output the full content or matching chunks. I'll use replace_file_content carefully.
             Actually, splitting this into chunks or replacing large block is safer.
          */}

        {/* Header Page 2 */}
        <div className="flex items-center justify-between mb-12 border-b-2 border-primary pb-6">
          <img src={logo} alt="Lifetrek Medical" className="h-10" />
          <h2 className="text-xl font-bold text-primary">{t("onepager.page2.title")}</h2>
        </div>

        {/* Machine Park (Expanded) */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-primary mb-6 border-l-4 border-primary pl-3">
            {t("onepager.machinepark.title")}
          </h3>
          <div className="grid grid-cols-4 gap-4">
            {[
              { img: citizenL20X, title: "Citizen L20-X", sub: t("onepager.machine.swiss5") },
              { img: citizenL32, title: "Citizen L32", sub: t("onepager.machine.swissHigh") },
              { img: fanucRobodrill, title: "Fanuc Robodrill", sub: t("onepager.machine.vertical") },
              { img: tornosG26, title: "Tornos G26", sub: t("onepager.machine.swiss5") },
              { img: doosanNew, title: "Doosan LYNX", sub: t("onepager.machine.turning") },
              { img: zeissContura, title: "Zeiss Contura", sub: t("onepager.machine.cmm") },
              { img: laserMarking, title: "Laser Marking", sub: t("onepager.machine.udi") },
              { img: electropolishLine, title: "Eletropolimento", sub: t("onepager.machine.automated") }
            ].map((m, i) => (
              <div key={i} className="bg-white border rounded-xl p-3 text-center shadow-sm hover:shadow-md transition-shadow flex flex-col items-center">
                <div className="h-28 w-full mb-3 flex items-center justify-center p-2 bg-slate-50 rounded-lg overflow-hidden">
                  <img src={m.img} alt={m.title} className="w-full h-full object-contain" />
                </div>
                <div className="font-bold text-primary text-xs mb-0.5">{m.title}</div>
                <div className="text-[10px] text-slate-500 font-medium">{m.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Capacidades Técnicas */}
        <div className="mb-12">
          <h3 className="text-xl font-bold text-primary mb-6 border-l-4 border-green-600 pl-3">
            {t("assessment.steps.projectDetails")}
          </h3>
          <div className="grid grid-cols-3 gap-10">
            <div>
              <h4 className="text-lg font-bold text-green-600 mb-4">{t("onepager.capabilities.machining")}</h4>
              <ul className="text-sm space-y-2 text-slate-600 font-medium">
                <li>• Swiss-Type (Citizen L20, L20X)</li>
                <li>• Multi-Axis (Citizen M32)</li>
                <li>• CNC Turning (Doosan)</li>
                <li>• Tecnologia LFV Citizen</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold text-green-600 mb-4">{t("onepager.capabilities.finishing")}</h4>
              <ul className="text-sm space-y-2 text-slate-600 font-medium">
                <li>• {t("onepager.capabilities.electropolish")}</li>
                <li>• {t("onepager.capabilities.passivation")}</li>
                <li>• {t("onepager.capabilities.laser")}</li>
                <li>• {t("onepager.capabilities.ultrasonic")}</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold text-green-600 mb-4">{t("onepager.capabilities.metrology")}</h4>
              <ul className="text-sm space-y-2 text-slate-600 font-medium">
                <li>• CMM ZEISS Contura</li>
                <li>• {t("onepager.capabilities.optical")}</li>
                <li>• {t("onepager.capabilities.olympus")}</li>
                <li>• {t("onepager.capabilities.hardness")}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Materials Row */}
        <div className="mb-12 bg-slate-50 p-6 rounded-xl border border-slate-100">
          <h4 className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">{t("onepager.materials.title")}</h4>
          <div className="flex flex-wrap gap-3">
            {t("onepager.materials.list").split(", ").map((mat, i) => (
              <span key={i} className="px-4 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold text-slate-700 shadow-sm">
                {mat}
              </span>
            ))}
          </div>
        </div>



        {/* Blue Footer CTA */}
        <div className="mt-8 bg-primary rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
            <div className="lg:col-span-1">
              <h3 className="text-2xl font-bold mb-2">{t("onepager.cta.title")}</h3>
              <p className="text-primary-foreground/80 text-sm mb-6 max-w-xs">
                {t("onepager.cta.subtitle")}
              </p>
              <div className="space-y-3">
                <a href="mailto:vmartin@lifetrek-medical.com" className="flex items-center gap-3 hover:text-accent-orange transition-colors group">
                  <div className="bg-white/10 p-2 rounded-lg group-hover:bg-accent-orange group-hover:text-white transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-sm">vmartin@lifetrek-medical.com</span>
                </a>
                <a href="https://wa.me/5511945336226" target="_blank" className="flex items-center gap-3 hover:text-accent-orange transition-colors group">
                  <div className="bg-white/10 p-2 rounded-lg group-hover:bg-green-500 group-hover:text-white transition-colors">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-sm">+55 (11) 94533-6226</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-1 flex flex-col justify-center pl-8 border-l border-white/10">
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="w-5 h-5 text-accent-orange mt-1" />
                <div>
                  <div className="font-bold text-sm">{t("onepager.cta.location")}</div>
                  <div className="text-xs opacity-70">{t("onepager.cta.industrial")}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-accent-orange" />
                <a href="https://www.lifetrek-medical.com" target="_blank" className="hover:underline font-bold text-sm">www.lifetrek-medical.com</a>
              </div>
            </div>

            <div className="lg:col-span-1 flex flex-col justify-end items-end gap-2 text-right">
              <div className="flex flex-col gap-2 items-end">
                <a href="https://www.linkedin.com/company/lifetrek-medical" target="_blank" className="bg-white/10 p-2 rounded hover:bg-white hover:text-primary transition-colors flex items-center gap-2 text-white no-underline group w-fit">
                  <Linkedin className="w-4 h-4" />
                  <span className="text-xs font-medium group-hover:text-primary">@lifetrek-medical</span>
                </a>
                <a href="https://instagram.com/lifetrekmedical" target="_blank" className="bg-white/10 p-2 rounded hover:bg-white hover:text-pink-600 transition-colors flex items-center gap-2 text-white no-underline group w-fit">
                  <Instagram className="w-4 h-4" />
                  <span className="text-xs font-medium group-hover:text-pink-600">@lifetrekmedical</span>
                </a>
                <a href="https://facebook.com/lifetrekmedical" target="_blank" className="bg-white/10 p-2 rounded hover:bg-white hover:text-blue-600 transition-colors flex items-center gap-2 text-white no-underline group w-fit">
                  <Facebook className="w-4 h-4" />
                  <span className="text-xs font-medium group-hover:text-blue-600">Lifetrek Medical</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Page 2 */}
        <div className="mt-auto pt-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400 font-medium">
          <span>© 2026 Lifetrek Medical</span>
          <span className="text-primary font-bold">{t("onepager.footer.tagline")}</span>
          <span>{t("onepager.footer.page")} 2/2</span>
        </div>

      </div>
    </div>
  );
};

export default OnePager;
