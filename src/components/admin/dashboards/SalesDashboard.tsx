import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  Users,
  Clock,
  AlertCircle,
  CheckCircle2,
  Mail,
  Phone,
  Building,
  Calendar,
  TrendingUp,
  Star,
  ArrowRight,
  RefreshCw,
  LogOut,
  Bot,
  BookOpen,
  Flame,
  LayoutGrid,
  MessageSquare
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SalesAgentChat } from "@/components/SalesAgentChat";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { ContentCalendarPreview } from "@/components/ev/ContentCalendarPreview";
import { QuickAccessGrid } from "@/components/ev/QuickAccessGrid";
import UnifiedInbox from "@/pages/UnifiedInbox";
import { WeeklyReportDashboard } from "@/components/WeeklyReportDashboard";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  project_type: string;
  project_types: string[] | null;
  annual_volume: string | null;
  technical_requirements: string;
  message: string | null;
  status: string;
  priority: string;
  lead_score: number | null;
  score_breakdown: any;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  source: string | null;
}

const projectTypeLabels: Record<string, string> = {
  dental_implants: "Implantes Dentários",
  orthopedic_implants: "Implantes Ortopédicos",
  spinal_implants: "Implantes de Coluna",
  veterinary_implants: "Implantes Veterinários",
  surgical_instruments: "Instrumentos Cirúrgicos",
  micro_precision_parts: "Peças de Micro Precisão",
  custom_tooling: "Ferramentas Customizadas",
  medical_devices: "Dispositivos Médicos",
  measurement_tools: "Instrumentos de Medição",
  other_medical: "Outros Médicos"
};

const statusLabels: Record<string, string> = {
  new: "Novo",
  contacted: "Contatado",
  in_progress: "Em Progresso",
  quoted: "Cotado",
  closed: "Fechado",
  rejected: "Rejeitado"
};

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-purple-100 text-purple-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  quoted: "bg-orange-100 text-orange-800",
  closed: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800"
};

