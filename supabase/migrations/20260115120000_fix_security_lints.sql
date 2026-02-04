-- Fix security lints: use security invoker views.

-- Recreate views with security_invoker enabled.
CREATE OR REPLACE VIEW public.lead_analytics_detailed
  WITH (security_invoker = true) AS
SELECT
  l.id,
  l.name,
  l.email,
  l.company,
  l.phone,
  l.project_types,
  l.annual_volume,
  l.status,
  l.priority,
  l.created_at,
  l.updated_at,
  DATE(l.created_at) as lead_date,
  CASE
    WHEN l.created_at >= NOW() - INTERVAL '24 hours' THEN 'today'
    WHEN l.created_at >= NOW() - INTERVAL '7 days' THEN 'this_week'
    WHEN l.created_at >= NOW() - INTERVAL '30 days' THEN 'this_month'
    ELSE 'older'
  END as time_bucket,
  CASE
    WHEN l.status IN ('closed') THEN true
    ELSE false
  END as is_converted
FROM public.contact_leads l;

CREATE OR REPLACE VIEW public.project_type_distribution
  WITH (security_invoker = true) AS
SELECT
  pt as project_type,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE status = 'closed') as converted_count,
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'closed')::numeric /
     NULLIF(COUNT(*), 0) * 100),
    1
  ) as conversion_rate
FROM public.contact_leads
CROSS JOIN UNNEST(project_types) as pt
GROUP BY pt
ORDER BY count DESC;

CREATE OR REPLACE VIEW public.lead_metrics_by_period
  WITH (security_invoker = true) AS
SELECT
  DATE_TRUNC('day', created_at) as period,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE status = 'new') as new_leads,
  COUNT(*) FILTER (WHERE status IN ('contacted', 'in_progress', 'quoted')) as active_leads,
  COUNT(*) FILTER (WHERE status = 'closed') as closed_leads,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_leads,
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'closed')::numeric /
     NULLIF(COUNT(*), 0) * 100),
    1
  ) as conversion_rate
FROM public.contact_leads
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY period DESC;

GRANT SELECT ON public.lead_analytics_detailed TO authenticated;
GRANT SELECT ON public.project_type_distribution TO authenticated;
GRANT SELECT ON public.lead_metrics_by_period TO authenticated;
