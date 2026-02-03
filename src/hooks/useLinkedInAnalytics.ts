import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsSnapshot {
  total_connections: number;
  total_conversations: number;
  unread_conversations: number;
  profile_views: number;
  snapshot_date: string;
}

export function useLinkedInAnalytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalConnections: 0,
    totalConversations: 0,
    unreadConversations: 0,
    profileViews: 0,
    connectionGrowth: 0
  });
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [messageData, setMessageData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Latest Snapshot
      const { data: latestSnapshot, error: snapError } = await (supabase
        .from("linkedin_analytics_daily" as any)
        .select("*")
        .order("snapshot_date", { ascending: false })
        .limit(1)
        .single() as any);

      if (snapError && snapError.code !== "PGRST116") console.error("Error fetching snapshot:", snapError);

      // 2. Fetch Previous Snapshot (for growth comparison)
      const { data: prevSnapshot } = await (supabase
        .from("linkedin_analytics_daily" as any)
        .select("total_connections")
        .order("snapshot_date", { ascending: false })
        .range(1, 1)
        .maybeSingle() as any);

      // 3. Fetch History (Last 30 days) for Connection Chart
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: history } = await (supabase
        .from("linkedin_analytics_daily" as any)
        .select("snapshot_date, total_connections")
        .gte("snapshot_date", thirtyDaysAgo.toISOString().split("T")[0])
        .order("snapshot_date", { ascending: true }) as any);

      const chartData = (history as AnalyticsSnapshot[] | null)?.map((d: AnalyticsSnapshot) => ({
        date: new Date(d.snapshot_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        connections: d.total_connections
      })) || [];
        
      if (latestSnapshot) {
        const snapshot = latestSnapshot as AnalyticsSnapshot;
        const prev = prevSnapshot as { total_connections: number } | null;
        setStats({
          totalConnections: snapshot.total_connections,
          totalConversations: snapshot.total_conversations,
          unreadConversations: snapshot.unread_conversations,
          profileViews: snapshot.profile_views,
          connectionGrowth: snapshot.total_connections - (prev?.total_connections || snapshot.total_connections)
        });
      }

      setHistoryData(chartData);
      
      // Mock Data for message volume until we accumulate history
      setMessageData([
          { date: "Jan 28", sent: 12, received: 5 },
          { date: "Jan 29", sent: 18, received: 8 },
          { date: "Jan 30", sent: 5, received: 12 },
          { date: "Jan 31", sent: 20, received: 15 },
          { date: "Feb 01", sent: 15, received: 10 },
          { date: "Feb 02", sent: 8, received: 22 },
      ]);

    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, historyData, messageData, loading, refetch: fetchData };
}
