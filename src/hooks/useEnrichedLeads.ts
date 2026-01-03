import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EnrichedLead {
  id: string;
  company: string;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  decision_maker: string | null;
  decision_makers_deep: any;
  scraped_emails: string | null;
  linkedin_person: string | null;
  lead_score: number | null;
  predicted_score: number | null;
  v2_score: number | null;
  renner_score: number | null;
  confidence_score: number | null;
  employees: number | null;
  years_active: number | null;
  products: string | null;
  fda_certified: boolean;
  ce_certified: boolean;
  linkedin_company: string | null;
  perplexity_segment: string | null;
  perplexity_city: string | null;
  perplexity_state: string | null;
  perplexity_decision_makers: string | null;
  perplexity_notes: string | null;
  status: string | null;
  source: string | null;
  enrichment_status: number;
  nome_empresa: string | null;
  created_at: string;
  updated_at: string;
}

export function useEnrichedLeads() {
  return useQuery({
    queryKey: ["enriched-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enriched_leads")
        .select("*")
        .order("lead_score", { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data as EnrichedLead[];
    },
  });
}

export function useEnrichedLeadsHighQuality() {
  return useQuery({
    queryKey: ["enriched-leads-high-quality"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enriched_leads")
        .select("*")
        .gte("lead_score", 70)
        .order("lead_score", { ascending: false });

      if (error) throw error;
      return data as EnrichedLead[];
    },
  });
}

export function useEnrichedLeadsBySegment(segment: string | null) {
  return useQuery({
    queryKey: ["enriched-leads-segment", segment],
    queryFn: async () => {
      let query = supabase
        .from("enriched_leads")
        .select("*")
        .order("lead_score", { ascending: false, nullsFirst: false });

      if (segment) {
        query = query.eq("perplexity_segment", segment);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as EnrichedLead[];
    },
    enabled: !!segment,
  });
}

export function useEnrichedLeadsStats() {
  return useQuery({
    queryKey: ["enriched-leads-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enriched_leads")
        .select("lead_score, confidence_score, perplexity_segment, state");

      if (error) throw error;

      const leads = data as EnrichedLead[];

      // Calculate statistics
      const totalLeads = leads.length;
      const highQualityLeads = leads.filter(l => (l.lead_score || 0) >= 70).length;
      const avgScore = leads.reduce((sum, l) => sum + (l.lead_score || 0), 0) / totalLeads;
      const avgConfidence = leads.reduce((sum, l) => sum + (l.confidence_score || 0), 0) / totalLeads;

      // Count by segment
      const segmentCounts: Record<string, number> = {};
      leads.forEach(l => {
        if (l.perplexity_segment) {
          segmentCounts[l.perplexity_segment] = (segmentCounts[l.perplexity_segment] || 0) + 1;
        }
      });

      // Count by state
      const stateCounts: Record<string, number> = {};
      leads.forEach(l => {
        if (l.state) {
          stateCounts[l.state] = (stateCounts[l.state] || 0) + 1;
        }
      });

      return {
        totalLeads,
        highQualityLeads,
        avgScore: avgScore.toFixed(1),
        avgConfidence: avgConfidence.toFixed(1),
        segments: Object.entries(segmentCounts)
          .map(([segment, count]) => ({ segment, count }))
          .sort((a, b) => b.count - a.count),
        states: Object.entries(stateCounts)
          .map(([state, count]) => ({ state, count }))
          .sort((a, b) => b.count - a.count),
      };
    },
  });
}
