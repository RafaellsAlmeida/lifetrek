import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Clock3, ExternalLink, FileClock, UserPlus } from "lucide-react";

interface DashboardLead {
  id: string;
  name: string;
  company: string | null;
  email: string;
  created_at: string;
}

interface ApprovalItem {
  id: string;
  title: string;
  type: "blog" | "linkedin" | "resource";
  created_at: string;
}

interface DashboardStats {
  newLeads: number;
  pendingApprovals: number;
  dailyVisitors: number;
  ga4SnapshotDate: string | null;
  recentLeads: DashboardLead[];
  approvalItems: ApprovalItem[];
}

const TYPE_META: Record<ApprovalItem["type"], { label: string; className: string }> = {
  blog: { label: "Blog", className: "bg-blue-100 text-blue-800" },
  linkedin: { label: "LinkedIn", className: "bg-sky-100 text-sky-800" },
  resource: { label: "Recurso", className: "bg-amber-100 text-amber-800" },
};

export function SuperAdminDashboard({ userName }: { userName: string }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    newLeads: 0,
    pendingApprovals: 0,
    dailyVisitors: 0,
    ga4SnapshotDate: null,
    recentLeads: [],
    approvalItems: [],
  });

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);

      try {
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const [
          recentLeadsRes,
          newLeadsRes,
          ga4Res,
          blogsRes,
          linkedinRes,
          resourcesRes,
        ] = await Promise.all([
          supabase
            .from("contact_leads")
            .select("id, name, company, email, created_at")
            .order("created_at", { ascending: false })
            .limit(6),
          supabase
            .from("contact_leads")
            .select("id", { count: "exact", head: true })
            .gte("created_at", last24Hours),
          (supabase
            .from("ga4_analytics_daily" as any)
            .select("snapshot_date, total_users")
            .order("snapshot_date", { ascending: false })
            .limit(1) as any),
          supabase
            .from("blog_posts")
            .select("id, title, created_at", { count: "exact" })
            .eq("status", "pending_review")
            .order("created_at", { ascending: false })
            .limit(6),
          supabase
            .from("linkedin_carousels")
            .select("id, topic, created_at", { count: "exact" })
            .in("status", ["draft", "pending_approval"])
            .order("created_at", { ascending: false })
            .limit(6),
          (supabase
            .from("resources" as any)
            .select("id, title, created_at", { count: "exact" })
            .eq("status", "pending_approval")
            .order("created_at", { ascending: false })
            .limit(6) as any),
        ]);

        if (recentLeadsRes.error) throw recentLeadsRes.error;
        if (newLeadsRes.error) throw newLeadsRes.error;
        if (ga4Res.error) throw ga4Res.error;
        if (blogsRes.error) throw blogsRes.error;
        if (linkedinRes.error) throw linkedinRes.error;
        if (resourcesRes.error) throw resourcesRes.error;

        const approvalItems: ApprovalItem[] = [
          ...((blogsRes.data || []).map((item) => ({
            id: item.id,
            title: item.title,
            type: "blog" as const,
            created_at: item.created_at,
          }))),
          ...((linkedinRes.data || []).map((item) => ({
            id: item.id,
            title: item.topic,
            type: "linkedin" as const,
            created_at: item.created_at,
          }))),
          ...((resourcesRes.data || []).map((item) => ({
            id: item.id,
            title: item.title,
            type: "resource" as const,
            created_at: item.created_at,
          }))),
        ]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 6);

        const ga4Row = ga4Res.data?.[0] as { snapshot_date?: string; total_users?: number } | undefined;

        setStats({
          newLeads: newLeadsRes.count || 0,
          pendingApprovals:
            (blogsRes.count || 0) +
            (linkedinRes.count || 0) +
            (resourcesRes.count || 0),
          dailyVisitors: ga4Row?.total_users || 0,
          ga4SnapshotDate: ga4Row?.snapshot_date || null,
          recentLeads: (recentLeadsRes.data || []) as DashboardLead[],
          approvalItems,
        });
      } catch (error) {
        console.error("Failed to load admin dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    void fetchDashboardData();
  }, []);

  const statCards = [
    {
      label: "Novos leads",
      value: stats.newLeads,
      detail: "Ultimas 24 horas",
      icon: UserPlus,
    },
    {
      label: "Aguardando aprovacao",
      value: stats.pendingApprovals,
      detail: "Blogs, LinkedIn e recursos",
      icon: FileClock,
    },
    {
      label: "Visitantes GA4",
      value: stats.dailyVisitors,
      detail: stats.ga4SnapshotDate
        ? `Snapshot ${new Date(stats.ga4SnapshotDate).toLocaleDateString("pt-BR")}`
        : "Sem snapshot recente",
      icon: BarChart3,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Painel</h2>
          <p className="text-sm text-muted-foreground">Prioridades do dia para {userName}.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/admin/content-approval")}>
            Aprovações
          </Button>
          <Button onClick={() => navigate("/admin/leads")}>Leads</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="flex items-start justify-between pt-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                <p className="mt-2 text-3xl font-semibold">{loading ? "..." : card.value}</p>
                <p className="mt-2 text-xs text-muted-foreground">{card.detail}</p>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <card.icon className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Leads recentes</CardTitle>
              <CardDescription>Entradas novas no CRM.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/leads")}>
              Ver tudo
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum lead recente.</p>
            ) : (
              stats.recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-start justify-between rounded-xl border p-3">
                  <div>
                    <p className="font-medium">{lead.name}</p>
                    <p className="text-sm text-muted-foreground">{lead.company || lead.email}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Conteúdo aguardando aprovação</CardTitle>
              <CardDescription>Fila real do fluxo editorial.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/content-approval")}>
              Revisar
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.approvalItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nada pendente agora.</p>
            ) : (
              stats.approvalItems.map((item) => (
                <div key={`${item.type}-${item.id}`} className="flex items-start justify-between rounded-xl border p-3">
                  <div className="space-y-2">
                    <Badge className={TYPE_META[item.type].className} variant="secondary">
                      {TYPE_META[item.type].label}
                    </Badge>
                    <p className="font-medium leading-snug">{item.title}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" />
                    {new Date(item.created_at).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Resumo operacional</CardTitle>
            <CardDescription>Sem métricas pessoais do LinkedIn. Só o que exige ação.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/analytics")}>
            Analytics
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
      </Card>
    </div>
  );
}
