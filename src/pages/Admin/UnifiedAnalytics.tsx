import { useState } from "react";
import { useUnifiedAnalytics } from "@/hooks/useUnifiedAnalytics";
import { useInternalAnalytics } from "@/hooks/useInternalAnalytics";
import { WebsiteStatsCards } from "@/components/admin/analytics/WebsiteStatsCards";
import { TrafficByDayChart } from "@/components/admin/analytics/TrafficByDayChart";
import { TrafficSourcesChart } from "@/components/admin/analytics/TrafficSourcesChart";
import { TopPagesTable } from "@/components/admin/analytics/TopPagesTable";
import { CorrelationChart } from "@/components/admin/analytics/CorrelationChart";
import { StatsCards } from "@/components/admin/analytics/StatsCards";
import { ConnectionGrowthChart } from "@/components/admin/analytics/ConnectionGrowthChart";
import { LeadBehaviorStats } from "@/components/admin/analytics/LeadBehaviorStats";
import { PostPerformanceTable } from "@/components/admin/analytics/PostPerformanceTable";
import { MonthlyMarketingReport } from "@/components/admin/analytics/MonthlyMarketingReport";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCcw, Globe, Linkedin, Link2, Users, CalendarRange } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function UnifiedAnalytics() {
  const [days, setDays] = useState(7);
  const { data, loading, refetch } = useUnifiedAnalytics({ days });
  const { data: internalData, loading: internalLoading } = useInternalAnalytics({ days });

  // Transform LinkedIn data for existing StatsCards component
  const linkedinStats = {
    totalConnections: data.linkedin.totalConnections,
    totalConversations: data.linkedin.totalConversations,
    unreadConversations: data.linkedin.unreadConversations,
    profileViews: 0, // Not available yet
    connectionGrowth: data.linkedin.connectionGrowth,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Performance unificada: Website + LinkedIn
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="14">Últimos 14 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview" className="gap-2">
            <Link2 className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="website" className="gap-2">
            <Globe className="h-4 w-4" />
            Website
          </TabsTrigger>
          <TabsTrigger value="linkedin" className="gap-2">
            <Linkedin className="h-4 w-4" />
            LinkedIn
          </TabsTrigger>
          <TabsTrigger value="leads" className="gap-2">
            <Users className="h-4 w-4" />
            Leads
          </TabsTrigger>
          <TabsTrigger value="monthly" className="gap-2">
            <CalendarRange className="h-4 w-4" />
            Monthly Report
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - Combined View */}
        <TabsContent value="overview" className="space-y-6">
          {/* Website KPIs */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              Website (GA4)
            </h2>
            <WebsiteStatsCards stats={data.website.stats} loading={loading} />
          </div>

          {/* LinkedIn KPIs */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Linkedin className="h-5 w-5 text-[#0A66C2]" />
              LinkedIn
            </h2>
            <StatsCards stats={linkedinStats} loading={loading} />
          </div>

          {/* Correlation Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Link2 className="h-5 w-5 text-indigo-600" />
              Correlação LinkedIn → Website
            </h2>
            <CorrelationChart
              linkedinMessages={data.linkedin.messageData}
              linkedinTraffic={data.correlation.linkedinTraffic}
              correlationScore={data.correlation.correlationScore}
            />
          </div>
        </TabsContent>

        {/* Website Tab - Detailed GA4 */}
        <TabsContent value="website" className="space-y-6">
          <WebsiteStatsCards stats={data.website.stats} loading={loading} />
          
          <div className="grid gap-6 lg:grid-cols-2">
            <TrafficByDayChart data={data.website.history} />
            <TrafficSourcesChart data={data.website.trafficSources} />
          </div>

          <TopPagesTable data={data.website.topPages} loading={loading} />
        </TabsContent>

        {/* LinkedIn Tab - Detailed LinkedIn */}
        <TabsContent value="linkedin" className="space-y-6">
          <StatsCards stats={linkedinStats} loading={loading} />
          
          <div className="grid gap-6 lg:grid-cols-2">
            <ConnectionGrowthChart data={data.linkedin.history} />
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background rounded-xl p-6 border">
                <h3 className="font-semibold mb-4">Métricas de Mensagens</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">{data.linkedin.messagesSent}</p>
                    <p className="text-sm text-muted-foreground">Enviadas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-emerald-600">{data.linkedin.messagesReceived}</p>
                    <p className="text-sm text-muted-foreground">Recebidas</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t text-center">
                  <p className="text-2xl font-bold text-purple-600">{data.linkedin.responseRate}%</p>
                  <p className="text-sm text-muted-foreground">Taxa de Resposta</p>
                </div>
              </div>
            </div>
          </div>

          <PostPerformanceTable />
        </TabsContent>

        {/* Leads Tab - Internal Behavior */}
        <TabsContent value="leads" className="space-y-6">
          <LeadBehaviorStats data={internalData} loading={internalLoading} />
        </TabsContent>

        <TabsContent value="monthly" className="space-y-6">
          <MonthlyMarketingReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
