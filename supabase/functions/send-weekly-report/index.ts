import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check for cron secret authentication (for scheduled jobs)
    const authHeader = req.headers.get("authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");
    
    // Allow either valid JWT (admin user) or cron secret
    const isCronAuth = authHeader === `Bearer ${cronSecret}`;
    
    if (!isCronAuth) {
      // If not cron auth, verify it's a valid admin JWT
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const { createClient: createAuthClient } = await import("npm:@supabase/supabase-js@2.75.0");
      const supabaseAuth = createAuthClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader || "" } }
      });
      
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
      if (authError || !user) {
        console.error("Unauthorized access attempt");
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Check if user is admin
      const { data: adminCheck } = await supabaseAuth
        .from("admin_users")
        .select("id")
        .eq("user_id", user.id)
        .single();
      
      if (!adminCheck) {
        console.error("Non-admin user attempted to trigger report");
        return new Response(
          JSON.stringify({ error: "Forbidden - Admin access required" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    console.log(`Starting weekly report generation... (auth: ${isCronAuth ? 'cron' : 'admin'})`);

    // Check for test mode and return data only
    const requestJson = await req.json().catch(() => ({}));
    const { test_mode, return_data_only } = requestJson;

    let newLeads, analyticsEvents;

    if (test_mode) {
      console.log("Running in TEST MODE with mock data");
      newLeads = Array.from({ length: 15 }, (_, i) => ({
        id: `mock-lead-${i}`,
        name: `Lead Teste ${i + 1}`,
        email: `test${i}@example.com`,
        company: `Empresa Mock ${i + 1}`,
        priority: i % 3 === 0 ? "high" : (i % 3 === 1 ? "medium" : "low"),
        lead_score: Math.floor(Math.random() * 5) + 1,
        status: i % 4 === 0 ? "new" : "contacted",
        project_types: ["medical_devices"],
        created_at: new Date().toISOString()
      }));
      
      analyticsEvents = Array.from({ length: 50 }, (_, i) => ({
        event_type: i % 3 === 0 ? "page_view" : (i % 3 === 1 ? "chatbot_interaction" : "form_submission"),
        company_email: `test${i}@example.com`
      }));
    } else {
      // Mock request for when running via GET/Cron (no body)
      // Re-initialize logic for standard fetching
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // ... Existing fetch logic ...
      // Fetch leads from last week
      const { data: leadsData, error: leadsError } = await supabase
        .from("contact_leads")
        .select("*")
        .gte("created_at", oneWeekAgo.toISOString())
        .order("created_at", { ascending: false });

      if (leadsError) {
        console.error("Error fetching leads:", leadsError);
        throw leadsError;
      }
      newLeads = leadsData;

      // Fetch analytics events from last week
      const { data: analyticsData, error: analyticsError } = await supabase
        .from("analytics_events")
        .select("*")
        .gte("created_at", oneWeekAgo.toISOString());

      if (analyticsError) {
        console.error("Error fetching analytics:", analyticsError);
        throw analyticsError;
      }
      analyticsEvents = analyticsData;
    }

    // Calculate statistics
    const stats = {
      totalNewLeads: newLeads?.length || 0,
      highPriorityLeads: newLeads?.filter(l => l.priority === "high").length || 0,
      mediumPriorityLeads: newLeads?.filter(l => l.priority === "medium").length || 0,
      lowPriorityLeads: newLeads?.filter(l => l.priority === "low").length || 0,
      leadsWithHighScore: newLeads?.filter(l => (l.lead_score || 0) >= 4).length || 0,
      chatbotInteractions: analyticsEvents?.filter(e => e.event_type === "chatbot_interaction").length || 0,
      formSubmissions: analyticsEvents?.filter(e => e.event_type === "form_submission").length || 0,
      pageViews: analyticsEvents?.filter(e => e.event_type === "page_view").length || 0,
      uniqueCompanies: new Set(analyticsEvents?.map(e => e.company_email).filter(Boolean)).size
    };
    
    // Check if we just want data return (for Dashboard)
    if (return_data_only) {
        return new Response(JSON.stringify({ success: true, stats, leads: newLeads }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    // ... Project Type, Status, Top Leads logic for Email ...
    // Get leads by project type
    const projectTypeCounts: Record<string, number> = {};
    newLeads?.forEach(lead => {
      if (lead.project_types && Array.isArray(lead.project_types)) {
        lead.project_types.forEach((type: string) => {
          projectTypeCounts[type] = (projectTypeCounts[type] || 0) + 1;
        });
      }
    });

    // Get leads by status
    const statusCounts: Record<string, number> = {};
    newLeads?.forEach(lead => {
      statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
    });

    // Format project type labels
    const projectTypeLabels: Record<string, string> = {
      dental_implants: "Implantes Dentários",
      orthopedic_implants: "Implantes Ortopédicos",
      spinal_implants: "Implantes de Coluna",
      veterinary_implants: "Implantes Veterinários",
      surgical_instruments: "Instrumentos Cirúrgicos",
      micro_precision_parts: "Peças de Micro Precisão",
      custom_tooling: "Ferramentas Customizadas",
      medical_devices: "Dispositivos Médicos",
      measurement_tools: "Instrumentos de Medição",
      other_medical: "Outros Médicos"
    };

    const statusLabels: Record<string, string> = {
      new: "Novo",
      contacted: "Contatado",
      in_progress: "Em Progresso",
      quoted: "Cotado",
      closed: "Fechado",
      rejected: "Rejeitado"
    };

    // Build project type summary
    const projectTypeSummary = Object.entries(projectTypeCounts)
      .map(([type, count]) => `• ${projectTypeLabels[type] || type}: ${count}`)
      .join("\n");

    // Build status summary
    const statusSummary = Object.entries(statusCounts)
      .map(([status, count]) => `• ${statusLabels[status] || status}: ${count}`)
      .join("\n");

    // Build top leads list (score >= 4)
    const topLeads = newLeads
      ?.filter(l => (l.lead_score || 0) >= 4)
      .slice(0, 5)
      .map(l => `• ${l.name} (${l.company || "N/A"}) - Score: ${l.lead_score || 0}/5 - ${l.email}`)
      .join("\n") || "Nenhum lead de alta pontuação esta semana.";

    // Get admin users for email recipients
    // If test mode, use a dummy email or the requester's email if possible, or just log
    let adminEmails: string[] = [];

    if (test_mode) {
        adminEmails = ["test@example.com"]; // Or fetch actual admin email if needed
    } else {
        const { data: adminUsers, error: adminError } = await supabase
          .from("admin_users")
          .select("user_id");

        if (adminError) throw adminError;

        for (const admin of adminUsers || []) {
          const { data: userData } = await supabase.auth.admin.getUserById(admin.user_id);
          if (userData?.user?.email) {
            adminEmails.push(userData.user.email);
          }
        }
    }
    
    // ... HTML Generation ... 
    // Format date range
    const dateFormatter = new Intl.DateTimeFormat('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
    const dateRangeStr = `${dateFormatter.format(oneWeekAgo)} - ${dateFormatter.format(now)}`;

    // Build email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #1a202c; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #004F8F 0%, #003D75 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
    .footer { background: #f7fafc; padding: 20px 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; }
    .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
    .stat-card { background: #f7fafc; padding: 15px; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 28px; font-weight: 700; color: #004F8F; }
    .stat-label { font-size: 12px; color: #718096; text-transform: uppercase; }
    .section { margin: 25px 0; }
    .section-title { font-size: 16px; font-weight: 600; color: #004F8F; margin-bottom: 10px; border-bottom: 2px solid #F07818; padding-bottom: 5px; display: inline-block; }
    .list { background: #f7fafc; padding: 15px; border-radius: 8px; white-space: pre-line; font-size: 14px; }
    .alert { background: #FEF3C7; border-left: 4px solid #F07818; padding: 15px; margin: 15px 0; border-radius: 0 8px 8px 0; }
    h1 { margin: 0; font-size: 24px; }
    .subtitle { opacity: 0.9; margin-top: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Relatório Semanal de Leads ${test_mode ? '(TEST)' : ''}</h1>
      <p class="subtitle">Lifetrek Medical CRM - ${dateRangeStr}</p>
    </div>
    
    <div class="content">
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-value">${stats.totalNewLeads}</div>
          <div class="stat-label">Novos Leads</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.leadsWithHighScore}</div>
          <div class="stat-label">Score Alto (4-5)</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.highPriorityLeads}</div>
          <div class="stat-label">Alta Prioridade</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.uniqueCompanies}</div>
          <div class="stat-label">Empresas Únicas</div>
        </div>
      </div>

      ${stats.leadsWithHighScore > 0 ? `
      <div class="alert">
        ⚠️ <strong>${stats.leadsWithHighScore} lead(s) com pontuação alta</strong> aguardando ação!
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">🎯 Top Leads da Semana</div>
        <div class="list">${topLeads}</div>
      </div>

      <div class="section">
        <div class="section-title">📁 Por Tipo de Projeto</div>
        <div class="list">${projectTypeSummary || "Nenhum dado disponível"}</div>
      </div>

      <div class="section">
        <div class="section-title">📈 Por Status</div>
        <div class="list">${statusSummary || "Nenhum dado disponível"}</div>
      </div>

      <div class="section">
        <div class="section-title">🌐 Atividade no Website</div>
        <div class="list">• Interações Chatbot: ${stats.chatbotInteractions}
• Submissões de Formulário: ${stats.formSubmissions}
• Visualizações de Página: ${stats.pageViews}</div>
      </div>
    </div>
    
    <div class="footer">
      <p style="margin: 0; font-size: 14px; color: #718096;">
        Este relatório é gerado automaticamente pelo sistema Lifetrek Medical CRM.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email to admins
    if (adminEmails.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No recipients found (or test mode logic skipped)", stats }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const emailResponse = await resend.emails.send({
      from: "Lifetrek CRM <onboarding@resend.dev>",
      to: adminEmails,
      subject: `📊 Relatório Semanal ${test_mode ? '[TEST]' : ''} - ${stats.totalNewLeads} Novos Leads`,
      html: emailHtml,
    });
    
    return new Response(JSON.stringify({ success: true, stats, email: emailResponse }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("Error in send-weekly-report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
