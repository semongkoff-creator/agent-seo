do $$
begin
  create type public.oauth_service as enum ('gsc', 'ga4');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.oauth_connection_status as enum ('connected', 'disconnected', 'error');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.oauth_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  service public.oauth_service not null,
  status public.oauth_connection_status not null default 'connected',
  google_email text,
  google_name text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  scopes jsonb not null default '[]'::jsonb,
  connected_resource jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists oauth_connections_user_service_unique
  on public.oauth_connections(user_id, service);
create index if not exists oauth_connections_user_idx
  on public.oauth_connections(user_id);
create index if not exists oauth_connections_status_idx
  on public.oauth_connections(status);

create table if not exists public.gsc_metrics (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  metric_type text not null,
  metric_value jsonb not null,
  data_source text not null default 'mock',
  date_range text,
  source_connection_id uuid references public.oauth_connections(id) on delete set null,
  measured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists gsc_metrics_project_idx
  on public.gsc_metrics(project_id, measured_at desc);
create index if not exists gsc_metrics_source_idx
  on public.gsc_metrics(source_connection_id, measured_at desc);

create table if not exists public.ga4_metrics (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  metric_type text not null,
  metric_value jsonb not null,
  data_source text not null default 'mock',
  date_range text,
  source_connection_id uuid references public.oauth_connections(id) on delete set null,
  measured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists ga4_metrics_project_idx
  on public.ga4_metrics(project_id, measured_at desc);
create index if not exists ga4_metrics_source_idx
  on public.ga4_metrics(source_connection_id, measured_at desc);

alter table if exists public.gsc_metrics
  add column if not exists data_source text not null default 'mock';
alter table if exists public.gsc_metrics
  add column if not exists date_range text;
alter table if exists public.gsc_metrics
  add column if not exists source_connection_id uuid references public.oauth_connections(id) on delete set null;
alter table if exists public.gsc_metrics
  add column if not exists measured_at timestamptz not null default now();

alter table if exists public.ga4_metrics
  add column if not exists data_source text not null default 'mock';
alter table if exists public.ga4_metrics
  add column if not exists date_range text;
alter table if exists public.ga4_metrics
  add column if not exists source_connection_id uuid references public.oauth_connections(id) on delete set null;
alter table if exists public.ga4_metrics
  add column if not exists measured_at timestamptz not null default now();

alter table if exists public.oauth_connections enable row level security;
alter table if exists public.gsc_metrics enable row level security;
alter table if exists public.ga4_metrics enable row level security;

drop policy if exists "Users manage own oauth connections" on public.oauth_connections;
create policy "Users manage own oauth connections"
  on public.oauth_connections
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users see own GSC metrics" on public.gsc_metrics;
create policy "Users see own GSC metrics"
  on public.gsc_metrics
  for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = gsc_metrics.project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = gsc_metrics.project_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "Users see own GA4 metrics" on public.ga4_metrics;
create policy "Users see own GA4 metrics"
  on public.ga4_metrics
  for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = ga4_metrics.project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = ga4_metrics.project_id and p.user_id = auth.uid()
    )
  );

alter publication supabase_realtime add table public.oauth_connections;
alter publication supabase_realtime add table public.gsc_metrics;
alter publication supabase_realtime add table public.ga4_metrics;
