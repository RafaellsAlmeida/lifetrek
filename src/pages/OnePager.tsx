import { Button } from "@/components/ui/button";
import { Download, Linkedin, Facebook, Instagram, MapPin, Globe, Mail, Phone, CheckCircle2 } from "lucide-react";
import logo from "@/assets/logo-optimized.webp";
import isoLogo from "@/assets/certifications/iso.webp";
import factoryExterior from "@/assets/facility/exterior-hero.webp";
import cleanroomHero from "@/assets/facility/cleanroom-hero.webp";
import receptionHero from "@/assets/facility/reception-hero.webp"; // Need to check if this exists or use fallback
import citizenL20 from "@/assets/equipment/citizen-l20.webp";
import citizenM32 from "@/assets/equipment/citizen-m32-new.png";
import doosanNew from "@/assets/equipment/doosan-new.png";
import electropolishLine from "@/assets/equipment/electropolish-line.webp";

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
  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-primary/10">
      {/* Download Button - Print only */}
      <div className="fixed top-4 right-4 z-50 no-print">
        <Button onClick={handleDownloadPDF} className="bg-primary hover:bg-primary-dark shadow-xl hover:shadow-2xl transition-all">
          <Download className="w-4 h-4 mr-2" />
          Baixar PDF
        </Button>
      </div>

      {/* --- PAGE 1 --- */}
      <div className="max-w-[210mm] mx-auto p-12 min-h-[297mm] flex flex-col relative bg-white page-break-after-always shadow-2xl my-8 print:shadow-none print:my-0 print:p-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-10 border-b-2 border-primary pb-6">
          <img src={logo} alt="Lifetrek Medical" className="h-14" />
          <img src={isoLogo} alt="ISO 13485:2016" className="h-16" />
        </div>

        {/* Hero Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-primary mb-2 tracking-tight">
            Fabricação de Precisão para Dispositivos Médicos
          </h1>
          <p className="text-lg text-slate-500 font-medium">
            Implantes • Instrumentais Cirúrgicos • Componentes Médicos
          </p>
        </div>

        {/* Stats Row */}
        <div className="flex justify-between px-10 mb-14">
          <div className="text-center">
            <div className="text-4xl font-extrabold text-primary mb-1">30+</div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">Anos de Experiência</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-extrabold text-green-600 mb-1">30+</div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">Clientes Ativos</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-extrabold text-accent-orange mb-1">±0.005mm</div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">Tolerância</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-extrabold text-primary mb-1">100%</div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">Rastreabilidade</div>
          </div>
        </div>

        {/* Main Grid content */}
        <div className="grid grid-cols-2 gap-12 flex-1">
          
          {/* Left Column */}
          <div className="flex flex-col gap-10">
            {/* Por que a Lifetrek? */}
            <div>
              <h2 className="text-xl font-bold text-primary mb-6 border-l-4 border-primary pl-3">
                Por que a Lifetrek?
              </h2>
              <ul className="space-y-4">
                 {[
                   { label: "Lead Time Reduzido", text: "De 90+ dias para 2-4 semanas" },
                   { label: "Compliance Total", text: "ISO 13485, GMP, rastreabilidade ANVISA/FDA" },
                   { label: "Nearshoring", text: "Reduza exposição cambial e riscos logísticos" },
                   { label: "Metrologia Avançada", text: "ZEISS Contura + validação completa" }
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
              <h2 className="text-xl font-bold text-primary mb-6 border-l-4 border-green-600 pl-3">
                Produtos
              </h2>
              <div className="grid grid-cols-3 gap-4">
                 <div className="text-center group">
                    <div className="bg-slate-50 rounded-lg p-2 mb-2 h-20 flex items-center justify-center border border-slate-100 group-hover:border-primary/20 transition-colors">
                      <img src={spinalImplants} alt="Espinhal" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">Espinhal</span>
                 </div>
                 <div className="text-center group">
                    <div className="bg-slate-50 rounded-lg p-2 mb-2 h-20 flex items-center justify-center border border-slate-100 group-hover:border-primary/20 transition-colors">
                      <img src={dentalImplants} alt="Dental" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">Dental</span>
                 </div>
                 <div className="text-center group">
                    <div className="bg-slate-50 rounded-lg p-2 mb-2 h-20 flex items-center justify-center border border-slate-100 group-hover:border-primary/20 transition-colors">
                      <img src={instrumental} alt="Instrumental" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">Instrumental</span>
                 </div>
              </div>
            </div>

             {/* Certificações */}
             <div>
              <h2 className="text-xl font-bold text-primary mb-4 border-l-4 border-accent-orange pl-3">
                Certificações
              </h2>
              <div className="flex gap-6">
                 <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-lg border border-slate-100 flex-1">
                    <div className="text-orange-500"><CheckCircle2 className="w-6 h-6" /></div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">ISO 13485:2016</div>
                      <div className="text-xs text-slate-500">Gestão da Qualidade</div>
                    </div>
                 </div>
                 <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-lg border border-slate-100 flex-1">
                    <div className="text-orange-500"><CheckCircle2 className="w-6 h-6" /></div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">ISO 7 Cleanroom</div>
                      <div className="text-xs text-slate-500">Sala Limpa</div>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* Right Column - Visuals */}
          <div className="flex flex-col gap-6">
             {/* VIDEO / FACTORY BLOCK */}
             <div className="rounded-xl overflow-hidden shadow-lg border border-primary/20 bg-primary group relative">
                <video 
                  src="/remotion/video-final-v2.mp4" 
                  controls 
                  className="w-full h-48 object-cover bg-black"
                  poster="/remotion/thumbnail.png"
                >
                  Seu navegador não suporta vídeos.
                </video>
                <div className="bg-primary text-white py-2 px-4 text-center text-sm font-bold">
                  Fábrica Própria • Indaiatuba, SP
                </div>
             </div>

             {/* CLEAN ROOM */}
             <div className="rounded-xl overflow-hidden shadow-lg border border-green-600/20 group">
                <img src={cleanroomHero} alt="Sala Limpa" className="w-full h-48 object-cover" />
                <div className="bg-green-600 text-white py-2 px-4 text-center text-sm font-bold">
                  Sala Limpa ISO 7 Certificada
                </div>
             </div>

             {/* RECEPTION */}
             <div className="rounded-xl overflow-hidden shadow-lg border border-slate-200 group flex-1 bg-slate-100">
               {/* Using factory exterior as fallback for reception if needed, or specific reception image */}
               <img src={factoryExterior} alt="Recepção" className="w-full h-full object-cover min-h-[180px]" />
               <div className="bg-slate-100 text-slate-600 py-2 px-4 text-center text-sm font-bold border-t border-slate-200">
                  Recepção
                </div>
             </div>
          </div>

        </div>

        {/* Footer Page 1 */}
        <div className="mt-auto pt-8 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400 font-medium">
             <span>© 2026 Lifetrek Medical</span>
             <span className="text-primary font-bold">Precisão que Transforma Vidas</span>
             <span>Página 1/2</span>
        </div>
      </div>

      {/* --- PAGE 2 --- */}
      <div className="max-w-[210mm] mx-auto p-12 min-h-[297mm] flex flex-col bg-white page-break-after-always shadow-2xl mb-8 print:shadow-none print:my-0 print:p-8">
         {/* Header Page 2 */}
         <div className="flex items-center justify-between mb-12 border-b-2 border-primary pb-6">
            <img src={logo} alt="Lifetrek Medical" className="h-10" />
            <h2 className="text-xl font-bold text-primary">Equipamentos & Capacidades</h2>
         </div>

         {/* Machine Park */}
         <div className="mb-12">
            <h3 className="text-xl font-bold text-primary mb-6 border-l-4 border-primary pl-3">
              Parque de Máquinas (R$ 1.5M+ Investidos)
            </h3>
            <div className="grid grid-cols-4 gap-6">
              {[
                { img: citizenL20, title: "Citizen L20/L20X", sub: "Swiss-Type CNC" },
                { img: citizenM32, title: "Citizen M32", sub: "Multi-Axis CNC" },
                { img: doosanNew, title: "Doosan LYNX", sub: "CNC Turning" },
                { img: electropolishLine, title: "Eletropolimento", sub: "Finishing Line" }
              ].map((m, i) => (
                <div key={i} className="bg-white border rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                   <div className="h-32 mb-4 flex items-center justify-center p-2 bg-slate-50 rounded-lg">
                     <img src={m.img} alt={m.title} className="max-h-full object-contain" />
                   </div>
                   <div className="font-bold text-primary text-sm mb-1">{m.title}</div>
                   <div className="text-xs text-slate-500 font-medium">{m.sub}</div>
                </div>
              ))}
            </div>
         </div>

         {/* Capacidades Técnicas */}
         <div className="mb-12">
            <h3 className="text-xl font-bold text-primary mb-6 border-l-4 border-green-600 pl-3">
              Capacidades Técnicas
            </h3>
            <div className="grid grid-cols-3 gap-10">
               <div>
                  <h4 className="text-lg font-bold text-green-600 mb-4">Usinagem</h4>
                  <ul className="text-sm space-y-2 text-slate-600 font-medium">
                     <li>• Swiss-Type (Citizen L20, L20X)</li>
                     <li>• Multi-Axis (Citizen M32)</li>
                     <li>• CNC Turning (Doosan)</li>
                     <li>• Tecnologia LFV Citizen</li>
                  </ul>
               </div>
               <div>
                  <h4 className="text-lg font-bold text-green-600 mb-4">Acabamento</h4>
                  <ul className="text-sm space-y-2 text-slate-600 font-medium">
                     <li>• Eletropolimento automatizado</li>
                     <li>• Passivação & Anodização</li>
                     <li>• Marcação a laser & Jateamento</li>
                     <li>• Limpeza Ultrassônica</li>
                  </ul>
               </div>
               <div>
                  <h4 className="text-lg font-bold text-green-600 mb-4">Metrologia</h4>
                  <ul className="text-sm space-y-2 text-slate-600 font-medium">
                     <li>• CMM ZEISS Contura</li>
                     <li>• Comparador óptico</li>
                     <li>• Microscopia Olympus</li>
                     <li>• Dureza Vickers/Rockwell</li>
                  </ul>
               </div>
            </div>
         </div>

         {/* Materials Row */}
         <div className="mb-12 bg-slate-50 p-6 rounded-xl border border-slate-100">
             <h4 className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">Materiais Processados</h4>
             <div className="flex flex-wrap gap-3">
                {["Ti-6Al-4V (Grau 5)", "Ti CP (Grau 1-4)", "Aço Inox 316L/316LVM", "CoCrMo", "PEEK", "UHMWPE"].map((mat, i) => (
                  <span key={i} className="px-4 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold text-slate-700 shadow-sm">
                    {mat}
                  </span>
                ))}
             </div>
         </div>

         {/* Logos Row */}
         <div className="mb-auto">
             <h3 className="text-xl font-bold text-primary mb-6 border-l-4 border-accent-orange pl-3">
               Quem Confia na Lifetrek
             </h3>
             <div className="flex justify-between items-center opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                 <img src={fgmNew} className="h-8 object-contain" alt="FGM" />
                 <img src={traumecNew2} className="h-8 object-contain" alt="Traumec" />
                 <img src={iolNew} className="h-8 object-contain" alt="IOL" />
                 <img src={cpmhNew} className="h-8 object-contain" alt="CPMH" />
                 <img src={orthometricNew} className="h-8 object-contain" alt="Orthometric" />
                 <img src={osseaNew} className="h-8 object-contain" alt="Ossea" />
             </div>
         </div>

         {/* Blue Footer CTA */}
         <div className="mt-8 bg-primary rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
             
             <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                <div className="lg:col-span-1">
                   <h3 className="text-2xl font-bold mb-2">Pronto para Começar?</h3>
                   <p className="text-primary-foreground/80 text-sm mb-6 max-w-xs">
                     Agende uma conversa técnica e receba uma proposta personalizada.
                   </p>
                   <div className="space-y-3">
                      <a href="mailto:vsmartins@lifetrekmedical.com.br" className="flex items-center gap-3 hover:text-accent-orange transition-colors group">
                        <div className="bg-white/10 p-2 rounded-lg group-hover:bg-accent-orange group-hover:text-white transition-colors">
                            <Mail className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-sm">vsmartins@lifetrekmedical.com.br</span>
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
                        <div className="font-bold text-sm">Indaiatuba, São Paulo</div>
                        <div className="text-xs opacity-70">Rua das Indústrias, 123 (Simulação)</div>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-accent-orange" />
                      <a href="https://www.lifetrekmedical.com.br" target="_blank" className="hover:underline font-bold text-sm">www.lifetrekmedical.com.br</a>
                   </div>
                </div>

                <div className="lg:col-span-1 flex flex-col justify-end items-end gap-2 text-right">
                    <div className="flex gap-3">
                         <a href="https://linkedin.com/company/lifetrekmedical" target="_blank" className="bg-white/10 p-2 rounded hover:bg-white hover:text-primary transition-colors">
                             <Linkedin className="w-5 h-5" />
                         </a>
                         <a href="https://instagram.com/lifetrekmedical" target="_blank" className="bg-white/10 p-2 rounded hover:bg-white hover:text-pink-600 transition-colors">
                             <Instagram className="w-5 h-5" />
                         </a>
                    </div>
                </div>
             </div>
         </div>

         {/* Footer Page 2 */}
         <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400 font-medium">
             <span>© 2026 Lifetrek Medical</span>
             <span className="text-primary font-bold">Precisão que Transforma Vidas</span>
             <span>Página 2/2</span>
        </div>

      </div>
    </div>
  );
};

export default OnePager;
