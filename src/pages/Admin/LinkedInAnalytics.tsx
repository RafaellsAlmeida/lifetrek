import { useLinkedInAnalytics } from "@/hooks/useLinkedInAnalytics";
import { StatsCards } from "@/components/admin/analytics/StatsCards";
import { ConnectionGrowthChart } from "@/components/admin/analytics/ConnectionGrowthChart";
import { MessageVolumeChart } from "@/components/admin/analytics/MessageVolumeChart";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

export default function LinkedInAnalytics() {
  const { stats, historyData, messageData, loading, refetch } = useLinkedInAnalytics();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">LinkedIn Analytics</h1>
          <p className="text-muted-foreground mt-1">
             Performance and engagement metrics for connected accounts.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
                <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
            </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <StatsCards stats={stats} loading={loading} />

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
         <ConnectionGrowthChart data={historyData} />
         <MessageVolumeChart data={messageData} />
      </div>
    </div>
  );
}
