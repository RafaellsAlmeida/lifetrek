// @ts-nocheck
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DashboardOverview } from "@/components/admin/DashboardOverview";

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/admin/login");
        return;
      }

      // Check admin_permissions table first
      const { data: permData } = await supabase
        .from("admin_permissions")
        .select("*")
        .eq("email", user.email)
        .single();

      if (permData) {
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      // Fallback to admin_users table
      const { data: adminData } = await supabase
        .from("admin_users")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!adminData) {
        toast.error("Acesso negado");
        navigate("/");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const { data: events, error } = await supabase
        .from("analytics_events")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const chatbot = events?.filter(e => e.event_type === "chatbot_interaction").length || 0;
      const forms = events?.filter(e => e.event_type === "form_submission").length || 0;
      const leadMagnets = events?.filter(e => e.event_type === "lead_magnet_usage").length || 0;
      const consultations = events?.filter(e => e.event_type === "consultation_scheduled").length || 0;

      const uniqueEmails = new Set(events?.map(e => e.company_email).filter(Boolean));

      setAnalytics({
        chatbot_interactions: chatbot,
        form_submissions: forms,
        lead_magnets: leadMagnets,
        consultations: consultations,
        total_companies: uniqueEmails.size,
        recent_events: events?.slice(0, 20) || [],
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics");
    }
  };

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("contact_leads")
        .select("*")
        .order("lead_score", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      const sortedLeads = (data || []).sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setLeads(sortedLeads);
      setFilteredLeads(sortedLeads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast.error("Failed to load leads");
    }
  };

  const fetchEnhancedAnalytics = async () => {
    try {
      // Fetch project type distribution
      const { data: projectData, error: projectError } = await supabase
        .from("project_type_distribution")
        .select("*");

      if (projectError) throw projectError;

      setProjectTypeData(projectData || []);

      // Fetch detailed lead analytics with filters
      let query = supabase
        .from("lead_analytics_detailed")
        .select("*")
        .order("created_at", { ascending: false });

      if (dateRange?.from) {
        query = query.gte("created_at", dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        query = query.lte("created_at", dateRange.to.toISOString());
      }
      if (analyticsStatusFilter !== "all") {
        query = query.eq("status", analyticsStatusFilter as 'new' | 'contacted' | 'in_progress' | 'quoted' | 'closed' | 'rejected');
      }
      if (analyticsPriorityFilter !== "all") {
        query = query.eq("priority", analyticsPriorityFilter as 'low' | 'medium' | 'high');
      }

      const { data: analyticsData, error: analyticsError } = await query;

      if (analyticsError) throw analyticsError;

      // Filter by project type if specified
      let filteredData = analyticsData || [];
      if (projectTypeFilter !== "all") {
        filteredData = filteredData.filter(lead =>
          lead.project_types && lead.project_types.includes(projectTypeFilter as any)
        );
      }

      setLeadAnalyticsData(filteredData);
    } catch (error) {
      console.error("Error fetching enhanced analytics:", error);
      toast.error("Failed to load enhanced analytics");
    }
  };

  const handleDeleteLead = async () => {
    if (!leadToDelete) return;

    try {
      const { error } = await supabase
        .from("contact_leads")
        .delete()
        .eq("id", leadToDelete);

      if (error) throw error;

      toast.success("Lead deleted successfully");
      await fetchLeads();
      setLeadToDelete(null);
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast.error("Failed to delete lead");
    }
  };

  const handleViewDetails = (lead: any) => {
    setSelectedLead(lead);
    setIsDetailsModalOpen(true);
  };

  const calculateLeadStats = () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const newLeads = leads.filter(lead => new Date(lead.created_at) >= yesterday).length;
    const pendingLeads = leads.filter(lead => 
      lead.status === 'new' || lead.status === 'contacted' || lead.status === 'in_progress'
    ).length;
    const closedLeads = leads.filter(lead => lead.status === 'closed').length;
    const conversionRate = leads.length > 0 ? (closedLeads / leads.length) * 100 : 0;

    return {
      totalLeads: leads.length,
      newLeads,
      pendingLeads,
      conversionRate
    };
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <DashboardOverview />;
}
