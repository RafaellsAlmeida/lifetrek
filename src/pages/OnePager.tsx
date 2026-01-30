import { Button } from "@/components/ui/button";
import { Download, Linkedin, Facebook, Instagram } from "lucide-react";
import logo from "@/assets/logo-optimized.webp";
import isoLogo from "@/assets/certifications/iso.webp";
import factoryExterior from "@/assets/facility/exterior-hero.webp";
import cleanroomHero from "@/assets/facility/cleanroom-hero.webp";
import citizenL20 from "@/assets/equipment/citizen-l20.webp";
import citizenM32 from "@/assets/equipment/citizen-m32-new.png";
import doosanNew from "@/assets/equipment/doosan-new.png";
import electropolishLine from "@/assets/equipment/electropolish-line.webp";

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
    <div className="min-h-screen bg-white">
      {/* Download Button - Print only */}
      <div className="fixed top-4 right-4 z-50 no-print">
        <Button onClick={handleDownloadPDF} className="bg-primary hover:bg-primary-dark">
          <Download className="w-4 h-4 mr-2" />
          Baixar PDF
        </Button>
      </div>

      {/* Page 1 */}
      <div className="max-w-5xl mx-auto p-8 min-h-screen flex flex-col page-break-after-always">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 border-b border-primary pb-6">
          <img src={logo} alt="Lifetrek Medical" className="h-12" />
          <img src={isoLogo} alt="ISO 13485:2016" className="h-16" />
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-3">
            Fabricação de Precisão para Dispositivos Médicos
          </h1>
          <p className="text-xl text-muted-foreground">
            Implantes • Instrumentais Cirúrgicos • Componentes Médicos
          </p>
        </div>

        {/* Stats - Only 3 stats, NO rastreabilidade */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">30+</div>
            <div className="text-sm text-muted-foreground">Anos de Experiência</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">30+</div>
            <div className="text-sm text-muted-foreground">Clientes Ativos</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-orange-500 mb-2">±0.005mm</div>
            <div className="text-sm text-muted-foreground">Tolerância</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="mb-10 rounded-xl overflow-hidden shadow-2xl border border-gray-200">
           <video 
             src="/remotion/video-final-v2.mp4" 
             controls 
             className="w-full"
             poster="/remotion/thumbnail.png"
           >
             Seu navegador não suporta vídeos.
           </video>
        </div>

        <div className="grid grid-cols-2 gap-8 flex-1">
          {/* Left Column - Why Lifetrek */}
          <div>
            <h2 className="text-2xl font-bold text-primary mb-4 border-l-4 border-primary pl-3">
              Por que a Lifetrek?
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-semibold">Lead Time Reduzido:</div>
                  <div className="text-sm text-muted-foreground">De 90+ dias para 2-4 semanas</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-semibold">Compliance Total:</div>
                  <div className="text-sm text-muted-foreground">ISO 13485, GMP</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-semibold">Nearshoring:</div>
                  <div className="text-sm text-muted-foreground">
                    Reduza exposição cambial e riscos logísticos
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-semibold">Metrologia Avançada:</div>
                  <div className="text-sm text-muted-foreground">
                    ZEISS Contura + validação completa
                  </div>
                </div>
              </div>
            </div>

            {/* Produtos Section */}
            <h2 className="text-2xl font-bold text-primary mt-8 mb-4 border-l-4 border-primary pl-3">
              Produtos
            </h2>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Implantes ortopédicos e dentais</p>
              <p>• Instrumentais cirúrgicos</p>
              <p>• Componentes de alta precisão</p>
            </div>
          </div>

          {/* Right Column - Images */}
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden shadow-lg">
              <img src={factoryExterior} alt="Fábrica Própria" className="w-full h-40 object-cover" />
              <div className="bg-primary text-white px-4 py-2 text-sm font-semibold text-center">
                Fábrica Própria • Indaiatuba, SP
              </div>
            </div>
            <div className="rounded-xl overflow-hidden shadow-lg">
              <img src={cleanroomHero} alt="Sala Limpa ISO 7" className="w-full h-40 object-cover" />
              <div className="bg-green-600 text-white px-4 py-2 text-sm font-semibold text-center">
                Sala Limpa ISO 7 Certificada
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page 2 */}
      <div className="max-w-5xl mx-auto p-8 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <img src={logo} alt="Lifetrek Medical" className="h-10" />
          <h2 className="text-2xl font-bold text-primary">Equipamentos & Capacidades</h2>
        </div>

        {/* Machine Park */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-3">
            Parque de Máquinas (R$ 1.5M+ Investidos)
          </h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="border rounded-lg p-3 text-center">
              <img src={citizenL20} alt="Citizen L20" className="w-full h-24 object-contain mb-2" />
              <div className="font-semibold text-sm">Citizen L20/L20X</div>
              <div className="text-xs text-muted-foreground">Swiss-Type CNC</div>
            </div>
            <div className="border rounded-lg p-3 text-center">
              <img src={citizenM32} alt="Citizen M32" className="w-full h-24 object-contain mb-2" />
              <div className="font-semibold text-sm">Citizen M32</div>
              <div className="text-xs text-muted-foreground">Multi-Axis CNC</div>
            </div>
            <div className="border rounded-lg p-3 text-center">
              <img src={doosanNew} alt="Doosan LYNX" className="w-full h-24 object-contain mb-2" />
              <div className="font-semibold text-sm">Doosan LYNX</div>
              <div className="text-xs text-muted-foreground">CNC Turning</div>
            </div>
            <div className="border rounded-lg p-3 text-center">
              <img src={electropolishLine} alt="Electropolimento" className="w-full h-24 object-contain mb-2" />
              <div className="font-semibold text-sm">Eletropolimento</div>
              <div className="text-xs text-muted-foreground">Finishing Line</div>
            </div>
          </div>
        </div>

        {/* Technical Capabilities */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-3">
            Capacidades Técnicas
          </h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <h4 className="text-lg font-bold text-green-600 mb-2">Usinagem</h4>
              <ul className="text-sm space-y-1">
                <li>• Swiss-Type (Citizen L20, L20X)</li>
                <li>• Multi-Axis (Citizen M32)</li>
                <li>• CNC Turning (Doosan)</li>
                <li>• Tecnologia LFV Citizen</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold text-green-600 mb-2">Acabamento</h4>
              <ul className="text-sm space-y-1">
                <li>• Eletropolimento automatizado</li>
                <li>• Passivação</li>
                <li>• Anodização colorida</li>
                <li>• Marcação a laser</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold text-green-600 mb-2">Metrologia</h4>
              <ul className="text-sm space-y-1">
                <li>• CMM ZEISS Contura</li>
                <li>• Comparador óptico</li>
                <li>• Microscopia Olympus</li>
                <li>• Dureza Vickers/Rockwell</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Processed Materials */}
        <div className="mb-6">
          <h3 className="font-bold text-primary mb-3">Materiais Processados</h3>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="px-3 py-1 bg-gray-100 rounded">Ti-6Al-4V (Grau 5)</span>
            <span className="px-3 py-1 bg-gray-100 rounded">Ti CP (Grau 1-4)</span>
            <span className="px-3 py-1 bg-gray-100 rounded">Aço Inox 316L/316LVM</span>
            <span className="px-3 py-1 bg-gray-100 rounded">CoCrMo</span>
            <span className="px-3 py-1 bg-gray-100 rounded">PEEK</span>
            <span className="px-3 py-1 bg-gray-100 rounded">UHMWPE</span>
          </div>
        </div>

        {/* Client Logos */}
        <div>
          <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-orange-500 pl-3">
            Quem Confia na Lifetrek
          </h3>
          <div className="grid grid-cols-6 gap-6 items-center">
            <img src={fgmNew} alt="FGM" className="h-8 object-contain grayscale opacity-60" />
            <img src={traumecNew2} alt="Traumec" className="h-8 object-contain grayscale opacity-60" />
            <img src={iolNew} alt="IOL" className="h-8 object-contain grayscale opacity-60" />
            <img src={cpmhNew} alt="CPMH" className="h-8 object-contain grayscale opacity-60" />
            <img src={orthometricNew} alt="Orthometric" className="h-8 object-contain grayscale opacity-60" />
            <img src={osseaNew} alt="Óssea" className="h-8 object-contain grayscale opacity-60" />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center text-sm text-primary font-semibold">
          <p>
            Lifetrek Medical • Indaiatuba, SP • www.lifetrekmedical.com.br
          </p>
          <div className="flex items-center gap-1">
            <Linkedin className="w-4 h-4" />
            <a href="https://www.linkedin.com/company/lifetrekmedical" target="_blank" rel="noopener noreferrer" className="hover:underline">/lifetrekmedical</a>
          </div>
          <div className="flex items-center gap-1">
            <Instagram className="w-4 h-4" />
            <a href="https://www.instagram.com/lifetrekmedical/" target="_blank" rel="noopener noreferrer" className="hover:underline">@lifetrekmedical</a>
          </div>
          <div className="flex items-center gap-1">
            <Facebook className="w-4 h-4" />
            <span>/lifetrek</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnePager;