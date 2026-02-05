import { useState, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentOrchestratorCore } from "@/components/admin/content/ContentOrchestratorCore";
import { ImageEditorCore } from "@/components/admin/content/ImageEditorCore";
import { ContentApprovalCore } from "@/components/admin/content/ContentApprovalCore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ContentScheduler } from "@/components/admin/content/ContentScheduler";
import { 
  PenLine, 
  Palette, 
  CheckCircle2, 
  CalendarDays,
  Sparkles,
  LayoutDashboard,
  ChevronRight,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Loading placeholder
const TabLoading = () => (
  <div className="flex items-center justify-center h-[60vh]">
    <div className="text-center space-y-4">
      <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto" />
      <p className="text-slate-500 text-sm">Carregando...</p>
    </div>
  </div>
);

// Context sidebar for current post
const ContextSidebar = ({ activeTab }: { activeTab: string }) => (
  <div className="w-80 border-l border-slate-200 bg-gradient-to-b from-white to-slate-50 p-6 hidden xl:block">
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Info className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-slate-800">Contexto</h3>
      </div>
      
      <Card className="p-4 bg-white/80 backdrop-blur-sm border-slate-200">
        <h4 className="text-sm font-medium text-slate-700 mb-3">Dicas Rápidas</h4>
        <ul className="space-y-2 text-xs text-slate-600">
          {activeTab === "create" && (
            <>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-3 h-3 mt-0.5 text-blue-500" />
                <span>Digite uma ideia de conteúdo e deixe a IA elaborar</span>
              </li>
            </>
          )}
          {activeTab === "design" && (
            <>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-3 h-3 mt-0.5 text-purple-500" />
                <span>Arraste elementos para posicionar</span>
              </li>
            </>
          )}
          {activeTab === "approve" && (
            <>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-3 h-3 mt-0.5 text-green-500" />
                <span>Revise antes de aprovar</span>
              </li>
            </>
          )}
          {activeTab === "calendar" && (
            <>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-3 h-3 mt-0.5 text-amber-500" />
                <span>Arraste posts para agendar</span>
              </li>
            </>
          )}
        </ul>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-blue-600 to-purple-600 text-white border-0 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold">Agentes Ativos</span>
        </div>
        <p className="text-xs text-blue-100">
          O Estrategista e o Designer estão monitorando sua criação para sugerir melhorias em tempo real.
        </p>
      </Card>
    </div>
  </div>
);

export default function SocialMediaWorkspace() {
  const [activeTab, setActiveTab] = useState("create");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateCarousel = async (topic: string) => {
    setIsGenerating(true);
    toast.info(`Iniciando geração de carrossel: "${topic}"...`, {
      description: "Nossos agentes (Estrategista, Copywriter, Designer) estão trabalhando no seu post.",
      duration: 5000,
    });

    try {
      const { data, error } = await supabase.functions.invoke("generate-linkedin-carousel", {
        body: { 
          topic,
          targetAudience: "Gestores Hospitalares e Engenheiros Clínicos",
          researchLevel: "light"
        },
      });

      if (error) throw error;

      toast.success("Carrossel gerado com sucesso!", {
        description: "O rascunho já está disponível para sua revisão na aba de Aprovação.",
      });

      // Switch to approval tab to show results
      setActiveTab("approve");
    } catch (error: any) {
      console.error("Pipeline failure:", error);
      toast.error("Erro na geração do carrossel", {
        description: error.message || "Ocorreu um problema na comunicação com os agentes.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const tabs = [
    { 
      id: "create", 
      label: "Criar", 
      icon: PenLine, 
      color: "blue",
      description: "Gerar ideias e rascunhos com IA"
    },
    { 
      id: "design", 
      label: "Design", 
      icon: Palette, 
      color: "purple",
      description: "Editor visual de posts"
    },
    { 
      id: "approve", 
      label: "Aprovar", 
      icon: CheckCircle2, 
      color: "green",
      description: "Revisar e aprovar conteúdo"
    },
    { 
      id: "calendar", 
      label: "Agendar", 
      icon: CalendarDays, 
      color: "amber",
      description: "Planejar publicações"
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-md">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Social Media Workspace</h1>
                <p className="text-sm text-slate-500">
                  Crie, edite, aprove e agende seu conteúdo em um só lugar
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="px-6 py-4 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
            <TabsList className="inline-flex h-14 items-center justify-start rounded-xl bg-slate-100/80 p-1.5 gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={`
                      relative px-5 py-3 rounded-lg font-medium text-sm transition-all duration-200
                      flex items-center gap-2
                      data-[state=active]:bg-white data-[state=active]:shadow-md
                      data-[state=active]:text-slate-900
                      data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700
                    `}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? `text-${tab.color}-600` : ''}`} />
                    <span>{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6 h-full">
              <TabsContent value="create" className="mt-0 focus-visible:outline-none h-full">
                <Suspense fallback={<TabLoading />}>
                  <ContentOrchestratorEmbed onGenerate={handleGenerateCarousel} />
                </Suspense>
              </TabsContent>

              <TabsContent value="design" className="mt-0 focus-visible:outline-none h-full">
                <Suspense fallback={<TabLoading />}>
                  <ImageEditorEmbed />
                </Suspense>
              </TabsContent>

              <TabsContent value="approve" className="mt-0 focus-visible:outline-none h-full">
                <Suspense fallback={<TabLoading />}>
                  <ContentApprovalEmbed />
                </Suspense>
              </TabsContent>

              <TabsContent value="calendar" className="mt-0 focus-visible:outline-none h-full">
                <Suspense fallback={<TabLoading />}>
                  <ContentCalendarEmbed />
                </Suspense>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </div>

      <ContextSidebar activeTab={activeTab} />
    </div>
  );
}

function ContentOrchestratorEmbed({ onGenerate }: { onGenerate: (topic: string) => void }) {
  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-slate-200 overflow-hidden min-h-[70vh]">
        <ContentOrchestratorCore embedded={true} onGenerate={onGenerate} />
    </div>
  );
}

function ImageEditorEmbed() {
  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-slate-200 overflow-hidden h-[80vh]">
        <ImageEditorCore embedded={true} />
    </div>
  );
}

function ContentApprovalEmbed() {
  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-slate-200 p-6 min-h-[70vh]">
        <ContentApprovalCore embedded={true} />
    </div>
  );
}

function ContentCalendarEmbed() {
  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-slate-200 p-6 min-h-[70vh]">
        <ContentScheduler />
    </div>
  );
}
