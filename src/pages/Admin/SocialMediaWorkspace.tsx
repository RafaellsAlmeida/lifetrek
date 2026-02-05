import { useState, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentOrchestratorCore } from "@/components/admin/content/ContentOrchestratorCore";
import { ImageEditorCore } from "@/components/admin/content/ImageEditorCore";
import { ContentApprovalCore } from "@/components/admin/content/ContentApprovalCore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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

// Loading placeholder
const TabLoading = () => (
  <div className="flex items-center justify-center h-[60vh]">
    <div className="text-center space-y-4">
      <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto" />
      <p className="text-slate-500 text-sm">Carregando...</p>
    </div>
  </div>
);

// Context sidebar for current post (future enhancement)
const ContextSidebar = ({ activeTab }: { activeTab: string }) => (
  <div className="w-80 border-l border-slate-200 bg-gradient-to-b from-white to-slate-50 p-6 hidden xl:block">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Info className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-slate-800">Contexto</h3>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
          <p className="text-2xl font-bold text-blue-700">12</p>
          <p className="text-xs text-blue-600">Rascunhos</p>
        </div>
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
          <p className="text-2xl font-bold text-amber-700">5</p>
          <p className="text-xs text-amber-600">Pendentes</p>
        </div>
        <div className="p-3 rounded-xl bg-green-50 border border-green-100">
          <p className="text-2xl font-bold text-green-700">28</p>
          <p className="text-xs text-green-600">Aprovados</p>
        </div>
        <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
          <p className="text-2xl font-bold text-purple-700">8</p>
          <p className="text-xs text-purple-600">Agendados</p>
        </div>
      </div>

      {/* Current Context */}
      <Card className="p-4 bg-white/80 backdrop-blur-sm border-slate-200">
        <h4 className="text-sm font-medium text-slate-700 mb-3">Dicas Rápidas</h4>
        <ul className="space-y-2 text-xs text-slate-600">
          {activeTab === "create" && (
            <>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-3 h-3 mt-0.5 text-blue-500" />
                <span>Digite uma ideia de conteúdo e deixe a IA elaborar</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-3 h-3 mt-0.5 text-blue-500" />
                <span>Rascunhos são salvos automaticamente</span>
              </li>
            </>
          )}
          {activeTab === "design" && (
            <>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-3 h-3 mt-0.5 text-purple-500" />
                <span>Arraste elementos para posicionar</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-3 h-3 mt-0.5 text-purple-500" />
                <span>Use templates da marca para consistência</span>
              </li>
            </>
          )}
          {activeTab === "approve" && (
            <>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-3 h-3 mt-0.5 text-green-500" />
                <span>Revise antes de aprovar</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-3 h-3 mt-0.5 text-green-500" />
                <span>Comentários ajudam o time a melhorar</span>
              </li>
            </>
          )}
          {activeTab === "calendar" && (
            <>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-3 h-3 mt-0.5 text-amber-500" />
                <span>Arraste posts para agendar</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-3 h-3 mt-0.5 text-amber-500" />
                <span>Horários otimizados são destacados</span>
              </li>
            </>
          )}
        </ul>
      </Card>

      {/* AI Assistant Teaser */}
      <Card className="p-4 bg-gradient-to-br from-blue-600 to-purple-600 text-white border-0">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold">Designer Agent</span>
          <Badge variant="secondary" className="bg-white/20 text-white text-[10px]">Em breve</Badge>
        </div>
        <p className="text-xs text-blue-100">
          IA que cria visuais seguindo as regras da marca automaticamente.
        </p>
      </Card>
    </div>
  </div>
);

export default function SocialMediaWorkspace() {
  const [activeTab, setActiveTab] = useState("create");

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
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white">
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
                      data-[state=inactive]:hover:bg-slate-200/50
                    `}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? `text-${tab.color}-600` : ''}`} />
                    <span>{tab.label}</span>
                    {isActive && (
                      <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-${tab.color}-600`} />
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            <p className="mt-2 text-xs text-slate-400">
              {tabs.find(t => t.id === activeTab)?.description}
            </p>
          </div>

          {/* Tab Contents */}
          <ScrollArea className="flex-1">
            <div className="p-6">
              <TabsContent value="create" className="mt-0 focus-visible:outline-none">
                <Suspense fallback={<TabLoading />}>
                  <ContentOrchestratorEmbed />
                </Suspense>
              </TabsContent>

              <TabsContent value="design" className="mt-0 focus-visible:outline-none">
                <Suspense fallback={<TabLoading />}>
                  <ImageEditorEmbed />
                </Suspense>
              </TabsContent>

              <TabsContent value="approve" className="mt-0 focus-visible:outline-none">
                <Suspense fallback={<TabLoading />}>
                  <ContentApprovalEmbed />
                </Suspense>
              </TabsContent>

              <TabsContent value="calendar" className="mt-0 focus-visible:outline-none">
                <Suspense fallback={<TabLoading />}>
                  <ContentCalendarEmbed />
                </Suspense>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </div>

      {/* Context Sidebar */}
      <ContextSidebar activeTab={activeTab} />
    </div>
  );
}

// Placeholder components until we extract core logic from AdminLayout-wrapped originals
// Phase 2 will create proper embeddable versions

function ContentOrchestratorEmbed() {
  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-slate-200 overflow-hidden min-h-[70vh]">
        <ContentOrchestratorCore embedded={true} />
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
    <Card className="p-6 bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm">
      <div className="text-center py-12 space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
          <CalendarDays className="w-8 h-8 text-amber-600" />
        </div>
        <h3 className="text-xl font-semibold text-slate-800">Calendário de Conteúdo</h3>
        <p className="text-slate-500 max-w-md mx-auto">
          Planeje e agende suas publicações. 
          Veja o cronograma mensal e otimize seus horários de postagem.
        </p>
        <Button 
          onClick={() => window.location.href = '/admin/content-calendar'} 
          className="bg-amber-600 hover:bg-amber-700"
        >
          Ver Calendário
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Card>
  );
}
