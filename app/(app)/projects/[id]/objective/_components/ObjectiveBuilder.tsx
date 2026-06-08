"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  ChevronDown,
  Lightbulb,
  Loader2,
  Save,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp
} from 'lucide-react';
import { objectiveInputSchema, type ObjectiveInput } from '@/lib/validators/objectives';
import {
  formatBusinessGoalLabel,
  MAIN_BUSINESS_GOAL_OPTIONS,
  normalizeBusinessGoalValue
} from '@/types/wizard';

type ObjectiveBuilderProps = {
  projectId: string;
  projectName: string;
  websiteStage: string;
  diagnosisId: string | null;
  diagnosisReady: boolean;
  diagnosisSummary: string;
  diagnosisType: string;
  diagnosisSeverity: string;
  diagnosisDirection: string;
  diagnosisResult: Record<string, unknown>;
  initialDraft: ObjectiveInput;
};

type DraftState = Record<string, unknown>;

type BusinessGoalCard = {
  value: (typeof MAIN_BUSINESS_GOAL_OPTIONS)[number]['value'];
  label: string;
  desc: string;
  icon: string;
};

const BUSINESS_GOALS: BusinessGoalCard[] = MAIN_BUSINESS_GOAL_OPTIONS.map((option) => {
  if (option.value === 'traffic') {
    return {
      value: option.value,
      label: option.label,
      desc: 'More organic visitors',
      icon: '📈'
    };
  }

  if (option.value === 'keyword_position') {
    return {
      value: option.value,
      label: option.label,
      desc: 'Improve rankings for priority keywords',
      icon: '🎯'
    };
  }

  return {
    value: option.value,
    label: option.label,
    desc: 'Form submissions and contact requests',
    icon: '👥'
  };
});

