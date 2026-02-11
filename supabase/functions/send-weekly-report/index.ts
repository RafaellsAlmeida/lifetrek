import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body first to check for return_data_only
    const requestJson = await req.json().catch(() => ({}));
    const { test_mode, return_data_only } = requestJson;

    // Auth: Allow all requests - email sending is protected by RESEND_API_KEY
    // Cron jobs are internal, dashboard uses return_data_only
    console.log("Starting weekly report generation...");

    // Date calculations
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneWeekAgoStr = oneWeekAgo.toISOString().split("T")[0];

    let newLeads: any[] = [];
    let ga4Stats = { totalUsers: 0, sessions: 0, pageViews: 0, engagementRate: 0 };
    let topPages: any[] = [];
    let trafficSources: any[] = [];

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
      ga4Stats = { totalUsers: 127, sessions: 168, pageViews: 705, engagementRate: 0.35 };
    } else {
      // Fetch leads from last week
      const { data: leadsData, error: leadsError } = await supabase
        .from("contact_leads")
        .select("*")
        .gte("created_at", oneWeekAgo.toISOString())
        .order("created_at", { ascending: false });

      if (leadsError) {
        console.error("Error fetching leads:", leadsError);
      }
      newLeads = leadsData || [];

      // Fetch GA4 analytics from last week
      const { data: ga4Data, error: ga4Error } = await supabase
        .from("ga4_analytics_daily")
        .select("*")
        .gte("snapshot_date", oneWeekAgoStr);

      if (ga4Error) {
        console.error("Error fetching GA4 data:", ga4Error);
      }

      if (ga4Data && ga4Data.length > 0) {
        ga4Stats = {
          totalUsers: ga4Data.reduce((sum, d) => sum + (d.total_users || 0), 0),
          sessions: ga4Data.reduce((sum, d) => sum + (d.sessions || 0), 0),
          pageViews: ga4Data.reduce((sum, d) => sum + (d.page_views || 0), 0),
          engagementRate: ga4Data.reduce((sum, d) => sum + (d.engagement_rate || 0), 0) / ga4Data.length,
        };
      }

      // Fetch top pages
      const { data: pagesData } = await supabase
        .from("ga4_page_analytics")
        .select("page_path, page_views")
        .gte("snapshot_date", oneWeekAgoStr)
        .order("page_views", { ascending: false })
        .limit(10);

      // Aggregate by page_path
      const pageMap = new Map<string, number>();
      (pagesData || []).forEach((p: any) => {
        const current = pageMap.get(p.page_path) || 0;
        pageMap.set(p.page_path, current + p.page_views);
      });
      topPages = Array.from(pageMap.entries())
        .map(([path, views]) => ({ path, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

      // Fetch traffic sources
      const { data: sourcesData } = await supabase
        .from("ga4_traffic_sources")
        .select("source, sessions")
        .gte("snapshot_date", oneWeekAgoStr);

      // Aggregate by source
      const sourceMap = new Map<string, number>();
      (sourcesData || []).forEach((s: any) => {
        const current = sourceMap.get(s.source) || 0;
        sourceMap.set(s.source, current + s.sessions);
      });
      trafficSources = Array.from(sourceMap.entries())
        .map(([source, sessions]) => ({ source, sessions }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 5);
    }

    // Calculate lead statistics
    const leadStats = {
      totalNewLeads: newLeads.length,
      highPriorityLeads: newLeads.filter(l => l.priority === "high").length,
      mediumPriorityLeads: newLeads.filter(l => l.priority === "medium").length,
      lowPriorityLeads: newLeads.filter(l => l.priority === "low").length,
      leadsWithHighScore: newLeads.filter(l => (l.lead_score || 0) >= 4).length,
    };

    const stats = { ...leadStats, ...ga4Stats };

    // Check if we just want data return (for Dashboard)
    if (return_data_only) {
      return new Response(JSON.stringify({ success: true, stats, leads: newLeads, topPages, trafficSources }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Get leads by project type
    const projectTypeCounts: Record<string, number> = {};
    newLeads.forEach(lead => {
      if (lead.project_types && Array.isArray(lead.project_types)) {
        lead.project_types.forEach((type: string) => {
          projectTypeCounts[type] = (projectTypeCounts[type] || 0) + 1;
        });
      }
    });

    // Get leads by status
    const statusCounts: Record<string, number> = {};
    newLeads.forEach(lead => {
      statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
    });

    // Format labels
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

    // Build summaries
    const projectTypeSummary = Object.entries(projectTypeCounts)
      .map(([type, count]) => `• ${projectTypeLabels[type] || type}: ${count}`)
      .join("\n");

    const statusSummary = Object.entries(statusCounts)
      .map(([status, count]) => `• ${statusLabels[status] || status}: ${count}`)
      .join("\n");

    // Build top leads list (score >= 4)
    const topLeads = newLeads
      .filter(l => (l.lead_score || 0) >= 4)
      .slice(0, 5)
      .map(l => `• ${l.name} (${l.company || "N/A"}) - Score: ${l.lead_score || 0}/5 - ${l.email}`)
      .join("\n") || "Nenhum lead de alta pontuação esta semana.";

    // Build top pages summary
    const topPagesSummary = topPages.length > 0
      ? topPages.map(p => `• ${p.path}: ${p.views} visualizações`).join("\n")
      : "Sem dados de páginas";

    // Build traffic sources summary
    const trafficSourcesSummary = trafficSources.length > 0
      ? trafficSources.map(s => `• ${s.source}: ${s.sessions} sessões`).join("\n")
      : "Sem dados de tráfego";

    // Fixed recipient list
    const adminEmails = [
      "njesus@lifetrek-medical.com",
      "rbianchini@lifetrek-medical.com",
      "erenner@lifetrek-medical.com",
      "vmartin@lifetrek-medical.com",
    ];

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
    .ga4-section { background: #EBF5FF; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .ga4-title { color: #004F8F; font-weight: 600; margin-bottom: 15px; }
    .ga4-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    .ga4-stat { text-align: center; }
    .ga4-value { font-size: 20px; font-weight: 700; color: #1A7A3E; }
    .ga4-label { font-size: 11px; color: #718096; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Relatório Semanal ${test_mode ? '(TEST)' : ''}</h1>
      <p class="subtitle">Lifetrek Medical CRM - ${dateRangeStr}</p>
    </div>

    <div class="content">
      <!-- GA4 Website Stats -->
      <div class="ga4-section">
        <div class="ga4-title">🌐 Analytics do Website (GA4)</div>
        <div class="ga4-grid">
          <div class="ga4-stat">
            <div class="ga4-value">${ga4Stats.totalUsers}</div>
            <div class="ga4-label">Visitantes</div>
          </div>
          <div class="ga4-stat">
            <div class="ga4-value">${ga4Stats.sessions}</div>
            <div class="ga4-label">Sessões</div>
          </div>
          <div class="ga4-stat">
            <div class="ga4-value">${ga4Stats.pageViews}</div>
            <div class="ga4-label">Page Views</div>
          </div>
          <div class="ga4-stat">
            <div class="ga4-value">${Math.round(ga4Stats.engagementRate * 100)}%</div>
            <div class="ga4-label">Engagement</div>
          </div>
        </div>
      </div>

      <!-- Lead Stats -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-value">${leadStats.totalNewLeads}</div>
          <div class="stat-label">Novos Leads</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${leadStats.leadsWithHighScore}</div>
          <div class="stat-label">Score Alto (4-5)</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${leadStats.highPriorityLeads}</div>
          <div class="stat-label">Alta Prioridade</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${leadStats.mediumPriorityLeads + leadStats.lowPriorityLeads}</div>
          <div class="stat-label">Média/Baixa Prior.</div>
        </div>
      </div>

      ${leadStats.leadsWithHighScore > 0 ? `
      <div class="alert">
        ⚠️ <strong>${leadStats.leadsWithHighScore} lead(s) com pontuação alta</strong> aguardando ação!
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">🎯 Top Leads da Semana</div>
        <div class="list">${topLeads}</div>
      </div>

      <div class="section">
        <div class="section-title">📄 Páginas Mais Visitadas</div>
        <div class="list">${topPagesSummary}</div>
      </div>

      <div class="section">
        <div class="section-title">🔗 Fontes de Tráfego</div>
        <div class="list">${trafficSourcesSummary}</div>
      </div>

      ${Object.keys(projectTypeCounts).length > 0 ? `
      <div class="section">
        <div class="section-title">📁 Por Tipo de Projeto</div>
        <div class="list">${projectTypeSummary}</div>
      </div>
      ` : ''}

      ${Object.keys(statusCounts).length > 0 ? `
      <div class="section">
        <div class="section-title">📈 Por Status</div>
        <div class="list">${statusSummary}</div>
      </div>
      ` : ''}
    </div>

    <div class="footer">
      <p style="margin: 0; font-size: 14px; color: #718096;">
        Este relatório é gerado automaticamente pelo sistema Lifetrek Medical CRM.
        <br>Acesse o dashboard: <a href="https://lifetrek-medical.com/admin">lifetrek-medical.com/admin</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email to admins
    if (adminEmails.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "No recipients found",
        stats,
        topPages,
        trafficSources
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: "RESEND_API_KEY not configured",
        stats,
        topPages,
        trafficSources
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const resend = new Resend(resendApiKey);
    const emailResponse = await resend.emails.send({
      from: "Lifetrek CRM <noreply@lifetrek-medical.com>",
      to: adminEmails,
      subject: `📊 Relatório Semanal ${test_mode ? '[TEST]' : ''} - ${leadStats.totalNewLeads} Leads | ${ga4Stats.totalUsers} Visitantes`,
      html: emailHtml,
    });

    return new Response(JSON.stringify({
      success: true,
      stats,
      topPages,
      trafficSources,
      email: emailResponse,
      recipients: adminEmails.length
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
