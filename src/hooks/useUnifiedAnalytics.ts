import { useState, useEffect, useCallback, useMemo } from "react";
import { useGA4Analytics, GA4DailyStats, GA4PageData, GA4TrafficSource, GA4HistoryPoint } from "./useGA4Analytics";
import { useLinkedInAnalytics } from "./useLinkedInAnalytics";
import { supabase } from "@/integrations/supabase/client";

export interface UnifiedAnalyticsData {
  // Website (GA4)
  website: {
    stats: GA4DailyStats;
    history: GA4HistoryPoint[];
    topPages: GA4PageData[];
    trafficSources: GA4TrafficSource[];
  };
  // LinkedIn (Unipile)
  linkedin: {
    totalConnections: number;
    connectionGrowth: number;
    totalConversations: number;
    unreadConversations: number;
    messagesSent: number;
    messagesReceived: number;
    responseRate: number;
    history: Array<{ date: string; connections: number }>;
  };
  // Correlation data
  correlation: {
    linkedinTraffic: number;
    linkedinConversions: number;
    correlationScore: number;
  };
}

interface UseUnifiedAnalyticsOptions {
  days?: number;
}

export function useUnifiedAnalytics(options: UseUnifiedAnalyticsOptions = {}) {
  const { days = 7 } = options;
  
  const ga4 = useGA4Analytics({ days });
  const linkedin = useLinkedInAnalytics();
  
  const [correlationData, setCorrelationData] = useState({
    linkedinTraffic: 0,
    linkedinConversions: 0,
    correlationScore: 0,
  });
  const [correlationLoading, setCorrelationLoading] = useState(true);

  const fetchCorrelation = useCallback(async () => {
    try {
      setCorrelationLoading(true);
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const formatDate = (d: Date) => d.toISOString().split("T")[0];

      // Fetch traffic from LinkedIn source
      const { data: linkedinSource } = await (supabase
        .from("ga4_traffic_sources" as any)
        .select("sessions, users")
        .gte("snapshot_date", formatDate(startDate))
        .or("source.ilike.%linkedin%,medium.ilike.%social%") as any);

      const linkedinTraffic = (linkedinSource || []).reduce(
        (sum: number, s: any) => sum + (s.sessions || 0), 
        0
      );

      // Count conversions from LinkedIn visitors (events with linkedin referrer)
      // For now, estimate as % of linkedin traffic
      const linkedinConversions = Math.round(linkedinTraffic * 0.08); // 8% estimated conversion

      // Calculate correlation score (simple: messages sent vs linkedin traffic)
      // Higher score = better correlation between outreach and visits
      const messagesSent = linkedin.messageData.reduce(
        (sum: number, d: any) => sum + (d.sent || 0), 
        0
      );
      
      const correlationScore = messagesSent > 0 && linkedinTraffic > 0
        ? Math.min(100, Math.round((linkedinTraffic / messagesSent) * 50))
        : 0;

      setCorrelationData({
        linkedinTraffic,
        linkedinConversions,
        correlationScore,
      });
    } catch (error) {
      console.error("Error fetching correlation data:", error);
    } finally {
      setCorrelationLoading(false);
    }
  }, [days, linkedin.messageData]);

  useEffect(() => {
    if (!linkedin.loading) {
      fetchCorrelation();
    }
  }, [linkedin.loading, fetchCorrelation]);

  const loading = ga4.loading || linkedin.loading || correlationLoading;

  const data: UnifiedAnalyticsData = useMemo(() => ({
    website: {
      stats: ga4.stats,
      history: ga4.historyData,
      topPages: ga4.topPages,
      trafficSources: ga4.trafficSources,
    },
    linkedin: {
      totalConnections: linkedin.stats.totalConnections,
      connectionGrowth: linkedin.stats.connectionGrowth,
      totalConversations: linkedin.stats.totalConversations,
      unreadConversations: linkedin.stats.unreadConversations,
      messagesSent: linkedin.messageData.reduce((s: number, d: any) => s + (d.sent || 0), 0),
      messagesReceived: linkedin.messageData.reduce((s: number, d: any) => s + (d.received || 0), 0),
      responseRate: 65, // Placeholder - calculate from actual message data when available
      history: linkedin.historyData,
    },
    correlation: correlationData,
  }), [ga4, linkedin, correlationData]);

  const refetch = useCallback(async () => {
    await Promise.all([ga4.refetch(), linkedin.refetch()]);
    await fetchCorrelation();
  }, [ga4.refetch, linkedin.refetch, fetchCorrelation]);

  return {
    data,
    loading,
    refetch,
    days,
  };
}