const TARGET_PERIODS = ['3 months', '6 months', '9 months', '12 months'] as const;
const BUDGET_LEVELS = [
  { value: 'low', label: 'Low', desc: '< $1k/month' },
  { value: 'medium', label: 'Medium', desc: '$1k - $5k/month' },
  { value: 'high', label: 'High', desc: '> $5k/month' }
] as const;
const LINK_BUILDING_CAPACITY = [
  { value: 'low', label: 'Low', desc: 'In-house only, 0-5 backlinks/month' },
  { value: 'medium', label: 'Medium', desc: 'Outreach team, 5-15 backlinks/month' },
  { value: 'high', label: 'High', desc: 'Dedicated PR, 15+ backlinks/month' }
] as const;
const COMPETITION_LEVELS = [
  { value: 'low', label: 'Low', desc: 'Few competitors, easy to differentiate' },
  { value: 'medium', label: 'Medium', desc: 'Some strong competitors' },
  { value: 'high', label: 'High', desc: 'Saturated market, big players dominate' }
] as const;
const BRAND_STRENGTH = [
  { value: 'low', label: 'Low', desc: 'New/unknown brand' },
  { value: 'medium', label: 'Medium', desc: 'Some recognition in niche' },
  { value: 'high', label: 'High', desc: 'Established, well-known brand' }
] as const;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function toText(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function toOptionalText(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : '';
}

function normalizeDraft(input: Partial<ObjectiveInput>): DraftState {
  return {
      business_goal: {
      main_business_goal: normalizeBusinessGoalValue(input.business_goal?.main_business_goal ?? 'leads'),
      business_target_value: input.business_goal?.business_target_value ?? '',
      target_period: input.business_goal?.target_period ?? '6 months',
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
      referring_domains: input.seo_baseline?.referring_domains ?? '',
      current_conversion_rate: input.seo_baseline?.current_conversion_rate ?? '',
      bounce_rate: input.seo_baseline?.bounce_rate ?? ''
    },
    constraints: {
      campaign_duration: input.constraints?.campaign_duration ?? input.business_goal?.target_period ?? '6 months',
      budget_level: input.constraints?.budget_level ?? 'medium',
      content_capacity_per_month: input.constraints?.content_capacity_per_month ?? '',
      developer_support_available: input.constraints?.developer_support_available ?? true,
      link_building_capacity: input.constraints?.link_building_capacity ?? 'medium',
      industry_competition_level: input.constraints?.industry_competition_level ?? 'medium',
      existing_brand_strength: input.constraints?.existing_brand_strength ?? 'medium'
    }
  };
}

function periodRank(value: unknown) {
  const normalized = toText(value, '6 months');
  return TARGET_PERIODS.indexOf(normalized as (typeof TARGET_PERIODS)[number]);
}

function calculateAchievability(draft: DraftState, websiteStage: string) {
  const constraints = (draft.constraints ?? {}) as Record<string, unknown>;
  const budget = toText(constraints.budget_level, 'medium');
  const content = Number(toNumber(constraints.content_capacity_per_month) || 0);
  const developer = Boolean(constraints.developer_support_available);
  const linkBuilding = toText(constraints.link_building_capacity, 'medium');
  const competition = toText(constraints.industry_competition_level, 'medium');
  const brand = toText(constraints.existing_brand_strength, 'medium');

  let score = 50;
  score += budget === 'low' ? 0 : budget === 'medium' ? 8 : 15;
  score += content >= 12 ? 10 : content >= 6 ? 7 : content > 0 ? 3 : 0;
  score += developer ? 10 : -8;
  score += linkBuilding === 'high' ? 10 : linkBuilding === 'medium' ? 6 : 2;
  score += competition === 'low' ? 10 : competition === 'medium' ? 0 : -12;
  score += brand === 'high' ? 8 : brand === 'medium' ? 4 : 0;
  score += websiteStage === 'from_scratch' ? -10 : websiteStage === 'new' ? -5 : 0;

  const clamped = Math.max(18, Math.min(92, score));
  const label = clamped >= 70 ? 'HIGH' : clamped >= 45 ? 'MODERATE' : 'LOW';

  return {
    score: clamped,
    label,
    summary:
      label === 'HIGH'
        ? 'Execution looks realistic with current inputs.'
        : label === 'MODERATE'
          ? 'Feasible, but one or two constraints may need to improve.'
          : 'This objective needs either more capacity or a lighter target.'
  };
}

function buildObjectivePreview(state: DraftState, projectName: string, diagnosisDirection: string) {
  const business = (state.business_goal ?? {}) as Record<string, unknown>;
  const baseline = (state.seo_baseline ?? {}) as Record<string, unknown>;
  const targetValue = toText(business.business_target_value, 'measurable growth');
  const period = toText(business.target_period, '6 months');
  const product = toText(business.priority_product_or_service, 'core offer');
  const market = toText(business.target_market, projectName);
  const traffic = toNumber(baseline.current_monthly_organic_traffic);
  const ctr = toNumber(baseline.current_ctr);

  return {
    headline: `Increase ${formatBusinessGoalLabel(business.main_business_goal)} for ${product} in ${market} within ${period}.`,
    summary: `Use the diagnosis direction to move from ${traffic || 'current'} monthly traffic and ${ctr || 'current'} CTR toward ${targetValue}.`,
    direction: diagnosisDirection
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
        <ChevronDown className="h-5 w-5 text-on-surface-variant transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-outline-variant p-4 pt-0 md:p-5 md:pt-0">{children}</div>
    </details>
  );
}

function ChoiceChip({
  selected,
  label,
  desc,
  icon,
  onClick
}: {
  selected: boolean;
  label: string;
  desc: string;
  icon?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-[24px] border p-4 text-left transition-all',
        selected
          ? 'border-primary bg-primary-container text-on-primary-container shadow-sm'
          : 'border-outline-variant bg-white text-on-surface hover:border-primary/50 hover:bg-primary/5'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          {icon ? <div className="text-xl">{icon}</div> : null}
          <p className="mt-2 text-sm font-semibold">{label}</p>
          <p className={cn('mt-2 text-xs leading-5', selected ? 'text-on-primary-container/80' : 'text-on-surface-variant')}>
            {desc}
          </p>
        </div>
        <div
          className={cn(
            'mt-1 flex h-5 w-5 items-center justify-center rounded-full border',
            selected ? 'border-primary bg-primary text-white' : 'border-outline-variant bg-white'
          )}
        >
          {selected ? '•' : null}
        </div>
      </div>
    </button>
  );
}

function OptionPill({
  selected,
  label,
  onClick
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'min-h-11 rounded-full px-4 py-2 text-sm font-semibold transition-all',
        selected ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
      )}
    >
      {label}
    </button>
  );
}

