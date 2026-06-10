-- Multi-source technical signals: GSC URL Inspection + PageSpeed Insights

ALTER TABLE IF EXISTS public.seo_diagnoses
  ADD COLUMN IF NOT EXISTS crawl_errors_data jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS core_web_vitals_data jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS mobile_usability_data jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS data_sources_status jsonb DEFAULT '{}'::jsonb;

ALTER TABLE IF EXISTS public.seo_diagnoses
  ALTER COLUMN crawl_errors_count DROP NOT NULL,
  ALTER COLUMN core_web_vitals_pass DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.psi_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  audited_url text NOT NULL,
  strategy text NOT NULL DEFAULT 'mobile' CHECK (strategy IN ('mobile', 'desktop')),
  lcp_value numeric,
  lcp_score text,
  cls_value numeric,
  cls_score text,
  inp_value numeric,
  inp_score text,
  performance_score integer,
  accessibility_score integer,
  best_practices_score integer,
  seo_score integer,
  overall_pass boolean NOT NULL DEFAULT false,
  audits_failed jsonb NOT NULL DEFAULT '[]'::jsonb,
  raw_response jsonb NOT NULL DEFAULT '{}'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_psi_audits_project ON public.psi_audits(project_id);
CREATE INDEX IF NOT EXISTS idx_psi_audits_fetched ON public.psi_audits(fetched_at DESC);

ALTER TABLE IF EXISTS public.psi_audits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own PSI audits" ON public.psi_audits;
CREATE POLICY "Users see own PSI audits" ON public.psi_audits
  FOR ALL USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.psi_audits;

CREATE TABLE IF NOT EXISTS public.gsc_inspection_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  total_urls_inspected integer NOT NULL DEFAULT 0,
  crawl_errors_total integer NOT NULL DEFAULT 0,
  crawl_errors_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  mobile_usability_issues_total integer NOT NULL DEFAULT 0,
  mobile_usability_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  robots_blocked_count integer NOT NULL DEFAULT 0,
  affected_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  raw_response jsonb NOT NULL DEFAULT '{}'::jsonb,
  inspected_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gsc_inspection_project ON public.gsc_inspection_results(project_id);

ALTER TABLE IF EXISTS public.gsc_inspection_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own GSC inspection" ON public.gsc_inspection_results;
CREATE POLICY "Users see own GSC inspection" ON public.gsc_inspection_results
  FOR ALL USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.gsc_inspection_results;
