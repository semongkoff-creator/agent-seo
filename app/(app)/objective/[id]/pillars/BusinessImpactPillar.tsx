import { ArrowRight } from 'lucide-react';
import type { Locale } from '@/lib/i18n';
import { calcGrowth, extractMetricCards, formatLabel, toRecord, toText } from './utils';

type DisplayMetric = {
  label: string;
  baseline?: string;
  target?: string;
  unit?: string;
};

function sectionLabel(locale: Locale, en: string, id: string) {
  return locale === 'id' ? id : en;
}

function buildBusinessMetrics(objective: Record<string, unknown>, locale: Locale): DisplayMetric[] {
  const targetCards = extractMetricCards(objective.target);
  if (targetCards.length > 0) {
    return targetCards as DisplayMetric[];
  }

  const outputMetrics = toRecord(objective.output_metrics);
  const inputMetrics = toRecord(objective.input_metrics);
  const seoBaseline = toRecord(inputMetrics.seo_baseline);
  const businessGoal = toRecord(inputMetrics.business_goal);
  const fallback: DisplayMetric[] = [
    {
      label: sectionLabel(locale, 'Projected traffic', 'Traffic proyeksi'),
      baseline: toText(seoBaseline.current_monthly_organic_traffic, 'n/a'),
      target: toText(outputMetrics.projected_traffic, toText(businessGoal?.business_target_value, 'n/a'))
    },
    {
      label: sectionLabel(locale, 'Lead / conversion goal', 'Target lead / konversi'),
      baseline: toText(seoBaseline.current_organic_conversions, 'n/a'),
      target: toText(outputMetrics.projected_conversions, 'n/a')
    }
  ];

  return fallback.filter((item) => item.target !== 'n/a' || item.baseline !== 'n/a');
}

function resolveRoiEstimate(objective: Record<string, unknown>, locale: Locale) {
  const outputMetrics = toRecord(objective.output_metrics);
  const raw = toRecord(objective.raw_llm_output);
  const value = outputMetrics.roi_estimate ?? raw.roi_estimate ?? raw.projected_roi ?? null;

  if (typeof value === 'number') {
    return `${value.toFixed(1)}x`;
  }

  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  const achievabilityPercent = typeof objective.achievability_percent === 'number' ? objective.achievability_percent : null;
  if (achievabilityPercent !== null) {
    return locale === 'id'
      ? `Estimasi berbasis ketercapian ${achievabilityPercent}%`
      : `Estimated from achievability at ${achievabilityPercent}%`;
  }

  return locale === 'id' ? 'Menunggu estimasi ROI' : 'ROI estimate pending';
}

export function BusinessImpactPillar({
  objective,
  locale
}: {
  objective: Record<string, unknown>;
  locale: Locale;
}) {
  const smartObjective = toText(
    objective.smart_objective,
    locale === 'id'
      ? 'Objective bisnis akan muncul setelah hasil objective final tersedia.'
      : 'The business objective will appear once the final output is available.'
  );
  const inputMetrics = toRecord(objective.input_metrics);
  const businessGoal = toRecord(inputMetrics.business_goal);
  const businessMetrics = buildBusinessMetrics(objective, locale);
  const roiEstimate = resolveRoiEstimate(objective, locale);
  const objectiveLabel = formatLabel(toText(objective.objective_type, locale === 'id' ? 'Campuran' : 'Mixed objective'));
  const targetValue = toText(businessGoal?.business_target_value, 'n/a');
  const growthHint =
    businessMetrics.length > 0 && businessMetrics[0].baseline && businessMetrics[0].target
      ? calcGrowth(Number(businessMetrics[0].baseline?.replace(/,/g, '')) || 0, Number(businessMetrics[0].target?.replace(/,/g, '')) || 0)
      : null;

  return (
    <section className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            {locale === 'id' ? 'Pillar 3' : 'Pillar 3'}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-on-surface">
            {locale === 'id' ? 'Business Impact' : 'Business Impact'}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
            {locale === 'id'
              ? 'Ringkas target bisnis, baseline ke target, dan estimasi dampak finansialnya.'
              : 'Summarize the business target, baseline-to-target movement, and the financial impact estimate.'}
          </p>
        </div>

        <div className="rounded-2xl border border-outline-variant bg-white px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
            {locale === 'id' ? 'Objective type' : 'Objective type'}
          </p>
          <p className="mt-1 text-sm font-semibold text-on-surface">{objectiveLabel}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4">
        <div className="rounded-2xl border border-outline-variant bg-emerald-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
            {locale === 'id' ? 'SMART Objective Bisnis' : 'Business SMART Objective'}
          </p>
          <p className="mt-2 text-base leading-7 text-on-surface">{smartObjective}</p>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-on-surface">
              {locale === 'id' ? 'Target Metrics' : 'Target Metrics'}
            </h3>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-on-surface-variant">
              {locale === 'id' ? 'Baseline menuju target' : 'Baseline to target'}
            </span>
          </div>

          {businessMetrics.length > 0 ? (
            <div className="mt-3 space-y-3">
              {businessMetrics.map((metric, index) => {
                const growth =
                  metric.baseline && metric.target
                    ? calcGrowth(Number(metric.baseline.replace(/[^0-9.]/g, '')) || 0, Number(metric.target.replace(/[^0-9.]/g, '')) || 0)
                    : null;

                return (
                  <div key={`${metric.label}-${index}`} className="rounded-2xl border border-outline-variant bg-white p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                          {metric.label}
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          <div>
                            <p className="text-xs text-on-surface-variant">{locale === 'id' ? 'Baseline' : 'Baseline'}</p>
                            <p className="text-2xl font-semibold text-on-surface">{metric.baseline ?? 'n/a'}</p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-on-surface-variant" />
                          <div>
                            <p className="text-xs text-on-surface-variant">{locale === 'id' ? 'Target' : 'Target'}</p>
                            <p className="text-2xl font-semibold text-emerald-700">{metric.target ?? 'n/a'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl bg-surface-container-low px-4 py-3 text-left md:text-right">
                        <p className="text-xs uppercase tracking-[0.22em] text-on-surface-variant">
                          {locale === 'id' ? 'Growth' : 'Growth'}
                        </p>
                        <p className="mt-1 text-lg font-semibold text-on-surface">
                          {growth !== null ? `+${growth}%` : locale === 'id' ? 'Menunggu data' : 'Pending data'}
                        </p>
                        {metric.unit ? <p className="text-xs text-on-surface-variant">{metric.unit}</p> : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-3 rounded-2xl border border-dashed border-outline-variant bg-surface-container-low px-4 py-5 text-sm text-on-surface-variant">
              {locale === 'id'
                ? 'Target metrics belum tersedia pada objective ini.'
                : 'Target metrics are not available for this objective yet.'}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                {locale === 'id' ? 'ROI estimate' : 'ROI estimate'}
              </p>
              <p className="mt-2 text-xl font-semibold text-on-surface">{roiEstimate}</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">
                {locale === 'id' ? 'Business target' : 'Business target'}
              </p>
              <p className="mt-1 text-sm font-semibold text-on-surface">{targetValue}</p>
            </div>
          </div>
          {growthHint !== null ? (
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">
              {locale === 'id'
                ? `Perubahan metric utama kira-kira menunjukkan growth ${growthHint}%.`
                : `The primary metric shift suggests roughly ${growthHint}% growth.`}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
