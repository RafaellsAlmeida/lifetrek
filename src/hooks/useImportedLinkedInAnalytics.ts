import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type LinkedInAnalyticsRow = Database["public"]["Tables"]["linkedin_analytics"]["Row"];

interface ImportedAnalyticsSummary {
  totalImpressions: number;
  totalClicks: number;
  totalReactions: number;
  totalComments: number;
  totalShares: number;
  averageEngagementRate: number | null;
}

export interface ImportedLinkedInAnalyticsData {
  rows: LinkedInAnalyticsRow[];
  latestPeriod: string | null;
  latestPeriodRows: LinkedInAnalyticsRow[];
  topPosts: LinkedInAnalyticsRow[];
  summary: ImportedAnalyticsSummary;
}

export function useImportedLinkedInAnalytics() {
  const [data, setData] = useState<ImportedLinkedInAnalyticsData>({
    rows: [],
    latestPeriod: null,
    latestPeriodRows: [],
    topPosts: [],
    summary: {
      totalImpressions: 0,
      totalClicks: 0,
      totalReactions: 0,
      totalComments: 0,
      totalShares: 0,
      averageEngagementRate: null,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchImportedAnalytics() {
      setLoading(true);
      setError(null);

      try {
        const { data: rows, error: fetchError } = await supabase
          .from("linkedin_analytics")
          .select("*")
          .order("posted_at", { ascending: false });

        if (fetchError) throw fetchError;
        if (!active) return;

        const allRows = rows || [];
        const latestPeriod = allRows[0]?.uploaded_period || null;
        const latestPeriodRows = latestPeriod
          ? allRows.filter((row) => row.uploaded_period === latestPeriod)
          : [];

        const totalImpressions = latestPeriodRows.reduce((sum, row) => sum + (row.impressions || 0), 0);
        const totalClicks = latestPeriodRows.reduce((sum, row) => sum + (row.clicks || 0), 0);
        const totalReactions = latestPeriodRows.reduce((sum, row) => sum + (row.reactions || 0), 0);
        const totalComments = latestPeriodRows.reduce((sum, row) => sum + (row.comments || 0), 0);
        const totalShares = latestPeriodRows.reduce((sum, row) => sum + (row.shares || 0), 0);

        const engagementRates = latestPeriodRows
          .map((row) => row.engagement_rate)
          .filter((rate): rate is number => typeof rate === "number" && Number.isFinite(rate));

        const averageEngagementRate = engagementRates.length > 0
          ? engagementRates.reduce((sum, rate) => sum + rate, 0) / engagementRates.length
          : null;

        const topPosts = [...latestPeriodRows]
          .sort((a, b) => (b.impressions || 0) - (a.impressions || 0))
          .slice(0, 10);

        setData({
          rows: allRows,
          latestPeriod,
          latestPeriodRows,
          topPosts,
          summary: {
            totalImpressions,
            totalClicks,
            totalReactions,
            totalComments,
            totalShares,
            averageEngagementRate,
          },
        });
      } catch (err) {
        if (!active) return;
        setError(err as Error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void fetchImportedAnalytics();

    return () => {
      active = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    hasData: data.rows.length > 0,
  };
}
