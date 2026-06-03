create extension if not exists "pgcrypto";

create type "public"."user_role" as enum ('owner', 'member', 'admin');
create type "public"."user_plan" as enum ('free', 'starter', 'growth', 'scale');
create type "public"."project_status" as enum ('active', 'archived');
create type "public"."website_stage" as enum ('from_scratch', 'new', 'existing');
create type "public"."business_goal" as enum ('traffic', 'leads', 'sales', 'awareness', 'local_visibility');
create type "public"."diagnosis_status" as enum ('pending', 'processing', 'completed', 'failed');
create type "public"."primary_problem_type" as enum ('technical_bottleneck', 'relevance_gap', 'authority_deficit', 'conversion_pitfall', 'from_scratch', 'mixed');
create type "public"."severity" as enum ('low', 'medium', 'high', 'critical');
create type "public"."campaign_readiness" as enum ('ready', 'not_ready', 'partially_ready');
create type "public"."objective_type" as enum ('technical_recovery', 'qualified_traffic', 'authority_growth', 'conversion_improvement', 'foundation_building', 'mixed');
create type "public"."achievability_score" as enum ('low', 'moderate', 'high');
create type "public"."campaign_status" as enum ('not_started', 'in_progress', 'completed', 'blocked', 'locked');
create type "public"."task_impact" as enum ('high', 'medium', 'low');
create type "public"."task_status" as enum ('pending', 'in_progress', 'completed', 'skipped');
create type "public"."integration_provider" as enum ('gsc', 'ga4', 'ahrefs', 'semrush');
create type "public"."integration_status" as enum ('connected', 'disconnected', 'error');
create type "public"."api_key_environment" as enum ('live', 'test');
create type "public"."job_type" as enum ('identify_problem', 'define_objective');
create type "public"."job_status" as enum ('queued', 'processing', 'completed', 'failed');
create type "public"."usage_event_type" as enum ('project_created', 'diagnosis_run', 'objective_generated', 'api_request');
create type "public"."ai_insight_kind" as enum ('opportunity', 'anomaly', 'recommendation');

create table if not exists public.users (
  id uuid primary key,
  email text not null unique,
  full_name text,
  avatar_url text,
  role public.user_role not null default 'member',
  plan public.user_plan not null default 'free',
  timezone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  website_url text not null,
  industry text,
  target_location text,
  target_audience text,
  main_product_or_service text,
  website_stage public.website_stage,
  main_business_goal public.business_goal,
  status public.project_status not null default 'active',
  current_step integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_user_status_idx on public.projects(user_id, status);
create index if not exists projects_user_updated_at_idx on public.projects(user_id, updated_at desc);

create table if not exists public.seo_inputs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  step_number integer not null,
  sub_step text not null,
  payload jsonb not null,
  is_draft boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists seo_inputs_project_step_substep_idx on public.seo_inputs(project_id, step_number, sub_step);

create table if not exists public.seo_diagnoses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  input_id uuid references public.seo_inputs(id) on delete set null,
  primary_problem_type public.primary_problem_type not null,
  secondary_problem_type public.primary_problem_type,
  severity public.severity not null,
  confidence_score numeric(5,2) not null,
  diagnosis_summary text not null,
  root_cause text not null,
  evidence jsonb not null default '[]'::jsonb,
  business_impact jsonb not null default '{}'::jsonb,
  campaign_readiness public.campaign_readiness not null,
  recommended_next_step text not null,
  objective_direction text not null,
  not_recommended_actions jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  raw_llm_output jsonb not null default '{}'::jsonb,
  model_used text not null,
  status public.diagnosis_status not null default 'pending',
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists seo_diagnoses_project_created_idx on public.seo_diagnoses(project_id, created_at desc);
create index if not exists seo_diagnoses_status_idx on public.seo_diagnoses(status);

create table if not exists public.seo_objectives (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  diagnosis_id uuid references public.seo_diagnoses(id) on delete set null,
  input_id uuid references public.seo_inputs(id) on delete set null,
  objective_type public.objective_type not null,
  smart_objective text not null,
  business_goal_alignment text,
  input_metrics jsonb not null default '{}'::jsonb,
  output_metrics jsonb not null default '{}'::jsonb,
  outcome_metrics jsonb not null default '{}'::jsonb,
  baseline jsonb not null default '{}'::jsonb,
  target jsonb not null default '{}'::jsonb,
  time_period text,
  achievability_score public.achievability_score,
  achievability_percent numeric(5,2),
  risk_notes jsonb not null default '[]'::jsonb,
  reasoning text,
  next_step text,
  raw_llm_output jsonb not null default '{}'::jsonb,
  model_used text not null,
  status public.diagnosis_status not null default 'pending',
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists seo_objectives_project_created_idx on public.seo_objectives(project_id, created_at desc);
create index if not exists seo_objectives_diagnosis_idx on public.seo_objectives(diagnosis_id);

create table if not exists public.campaign_progress (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  step_number integer not null,
  status public.campaign_status not null default 'not_started',
  started_at timestamptz,
  completed_at timestamptz,
  unique(project_id, step_number)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  step_number integer not null,
  title text not null,
  description text,
  impact public.task_impact not null default 'medium',
  status public.task_status not null default 'pending',
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists tasks_project_status_idx on public.tasks(project_id, status);

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  provider public.integration_provider not null,
  status public.integration_status not null default 'disconnected',
  credentials_encrypted text,
  metadata jsonb not null default '{}'::jsonb,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, provider)
);

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  label text not null,
  key_hash text not null,
  key_prefix text not null,
  environment public.api_key_environment not null default 'live',
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists api_keys_user_idx on public.api_keys(user_id);
create index if not exists api_keys_key_hash_idx on public.api_keys(key_hash);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  type public.job_type not null,
  status public.job_status not null default 'queued',
  request_payload jsonb not null default '{}'::jsonb,
  response_payload jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);
create index if not exists jobs_project_idx on public.jobs(project_id);
create index if not exists jobs_status_created_idx on public.jobs(status, created_at);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  event_type public.usage_event_type not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists usage_events_user_event_created_idx on public.usage_events(user_id, event_type, created_at desc);

create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  kind public.ai_insight_kind not null,
  title text not null,
  body text not null,
  action_label text,
  action_url text,
  dismissed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ai_insights_user_dismissed_created_idx on public.ai_insights(user_id, dismissed_at, created_at desc);
