import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LeadDetailsModal } from "@/components/admin/LeadDetailsModal";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart3,
  Download,
  Filter,
  Flame,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import Papa from "papaparse";

type LeadStatus = "new" | "contacted" | "in_progress" | "quoted" | "closed" | "rejected";
type LeadPriority = "low" | "medium" | "high";

interface LeadRecord {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  phone: string | null;
  project_type?: string | null;
  project_types: string[] | null;
  annual_volume: string | null;
  technical_requirements: string;
  message: string | null;
  status: LeadStatus;
  priority: LeadPriority;
  admin_notes: string | null;
  assigned_to: string | null;
  lead_score: number | null;
  score_breakdown: Record<string, unknown> | null;
  source?: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_ORDER: LeadStatus[] = [
  "new",
  "contacted",
  "in_progress",
  "quoted",
  "closed",
  "rejected",
];

const STATUS_META: Record<LeadStatus, { label: string; chip: string }> = {
  new: { label: "Novo", chip: "bg-sky-100 text-sky-800 border-sky-200" },
  contacted: { label: "Contato", chip: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  in_progress: { label: "Em andamento", chip: "bg-amber-100 text-amber-800 border-amber-200" },
  quoted: { label: "Proposta", chip: "bg-violet-100 text-violet-800 border-violet-200" },
  closed: { label: "Fechado", chip: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  rejected: { label: "Perdido", chip: "bg-slate-100 text-slate-700 border-slate-200" },
};

const PRIORITY_META: Record<LeadPriority, { label: string; chip: string }> = {
  low: { label: "Baixa", chip: "bg-slate-100 text-slate-700" },
  medium: { label: "Média", chip: "bg-blue-100 text-blue-700" },
  high: { label: "Alta", chip: "bg-orange-100 text-orange-700" },
};

export function LeadsCRMBoard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | LeadStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | LeadPriority>("all");
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contact_leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000);

      if (error) throw error;
      setLeads((data || []) as LeadRecord[]);
    } catch (error: any) {
      console.error("Failed to load leads:", error);
      toast({
        title: "Erro ao carregar leads",
        description: error?.message || "Não foi possível buscar os leads.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();

    const channel = supabase
      .channel("crm_leads_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contact_leads" },
        () => fetchLeads(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const text = `${lead.name || ""} ${lead.company || ""} ${lead.email || ""}`.toLowerCase();
      const matchesSearch = !search || text.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || lead.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [leads, priorityFilter, search, statusFilter]);

  const groupedByStatus = useMemo(() => {
    return STATUS_ORDER.reduce<Record<LeadStatus, LeadRecord[]>>((acc, status) => {
      acc[status] = filteredLeads.filter((lead) => lead.status === status);
      return acc;
    }, {} as Record<LeadStatus, LeadRecord[]>);
  }, [filteredLeads]);

  const kpis = useMemo(() => {
    const total = leads.length;
    const hot = leads.filter((lead) => (lead.lead_score || 0) >= 80).length;
    const openPipeline = leads.filter((lead) =>
      ["new", "contacted", "in_progress", "quoted"].includes(lead.status),
    ).length;
    const closed = leads.filter((lead) => lead.status === "closed").length;
    const closeRate = total > 0 ? (closed / total) * 100 : 0;
    return { total, hot, openPipeline, closeRate };
  }, [leads]);

  const updateLeadField = async (leadId: string, patch: Partial<LeadRecord>) => {
    try {
      const { error } = await supabase.from("contact_leads").update(patch).eq("id", leadId);
      if (error) throw error;

      setLeads((current) =>
        current.map((lead) => (lead.id === leadId ? { ...lead, ...patch } : lead)),
      );
    } catch (error: any) {
      toast({
        title: "Falha ao atualizar",
        description: error?.message || "Não foi possível atualizar o lead.",
        variant: "destructive",
      });
    }
  };

  const exportCsv = () => {
    const csv = Papa.unparse(filteredLeads);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crm_leads_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">CRM de Leads</h1>
          <p className="text-sm text-slate-600">Pipeline comercial com atualização em tempo real.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLeads}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button variant="outline" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Leads Totais</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-2xl font-semibold">{kpis.total}</span>
            <Users className="h-5 w-5 text-slate-500" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Leads Quentes</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-2xl font-semibold">{kpis.hot}</span>
            <Flame className="h-5 w-5 text-orange-500" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pipeline Aberto</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-2xl font-semibold">{kpis.openPipeline}</span>
            <Filter className="h-5 w-5 text-blue-500" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Taxa de Fechamento</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-2xl font-semibold">{kpis.closeRate.toFixed(1)}%</span>
            <BarChart3 className="h-5 w-5 text-emerald-500" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-3 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nome, empresa ou e-mail"
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value: "all" | LeadStatus) => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {STATUS_ORDER.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_META[status].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={priorityFilter}
              onValueChange={(value: "all" | LeadPriority) => setPriorityFilter(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as prioridades</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[1320px] grid-cols-6 gap-4">
          {STATUS_ORDER.map((status) => (
            <Card key={status} className="bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={STATUS_META[status].chip}>
                    {STATUS_META[status].label}
                  </Badge>
                  <span className="text-xs font-medium text-slate-500">
                    {groupedByStatus[status]?.length || 0}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <p className="text-xs text-slate-500">Carregando...</p>
                ) : groupedByStatus[status]?.length ? (
                  groupedByStatus[status].map((lead) => (
                    <div key={lead.id} className="rounded-lg border border-slate-200 p-3 shadow-sm">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{lead.name}</p>
                          <p className="text-xs text-slate-500">{lead.company || "Empresa não informada"}</p>
                        </div>
                        <Badge variant="outline" className={PRIORITY_META[lead.priority].chip}>
                          {PRIORITY_META[lead.priority].label}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-xs text-slate-600">
                        {lead.email && (
                          <p className="flex items-center gap-1.5">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{lead.email}</span>
                          </p>
                        )}
                        {lead.phone && (
                          <p className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3" />
                            <span>{lead.phone}</span>
                          </p>
                        )}
                      </div>

                      <div className="mt-3 space-y-2">
                        <Select
                          value={lead.status}
                          onValueChange={(value: LeadStatus) => updateLeadField(lead.id, { status: value })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_ORDER.map((value) => (
                              <SelectItem key={value} value={value}>
                                {STATUS_META[value].label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={lead.priority}
                          onValueChange={(value: LeadPriority) => updateLeadField(lead.id, { priority: value })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Baixa</SelectItem>
                            <SelectItem value="medium">Média</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">
                          {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => {
                            setSelectedLead(lead);
                            setDetailsOpen(true);
                          }}
                        >
                          Detalhes
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">Sem leads neste estágio.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <LeadDetailsModal
        lead={selectedLead}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onUpdate={fetchLeads}
      />
    </div>
  );
}
