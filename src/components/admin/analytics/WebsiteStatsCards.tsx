import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, Clock, MousePointerClick, TrendingUp, TrendingDown } from "lucide-react";
import { GA4DailyStats } from "@/hooks/useGA4Analytics";

interface WebsiteStatsCardsProps {
  stats: GA4DailyStats;
  loading: boolean;
}

export function WebsiteStatsCards({ stats, loading }: WebsiteStatsCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-muted/20 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatGrowth = (value: number) => {
    const formatted = value.toFixed(1);
    if (value > 0) return `+${formatted}%`;
    if (value < 0) return `${formatted}%`;
    return "0%";
  };

  const GrowthIndicator = ({ value }: { value: number }) => (
    <span className={`flex items-center gap-1 ${value > 0 ? "text-green-600" : value < 0 ? "text-red-500" : "text-muted-foreground"}`}>
      {value > 0 ? <TrendingUp className="h-3 w-3" /> : value < 0 ? <TrendingDown className="h-3 w-3" /> : null}
      {formatGrowth(value)}
    </span>
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background border-blue-100 dark:border-blue-900/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Visitantes</CardTitle>
          <Users className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            vs período anterior <GrowthIndicator value={stats.userGrowth} />
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background border-emerald-100 dark:border-emerald-900/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sessões</CardTitle>
          <Activity className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.sessions.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            vs período anterior <GrowthIndicator value={stats.sessionGrowth} />
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-background border-amber-100 dark:border-amber-900/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Engajamento</CardTitle>
          <MousePointerClick className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(stats.engagementRate * 100).toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            {stats.engagedSessions.toLocaleString()} sessões engajadas
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background border-purple-100 dark:border-purple-900/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
          <Clock className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatDuration(stats.avgSessionDuration)}</div>
          <p className="text-xs text-muted-foreground">
            {stats.pageViews.toLocaleString()} pageviews
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
