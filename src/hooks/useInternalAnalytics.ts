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

      // Fetch current period events
      const { data: currentEvents, error: currentError } = await supabase
        .from("analytics_events")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      if (currentError) throw currentError;

      // Fetch previous period events for growth calculation
      const { data: prevEvents, error: prevError } = await supabase
        .from("analytics_events")
        .select("event_type")
        .gte("created_at", prevStartDate.toISOString())
        .lt("created_at", startDate.toISOString());

      if (prevError) throw prevError;

      // Calculate stats
      const countByType = (events: any[], type: EventType) => 
        events?.filter(e => e.event_type === type).length || 0;

      const stats: InternalStats = {
        resourceViews: countByType(currentEvents || [], "resource_view"),
        resourceReads: countByType(currentEvents || [], "resource_read"),
        chatbotOpens: countByType(currentEvents || [], "chatbot_opened"),
        chatbotMessages: countByType(currentEvents || [], "chatbot_message_sent"),
        leadsCaptures: countByType(currentEvents || [], "chatbot_lead_captured") + 
                       countByType(currentEvents || [], "form_submission"),
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
        leadsCaptures: countByType(prevEvents || [], "chatbot_lead_captured") + 
                       countByType(prevEvents || [], "form_submission"),
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
        const meta = event.metadata as Record<string, unknown> | null;
        const slug = (meta?.resource_slug as string) || "unknown";
        const title = (meta?.resource_title as string) || slug;
        
        if (!resourceMap.has(slug)) {
          resourceMap.set(slug, { slug, title, views: 0, reads: 0, downloads: 0, avgReadPercentage: 0 });
        }
        
        const res = resourceMap.get(slug)!;
        if (event.event_type === "resource_view") res.views++;
        if (event.event_type === "resource_read") {
          res.reads++;
          const readPct = (meta?.read_percentage as number) || 0;
          res.avgReadPercentage = (res.avgReadPercentage + readPct) / res.reads;
        }
        if (event.event_type === "resource_download") res.downloads++;
      });

      const resources = Array.from(resourceMap.values())
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      // Aggregate leads from website
      const leadEvents = (currentEvents || []).filter(
        e => e.company_email && 
          ["form_submission", "chatbot_lead_captured", "lead_magnet_usage"].includes(e.event_type)
      );

      const leadMap = new Map<string, LeadFromWebsite>();
      
      leadEvents.forEach(event => {
        const email = event.company_email as string;
        
        if (!leadMap.has(email)) {
          leadMap.set(email, {
            email,
            companyName: event.company_name,
            source: event.event_type,
            firstSeen: event.created_at,
            events: 0,
          });
        }
        
        const lead = leadMap.get(email)!;
        lead.events++;
        if (new Date(event.created_at) < new Date(lead.firstSeen)) {
          lead.firstSeen = event.created_at;
        }
      });

      const leads = Array.from(leadMap.values())
        .sort((a, b) => new Date(b.firstSeen).getTime() - new Date(a.firstSeen).getTime())
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
        if (["form_submission", "chatbot_lead_captured"].includes(event.event_type)) day.leads++;
        if (event.event_type === "chatbot_message_sent") day.chatbotMessages++;
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
