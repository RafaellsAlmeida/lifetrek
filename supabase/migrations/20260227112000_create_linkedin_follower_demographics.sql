-- LinkedIn follower demographics snapshots (for monthly reporting)
CREATE TABLE IF NOT EXISTS public.linkedin_follower_demographics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  dimension TEXT NOT NULL DEFAULT 'industry',
  label TEXT NOT NULL,
  followers INTEGER NOT NULL CHECK (followers >= 0),
  percentage NUMERIC(6,2) NOT NULL CHECK (percentage >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (snapshot_date, dimension, label)
);

CREATE INDEX IF NOT EXISTS idx_linkedin_follower_demographics_snapshot
ON public.linkedin_follower_demographics (snapshot_date DESC);

ALTER TABLE public.linkedin_follower_demographics ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'linkedin_follower_demographics'
      AND policyname = 'Authenticated users can view linkedin follower demographics'
  ) THEN
    CREATE POLICY "Authenticated users can view linkedin follower demographics"
      ON public.linkedin_follower_demographics
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'linkedin_follower_demographics'
      AND policyname = 'Service role can manage linkedin follower demographics'
  ) THEN
    CREATE POLICY "Service role can manage linkedin follower demographics"
      ON public.linkedin_follower_demographics
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;

-- Seed from LinkedIn follower industry snapshot (shared by admin team)
INSERT INTO public.linkedin_follower_demographics (snapshot_date, dimension, label, followers, percentage)
VALUES
  ('2026-02-27', 'industry', 'Medical Equipment Manufacturing', 39, 26.7),
  ('2026-02-27', 'industry', 'Hospitals and Health Care', 12, 8.2),
  ('2026-02-27', 'industry', 'Machinery Manufacturing', 9, 6.2),
  ('2026-02-27', 'industry', 'Motor Vehicle Manufacturing', 5, 3.4),
  ('2026-02-27', 'industry', 'Industrial Machinery Manufacturing', 5, 3.4),
  ('2026-02-27', 'industry', 'Software Development', 4, 2.7),
  ('2026-02-27', 'industry', 'Appliances, Electrical, and Electronics Manufacturing', 4, 2.7),
  ('2026-02-27', 'industry', 'Transportation, Logistics, Supply Chain and Storage', 4, 2.7),
  ('2026-02-27', 'industry', 'Business Consulting and Services', 3, 2.1),
  ('2026-02-27', 'industry', 'Pharmaceutical Manufacturing', 3, 2.1),
  ('2026-02-27', 'job_function', 'Engineering', 21, 14.4),
  ('2026-02-27', 'job_function', 'Operations', 20, 13.7),
  ('2026-02-27', 'job_function', 'Business Development', 15, 10.3),
  ('2026-02-27', 'job_function', 'Arts and Design', 11, 7.5),
  ('2026-02-27', 'job_function', 'Sales', 11, 7.5),
  ('2026-02-27', 'job_function', 'Information Technology', 7, 4.8),
  ('2026-02-27', 'job_function', 'Research', 6, 4.1),
  ('2026-02-27', 'job_function', 'Media and Communication', 4, 2.7),
  ('2026-02-27', 'job_function', 'Consulting', 3, 2.1),
  ('2026-02-27', 'job_function', 'Finance', 3, 2.1)
ON CONFLICT (snapshot_date, dimension, label) DO UPDATE
SET
  followers = EXCLUDED.followers,
  percentage = EXCLUDED.percentage;
