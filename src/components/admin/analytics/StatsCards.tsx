import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, Eye, TrendingUp } from "lucide-react";

interface AnalyticsStats {
  totalConnections: number;
  totalConversations: number;
  unreadConversations: number;
  profileViews: number;
  connectionGrowth: number; // +X from yesterday
}

interface StatsCardsProps {
  stats: AnalyticsStats;
  loading: boolean;
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  if (loading) {
     return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         {[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted/20 animate-pulse rounded-xl" />)}
     </div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Connections</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalConnections}</div>
          <p className="text-xs text-muted-foreground">
            {stats.connectionGrowth > 0 ? `+${stats.connectionGrowth}` : '0'} since yesterday
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Conversations</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalConversations}</div>
          <p className="text-xs text-muted-foreground">
            {stats.unreadConversations} unread messages
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.profileViews}</div>
          <p className="text-xs text-muted-foreground">
            Last 30 days
          </p>
        </CardContent>
      </Card>

       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
           {/* Placeholder calculation */}
          <div className="text-2xl font-bold">{(stats.totalConversations / (stats.totalConnections || 1) * 100).toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            Chats / Connections
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
