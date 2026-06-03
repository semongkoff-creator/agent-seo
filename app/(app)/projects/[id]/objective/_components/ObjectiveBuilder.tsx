"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, BadgeCheck, BrainCircuit, Lightbulb, Save, Target, TrendingUp } from 'lucide-react';
import { objectiveInputSchema, type ObjectiveInput } from '@/lib/validators/objectives';

type ObjectiveBuilderProps = {
  projectId: string;
  projectName: string;
  diagnosisId: string | null;
  diagnosisSummary: string;
  diagnosisType: string;
  initialDraft: ObjectiveInput;
};

type DraftState = Record<string, any>;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : '';
}

function toText(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function normalizeDraft(input: Partial<ObjectiveInput>): DraftState {
  return {
    business_goal: {
      main_business_goal: input.business_goal?.main_business_goal ?? 'leads',
      business_target_value: input.business_goal?.business_target_value ?? '',
      target_period: input.business_goal?.target_period ?? '',
      priority_product_or_service: input.business_goal?.priority_product_or_service ?? '',
      target_market: input.business_goal?.target_market ?? '',
      average_order_value: input.business_goal?.average_order_value ?? ''
    },
    seo_baseline: {
      current_monthly_organic_traffic: input.seo_baseline?.current_monthly_organic_traffic ?? '',
      current_organic_conversions: input.seo_baseline?.current_organic_conversions ?? '',
      current_impressions: input.seo_baseline?.current_impressions ?? '',
      current_ctr: input.seo_baseline?.current_ctr ?? '',
      current_ranking_keywords: input.seo_baseline?.current_ranking_keywords ?? '',
      current_indexed_pages: input.seo_baseline?.current_indexed_pages ?? '',
      domain_authority: input.seo_baseline?.domain_authority ?? '',
      referring_domains: input.seo_baseline?.referring_domains ?? ''
    },
    constraints: {
      campaign_duration: input.constraints?.campaign_duration ?? '90 days',
      budget_level: input.constraints?.budget_level ?? 'medium',
      content_capacity_per_month: input.constraints?.content_capacity_per_month ?? '',
      developer_support_available: input.constraints?.developer_support_available ?? true,
      link_building_capacity: input.constraints?.link_building_capacity ?? 'medium',
      industry_competition_level: input.constraints?.industry_competition_level ?? 'medium'
    }
  };
}

function buildObjectivePreview(state: DraftState, projectName: string) {
  const business = state.business_goal ?? {};
  const baseline = state.seo_baseline ?? {};
  const targetValue = toText(business.business_target_value, 'measurable growth');
  const period = toText(business.target_period, 'the next 90 days');
  const product = toText(business.priority_product_or_service, 'core offer');
  const market = toText(business.target_market, projectName);
  const traffic = toNumber(baseline.current_monthly_organic_traffic);
  const ctr = toNumber(baseline.current_ctr);

  return {
    headline: `Increase organic ${business.main_business_goal ?? 'leads'} for ${product} in ${market} by ${period}.`,
    summary: `Use technical recovery, relevance clustering, and authority growth to move from ${traffic || 'current'} monthly organic traffic and ${ctr || 'current'} CTR toward ${targetValue}.`,
    successMetric: targetValue || 'Target value',
    baselineMetric: `${traffic || 'n/a'} current traffic`,
    timebox: toText(state.constraints?.campaign_duration, '90 days')
  };
}

function Section({
  title,
  eyebrow,
  icon,
  children,
  defaultOpen = true
}: {
  title: string;
  eyebrow: string;
  icon: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="group rounded-[28px] border border-outline-variant bg-surface-container-lowest shadow-sm" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between p-4 md:p-5">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-on-surface-variant">{eyebrow}</p>
            <span className="mt-1 block font-semibold text-on-surface">{title}</span>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 rotate-90 text-on-surface-variant transition-transform group-open:rotate-90" />
      </summary>
      <div className="border-t border-outline-variant p-4 pt-0 md:p-5 md:pt-0">{children}</div>
    </details>
  );
}

export function ObjectiveBuilder({
  projectId,
  projectName,
  diagnosisId,
  diagnosisSummary,
  diagnosisType,
  initialDraft
}: ObjectiveBuilderProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<DraftState>(() => normalizeDraft(initialDraft));
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const mounted = useRef(false);

  const preview = useMemo(() => buildObjectivePreview(draft, projectName), [draft, projectName]);

  useEffect(() => {
    mounted.current = true;
  }, []);

  useEffect(() => {
    if (!mounted.current) {
      return;
    }

    if (timer.current) {
      window.clearTimeout(timer.current);
    }

    timer.current = window.setTimeout(() => {
      void persistDraft();
    }, 1000);

    return () => {
      if (timer.current) {
        window.clearTimeout(timer.current);
      }
    };
  }, [draft]);

  function setNested(path: 'business_goal' | 'seo_baseline' | 'constraints', key: string, value: unknown) {
    setDraft((current) => ({
      ...current,
      [path]: {
        ...(current[path] as Record<string, unknown>),
        [key]: value
      }
    }));
  }

  async function persistDraft() {
    setSaving(true);
    setError(null);

    try {
      const payload = objectiveInputSchema.parse({
        business_goal: {
          main_business_goal: draft.business_goal?.main_business_goal,
          business_target_value: toText(draft.business_goal?.business_target_value),
          target_period: toText(draft.business_goal?.target_period),
          priority_product_or_service: toText(draft.business_goal?.priority_product_or_service),
          target_market: toText(draft.business_goal?.target_market),
          average_order_value: toNumber(draft.business_goal?.average_order_value) || undefined
        },
        seo_baseline: {
          current_monthly_organic_traffic: toNumber(draft.seo_baseline?.current_monthly_organic_traffic) || undefined,
          current_organic_conversions: toNumber(draft.seo_baseline?.current_organic_conversions) || undefined,
          current_impressions: toNumber(draft.seo_baseline?.current_impressions) || undefined,
          current_ctr: toNumber(draft.seo_baseline?.current_ctr) || undefined,
          current_ranking_keywords: toNumber(draft.seo_baseline?.current_ranking_keywords) || undefined,
          current_indexed_pages: toNumber(draft.seo_baseline?.current_indexed_pages) || undefined,
          domain_authority: toNumber(draft.seo_baseline?.domain_authority) || undefined,
          referring_domains: toNumber(draft.seo_baseline?.referring_domains) || undefined
        },
        constraints: {
          campaign_duration: toText(draft.constraints?.campaign_duration, '90 days'),
          budget_level: draft.constraints?.budget_level ?? 'medium',
          content_capacity_per_month: toNumber(draft.constraints?.content_capacity_per_month) || 0,
          developer_support_available: Boolean(draft.constraints?.developer_support_available),
          link_building_capacity: draft.constraints?.link_building_capacity ?? 'medium',
          industry_competition_level: draft.constraints?.industry_competition_level ?? 'medium'
        }
      });

      const response = await fetch(`/api/projects/${projectId}/objective/inputs`, {
        method: 'PUT',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.error?.message ?? 'Failed to save objective draft');
      }
    } catch (draftError) {
      setError(draftError instanceof Error ? draftError.message : 'Failed to save objective draft');
    } finally {
      setSaving(false);
    }
  }

  async function generateObjective() {
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      await persistDraft();
      const response = await fetch(`/api/projects/${projectId}/objective/generate`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(
          objectiveInputSchema.parse({
            business_goal: {
              main_business_goal: draft.business_goal?.main_business_goal,
              business_target_value: toText(draft.business_goal?.business_target_value),
              target_period: toText(draft.business_goal?.target_period),
              priority_product_or_service: toText(draft.business_goal?.priority_product_or_service),
              target_market: toText(draft.business_goal?.target_market),
              average_order_value: toNumber(draft.business_goal?.average_order_value) || undefined
            },
            seo_baseline: {
              current_monthly_organic_traffic: toNumber(draft.seo_baseline?.current_monthly_organic_traffic) || undefined,
              current_organic_conversions: toNumber(draft.seo_baseline?.current_organic_conversions) || undefined,
              current_impressions: toNumber(draft.seo_baseline?.current_impressions) || undefined,
              current_ctr: toNumber(draft.seo_baseline?.current_ctr) || undefined,
              current_ranking_keywords: toNumber(draft.seo_baseline?.current_ranking_keywords) || undefined,
              current_indexed_pages: toNumber(draft.seo_baseline?.current_indexed_pages) || undefined,
              domain_authority: toNumber(draft.seo_baseline?.domain_authority) || undefined,
              referring_domains: toNumber(draft.seo_baseline?.referring_domains) || undefined
            },
            constraints: {
              campaign_duration: toText(draft.constraints?.campaign_duration, '90 days'),
              budget_level: draft.constraints?.budget_level ?? 'medium',
              content_capacity_per_month: toNumber(draft.constraints?.content_capacity_per_month) || 0,
              developer_support_available: Boolean(draft.constraints?.developer_support_available),
              link_building_capacity: draft.constraints?.link_building_capacity ?? 'medium',
              industry_competition_level: draft.constraints?.industry_competition_level ?? 'medium'
            }
          })
        )
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.error?.message ?? 'Failed to generate objective');
      }

      setMessage('Objective generated. Redirecting now...');
      router.push(`/objective/${body?.data?.objectiveId ?? body?.data?.objective_id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to generate objective');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-primary">Define Objective</p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-on-surface md:text-3xl lg:text-4xl">
                {projectName}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant md:text-base">
                Turn the diagnosis into a measurable SMART objective the team can execute.
              </p>
            </div>
            <Link
              href={diagnosisId ? `/diagnosis/${diagnosisId}` : '/dashboard'}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-4 py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
            >
              <BadgeCheck className="h-4 w-4 text-primary" />
              Back to diagnosis
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-outline-variant bg-surface-container-low p-4 text-sm text-on-surface-variant">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <BrainCircuit className="h-3.5 w-3.5" />
              Diagnosis linked
            </span>
            <span>{diagnosisType}</span>
            <span className="hidden h-4 w-px bg-outline-variant sm:block" />
            <span className="line-clamp-1">{diagnosisSummary}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-4">
            <Section
              title="Business Goal"
              eyebrow="Intent"
              icon={<Target className="h-5 w-5 text-primary" />}
              defaultOpen
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                    Main business goal
                  </span>
                  <select
                    value={draft.business_goal?.main_business_goal ?? 'leads'}
                    onChange={(event) => setNested('business_goal', 'main_business_goal', event.target.value)}
                    className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="traffic">Traffic</option>
                    <option value="leads">Leads</option>
                    <option value="sales">Sales</option>
                    <option value="revenue">Revenue</option>
                    <option value="awareness">Awareness</option>
                    <option value="local_visibility">Local visibility</option>
                  </select>
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                    Business target value
                  </span>
                  <input
                    value={toText(draft.business_goal?.business_target_value)}
                    onChange={(event) => setNested('business_goal', 'business_target_value', event.target.value)}
                    className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g. 40% more organic leads"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                    Target period
                  </span>
                  <input
                    value={toText(draft.business_goal?.target_period)}
                    onChange={(event) => setNested('business_goal', 'target_period', event.target.value)}
                    className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Q3-Q4 2026"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                    Target market
                  </span>
                  <input
                    value={toText(draft.business_goal?.target_market)}
                    onChange={(event) => setNested('business_goal', 'target_market', event.target.value)}
                    className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="B2B SaaS founders"
                  />
                </label>
                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                    Priority product or service
                  </span>
                  <textarea
                    rows={3}
                    value={toText(draft.business_goal?.priority_product_or_service)}
                    onChange={(event) => setNested('business_goal', 'priority_product_or_service', event.target.value)}
                    className="rounded-2xl border border-outline-variant bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Managed SEO audits, content strategy, and technical fixes"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                    Average order value
                  </span>
                  <input
                    type="number"
                    value={toNumber(draft.business_goal?.average_order_value)}
                    onChange={(event) => setNested('business_goal', 'average_order_value', event.target.value)}
                    className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="0"
                  />
                </label>
              </div>
            </Section>

            <Section
              title="SEO Baseline"
              eyebrow="Current state"
              icon={<TrendingUp className="h-5 w-5 text-primary" />}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  ['current_monthly_organic_traffic', 'Current monthly organic traffic'],
                  ['current_organic_conversions', 'Current organic conversions'],
                  ['current_impressions', 'Current impressions'],
                  ['current_ctr', 'Current CTR (%)'],
                  ['current_ranking_keywords', 'Current ranking keywords'],
                  ['current_indexed_pages', 'Current indexed pages'],
                  ['domain_authority', 'Domain authority'],
                  ['referring_domains', 'Referring domains']
                ].map(([key, label]) => (
                  <label key={key} className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                      {label}
                    </span>
                    <input
                      type="number"
                      value={toNumber(draft.seo_baseline?.[key])}
                      onChange={(event) => setNested('seo_baseline', key, event.target.value)}
                      className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                ))}
              </div>
            </Section>

            <Section
              title="Constraints"
              eyebrow="Execution"
              icon={<Lightbulb className="h-5 w-5 text-primary" />}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                    Campaign duration
                  </span>
                  <input
                    value={toText(draft.constraints?.campaign_duration, '90 days')}
                    onChange={(event) => setNested('constraints', 'campaign_duration', event.target.value)}
                    className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="90 days"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                    Budget level
                  </span>
                  <select
                    value={draft.constraints?.budget_level ?? 'medium'}
                    onChange={(event) => setNested('constraints', 'budget_level', event.target.value)}
                    className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                    Content capacity / month
                  </span>
                  <input
                    type="number"
                    value={toNumber(draft.constraints?.content_capacity_per_month)}
                    onChange={(event) => setNested('constraints', 'content_capacity_per_month', event.target.value)}
                    className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="0"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                    Developer support
                  </span>
                  <select
                    value={draft.constraints?.developer_support_available ? 'yes' : 'no'}
                    onChange={(event) => setNested('constraints', 'developer_support_available', event.target.value === 'yes')}
                    className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="yes">Available</option>
                    <option value="no">Not available</option>
                  </select>
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                    Link building capacity
                  </span>
                  <select
                    value={draft.constraints?.link_building_capacity ?? 'medium'}
                    onChange={(event) => setNested('constraints', 'link_building_capacity', event.target.value)}
                    className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                    Competition level
                  </span>
                  <select
                    value={draft.constraints?.industry_competition_level ?? 'medium'}
                    onChange={(event) => setNested('constraints', 'industry_competition_level', event.target.value)}
                    className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
              </div>
            </Section>

            {error ? (
              <p className="rounded-2xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-on-error-container">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </p>
            ) : null}
          </div>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-primary bg-primary p-6 text-on-primary shadow-lg shadow-primary/20">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-primary/80">
                SMART Objective Preview
              </p>
              <h2 className="mt-3 text-2xl font-semibold leading-tight">{preview.headline}</h2>
              <p className="mt-3 text-sm leading-6 text-on-primary/90">{preview.summary}</p>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/30 bg-white/10 p-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-on-primary/70">Timebox</p>
                  <p className="mt-2 text-sm font-semibold">{preview.timebox}</p>
                </div>
                <div className="rounded-2xl border border-white/30 bg-white/10 p-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-on-primary/70">Baseline</p>
                  <p className="mt-2 text-sm font-semibold">{preview.baselineMetric}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">Generated Outputs</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-surface-container-low p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Objective</p>
                  <p className="mt-2 text-lg font-semibold text-on-surface">V1.0</p>
                </div>
                <div className="rounded-2xl bg-surface-container-low p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Status</p>
                  <p className="mt-2 text-lg font-semibold text-on-surface">Pending</p>
                </div>
                <div className="rounded-2xl bg-surface-container-low p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Inputs</p>
                  <p className="mt-2 text-lg font-semibold text-on-surface">Live</p>
                </div>
                <div className="rounded-2xl bg-surface-container-low p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Risk</p>
                  <p className="mt-2 text-lg font-semibold text-on-surface">Tracked</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-tertiary bg-tertiary-fixed/30 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-tertiary-fixed-variant">
                Risk Notes
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-on-tertiary-fixed-variant">
                <li>Objective quality depends on the diagnosis inputs being current.</li>
                <li>Low budget or low developer support may slow technical recovery.</li>
                <li>High competition can require a longer campaign duration.</li>
              </ul>
            </div>

            <div className="rounded-[28px] border border-outline-variant bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
                <Save className="h-4 w-4 text-primary" />
                Draft autosave
              </div>
              <p className="mt-2 text-sm text-on-surface-variant">
                We save the objective draft as you type, then send it to n8n when you click generate.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={generateObjective}
                  disabled={saving || submitting}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? 'Generating...' : 'Generate Objective'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