export function ObjectiveBuilder({
  projectId,
  projectName,
  websiteStage,
  diagnosisId,
  diagnosisReady,
  diagnosisSummary,
  diagnosisType,
  diagnosisSeverity,
  diagnosisDirection,
  diagnosisResult,
  initialDraft
}: ObjectiveBuilderProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<DraftState>(() => normalizeDraft(initialDraft));
  const [showMoreMetrics, setShowMoreMetrics] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const mounted = useRef(false);

  const preview = useMemo(() => buildObjectivePreview(draft, projectName, diagnosisDirection), [draft, projectName, diagnosisDirection]);
  const achievability = useMemo(() => calculateAchievability(draft, websiteStage), [draft, websiteStage]);

  const businessGoal = useMemo(() => (draft.business_goal ?? {}) as Record<string, unknown>, [draft.business_goal]);
  const baseline = useMemo(() => (draft.seo_baseline ?? {}) as Record<string, unknown>, [draft.seo_baseline]);
  const constraints = useMemo(() => (draft.constraints ?? {}) as Record<string, unknown>, [draft.constraints]);
  const targetPeriod = toText(businessGoal.target_period, '6 months');
  const campaignDuration = toText(constraints.campaign_duration, targetPeriod);
  const durationWarning =
    periodRank(campaignDuration) !== -1 && periodRank(targetPeriod) !== -1 && periodRank(campaignDuration) < periodRank(targetPeriod)
      ? `⚠ Campaign duration (${campaignDuration}) is shorter than business target (${targetPeriod}). Are you sure?`
      : null;
  const fromScratch = websiteStage === 'from_scratch';
  const canGenerateObjective = Boolean(diagnosisId) && diagnosisReady;

  useEffect(() => {
    mounted.current = true;
  }, []);

  function setNested(path: 'business_goal' | 'seo_baseline' | 'constraints', key: string, value: unknown) {
    setDraft((current) => ({
      ...current,
      [path]: {
        ...(current[path] as Record<string, unknown>),
        [key]: value
      }
    }));
  }

  function syncTargetPeriod(value: string) {
    setNested('business_goal', 'target_period', value);
    if (!toText(constraints.campaign_duration)) {
      setNested('constraints', 'campaign_duration', value);
    }
  }

  const persistDraft = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      const payload = objectiveInputSchema.parse({
        business_goal: {
          main_business_goal: businessGoal.main_business_goal,
          business_target_value: toOptionalText(businessGoal.business_target_value),
          target_period: toText(businessGoal.target_period, '6 months'),
          priority_product_or_service: toOptionalText(businessGoal.priority_product_or_service),
          target_market: toOptionalText(businessGoal.target_market),
          average_order_value: toNumber(businessGoal.average_order_value) || undefined
        },
        seo_baseline: {
          current_monthly_organic_traffic: toNumber(baseline.current_monthly_organic_traffic) || undefined,
          current_organic_conversions: toNumber(baseline.current_organic_conversions) || undefined,
          current_impressions: toNumber(baseline.current_impressions) || undefined,
          current_ctr: toNumber(baseline.current_ctr) || undefined,
          current_ranking_keywords: toNumber(baseline.current_ranking_keywords) || undefined,
          current_indexed_pages: toNumber(baseline.current_indexed_pages) || undefined,
          domain_authority: toNumber(baseline.domain_authority) || undefined,
          referring_domains: toNumber(baseline.referring_domains) || undefined,
          current_conversion_rate: toNumber(baseline.current_conversion_rate) || undefined,
          bounce_rate: toNumber(baseline.bounce_rate) || undefined
        },
        constraints: {
          campaign_duration: toText(campaignDuration, '6 months'),
          budget_level: toText(constraints.budget_level, 'medium') as 'low' | 'medium' | 'high',
          content_capacity_per_month: toNumber(constraints.content_capacity_per_month) || 0,
          developer_support_available: Boolean(constraints.developer_support_available),
          link_building_capacity: (toText(constraints.link_building_capacity, 'medium') as 'low' | 'medium' | 'high'),
          industry_competition_level: toText(constraints.industry_competition_level, 'medium') as 'low' | 'medium' | 'high',
          existing_brand_strength: toText(constraints.existing_brand_strength, 'medium') as 'low' | 'medium' | 'high'
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
  }, [businessGoal, baseline, campaignDuration, constraints, projectId]);

  useEffect(() => {
    if (!mounted.current) {
      return;
    }

    if (timer.current) {
      window.clearTimeout(timer.current);
    }

    timer.current = window.setTimeout(() => {
      void persistDraft();
    }, 900);

    return () => {
      if (timer.current) {
        window.clearTimeout(timer.current);
      }
    };
  }, [draft, persistDraft]);

  async function generateObjective() {
    if (!canGenerateObjective) {
      setError('Wait until the diagnosis is completed before generating an objective.');
      return;
    }

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
        body: JSON.stringify({
          diagnosis_id: diagnosisId,
          diagnosis_result: diagnosisResult,
          business_goal: {
            main_business_goal: businessGoal.main_business_goal,
            business_target_value: toOptionalText(businessGoal.business_target_value),
            target_period: toText(businessGoal.target_period, '6 months'),
            priority_product_or_service: toOptionalText(businessGoal.priority_product_or_service),
            target_market: toOptionalText(businessGoal.target_market),
            average_order_value: toNumber(businessGoal.average_order_value) || undefined
          },
          seo_baseline: {
            current_monthly_organic_traffic: fromScratch ? 0 : toNumber(baseline.current_monthly_organic_traffic) || 0,
            current_organic_conversions: fromScratch ? 0 : toNumber(baseline.current_organic_conversions) || undefined,
            current_impressions: fromScratch ? 0 : toNumber(baseline.current_impressions) || undefined,
            current_ctr: fromScratch ? 0 : toNumber(baseline.current_ctr) || undefined,
            current_ranking_keywords: fromScratch ? 0 : toNumber(baseline.current_ranking_keywords) || undefined,
            current_indexed_pages: fromScratch ? 0 : toNumber(baseline.current_indexed_pages) || 0,
            domain_authority: fromScratch ? 0 : toNumber(baseline.domain_authority) || 0,
            referring_domains: fromScratch ? 0 : toNumber(baseline.referring_domains) || undefined,
            current_conversion_rate: fromScratch ? 0 : toNumber(baseline.current_conversion_rate) || undefined,
            bounce_rate: fromScratch ? 0 : toNumber(baseline.bounce_rate) || undefined
          },
          constraints: {
            campaign_duration: campaignDuration || toText(businessGoal.target_period, '6 months'),
            budget_level: toText(constraints.budget_level, 'medium'),
            content_capacity_per_month: toNumber(constraints.content_capacity_per_month) || 0,
            developer_support_available: Boolean(constraints.developer_support_available),
            link_building_capacity: toText(constraints.link_building_capacity, 'medium'),
            industry_competition_level: toText(constraints.industry_competition_level, 'medium'),
            existing_brand_strength: toText(constraints.existing_brand_strength, 'medium')
          }
        })
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
              Based on your diagnosis
            </span>
            <span>{diagnosisType}</span>
            <span className="hidden h-4 w-px bg-outline-variant sm:block" />
            <span className="line-clamp-1">{diagnosisSummary}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-4">
            <div className="rounded-[28px] border border-outline-variant bg-primary-container p-5 text-on-primary-container shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-on-primary-container/75">
                    Diagnosis Context
                  </p>
                  <p className="mt-2 text-sm leading-6 text-on-primary-container">
                    Primary problem: <span className="font-semibold">{diagnosisType}</span> · Severity:{' '}
                    <span className="font-semibold">{diagnosisSeverity}</span>
                  </p>
                  <p className="mt-2 text-sm leading-6 text-on-primary-container/90">{diagnosisDirection}</p>
                </div>
                <Link
                  href={diagnosisId ? `/diagnosis/${diagnosisId}` : '/diagnosis'}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white/80 px-4 py-3 text-sm font-semibold text-on-primary-container transition-colors hover:bg-white"
                >
                  View full diagnosis
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {fromScratch ? (
              <div className="rounded-[28px] border border-primary/20 bg-primary-container px-5 py-4 text-on-primary-container shadow-sm">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">Your website is at &quot;from scratch&quot; stage.</p>
                    <p className="mt-2 text-sm leading-6 text-on-primary-container">
                      Baseline values are set to 0. We&apos;ll create a foundation-building objective.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-5 shadow-sm md:p-6">
                <div className="flex items-start gap-3">
                  <Lightbulb className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-on-surface">Most values are pre-filled from your diagnosis.</p>
                    <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                      Verify and update the SEO baseline where needed. You can keep going even if a metric is unknown.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Section title="Business Goal" eyebrow="Step 1" icon={<Target className="h-5 w-5 text-primary" />} defaultOpen>
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {BUSINESS_GOALS.map((goal) => (
                    <ChoiceChip
                      key={goal.value}
                      selected={normalizeBusinessGoalValue(businessGoal.main_business_goal) === goal.value}
                      label={goal.label}
                      desc={goal.desc}
                      icon={goal.icon}
                      onClick={() => setNested('business_goal', 'main_business_goal', goal.value)}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                      Business target value
                    </span>
                    <input
                      value={toText(businessGoal.business_target_value)}
                      onChange={(event) => setNested('business_goal', 'business_target_value', event.target.value)}
                      className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="e.g., Increase qualified leads by 30%"
                    />
                  </label>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                      Target period
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {TARGET_PERIODS.map((period) => (
                        <OptionPill
                          key={period}
                          selected={toText(businessGoal.target_period, '6 months') === period}
                          label={period}
                          onClick={() => syncTargetPeriod(period)}
                        />
                      ))}
                    </div>
                  </div>
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                      Priority product or service
                    </span>
                    <input
                      value={toText(businessGoal.priority_product_or_service)}
                      onChange={(event) => setNested('business_goal', 'priority_product_or_service', event.target.value)}
                      className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="ERP implementation service"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                      Target market
                    </span>
                    <input
                      value={toText(businessGoal.target_market)}
                      onChange={(event) => setNested('business_goal', 'target_market', event.target.value)}
                      className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="Indonesia mid-market B2B"
                    />
                  </label>
                  <label className="flex flex-col gap-2 md:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                      Average order value
                    </span>
                    <input
                      type="number"
                      value={toNumber(businessGoal.average_order_value)}
                      onChange={(event) => setNested('business_goal', 'average_order_value', event.target.value)}
                      className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="50000000"
                    />
                  </label>
                </div>
              </div>
            </Section>

            <Section title="SEO Baseline" eyebrow="Step 2" icon={<TrendingUp className="h-5 w-5 text-primary" />}>
              <div className="rounded-2xl border border-outline-variant bg-primary-container/30 px-4 py-3 text-sm text-on-primary-container">
                ℹ️ Most values are pre-filled from your diagnosis. Verify and update if needed.
              </div>

              <div className="mt-5 grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                    Traffic & Visibility
                  </p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {[
                      ['current_monthly_organic_traffic', 'Monthly Organic Traffic', '0'],
                      ['current_impressions', 'Impressions', '0'],
                      ['current_ctr', 'CTR (%)', '0'],
                      ['current_ranking_keywords', 'Ranking Keywords', '0']
                    ].map(([key, label, placeholder]) => (
                      <label key={key} className="flex flex-col gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                          {label}
                        </span>
                        <input
                          type="number"
                          disabled={fromScratch && key !== 'current_impressions'}
                          value={toNumber(baseline[key])}
                          onChange={(event) => setNested('seo_baseline', key, event.target.value)}
                          className={cn(
                            'min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
                            fromScratch && key !== 'current_impressions' ? 'cursor-not-allowed bg-surface-container-low text-on-surface-variant' : ''
                          )}
                          placeholder={placeholder}
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">Engagement</p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {[
                      ['current_organic_conversions', 'Organic Conversions', '0'],
                      ['current_conversion_rate', 'Conversion Rate (%)', '0.0'],
                      ['bounce_rate', 'Bounce Rate (%)', '0.0']
                    ].map(([key, label, placeholder]) => (
                      <label key={key} className="flex flex-col gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                          {label}
                        </span>
                        <input
                          type="number"
                          value={toNumber(baseline[key])}
                          onChange={(event) => setNested('seo_baseline', key, event.target.value)}
                          className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                          placeholder={placeholder}
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">Authority</p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {[
                      ['current_indexed_pages', 'Indexed Pages', '0'],
                      ['domain_authority', 'Domain Authority', '0'],
                      ['referring_domains', 'Referring Domains', '0']
                    ].map(([key, label, placeholder]) => (
                      <label key={key} className="flex flex-col gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                          {label}
                        </span>
                        <input
                          type="number"
                          disabled={fromScratch && (key === 'current_indexed_pages' || key === 'domain_authority')}
                          value={toNumber(baseline[key])}
                          onChange={(event) => setNested('seo_baseline', key, event.target.value)}
                          className={cn(
                            'min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
                            fromScratch && (key === 'current_indexed_pages' || key === 'domain_authority')
                              ? 'cursor-not-allowed bg-surface-container-low text-on-surface-variant'
                              : ''
                          )}
                          placeholder={placeholder}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowMoreMetrics((current) => !current)}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-surface-container px-4 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
              >
                {showMoreMetrics ? 'Hide more metrics' : 'Show more metrics'}
                <ChevronDown className={cn('h-4 w-4 transition-transform', showMoreMetrics && 'rotate-180')} />
              </button>

              {showMoreMetrics ? (
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {[
                    ['current_monthly_organic_traffic', 'Monthly Organic Traffic'],
                    ['current_organic_conversions', 'Organic Conversions'],
                    ['current_conversion_rate', 'Conversion Rate (%)'],
                    ['bounce_rate', 'Bounce Rate (%)']
                  ].map(([key, label]) => (
                    <div key={key} className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">{label}</p>
                      <p className="mt-2 text-sm text-on-surface-variant">
                        Current value: {toNumber(baseline[key]) || 'n/a'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </Section>

            <Section title="Resources & Capacity" eyebrow="Step 3" icon={<Lightbulb className="h-5 w-5 text-primary" />}>
              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                    Budget level
                  </span>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {BUDGET_LEVELS.map((option) => (
                      <ChoiceChip
                        key={option.value}
                        selected={toText(constraints.budget_level, 'medium') === option.value}
                        label={option.label}
                        desc={option.desc}
                        onClick={() => setNested('constraints', 'budget_level', option.value)}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                      Content production capacity / month
                    </span>
                    <input
                      type="number"
                      value={toNumber(constraints.content_capacity_per_month)}
                      onChange={(event) => setNested('constraints', 'content_capacity_per_month', event.target.value)}
                      className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="6"
                    />
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-outline-variant bg-white px-4 py-3">
                    <input
                      type="checkbox"
                      checked={Boolean(constraints.developer_support_available)}
                      onChange={(event) => setNested('constraints', 'developer_support_available', event.target.checked)}
                      className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="text-sm font-semibold text-on-surface">Developer support available</p>
                      <p className="text-xs text-on-surface-variant">We have access to a developer for technical SEO fixes</p>
                    </div>
                  </label>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                    Link building capacity
                  </span>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {LINK_BUILDING_CAPACITY.map((option) => (
                      <ChoiceChip
                        key={option.value}
                        selected={toText(constraints.link_building_capacity, 'medium') === option.value}
                        label={option.label}
                        desc={option.desc}
                        onClick={() => setNested('constraints', 'link_building_capacity', option.value)}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                    Industry competition level
                  </span>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {COMPETITION_LEVELS.map((option) => (
                      <ChoiceChip
                        key={option.value}
                        selected={toText(constraints.industry_competition_level, 'medium') === option.value}
                        label={option.label}
                        desc={option.desc}
                        onClick={() => setNested('constraints', 'industry_competition_level', option.value)}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                    Existing brand strength
                  </span>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {BRAND_STRENGTH.map((option) => (
                      <ChoiceChip
                        key={option.value}
                        selected={toText(constraints.existing_brand_strength, 'medium') === option.value}
                        label={option.label}
                        desc={option.desc}
                        onClick={() => setNested('constraints', 'existing_brand_strength', option.value)}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                    Campaign duration
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {TARGET_PERIODS.map((period) => (
                      <OptionPill
                        key={period}
                        selected={campaignDuration === period}
                        label={period}
                        onClick={() => setNested('constraints', 'campaign_duration', period)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            {durationWarning ? (
              <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                {durationWarning}
              </div>
            ) : null}

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
              <p className="mt-4 text-sm font-semibold text-on-primary/90">
                Direction: {preview.direction}
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/30 bg-white/10 p-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-on-primary/70">Timebox</p>
                  <p className="mt-2 text-sm font-semibold">{campaignDuration || targetPeriod}</p>
                </div>
                <div className="rounded-2xl border border-white/30 bg-white/10 p-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-on-primary/70">Baseline</p>
                  <p className="mt-2 text-sm font-semibold">
                    {toNumber(baseline.current_monthly_organic_traffic) || 'n/a'} current traffic
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">Estimated Achievability</p>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-3xl font-semibold tracking-tight text-on-surface">
                    {achievability.label}
                  </p>
                  <p className="mt-1 text-sm text-on-surface-variant">{achievability.score}%</p>
                </div>
                <ShieldAlert className={cn('h-7 w-7', achievability.label === 'HIGH' ? 'text-emerald-500' : achievability.label === 'MODERATE' ? 'text-amber-500' : 'text-error')} />
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-surface-container">
                <div
                  className={cn(
                    'h-full rounded-full',
                    achievability.label === 'HIGH' ? 'bg-emerald-500' : achievability.label === 'MODERATE' ? 'bg-amber-500' : 'bg-error'
                  )}
                  style={{ width: `${achievability.score}%` }}
                />
              </div>
              <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                Based on budget, content capacity, developer support, link building, competition, and brand strength.
              </p>
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
                {diagnosisReady
                  ? 'We save the objective draft as you type, then send the full payload to n8n when you click generate.'
                  : 'We save the draft, but you need a completed diagnosis before generating the objective.'}
              </p>
              {!diagnosisReady ? (
                <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                  Diagnosis is still processing. Open the diagnosis page and wait until the status becomes completed, then try again.
                </p>
              ) : null}
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={generateObjective}
                  disabled={saving || submitting || !canGenerateObjective}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : !canGenerateObjective ? (
                    <>
                      Wait for Diagnosis
                    </>
                  ) : (
                    <>
                      Generate Objective
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