export function SalesDashboard({ userName }: { userName?: string }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLeads();
    
    // Set up real-time subscription for new leads
    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contact_leads' },
        () => {
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeads = async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase
        .from("contact_leads")
        .select("*, source")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast.error("Erro ao carregar leads");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // Filter leads for different categories
  const newLeads = leads.filter(l => l.status === "new");
  const pendingAction = leads.filter(l => ["new", "contacted"].includes(l.status));
  const highPriorityLeads = leads.filter(l => l.priority === "high" && l.status !== "closed" && l.status !== "rejected");
  
  // Hot leads = leads from website (not imported cold leads)
  const hotLeadsToday = leads.filter(l => {
    const isFromWebsite = !l.source || l.source === "website" || l.source === "contact_form";
    const isToday = new Date(l.created_at).toDateString() === new Date().toDateString();
    return isFromWebsite && isToday;
  });
  
  const recentLeads = leads.filter(l => {
    const hoursSince = (Date.now() - new Date(l.created_at).getTime()) / (1000 * 60 * 60);
    return hoursSince < 24;
  });

  // Calculate stats
  const stats = {
    total: leads.length,
    new: newLeads.length,
    highPriority: highPriorityLeads.length,
    hotToday: hotLeadsToday.length,
    last24h: recentLeads.length,
    avgScore: leads.length > 0
      ? (leads.reduce((sum, l) => sum + (l.lead_score || 0), 0) / leads.length).toFixed(1)
      : "0"
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const LeadCard = ({ lead, showBadges = true }: { lead: Lead; showBadges?: boolean }) => (
    <Card className="hover:shadow-md transition-all duration-200 border-l-4" style={{
      borderLeftColor: lead.priority === "high" ? "#ef4444" : lead.priority === "medium" ? "#f59e0b" : "#22c55e"
    }}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-semibold text-lg flex items-center gap-2">
              {lead.name}
              {lead.lead_score && lead.lead_score >= 4 && (
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              )}
            </h4>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Building className="h-3 w-3" />
              {lead.company || "Empresa não informada"}
            </p>
          </div>
          {showBadges && (
            <div className="flex gap-2">
              <Badge className={statusColors[lead.status] || "bg-gray-100"}>
                {statusLabels[lead.status] || lead.status}
              </Badge>
              {lead.lead_score !== null && (
                <Badge variant="outline" className="font-mono">
                  Score: {lead.lead_score}/5
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span className="truncate">{lead.email}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span>{lead.phone}</span>
          </div>
        </div>

        {lead.project_types && lead.project_types.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {lead.project_types.slice(0, 3).map(type => (
              <Badge key={type} variant="secondary" className="text-xs">
                {projectTypeLabels[type] || type}
              </Badge>
            ))}
            {lead.project_types.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{lead.project_types.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(lead.created_at).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit"
            })}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/admin?lead=${lead.id}`)}
            className="text-primary"
          >
            Ver Detalhes
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex justify-between items-center mb-6">
           <div>
             <h1 className="text-2xl font-bold text-primary">Engenharia de Vendas</h1>
             <p className="text-sm text-muted-foreground">Bem-vindo, {userName || 'Engenheiro'}</p>
           </div>
           <div className="flex gap-2">
             <Button
                variant="outline"
                size="sm"
                onClick={fetchLeads}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
           </div>
        </div>

        {/* Quick Access Grid */}
        <QuickAccessGrid />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
            <CardContent className="p-4 text-center">
              <Flame className="h-6 w-6 mx-auto mb-2 text-orange-600" />
              <p className="text-3xl font-bold text-orange-700">{stats.hotToday}</p>
              <p className="text-xs text-orange-600">Quentes Hoje</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <p className="text-3xl font-bold text-blue-700">{stats.total}</p>
              <p className="text-xs text-blue-600">Total</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-yellow-200">
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
              <p className="text-3xl font-bold text-yellow-700">{stats.new}</p>
              <p className="text-xs text-yellow-600">Novos</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-red-200">
            <CardContent className="p-4 text-center">
              <AlertCircle className="h-6 w-6 mx-auto mb-2 text-red-600" />
              <p className="text-3xl font-bold text-red-700">{stats.highPriority}</p>
              <p className="text-xs text-red-600">Alta Prior.</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <p className="text-3xl font-bold text-green-700">{stats.last24h}</p>
              <p className="text-xs text-green-600">24h</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <p className="text-3xl font-bold text-purple-700">{stats.avgScore}</p>
              <p className="text-xs text-purple-600">Score</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="inbox" className="space-y-4">
          <TabsList className="grid w-full max-w-5xl grid-cols-8">
            <TabsTrigger value="hot" className="flex items-center gap-2">
              <Flame className="h-4 w-4" />
              <span className="hidden lg:inline">Quentes</span> ({hotLeadsToday.length})
            </TabsTrigger>
            <TabsTrigger value="action" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="hidden lg:inline">Pendente</span> ({pendingAction.length})
            </TabsTrigger>
            <TabsTrigger value="inbox" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden lg:inline">Inbox</span>
            </TabsTrigger>
             <TabsTrigger value="report" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden lg:inline">Relatório</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden lg:inline">Agenda</span>
            </TabsTrigger>
            <TabsTrigger value="assistant" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span className="hidden lg:inline">IA</span>
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden lg:inline">Tools</span>
            </TabsTrigger>
            <TabsTrigger value="onboarding" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden lg:inline">Início</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hot">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  Leads Quentes de Hoje
                </CardTitle>
                <CardDescription>
                  Leads que chegaram pelo website hoje (não importados)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {hotLeadsToday.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Flame className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum lead quente hoje ainda</p>
                        <p className="text-sm mt-2">Leads do website aparecerão aqui</p>
                      </div>
                    ) : (
                      hotLeadsToday.map(lead => (
                        <LeadCard key={lead.id} lead={lead} />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="action">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  Leads Aguardando Ação
                </CardTitle>
                <CardDescription>
                  Leads novos ou contatados que precisam de follow-up
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {pendingAction.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum lead pendente de ação!</p>
                      </div>
                    ) : (
                      pendingAction.map(lead => (
                        <LeadCard key={lead.id} lead={lead} />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inbox" className="h-[800px]">
             <UnifiedInbox />
          </TabsContent>

          <TabsContent value="report">
             <Card>
                <CardContent className="pt-6">
                  <WeeklyReportDashboard />
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="calendar">
            <ContentCalendarPreview />
          </TabsContent>

          <TabsContent value="assistant">
            <div className="max-w-4xl mx-auto">
              <SalesAgentChat />
            </div>
          </TabsContent>

          <TabsContent value="tools">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate("/admin/linkedin-carousel")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-blue-500" />
                    LinkedIn Carousel Generator
                  </CardTitle>
                  <CardDescription>
                    Crie carrosséis profissionais com IA para LinkedIn
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    Abrir LCG
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate("/admin/campaigns")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                    Campanhas
                  </CardTitle>
                  <CardDescription>
                    Monitore e gerencie suas campanhas de marketing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Ver Campanhas
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate("/admin/knowledge-base")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-green-500" />
                    Knowledge Base
                  </CardTitle>
                  <CardDescription>
                    Acesse a base de conhecimento da empresa
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Explorar Knowledge
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate("/admin/content-approval")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-orange-500" />
                    Aprovação de Conteúdo
                  </CardTitle>
                  <CardDescription>
                    Revise e aprove templates de conteúdo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Ver Pendentes
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="onboarding">
            <div className="max-w-4xl mx-auto">
              <OnboardingChecklist />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
