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
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCcw, Globe, Linkedin, Link2, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function AnalyticsDashboardCore() {
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
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4 bg-muted/20 p-4 rounded-lg border">
        <div>
          <h3 className="text-lg font-medium">Visão Geral de Performance</h3>
          <p className="text-sm text-muted-foreground">
            Acompanhe o impacto do seu conteúdo no tráfego e engajamento.
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
        <TabsList className="bg-muted/50 w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview" className="gap-2">
            <Link2 className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="website" className="gap-2">
            <Globe className="h-4 w-4" />
            Website (GA4)
          </TabsTrigger>
          <TabsTrigger value="linkedin" className="gap-2">
            <Linkedin className="h-4 w-4" />
            LinkedIn
          </TabsTrigger>
          <TabsTrigger value="leads" className="gap-2">
            <Users className="h-4 w-4" />
            Leads Internos
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - Combined View */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Website Summary */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                         <Globe className="h-4 w-4 text-blue-500" /> Website Traffic
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <WebsiteStatsCards stats={data.website.stats} loading={loading} minimal={true} />
                </CardContent>
            </Card>

            {/* LinkedIn Summary */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                         <Linkedin className="h-4 w-4 text-[#0A66C2]" /> LinkedIn Growth
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <StatsCards stats={linkedinStats} loading={loading} minimal={true} />
                </CardContent>
            </Card>
          </div>

          {/* Correlation Section */}
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-indigo-600" />
                    Correlação LinkedIn → Website
                </CardTitle>
                <CardDescription>
                    Como suas conversas no LinkedIn impactam o tráfego do site.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <CorrelationChart
                linkedinMessages={data.linkedin.messageData}
                linkedinTraffic={data.correlation.linkedinTraffic}
                correlationScore={data.correlation.correlationScore}
                />
            </CardContent>
          </Card>
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
        </TabsContent>

        {/* Leads Tab - Internal Behavior */}
        <TabsContent value="leads" className="space-y-6">
          <LeadBehaviorStats data={internalData} loading={internalLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
