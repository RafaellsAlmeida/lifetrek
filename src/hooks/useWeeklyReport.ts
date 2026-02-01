import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WeeklyStats {
  totalNewLeads: number;
  highPriorityLeads: number;
  leadsWithHighScore: number;
  uniqueCompanies: number;
  chatbotInteractions: number;
  formSubmissions: number;
  pageViews: number;
}

export function useWeeklyReport(testMode = false) {
  return useQuery({
    queryKey: ["weekly-report", testMode],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('send-weekly-report', {
        body: { return_data_only: true, test_mode: testMode }
      });

      if (error) throw error;
      return data as { success: boolean, stats: WeeklyStats, leads: any[] };
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}
