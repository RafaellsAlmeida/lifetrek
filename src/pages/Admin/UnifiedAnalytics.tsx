import { useState } from "react";
import { useUnifiedAnalytics } from "@/hooks/useUnifiedAnalytics";
import { useInternalAnalytics } from "@/hooks/useInternalAnalytics";
import { ImportedAnalyticsSummary } from "@/components/admin/analytics/ImportedAnalyticsSummary";
import { LeadBehaviorStats } from "@/components/admin/analytics/LeadBehaviorStats";
import { LinkedInCsvUploadPanel } from "@/components/admin/analytics/LinkedInCsvUploadPanel";
import { MonthlyMarketingReport } from "@/components/admin/analytics/MonthlyMarketingReport";
import { PostPerformanceTable } from "@/components/admin/analytics/PostPerformanceTable";
import { TopPagesTable } from "@/components/admin/analytics/TopPagesTable";
import { TrafficByDayChart } from "@/components/admin/analytics/TrafficByDayChart";
import { TrafficSourcesChart } from "@/components/admin/analytics/TrafficSourcesChart";
import { WebsiteStatsCards } from "@/components/admin/analytics/WebsiteStatsCards";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, CalendarRange, Globe, RefreshCcw, Users } from "lucide-react";

export default function UnifiedAnalytics() {
  const [days, setDays] = useState(30);
  const { data, loading, refetch } = useUnifiedAnalytics({ days });
  const {
    data: internalData,
    loading: internalLoading,
    refetch: refetchInternal,
  } = useInternalAnalytics({ days });

  const handleRefresh = async () => {
    await Promise.all([refetch(), refetchInternal()]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="mt-1 text-muted-foreground">Website, conteúdo LinkedIn e captação de leads.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={String(days)} onValueChange={(value) => setDays(Number(value))}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="14">Últimos 14 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => void handleRefresh()} disabled={loading || internalLoading}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${loading || internalLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <LinkedInCsvUploadPanel />

      <Tabs defaultValue="website" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="website" className="gap-2">
            <Globe className="h-4 w-4" />
            Website
          </TabsTrigger>
          <TabsTrigger value="linkedin" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Conteúdo LinkedIn
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

        <TabsContent value="website" className="space-y-6">
          <WebsiteStatsCards stats={data.website.stats} loading={loading} />

          <div className="grid gap-6 lg:grid-cols-2">
            <TrafficByDayChart data={data.website.history} />
            <TrafficSourcesChart data={data.website.trafficSources} />
          </div>

          <TopPagesTable data={data.website.topPages} loading={loading} />
        </TabsContent>

        <TabsContent value="linkedin" className="space-y-6">
          <PostPerformanceTable />
          <ImportedAnalyticsSummary />
        </TabsContent>

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
