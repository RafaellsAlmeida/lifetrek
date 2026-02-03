import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  ChevronDown, 
  ChevronRight, 
  BookOpen, 
  Settings, 
  Users, 
  MessageSquare, 
  FileText, 
  Phone,
  Loader2
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChecklistItem {
  key: string;
  label: string;
  indent?: boolean;
}

interface ChecklistSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: ChecklistItem[];
}

const CHECKLIST_SECTIONS: ChecklistSection[] = [
  {
    id: "access",
    title: "A. Acesso & Integrações",
    icon: <Settings className="h-4 w-4" />,
    items: [
      { key: "access_system", label: "Acesso ao sistema Lifetrek (login criado)" },
      { key: "access_linkedin_company", label: "Acesso à página da empresa no LinkedIn" },
      { key: "access_linkedin_personal", label: "LinkedIn pessoal do Rafael conectado", indent: true },
      { key: "access_sales_navigator", label: "LinkedIn Sales Navigator (licença individual)" },
      { key: "access_sn_trial", label: "Trial de 30 dias ativado (ou licença paga)", indent: true },
      { key: "access_sn_training", label: "Treinamento em filtros avançados agendado", indent: true },
      { key: "access_sn_lists", label: "Listas salvas criadas (ortopedia, odonto, vet, OEM)", indent: true },
      { key: "access_crm", label: "Acesso ao CRM ou planilha de gestão de leads" },
      { key: "access_email", label: "Email comercial configurado" },
      { key: "access_email_signature", label: "Assinatura de email configurada", indent: true },
      { key: "access_email_templates", label: "Modelos de resposta salvos", indent: true },
      { key: "access_whatsapp", label: "WhatsApp Business configurado" },
      { key: "access_whatsapp_auto", label: "Mensagens automáticas configuradas", indent: true },
      { key: "access_whatsapp_labels", label: "Etiquetas organizadas", indent: true },
      { key: "access_phone", label: "Sistema de telefonia/VoIP configurado" },
    ],
  },
  {
    id: "knowledge",
    title: "B. Conhecimento da Empresa",
    icon: <BookOpen className="h-4 w-4" />,
    items: [
      { key: "know_brand_book", label: "Brand Book Completo lido" },
      { key: "know_quick_ref", label: "Brand Quick Reference lido" },
      { key: "know_company_context", label: "Company Context lido" },
      { key: "know_pitch_deck", label: "Pitch Deck atualizado revisado" },
      { key: "know_market_research", label: "Pesquisa de mercado brasileiro entendida" },
      { key: "know_client_ortho", label: "Cliente: Ortopedia (próteses, placas, parafusos)" },
      { key: "know_client_dental", label: "Cliente: Odontologia (guias cirúrgicos, implantes)" },
      { key: "know_client_vet", label: "Cliente: Veterinária (placas, pinos)" },
      { key: "know_client_oem", label: "Cliente: OEM/Indústria (componentes para revenda)" },
      { key: "know_client_hospital", label: "Cliente: Hospitais (instrumentais customizados)" },
      { key: "know_sla", label: "SLA de resposta: 1h no horário comercial" },
      { key: "know_qualification", label: "Processo de qualificação: 3-6 perguntas" },
    ],
  },
  {
    id: "playbooks",
    title: "C. Playbooks e Prompts",
    icon: <FileText className="h-4 w-4" />,
    items: [
      { key: "play_linkedin_best", label: "LinkedIn Best Practices lido" },
      { key: "play_content_plan", label: "Plano de Conteúdo LinkedIn revisado" },
      { key: "play_enrichment", label: "Sales Enrichment System entendido" },
      { key: "play_lead_guide", label: "Lead Enrichment Guide lido" },
      { key: "play_linkedin_sequence", label: "Sequência de LinkedIn (conexão + follow-up)" },
      { key: "play_cold_email", label: "Cold Email por nicho" },
      { key: "play_inbound", label: "Resposta a inbound (formulário do site)" },
    ],
  },
  {
    id: "voice",
    title: "D. Regras de Voz e Tom",
    icon: <MessageSquare className="h-4 w-4" />,
    items: [
      { key: "voice_pt_br", label: "Idioma: Português BR técnico, educado, direto" },
      { key: "voice_we", label: "Postura: Falar como 'nós/nossa equipe'" },
      { key: "voice_no_price", label: "Nunca promete preço/prazo sem análise técnica" },
      { key: "voice_next_step", label: "Toda mensagem termina com próximo passo claro" },
    ],
  },
  {
    id: "escalation",
    title: "E. Regras de Escalação",
    icon: <Users className="h-4 w-4" />,
    items: [
      { key: "esc_high_value", label: "Sabe escalar lead de alto valor (score 4-5)" },
      { key: "esc_technical", label: "Sabe escalar dúvida técnica profunda" },
      { key: "esc_negotiation", label: "Sabe escalar negociação comercial" },
      { key: "esc_existing", label: "Sabe escalar cliente existente com problema" },
      { key: "esc_handoff", label: "Sabe fazer handoff contextualizado" },
    ],
  },
  {
    id: "channels",
    title: "F. Operação por Canal",
    icon: <Phone className="h-4 w-4" />,
    items: [
      { key: "ch_linkedin_invites", label: "LinkedIn: Enviar convites personalizados (20-30/dia)" },
      { key: "ch_linkedin_sequence", label: "LinkedIn: Gerenciar sequência de mensagens" },
      { key: "ch_linkedin_log", label: "LinkedIn: Logar interações no CRM" },
      { key: "ch_engagement", label: "Engajamento: Responder comentários em até 2h" },
      { key: "ch_engagement_hot", label: "Engajamento: Identificar comentários 'quentes'" },
      { key: "ch_inbound_ai", label: "Inbound: Usar AI Sales Assistant Prompt" },
      { key: "ch_inbound_sla", label: "Inbound: Primeira resposta em 15 min" },
      { key: "ch_phone_flow", label: "Telefone: Fluxo padrão dominado" },
      { key: "ch_multichannel", label: "Multi-canal: Centralizar histórico por lead" },
    ],
  },
  {
    id: "week1",
    title: "G. Primeira Semana",
    icon: <BookOpen className="h-4 w-4" />,
    items: [
      { key: "w1_d1_access", label: "Dia 1: Configurar acessos" },
      { key: "w1_d1_brand", label: "Dia 1: Ler Brand Book + Company Context" },
      { key: "w1_d1_pitch", label: "Dia 1: Assistir pitch deck" },
      { key: "w1_d2_playbooks", label: "Dia 2: Estudar playbooks" },
      { key: "w1_d2_enrichment", label: "Dia 2: Rodar script de enrichment" },
      { key: "w1_d2_qualification", label: "Dia 2: Entender fluxo de qualificação" },
      { key: "w1_d3_inbound", label: "Dia 3: Responder 5 leads inbound (com revisão)" },
      { key: "w1_d3_linkedin", label: "Dia 3: Enviar 10 convites LinkedIn (com revisão)" },
      { key: "w1_d3_calls", label: "Dia 3: Fazer 2 ligações de follow-up" },
      { key: "w1_d4_autonomy", label: "Dia 4: Responder inbound sozinha" },
      { key: "w1_d4_sequences", label: "Dia 4: Gerenciar sequências LinkedIn" },
      { key: "w1_d4_crm", label: "Dia 4: Começar a alimentar CRM" },
      { key: "w1_d5_feedback", label: "Dia 5: Reunião de feedback com líder" },
      { key: "w1_d5_plan", label: "Dia 5: Criar plano de ação para semana 2" },
    ],
  },
];

