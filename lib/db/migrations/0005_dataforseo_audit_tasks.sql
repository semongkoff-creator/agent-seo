-- DataForSEO integration: audit task tracking + richer technical errors

ALTER TABLE IF EXISTS public.technical_errors
  DROP CONSTRAINT IF EXISTS technical_errors_source_check;

ALTER TABLE IF EXISTS public.technical_errors
  ADD CONSTRAINT technical_errors_source_check
  CHECK (source IN ('screaming_frog', 'pagespeed', 'gsc', 'manual', 'custom_crawler', 'dataforseo'));

CREATE TABLE IF NOT EXISTS public.audit_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'dataforseo',
  external_task_id text,
  target_url text NOT NULL,
  max_crawl_pages integer NOT NULL DEFAULT 500,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'in_progress', 'parsing', 'completed', 'failed', 'cancelled')),
  pages_crawled integer NOT NULL DEFAULT 0,
  pages_total integer,
  progress_percent numeric(5,2) NOT NULL DEFAULT 0,
  total_errors_found integer NOT NULL DEFAULT 0,
  errors_by_severity jsonb NOT NULL DEFAULT '{}'::jsonb,
  estimated_cost_usd numeric(10,4),
  actual_cost_usd numeric(10,4),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  duration_seconds integer,
  error_message text,
  retry_count integer NOT NULL DEFAULT 0,
  raw_summary jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_tasks_project ON public.audit_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_tasks_status ON public.audit_tasks(status);
CREATE INDEX IF NOT EXISTS idx_audit_tasks_external_id ON public.audit_tasks(external_task_id);

ALTER TABLE IF EXISTS public.audit_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own audit tasks" ON public.audit_tasks;
CREATE POLICY "Users manage own audit tasks" ON public.audit_tasks
  FOR ALL USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.audit_tasks;
