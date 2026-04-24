import { useState, Suspense, useEffect, Component, ErrorInfo, ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageEditorCore } from "@/components/admin/content/ImageEditorCore";
import { ContentApprovalCore } from "@/components/admin/content/ContentApprovalCore";
import { ContentOrchestratorCore, OrchestratorGenerationParams } from "@/components/admin/content/ContentOrchestratorCore";
import { ContentScheduler } from "@/components/admin/content/ContentScheduler";
// import { AnalyticsDashboardCore } from "@/components/admin/analytics/AnalyticsDashboardCore"; 
import { Loader2, LayoutDashboard, PenLine, Palette, CheckCircle2, CalendarDays, BarChart3 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Helper for loading state
function TabLoading() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-12 text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin mb-4" />
      <p>Carregando módulo...</p>
    </div>
  );
}

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-red-500 bg-white rounded-lg border border-red-200 m-4">
          <h2 className="text-lg font-bold mb-2">Something went wrong.</h2>
          <pre className="text-xs overflow-auto bg-slate-50 p-4 rounded">{this.state.error?.toString()}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

function ContextSidebar({ activeTab }: { activeTab: string }) {
  return (
    <div className="w-80 border-l border-slate-200 bg-white p-6 hidden xl:block h-full overflow-y-auto">
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-slate-500" />
            Contexto do Workspace
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Este painel fornece informações contextuais e ações rápidas baseadas na aba ativa: <strong>{activeTab}</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SocialMediaWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "create");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<"linkedin" | "instagram">("linkedin");

  // Update state when URL params change
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (val: string) => {
    setActiveTab(val);
    setSearchParams(prev => {
      prev.set("tab", val);
      return prev;
    });
  };

  const handleGenerateFromOrchestrator = async (input: OrchestratorGenerationParams) => {
    const topic = input?.topic?.trim() || "Plano de conteúdo técnico para OEMs de dispositivos médicos";
    const platform = input?.platform || selectedPlatform;
    setIsGenerating(true);

    try {
      const { error } = await supabase.functions.invoke("generate-linkedin-carousel", {
        body: {
          platform,
          topic,
          targetAudience: input?.targetAudience || "OEM / Parceiros de Manufatura Contratada (CM)",
          painPoint: input?.painPoint || "Dependência de importação e risco de qualidade em componentes críticos",
          desiredOutcome: input?.desiredOutcome || "Produção local previsível com qualidade auditável e lead time menor",
          proofPoints: Array.isArray(input?.proofPoints) && input.proofPoints.length > 0 ? input.proofPoints : [
            "ISO 13485",
            "Metrologia ZEISS Contura",
            "Sala Limpa ISO 7",
            "Usinagem CNC de precisão",
          ],
          ctaAction: input?.ctaAction || "Comente DIAGNOSTICO para avaliar um SKU crítico",
          format: "carousel",
          mode: "generate",
          numberOfCarousels: 1,
          researchLevel: "light",
          style_mode: "hybrid-composite",
          selectedEquipment: ["ZEISS Contura", "Citizen M32", "Sala Limpa ISO 7"],
        },
      });

      if (error) throw error;

      toast.success(`Conteúdo ${platform === "instagram" ? "Instagram" : "LinkedIn"} gerado e salvo como aprovado.`);
      setActiveTab("approve");
      setSearchParams((prev) => {
        prev.set("tab", "approve");
        return prev;
      });
    } catch (err: any) {
      throw err instanceof Error ? err : new Error(err?.message || "Falha ao gerar carrossel");
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
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      color: "indigo",
      description: "Resultados e Performance"
    }
  ];

  return (
    <ErrorBoundary>
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
          <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
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
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedPlatform("linkedin")}
                          className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                            selectedPlatform === "linkedin"
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          LinkedIn
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPlatform("instagram")}
                          className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                            selectedPlatform === "instagram"
                              ? "bg-pink-600 text-white border-pink-600"
                              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          Instagram
                        </button>
                      </div>
                      <ContentOrchestratorEmbed
                        onGenerate={handleGenerateFromOrchestrator}
                        isGenerating={isGenerating}
                        selectedPlatform={selectedPlatform}
                      />
                    </div>
                  </Suspense>
                </TabsContent>

                <TabsContent value="design" className="mt-0 focus-visible:outline-none h-full">
                  <Suspense fallback={<TabLoading />}>
                    <ImageEditorEmbed
                      postId={searchParams.get("id")}
                      postType={searchParams.get("type") as any}
                      slideIndex={Number(searchParams.get("slide") || 0)}
                    />
                  </Suspense>
                </TabsContent>

                <TabsContent value="approve" className="mt-0 focus-visible:outline-none h-full">
                  <Suspense fallback={<TabLoading />}>
                    <ContentApprovalEmbed />
                  </Suspense>
                </TabsContent>

                <TabsContent value="calendar" className="mt-0 focus-visible:outline-none h-full">
                  <Suspense fallback={<TabLoading />}>
                    <ContentSchedulerEmbed />
                  </Suspense>
                </TabsContent>

                <TabsContent value="analytics" className="mt-0 focus-visible:outline-none h-full">
                  <div className="p-12 text-center text-muted-foreground space-y-3">
                    <p>Use o módulo oficial de Analytics em <strong>/admin/analytics</strong> para upload CSV e relatórios.</p>
                    <button
                      type="button"
                      onClick={() => window.location.assign("/admin/analytics")}
                      className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Ir para Analytics
                    </button>
                  </div>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </div>

        <ContextSidebar activeTab={activeTab} />
      </div>
    </ErrorBoundary>
  );
}

function ImageEditorEmbed({ postId, postType, slideIndex }: { postId?: string | null, postType?: any, slideIndex?: number }) {
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const stateKey = searchParams.get("stateKey");
  const backUrl = returnTo
    ? `${returnTo}${stateKey ? `?${stateKey}` : ""}`
    : null;

  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-slate-200 overflow-hidden h-[80vh]">
      <ImageEditorCore
        embedded={true}
        postId={postId}
        postType={postType}
        slideIndex={slideIndex}
        onBack={backUrl ? () => window.location.assign(backUrl) : undefined}
      />
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

function ContentOrchestratorEmbed({
  onGenerate,
  isGenerating,
  selectedPlatform,
}: {
  onGenerate: (params: OrchestratorGenerationParams) => Promise<void>;
  isGenerating: boolean;
  selectedPlatform: "linkedin" | "instagram";
}) {
  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-slate-200 overflow-hidden h-[80vh]">
      {isGenerating && (
        <div className="px-4 py-2 border-b border-slate-200 bg-blue-50 text-sm text-blue-700">
          Gerando carrossel com assets reais...
        </div>
      )}
      <ContentOrchestratorCore embedded={true} onGenerate={onGenerate} defaultPlatform={selectedPlatform} />
    </div>
  );
}

function ContentSchedulerEmbed() {
  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-slate-200 p-6 min-h-[70vh]">
      <ContentScheduler />
    </div>
  );
}
