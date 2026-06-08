import type { Locale } from '@/lib/i18n';
import { extractMetricCards, formatLabel, formatMetricValue, toArray, toRecord, toText } from './utils';

type DisplayMetric = {
  label: string;
  baseline?: string;
  target?: string;
  unit?: string;
  note?: string;
};

function sectionLabel(locale: Locale, en: string, id: string) {
  return locale === 'id' ? id : en;
}

function buildActionItems(objective: Record<string, unknown>, locale: Locale) {
  const rawOutput = toRecord(objective.raw_llm_output);
  const outputMetrics = toRecord(objective.output_metrics);
  const rawItems = toArray(rawOutput.action_items ?? outputMetrics.action_items);

  if (rawItems.length > 0) {
    return rawItems.map((item, index) => {
      const record = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
      const label = toText(record.label ?? record.title, `${sectionLabel(locale, 'Action item', 'Item aksi')} ${index + 1}`);
      const desc = toText(record.value ?? record.description ?? record.note, formatMetricValue(item));
      return { label, desc };
    });
  }

  const businessGoal = toRecord(objective.input_metrics).business_goal as Record<string, unknown> | undefined;
  const fallbackItems = [
    toText(businessGoal?.priority_product_or_service, ''),
    toText(businessGoal?.target_market, ''),
    toText(businessGoal?.target_period, '')
  ].filter(Boolean);

  return fallbackItems.map((item, index) => ({
    label: `${sectionLabel(locale, 'Task', 'Tugas')} ${index + 1}`,
    desc: item
  }));
}

function buildTargetMetrics(objective: Record<string, unknown>, locale: Locale): DisplayMetric[] {
  const targetCards = extractMetricCards(objective.target);
  if (targetCards.length > 0) {
    return targetCards as DisplayMetric[];
  }

  const businessGoal = toRecord(objective.input_metrics).business_goal as Record<string, unknown> | undefined;
  const fallbackMetrics = [
    {
      label: sectionLabel(locale, 'Business target', 'Target bisnis'),
      target: toText(businessGoal?.business_target_value, 'n/a')
    },
    {
      label: sectionLabel(locale, 'Target market', 'Target market'),
      target: toText(businessGoal?.target_market, 'n/a')
    },
    {
      label: sectionLabel(locale, 'Time period', 'Periode'),
      target: toText(businessGoal?.target_period, 'n/a')
    }
  ];

  return fallbackMetrics.filter((item) => item.target && item.target !== 'n/a');
}

export function ContentKeywordPillar({
  objective,
  locale
}: {
  objective: Record<string, unknown>;
  locale: Locale;
}) {
  const smartObjective = toText(
    objective.smart_objective,
    locale === 'id'
      ? 'SMART objective belum selesai. Data akan tampil setelah objective final tersimpan.'
      : 'The SMART objective is still pending. It will appear once the final objective is stored.'
  );
  const actionItems = buildActionItems(objective, locale);
  const targetMetrics = buildTargetMetrics(objective, locale);

  return (
    <section className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            {locale === 'id' ? 'Pillar 2' : 'Pillar 2'}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-on-surface">
            {locale === 'id' ? 'Content & Keyword' : 'Content & Keyword'}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
            {locale === 'id'
              ? 'Fokus pada SMART objective, langkah kerja tim, dan target ranking yang ingin dikejar.'
              : 'Focus on the SMART objective, team execution steps, and the ranking targets to pursue.'}
          </p>
        </div>

        <div className="rounded-2xl border border-outline-variant bg-white px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
            {locale === 'id' ? 'Objective type' : 'Objective type'}
          </p>
          <p className="mt-1 text-sm font-semibold text-on-surface">
            {formatLabel(toText(objective.objective_type, locale === 'id' ? 'Campuran' : 'Mixed objective'))}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4">
        <div className="rounded-2xl border border-outline-variant bg-primary/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            {locale === 'id' ? 'SMART Objective' : 'SMART Objective'}
          </p>
          <p className="mt-2 text-base leading-7 text-on-surface">{smartObjective}</p>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-on-surface">
              {locale === 'id' ? 'Action Items' : 'Action Items'}
            </h3>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-on-surface-variant">
              {locale === 'id' ? 'Apa yang dikerjakan tim' : 'What the team will execute'}
            </span>
          </div>

          {actionItems.length > 0 ? (
            <div className="mt-3 space-y-2">
              {actionItems.map((item, index) => (
                <div key={`${item.label}-${index}`} className="flex items-start gap-3 rounded-2xl border border-outline-variant bg-white px-4 py-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-container text-xs font-semibold text-on-surface-variant">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-on-surface">{item.label}</p>
                    <p className="mt-1 text-sm leading-6 text-on-surface-variant">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-2xl border border-dashed border-outline-variant bg-surface-container-low px-4 py-5 text-sm text-on-surface-variant">
              {locale === 'id'
                ? 'Belum ada action items yang tersusun di data objective.'
                : 'No action items have been stored in the objective data yet.'}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-on-surface">
              {locale === 'id' ? 'Target Metrics' : 'Target Metrics'}
            </h3>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-on-surface-variant">
              {locale === 'id' ? 'Ranking dan target kerja' : 'Ranking and execution targets'}
            </span>
          </div>

          {targetMetrics.length > 0 ? (
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {targetMetrics.map((metric, index) => (
                <div key={`${metric.label}-${index}`} className="rounded-2xl border border-outline-variant bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-xl font-semibold text-on-surface">
                    {metric.baseline && metric.target
                      ? `${metric.baseline} -> ${metric.target}`
                      : metric.target ?? metric.baseline ?? 'n/a'}
                  </p>
                  {metric.unit ? <p className="mt-1 text-xs text-on-surface-variant">{metric.unit}</p> : null}
                  {metric.note ? <p className="mt-1 text-sm leading-6 text-on-surface-variant">{metric.note}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-2xl border border-dashed border-outline-variant bg-surface-container-low px-4 py-5 text-sm text-on-surface-variant">
              {locale === 'id'
                ? 'Target metrics belum tersedia, jadi section ini menunggu data final dari objective generator.'
                : 'Target metrics are not available yet, so this section is waiting for the final objective generator output.'}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
