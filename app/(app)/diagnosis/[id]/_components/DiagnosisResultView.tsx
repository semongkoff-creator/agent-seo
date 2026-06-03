import Link from 'next/link';
import { ArrowRight, Ban, Brain, CircleAlert, Sparkles } from 'lucide-react';
import { ConfidenceGauge } from '@/components/ui/confidence-gauge';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { formatWibDateTime } from '@/lib/time';

type DiagnosisResultViewProps = {
  diagnosisId: string;
  diagnosis: Record<string, unknown>;
  projectName: string;
  projectId: string;
};

const problemTypeLabels: Record<string, string> = {
  technical_bottleneck: 'Technical Bottleneck',
  relevance_gap: 'Relevance & Traffic Gap',
  authority_deficit: 'Authority Deficit',
  conversion_pitfall: 'Conversion Pitfall',
  from_scratch: 'From Scratch',
  mixed: 'Mixed Issues'
};

function toText(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function toNumber(value: unknown, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function formatLabel(value: unknown) {
  if (typeof value !== 'string' || !value) {
    return 'mixed';
  }

  return problemTypeLabels[value] ?? value.replace(/_/g, ' ');
}

function ToneCard({
  title,
  value,
  hint,
  tone = 'bg-primary-fixed text-on-primary-fixed-variant'
}: {
  title: string;
  value: string;
  hint?: string;
  tone?: string;
}) {
  return (
    <div className="rounded-[24px] border border-outline-variant bg-white p-4 shadow-sm">
      <div className={['inline-flex rounded-full px-3 py-1 text-xs font-semibold', tone].join(' ')}>
        {title}
      </div>
      <p className="mt-4 text-2xl font-semibold text-on-surface">{value}</p>
      {hint ? <p className="mt-2 text-sm leading-6 text-on-surface-variant">{hint}</p> : null}
    </div>
  );
}

export function DiagnosisResultView({ diagnosisId, diagnosis, projectName, projectId }: DiagnosisResultViewProps) {
  const problemType = formatLabel(diagnosis.primary_problem_type);
  const severity = toText(diagnosis.severity, 'medium') as 'low' | 'medium' | 'high' | 'critical';
  const confidence = toNumber(diagnosis.confidence_score, 87);
  const summary = toText(
    diagnosis.diagnosis_summary,
    'High-frequency mismatch between core content clusters and search intent is causing a visibility drop over the last 30 days.'
  );
  const rootCause = toText(
    diagnosis.root_cause,
    'The current information architecture is not aligned with search intent.'
  );
  const evidence = toArray(diagnosis.evidence);
  const warnings = toArray(diagnosis.warnings);
  const businessImpact = (diagnosis.business_impact as Record<string, unknown>) ?? {};
  const businessSummary = toText(
    businessImpact.summary,
    'Search visibility drop is compressing organic revenue and reducing conversion efficiency.'
  );
  const businessMetrics = toArray(businessImpact.metrics);
  const recommendedNextStep = toText(
    diagnosis.recommended_next_step,
    'Prioritize crawlability repairs and rebuild the core content path before scaling content output.'
  );
  const objectiveDirection = toText(
    diagnosis.objective_direction,
    'Focus on restoring technical health first, then move into authority and conversion improvements.'
  );
  const campaignReadiness = toText(diagnosis.campaign_readiness, 'not_ready');
  const modelUsed = toText(diagnosis.model_used, 'n8n');
  const analyzedAt = toText(diagnosis.completed_at ?? diagnosis.created_at, 'Recently');
  const metaDate = formatWibDateTime(analyzedAt);

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-semibold text-on-primary-fixed-variant">
                  {problemType}
                </span>
                <SeverityBadge severity={severity} label={`Severity: ${severity}`} />
                <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant">
                  {campaignReadiness === 'ready' ? 'Campaign ready' : 'Campaign not ready'}
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-primary">Diagnosis result</p>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-on-surface md:text-3xl lg:text-4xl">
                  {projectName}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant md:text-base">{summary}</p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 rounded-[24px] border border-outline-variant bg-white p-4 md:items-center">
              <ConfidenceGauge value={confidence} />
              <div className="text-left md:text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">Confidence</p>
                <p className="mt-1 text-sm text-on-surface-variant">Strong confidence from the current signals</p>
              </div>
            </div>
          </div>
        </div>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-on-surface">Evidence Found</h2>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {evidence.length > 0
                  ? evidence.map((item, index) => {
                      const record = item as Record<string, unknown>;
                      const title = toText(record.label ?? record.title, `Evidence ${index + 1}`);
                      const value = toText(record.value, 'n/a');
                      const hint = toText(
                        record.source ?? record.hint,
                        'Supporting evidence from the latest crawl.'
                      );
                      const tone = index % 4 === 0
                        ? 'bg-error-container text-on-error-container'
                        : index % 4 === 1
                          ? 'bg-secondary-container text-on-secondary-container'
                          : index % 4 === 2
                            ? 'bg-primary-fixed text-on-primary-fixed-variant'
                            : 'bg-tertiary-fixed text-on-tertiary-fixed-variant';

                      return <ToneCard key={title} title={title} value={value} hint={hint} tone={tone} />;
                    })
                  : null}
              </div>
            </div>

            <div className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-on-surface">Root Cause Analysis</h2>
              <div className="mt-5 space-y-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="mt-2 h-3 w-3 rounded-full bg-primary" />
                    <div className="mt-1 h-full w-px bg-outline-variant" />
                  </div>
                  <div className="pb-4">
                    <p className="font-semibold text-on-surface">Primary root cause</p>
                    <p className="mt-1 text-sm leading-6 text-on-surface-variant">{rootCause}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-error/30 bg-error-container/20 p-6">
              <div className="flex items-start gap-4">
                <CircleAlert className="mt-1 h-8 w-8 text-error" />
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold text-on-error-container">Business Impact</h2>
                  <p className="mt-3 text-sm leading-6 text-on-error-container">{businessSummary}</p>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {businessMetrics.length > 0 ? (
                      businessMetrics.map((metric, index) => {
                        const metricRecord = metric as Record<string, unknown>;
                        const label = toText(metricRecord.label, `Metric ${index + 1}`);
                        const value = toText(metricRecord.value, 'n/a');
                        const direction = toText(metricRecord.direction, 'neutral');
                        return (
                          <div key={label} className="rounded-[20px] border border-white/60 bg-white/70 p-4">
                            <p className="text-3xl font-semibold text-error">{value}</p>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-on-error-container">
                              {label}
                            </p>
                            <p className="mt-2 text-xs text-on-error-container/80">{direction}</p>
                          </div>
                        );
                      })
                    ) : (
                      <>
                        <div className="rounded-[20px] border border-white/60 bg-white/70 p-4">
                          <p className="text-3xl font-semibold text-error">-$12.4k</p>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-on-error-container">
                            Est. Monthly Revenue Loss
                          </p>
                        </div>
                        <div className="rounded-[20px] border border-white/60 bg-white/70 p-4">
                          <p className="text-3xl font-semibold text-error">-18%</p>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-on-error-container">
                            Checkout Conversion Rate
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-primary bg-primary p-6 text-on-primary shadow-lg shadow-primary/20">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-primary/80">
                Recommended Next Step
              </p>
              <h2 className="mt-3 text-2xl font-semibold">{recommendedNextStep}</h2>
              <p className="mt-3 text-sm leading-6 text-on-primary/90">{objectiveDirection}</p>
              <Link
                href={`/projects/${projectId}/objective`}
                className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-primary transition-transform hover:translate-y-[-1px]"
              >
                Proceed to Define Objective
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-[28px] border border-outline-variant bg-surface-container-highest p-6">
              <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                Avoid These Actions
              </h3>
              <ul className="mt-4 space-y-3">
                {(warnings.length > 0 ? warnings : ['Domain migration or TLD changes.']).map((item) => (
                  <li key={String(item)} className="flex items-start gap-3 text-sm leading-6 text-on-surface">
                    <Ban className="mt-0.5 h-4 w-4 text-error" />
                    {String(item)}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[28px] border border-outline-variant bg-white p-4 shadow-sm">
              <div className="h-32 rounded-[20px] bg-surface-container-low p-4">
                <div className="flex h-full flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      Status
                    </span>
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">Campaign readiness</p>
                    <p className="mt-1 text-sm text-on-surface-variant">{campaignReadiness}</p>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm text-on-surface-variant">
                Strategy health is below the benchmark for comparable SaaS platforms.
              </p>
            </div>
          </aside>
        </section>

        <footer className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-4 text-sm text-on-surface-variant shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <span>
                Project: <span className="font-semibold text-on-surface">{projectName}</span>
              </span>
              <span>
                Analyzed: <span className="font-semibold text-on-surface">{metaDate}</span>
              </span>
              <span>
                Model:{' '}
                <span className="rounded bg-surface-container px-2 py-1 font-semibold text-on-surface">{modelUsed}</span>
              </span>
            </div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
              <Sparkles className="h-4 w-4 text-primary" />
              System Status: Optimal
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}
