-- Create enriched_leads table for imported CSV data
CREATE TABLE public.enriched_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Company Information
  company TEXT NOT NULL,
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  phone TEXT,

  -- Contact Information
  email TEXT,
  decision_maker TEXT,
  decision_makers_deep JSONB DEFAULT '[]'::jsonb,
  scraped_emails TEXT,
  linkedin_person TEXT,

  -- Scoring
  lead_score INTEGER,
  predicted_score NUMERIC,
  v2_score NUMERIC,
  renner_score NUMERIC,
  confidence_score INTEGER,

  -- Company Details
  employees INTEGER,
  years_active INTEGER,
  products TEXT,

  -- Certifications
  fda_certified BOOLEAN DEFAULT false,
  ce_certified BOOLEAN DEFAULT false,

  -- LinkedIn Data
  linkedin_company TEXT,

  -- Perplexity Enrichment
  perplexity_segment TEXT,
  perplexity_city TEXT,
  perplexity_state TEXT,
  perplexity_decision_makers TEXT,
  perplexity_notes TEXT,

  -- Status & Source
  status TEXT DEFAULT 'Original',
  source TEXT,
  enrichment_status NUMERIC DEFAULT 0.0,

  -- Metadata
  nome_empresa TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX enriched_leads_company_idx ON public.enriched_leads(company);
CREATE INDEX enriched_leads_city_idx ON public.enriched_leads(city);
CREATE INDEX enriched_leads_state_idx ON public.enriched_leads(state);
CREATE INDEX enriched_leads_lead_score_idx ON public.enriched_leads(lead_score DESC);
CREATE INDEX enriched_leads_confidence_score_idx ON public.enriched_leads(confidence_score DESC);
CREATE INDEX enriched_leads_segment_idx ON public.enriched_leads(perplexity_segment);

-- Enable RLS
ALTER TABLE public.enriched_leads ENABLE ROW LEVEL SECURITY;

-- Admins can manage all enriched leads
CREATE POLICY "Admins can manage enriched leads"
ON public.enriched_leads
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_enriched_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_enriched_leads_updated_at
  BEFORE UPDATE ON public.enriched_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_enriched_leads_updated_at();

-- Create view for high quality leads (score >= 70)
CREATE OR REPLACE VIEW public.enriched_leads_high_quality AS
SELECT * FROM public.enriched_leads
WHERE lead_score >= 70
ORDER BY lead_score DESC, confidence_score DESC;

-- Create view for leads by segment
CREATE OR REPLACE VIEW public.enriched_leads_by_segment AS
SELECT
  perplexity_segment,
  COUNT(*) as total_leads,
  AVG(lead_score) as avg_score,
  AVG(confidence_score) as avg_confidence,
  COUNT(*) FILTER (WHERE lead_score >= 70) as high_quality_count
FROM public.enriched_leads
WHERE perplexity_segment IS NOT NULL
GROUP BY perplexity_segment
ORDER BY total_leads DESC;
