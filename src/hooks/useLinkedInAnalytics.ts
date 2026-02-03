import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
      const { data: latestSnapshot, error: snapError } = await supabase
        .from("linkedin_analytics_daily")
        .select("*")
        .order("snapshot_date", { ascending: false })
        .limit(1)
        .single();

      if (snapError && snapError.code !== "PGRST116") console.error("Error fetching snapshot:", snapError);

      // 2. Fetch Previous Snapshot (for growth comparison)
      const { data: prevSnapshot } = await supabase
        .from("linkedin_analytics_daily")
        .select("total_connections")
        .order("snapshot_date", { ascending: false })
        .skip(1) // Skip the latest
        .limit(1)
        .maybeSingle();

      // 3. Fetch History (Last 30 days) for Connection Chart
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: history } = await supabase
        .from("linkedin_analytics_daily")
        .select("snapshot_date, total_connections")
        .gte("snapshot_date", thirtyDaysAgo.toISOString().split("T")[0])
        .order("snapshot_date", { ascending: true });

      // 4. Fetch Message Volume (Last 7 days) from specific table or aggregate
      // Since we just started tracking message volume via daily sync, we might not have much.
      // We can also query 'conversation_messages' for real-time aggregation if needed.
      // For now, let's use the daily snapshots if populated, or mock if empty.
      // Note: messages_sent_today / messages_received_today are in daily snapshot.
      
      const chartData = history?.map(d => ({
        date: new Date(d.snapshot_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        connections: d.total_connections
      })) || [];
        
      if (latestSnapshot) {
        setStats({
          totalConnections: latestSnapshot.total_connections,
          totalConversations: latestSnapshot.total_conversations,
          unreadConversations: latestSnapshot.unread_conversations,
          profileViews: latestSnapshot.profile_views,
          connectionGrowth: latestSnapshot.total_connections - (prevSnapshot?.total_connections || latestSnapshot.total_connections)
        });
      }

      setHistoryData(chartData);
      
      // Mock Data for message volume until we accumulate history
      // or query conversation_messages if we want granular
      setMessageData([
          { date: "Jan 28", sent: 12, received: 5 },
          { date: "Jan 29", sent: 18, received: 8 },
          { date: "Jan 30", sent: 5, received: 12 },
          { date: "Jan 31", sent: 20, received: 15 },
          { date: "Feb 01", sent: 15, received: 10 },
          { date: "Feb 02", sent: 8, received: 22 }, // Today/Yesterday
      ]);

    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, historyData, messageData, loading, refetch: fetchData };
}
