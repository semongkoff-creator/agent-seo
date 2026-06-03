alter table if exists public.users enable row level security;
alter table if exists public.projects enable row level security;
alter table if exists public.seo_inputs enable row level security;
alter table if exists public.seo_diagnoses enable row level security;
alter table if exists public.seo_objectives enable row level security;
alter table if exists public.campaign_progress enable row level security;
alter table if exists public.tasks enable row level security;
alter table if exists public.integrations enable row level security;
alter table if exists public.api_keys enable row level security;
alter table if exists public.jobs enable row level security;
alter table if exists public.usage_events enable row level security;
alter table if exists public.ai_insights enable row level security;

drop policy if exists "Users can read own profile" on public.users;
create policy "Users can read own profile"
  on public.users
  for select
  using (id = auth.uid());

drop policy if exists "Projects visible to owner" on public.projects;
create policy "Projects visible to owner"
  on public.projects
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "SEO inputs visible to owner project" on public.seo_inputs;
create policy "SEO inputs visible to owner project"
  on public.seo_inputs
  for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = seo_inputs.project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = seo_inputs.project_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "SEO diagnoses visible to owner project" on public.seo_diagnoses;
create policy "SEO diagnoses visible to owner project"
  on public.seo_diagnoses
  for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = seo_diagnoses.project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = seo_diagnoses.project_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "SEO objectives visible to owner project" on public.seo_objectives;
create policy "SEO objectives visible to owner project"
  on public.seo_objectives
  for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = seo_objectives.project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = seo_objectives.project_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "Campaign progress visible to owner project" on public.campaign_progress;
create policy "Campaign progress visible to owner project"
  on public.campaign_progress
  for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = campaign_progress.project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = campaign_progress.project_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "Tasks visible to owner project" on public.tasks;
create policy "Tasks visible to owner project"
  on public.tasks
  for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = tasks.project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = tasks.project_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "Integrations visible to owner" on public.integrations;
create policy "Integrations visible to owner"
  on public.integrations
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Api keys visible to owner" on public.api_keys;
create policy "Api keys visible to owner"
  on public.api_keys
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Jobs visible to owner" on public.jobs;
create policy "Jobs visible to owner"
  on public.jobs
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Usage events visible to owner" on public.usage_events;
create policy "Usage events visible to owner"
  on public.usage_events
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "AI insights visible to owner" on public.ai_insights;
create policy "AI insights visible to owner"
  on public.ai_insights
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

alter publication supabase_realtime add table public.seo_diagnoses;
alter publication supabase_realtime add table public.seo_objectives;
alter publication supabase_realtime add table public.jobs;
alter publication supabase_realtime add table public.campaign_progress;