export function OnboardingChecklist() {
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>(["access", "week1"]);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase
        .from("onboarding_progress" as any)
        .select("item_key, completed")
        .eq("user_id", user.id) as any);

      if (error) throw error;

      const progressMap: Record<string, boolean> = {};
      (data as any[])?.forEach((item: any) => {
        progressMap[item.item_key] = item.completed;
      });
      setProgress(progressMap);
    } catch (error) {
      console.error("Error fetching progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = async (key: string) => {
    const newValue = !progress[key];
    setSaving(key);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await (supabase
        .from("onboarding_progress" as any)
        .upsert({
          user_id: user.id,
          item_key: key,
          completed: newValue,
          completed_at: newValue ? new Date().toISOString() : null,
        }, { onConflict: "user_id,item_key" }) as any);

      if (error) throw error;

      setProgress((prev) => ({ ...prev, [key]: newValue }));
      
      if (newValue) {
        toast.success("Item concluído!");
      }
    } catch (error) {
      console.error("Error updating progress:", error);
      toast.error("Erro ao salvar progresso");
    } finally {
      setSaving(null);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Calculate overall progress
  const totalItems = CHECKLIST_SECTIONS.reduce((sum, section) => sum + section.items.length, 0);
  const completedItems = Object.values(progress).filter(Boolean).length;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Calculate section progress
  const getSectionProgress = (section: ChecklistSection) => {
    const completed = section.items.filter((item) => progress[item.key]).length;
    return { completed, total: section.items.length };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Checklist de Onboarding
            </CardTitle>
            <CardDescription>
              SDR/Marketing Team Member - Lifetrek Medical
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-1">
            {progressPercent}%
          </Badge>
        </div>
        <Progress value={progressPercent} className="h-2 mt-4" />
        <p className="text-sm text-muted-foreground mt-2">
          {completedItems} de {totalItems} itens concluídos
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {CHECKLIST_SECTIONS.map((section) => {
              const { completed, total } = getSectionProgress(section);
              const isExpanded = expandedSections.includes(section.id);

              return (
                <Collapsible
                  key={section.id}
                  open={isExpanded}
                  onOpenChange={() => toggleSection(section.id)}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      {section.icon}
                      <span className="font-medium">{section.title}</span>
                    </div>
                    <Badge
                      variant={completed === total ? "default" : "secondary"}
                      className={completed === total ? "bg-green-500" : ""}
                    >
                      {completed}/{total}
                    </Badge>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <div className="space-y-2 pl-4 border-l-2 border-muted ml-5">
                      {section.items.map((item) => (
                        <div
                          key={item.key}
                          className={`flex items-center gap-3 py-2 px-3 rounded-md hover:bg-muted/30 transition-colors ${
                            item.indent ? "ml-4" : ""
                          }`}
                        >
                          <Checkbox
                            id={item.key}
                            checked={progress[item.key] || false}
                            onCheckedChange={() => toggleItem(item.key)}
                            disabled={saving === item.key}
                          />
                          <label
                            htmlFor={item.key}
                            className={`flex-1 cursor-pointer text-sm ${
                              progress[item.key] ? "text-muted-foreground line-through" : ""
                            }`}
                          >
                            {item.label}
                          </label>
                          {saving === item.key && (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          )}
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}