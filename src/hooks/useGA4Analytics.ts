import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GA4DailyStats {
  totalUsers: number;
  newUsers: number;
  sessions: number;
  engagedSessions: number;
  avgSessionDuration: number;
  engagementRate: number;
  bounceRate: number;
  pageViews: number;
  // Comparison with previous period
  userGrowth: number;
  sessionGrowth: number;
}

export interface GA4PageData {
  pagePath: string;
  pageTitle: string;
  pageViews: number;
  avgTimeOnPage: number;
  bounceRate: number;
}

export interface GA4TrafficSource {
  source: string;
  medium: string;
  sessions: number;
  users: number;
  engagementRate: number;
}

export interface GA4HistoryPoint {
  date: string;
  users: number;
  sessions: number;
}

interface UseGA4AnalyticsOptions {
  days?: number; // Default 7 (weekly)
}

export function useGA4Analytics(options: UseGA4AnalyticsOptions = {}) {
  const { days = 7 } = options;
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<GA4DailyStats>({
    totalUsers: 0,
    newUsers: 0,
    sessions: 0,
    engagedSessions: 0,
    avgSessionDuration: 0,
    engagementRate: 0,
    bounceRate: 0,
    pageViews: 0,
    userGrowth: 0,
    sessionGrowth: 0,
  });
  const [historyData, setHistoryData] = useState<GA4HistoryPoint[]>([]);
  const [topPages, setTopPages] = useState<GA4PageData[]>([]);
  const [trafficSources, setTrafficSources] = useState<GA4TrafficSource[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - days);
      
      const formatDate = (d: Date) => d.toISOString().split("T")[0];

      // 1. Fetch current period daily data
      const { data: currentPeriod } = await (supabase
        .from("ga4_analytics_daily" as any)
        .select("*")
        .gte("snapshot_date", formatDate(startDate))
        .lte("snapshot_date", formatDate(endDate))
        .order("snapshot_date", { ascending: true }) as any);

      // 2. Fetch previous period for comparison
      const { data: prevPeriod } = await (supabase
        .from("ga4_analytics_daily" as any)
        .select("total_users, sessions")
        .gte("snapshot_date", formatDate(prevStartDate))
        .lt("snapshot_date", formatDate(startDate)) as any);

      // 3. Aggregate current period
      const current = currentPeriod || [];
      const prev = prevPeriod || [];

      const totalUsers = current.reduce((sum: number, d: any) => sum + (d.total_users || 0), 0);
      const totalSessions = current.reduce((sum: number, d: any) => sum + (d.sessions || 0), 0);
      const totalPageViews = current.reduce((sum: number, d: any) => sum + (d.page_views || 0), 0);
      const totalNewUsers = current.reduce((sum: number, d: any) => sum + (d.new_users || 0), 0);
      const totalEngagedSessions = current.reduce((sum: number, d: any) => sum + (d.engaged_sessions || 0), 0);

      const avgEngagementRate = current.length > 0
        ? current.reduce((sum: number, d: any) => sum + (d.engagement_rate || 0), 0) / current.length
        : 0;
      const avgBounceRate = current.length > 0
        ? current.reduce((sum: number, d: any) => sum + (d.bounce_rate || 0), 0) / current.length
        : 0;
      const avgSessionDuration = current.length > 0
        ? current.reduce((sum: number, d: any) => sum + (d.avg_session_duration_seconds || 0), 0) / current.length
        : 0;

      const prevTotalUsers = prev.reduce((sum: number, d: any) => sum + (d.total_users || 0), 0);
      const prevTotalSessions = prev.reduce((sum: number, d: any) => sum + (d.sessions || 0), 0);

      setStats({
        totalUsers,
        newUsers: totalNewUsers,
        sessions: totalSessions,
        engagedSessions: totalEngagedSessions,
        avgSessionDuration,
        engagementRate: avgEngagementRate,
        bounceRate: avgBounceRate,
        pageViews: totalPageViews,
        userGrowth: prevTotalUsers > 0 ? ((totalUsers - prevTotalUsers) / prevTotalUsers) * 100 : 0,
        sessionGrowth: prevTotalSessions > 0 ? ((totalSessions - prevTotalSessions) / prevTotalSessions) * 100 : 0,
      });

      // History for chart
      setHistoryData(
        current.map((d: any) => ({
          date: new Date(d.snapshot_date).toLocaleDateString("pt-BR", { 
            month: "short", 
            day: "numeric" 
          }),
          users: d.total_users || 0,
          sessions: d.sessions || 0,
        }))
      );

      // 4. Fetch Top Pages (aggregate over period)
      const { data: pageData } = await (supabase
        .from("ga4_page_analytics" as any)
        .select("page_path, page_title, page_views, avg_time_on_page_seconds, bounce_rate")
        .gte("snapshot_date", formatDate(startDate))
        .order("page_views", { ascending: false })
        .limit(10) as any);

      // Aggregate by page path
      const pageMap = new Map<string, GA4PageData>();
      (pageData || []).forEach((p: any) => {
        const existing = pageMap.get(p.page_path);
        if (existing) {
          existing.pageViews += p.page_views || 0;
        } else {
          pageMap.set(p.page_path, {
            pagePath: p.page_path,
            pageTitle: p.page_title || p.page_path,
            pageViews: p.page_views || 0,
            avgTimeOnPage: p.avg_time_on_page_seconds || 0,
            bounceRate: p.bounce_rate || 0,
          });
        }
      });

      setTopPages(
        Array.from(pageMap.values())
          .sort((a, b) => b.pageViews - a.pageViews)
          .slice(0, 10)
      );

      // 5. Fetch Traffic Sources (aggregate)
      const { data: sourceData } = await (supabase
        .from("ga4_traffic_sources" as any)
        .select("source, medium, sessions, users, engagement_rate")
        .gte("snapshot_date", formatDate(startDate)) as any);

      const sourceMap = new Map<string, GA4TrafficSource>();
      (sourceData || []).forEach((s: any) => {
        const key = `${s.source}/${s.medium}`;
        const existing = sourceMap.get(key);
        if (existing) {
          existing.sessions += s.sessions || 0;
          existing.users += s.users || 0;
        } else {
          sourceMap.set(key, {
            source: s.source,
            medium: s.medium || "(none)",
            sessions: s.sessions || 0,
            users: s.users || 0,
            engagementRate: s.engagement_rate || 0,
          });
        }
      });

      setTrafficSources(
        Array.from(sourceMap.values())
          .sort((a, b) => b.sessions - a.sessions)
          .slice(0, 8)
      );

    } catch (error) {
      console.error("Error loading GA4 analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { 
    stats, 
    historyData, 
    topPages, 
    trafficSources, 
    loading, 
    refetch: fetchData 
  };
}
