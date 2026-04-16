CREATE TABLE IF NOT EXISTS public.company_facts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fact_key text NOT NULL UNIQUE,
  entity_type text NOT NULL,
  entity_name text NOT NULL,
  fact_type text NOT NULL,
  fact_value jsonb NOT NULL,
  source_doc text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_facts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read company facts"
  ON public.company_facts
  FOR SELECT
  USING (true);

CREATE POLICY "Service role write company facts"
  ON public.company_facts
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_company_facts_entity_name
  ON public.company_facts (lower(entity_name));

CREATE INDEX IF NOT EXISTS idx_company_facts_entity_type
  ON public.company_facts (entity_type);

CREATE INDEX IF NOT EXISTS idx_company_facts_fact_type
  ON public.company_facts (fact_type);

INSERT INTO public.company_facts (fact_key, entity_type, entity_name, fact_type, fact_value, source_doc)
VALUES
  (
    'equipment.citizen_l20.availability',
    'equipment',
    'Citizen L20',
    'availability',
    jsonb_build_object('value', true, 'aliases', jsonb_build_array('citizen l20', 'l20')),
    'docs/guides/LIFETREK_RAG_KNOWLEDGE.md'
  ),
  (
    'equipment.citizen_l32.availability',
    'equipment',
    'Citizen L32',
    'availability',
    jsonb_build_object('value', true, 'aliases', jsonb_build_array('citizen l32', 'l32', 'm32', 'citizen m32')),
    'docs/guides/LIFETREK_RAG_KNOWLEDGE.md'
  ),
  (
    'equipment.zeiss_contura.availability',
    'equipment',
    'ZEISS Contura',
    'availability',
    jsonb_build_object('value', true, 'aliases', jsonb_build_array('zeiss contura', 'contura', 'zeiss cmm')),
    'docs/guides/LIFETREK_RAG_KNOWLEDGE.md'
  ),
  (
    'equipment.citizen.total_count',
    'equipment',
    'Citizen',
    'count_total',
    jsonb_build_object('value', 2, 'unit', 'machines', 'aliases', jsonb_build_array('citizen', 'tornos citizen', 'torno citizen')),
    'docs/guides/LIFETREK_RAG_KNOWLEDGE.md'
  ),
  (
    'equipment.citizen.model_breakdown',
    'equipment',
    'Citizen',
    'count_breakdown',
    jsonb_build_object(
      'value',
      jsonb_build_object('Citizen L20', 1, 'Citizen L32', 1),
      'aliases',
      jsonb_build_array('citizen', 'l20', 'l32', 'm32')
    ),
    'docs/guides/LIFETREK_RAG_KNOWLEDGE.md'
  ),
  (
    'certification.iso_13485.availability',
    'certification',
    'ISO 13485',
    'availability',
    jsonb_build_object('value', true, 'aliases', jsonb_build_array('iso 13485', 'iso13485')),
    'docs/guides/LIFETREK_RAG_KNOWLEDGE.md'
  ),
  (
    'certification.anvisa.availability',
    'certification',
    'ANVISA',
    'availability',
    jsonb_build_object('value', true, 'aliases', jsonb_build_array('anvisa')),
    'docs/guides/LIFETREK_RAG_KNOWLEDGE.md'
  )
ON CONFLICT (fact_key) DO UPDATE
SET
  entity_type = EXCLUDED.entity_type,
  entity_name = EXCLUDED.entity_name,
  fact_type = EXCLUDED.fact_type,
  fact_value = EXCLUDED.fact_value,
  source_doc = EXCLUDED.source_doc,
  updated_at = now();
