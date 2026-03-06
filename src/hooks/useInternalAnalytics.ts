import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { EventType } from "@/utils/trackAnalytics";

interface InternalStats {
  resourceViews: number;
  resourceReads: number;
  chatbotOpens: number;
  chatbotMessages: number;
  leadsCaptures: number;
  calculatorStarts: number;
  calculatorCompletes: number;
  ctaClicks: number;
}

interface ResourceAnalytics {
  slug: string;
  title: string;
  views: number;
  reads: number;
  downloads: number;
  avgReadPercentage: number;
}

interface LeadFromWebsite {
  name: string;
  email: string;
  companyName: string | null;
  source: string;
  firstSeen: string;
  events: number;
}

interface HistoryDataPoint {
  date: string;
  views: number;
  leads: number;
  chatbotMessages: number;
}

export interface InternalAnalyticsData {
  stats: InternalStats;
  statsGrowth: Partial<Record<keyof InternalStats, number>>;
  resources: ResourceAnalytics[];
  leads: LeadFromWebsite[];
  historyData: HistoryDataPoint[];
}

interface UseInternalAnalyticsOptions {
  days?: number;
}

export function useInternalAnalytics(options: UseInternalAnalyticsOptions = {}) {
  const { days = 7 } = options;
  const [data, setData] = useState<InternalAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Previous period for comparison
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - days);

      const [
        currentEventsRes,
        prevEventsRes,
        currentLeadsRes,
        prevLeadsRes,
      ] = await Promise.all([
        supabase
          .from("analytics_events")
          .select("*")
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString()),
        supabase
          .from("analytics_events")
          .select("event_type")
          .gte("created_at", prevStartDate.toISOString())
          .lt("created_at", startDate.toISOString()),
        supabase
          .from("contact_leads")
          .select("name, email, company, source, created_at")
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString())
          .order("created_at", { ascending: false }),
        supabase
          .from("contact_leads")
          .select("id", { count: "exact", head: true })
          .gte("created_at", prevStartDate.toISOString())
          .lt("created_at", startDate.toISOString()),
      ]);

      if (currentEventsRes.error) throw currentEventsRes.error;
      if (prevEventsRes.error) throw prevEventsRes.error;
      if (currentLeadsRes.error) throw currentLeadsRes.error;
      if (prevLeadsRes.error) throw prevLeadsRes.error;

      const currentEvents = currentEventsRes.data || [];
      const prevEvents = prevEventsRes.data || [];
      const currentLeads = currentLeadsRes.data || [];
      const previousLeadCount = prevLeadsRes.count || 0;

      // Calculate stats
      const countByType = (events: any[], type: EventType) => 
        events?.filter(e => e.event_type === type).length || 0;

      const stats: InternalStats = {
        resourceViews: countByType(currentEvents || [], "resource_view"),
        resourceReads: countByType(currentEvents || [], "resource_read"),
        chatbotOpens: countByType(currentEvents || [], "chatbot_opened"),
        chatbotMessages: countByType(currentEvents || [], "chatbot_message_sent"),
        leadsCaptures: currentLeads.length,
        calculatorStarts: countByType(currentEvents || [], "calculator_started"),
        calculatorCompletes: countByType(currentEvents || [], "calculator_completed"),
        ctaClicks: countByType(currentEvents || [], "cta_click"),
      };

      // Calculate growth
      const prevStats: InternalStats = {
        resourceViews: countByType(prevEvents || [], "resource_view"),
        resourceReads: countByType(prevEvents || [], "resource_read"),
        chatbotOpens: countByType(prevEvents || [], "chatbot_opened"),
        chatbotMessages: countByType(prevEvents || [], "chatbot_message_sent"),
        leadsCaptures: previousLeadCount,
        calculatorStarts: countByType(prevEvents || [], "calculator_started"),
        calculatorCompletes: countByType(prevEvents || [], "calculator_completed"),
        ctaClicks: countByType(prevEvents || [], "cta_click"),
      };

      const calcGrowth = (current: number, prev: number) => 
        prev === 0 ? (current > 0 ? 100 : 0) : ((current - prev) / prev) * 100;

      const statsGrowth: Partial<Record<keyof InternalStats, number>> = {
        resourceViews: calcGrowth(stats.resourceViews, prevStats.resourceViews),
        leadsCaptures: calcGrowth(stats.leadsCaptures, prevStats.leadsCaptures),
        chatbotMessages: calcGrowth(stats.chatbotMessages, prevStats.chatbotMessages),
      };

      // Aggregate resources
      const resourceEvents = (currentEvents || []).filter(
        e => ["resource_view", "resource_read", "resource_download"].includes(e.event_type)
      );
      
      const resourceMap = new Map<string, ResourceAnalytics>();
      
      resourceEvents.forEach(event => {
        const metadata = event.metadata as Record<string, unknown> | null;
        const slug = (metadata?.resource_slug as string) || "unknown";
        const title = (metadata?.resource_title as string) || slug;
        
        if (!resourceMap.has(slug)) {
          resourceMap.set(slug, { slug, title, views: 0, reads: 0, downloads: 0, avgReadPercentage: 0 });
        }
        
        const res = resourceMap.get(slug)!;
        if (event.event_type === "resource_view") res.views++;
        if (event.event_type === "resource_read") {
          res.reads++;
          const readPct = (metadata?.read_percentage as number) || 0;
          res.avgReadPercentage = (res.avgReadPercentage + readPct) / res.reads;
        }
        if (event.event_type === "resource_download") res.downloads++;
      });

      const resources = Array.from(resourceMap.values())
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      const leads = currentLeads
        .map((lead) => ({
          name: lead.name,
          email: lead.email,
          companyName: lead.company,
          source: lead.source,
          firstSeen: lead.created_at,
          events: 1,
        }))
        .slice(0, 20);

      // Build history data (daily aggregation)
      const historyMap = new Map<string, HistoryDataPoint>();
      
      (currentEvents || []).forEach(event => {
        const date = new Date(event.created_at).toISOString().split("T")[0];
        
        if (!historyMap.has(date)) {
          historyMap.set(date, { date, views: 0, leads: 0, chatbotMessages: 0 });
        }
        
        const day = historyMap.get(date)!;
        if (event.event_type === "resource_view") day.views++;
        if (event.event_type === "chatbot_message_sent") day.chatbotMessages++;
      });

      currentLeads.forEach((lead) => {
        const date = new Date(lead.created_at).toISOString().split("T")[0];

        if (!historyMap.has(date)) {
          historyMap.set(date, { date, views: 0, leads: 0, chatbotMessages: 0 });
        }

        const day = historyMap.get(date)!;
        day.leads++;
      });

      const historyData = Array.from(historyMap.values())
        .sort((a, b) => a.date.localeCompare(b.date));

      setData({
        stats,
        statsGrowth,
        resources,
        leads,
        historyData,
      });
    } catch (err) {
      setError(err as Error);
      console.error("Error fetching internal analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
