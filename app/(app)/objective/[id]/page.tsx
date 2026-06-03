import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowUpRight,
  Brain,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Flame,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { AppError } from '@/lib/errors';
import { requireUser } from '@/lib/auth/session';
import { getDiagnosis } from '@/lib/services/diagnoses';
import { getObjective } from '@/lib/services/objectives';
import { getProject } from '@/lib/services/projects';
import { formatWibDate, formatWibDateTime } from '@/lib/time';

type ObjectiveRecord = Record<string, unknown>;

function toText(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function toObject(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as ObjectiveRecord) : {};
}

function formatKey(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .trim();
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return 'n/a';
  }

  if (typeof value === 'number') {
    return value.toLocaleString();
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatValue(item)).join(', ');
  }

  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${formatKey(key)}: ${formatValue(item)}`)
      .join(' · ');
  }

  return String(value);
}

function objectiveTypeLabel(value: unknown): string {
  const label = toText(value, 'mixed');
  const labels: Record<string, string> = {
    technical_recovery: 'Technical Recovery',
    qualified_traffic: 'Qualified Traffic',
    authority_growth: 'Authority Growth',
    conversion_improvement: 'Conversion Improvement',
    foundation_building: 'Foundation Building',
    mixed: 'Mixed Objective'
  };

  return labels[label] ?? label.replace(/_/g, ' ');
}

function renderKeyValueGrid(title: string, data: Record<string, unknown>, emptyLabel: string) {
  const entries = Object.entries(data);

  return (
    <section className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-5 shadow-sm md:p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-lg font-semibold text-on-surface">{title}</h2>
      </div>

      {entries.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {entries.map(([key, value]) => (
            <div key={key} className="rounded-2xl border border-outline-variant bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                {formatKey(key)}
              </p>
              <p className="mt-2 text-sm leading-6 text-on-surface">{formatValue(value)}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-dashed border-outline-variant bg-surface-container-low px-4 py-5 text-sm text-on-surface-variant">
          {emptyLabel}
        </p>
      )}
    </section>
  );
}

function renderArrayCards(title: string, items: unknown[], emptyLabel: string) {
  return (
    <section className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-5 shadow-sm md:p-6">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-primary" />
        <h2 className="text-lg font-semibold text-on-surface">{title}</h2>
      </div>

      {items.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {items.map((item, index) => {
            const record = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
            const label = toText(record.label ?? record.title, `Item ${index + 1}`);
            const value = toText(record.value ?? record.amount ?? record.metric, formatValue(item));
            const source = toText(record.source ?? record.hint ?? record.note, '');

            return (
              <article key={`${label}-${index}`} className="rounded-2xl border border-outline-variant bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                  {label}
                </p>
                <p className="mt-2 text-xl font-semibold text-on-surface">{value}</p>
                {source ? <p className="mt-2 text-sm leading-6 text-on-surface-variant">{source}</p> : null}
              </article>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-dashed border-outline-variant bg-surface-container-low px-4 py-5 text-sm text-on-surface-variant">
          {emptyLabel}
        </p>
      )}
    </section>
  );
}

export default async function ObjectivePage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  let objective: ObjectiveRecord;
  try {
    objective = (await getObjective(user.id, params.id)) as ObjectiveRecord;
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 404) {
      notFound();
    }

    throw error;
  }

  const objectiveProjectId = String(objective.project_id);

  let project: ObjectiveRecord;
  try {
    project = (await getProject(user.id, objectiveProjectId)) as ObjectiveRecord;
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 404) {
      notFound();
    }

    throw error;
  }

  let diagnosis: ObjectiveRecord | null = null;
  if (objective.diagnosis_id) {
    try {
      diagnosis = (await getDiagnosis(user.id, String(objective.diagnosis_id))) as ObjectiveRecord;
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 404) {
        diagnosis = null;
      } else {
        throw error;
      }
    }
  }

  const projectName = toText(project.name, 'Project');
  const objectiveType = objectiveTypeLabel(objective.objective_type);
  const smartObjective = toText(
    objective.smart_objective,
    'Pending objective generation. The final SMART objective will appear here once the result is stored in Supabase.'
  );
  const status = toText(objective.status, 'pending');
  const modelUsed = toText(objective.model_used, 'n8n');
  const achievabilityScore = toText(objective.achievability_score, '');
  const achievabilityPercent = objective.achievability_percent ? `${toNumber(objective.achievability_percent)}%` : 'n/a';
  const createdAt = toText(objective.completed_at ?? objective.created_at, 'Recently');
  const analyzedDate = formatWibDate(createdAt);
  const generatedAt = formatWibDateTime(createdAt);
  const baseline = toObject(objective.baseline);
  const target = toObject(objective.target);
  const inputMetrics = toObject(objective.input_metrics);
  const outputMetrics = toArray(objective.output_metrics);
  const outcomeMetrics = toArray(objective.outcome_metrics);
  const riskNotes = toArray(objective.risk_notes);

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <PageHeader
          eyebrow="Objective"
          title={smartObjective}
          description={`Generated for ${projectName} from the latest diagnosis.`}
          actions={[
            { label: 'Open Builder', href: `/projects/${objectiveProjectId}/objective` },
            { label: 'Open Campaign', href: `/campaign/${objectiveProjectId}` }
          ]}
        >
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-outline-variant bg-surface-container-low p-4 text-sm text-on-surface-variant">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Target className="h-3.5 w-3.5" />
              {objectiveType}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              {status}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant">
              <CalendarRange className="h-3.5 w-3.5 text-primary" />
              {analyzedDate}
            </span>
          </div>
        </PageHeader>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            label="Achievability"
            value={achievabilityPercent}
            delta={achievabilityScore ? `Score: ${achievabilityScore}` : 'Awaiting score'}
            icon={TrendingUp}
            toneClassName="text-primary"
          />
          <StatCard
            label="Generated via"
            value={modelUsed}
            delta={diagnosis ? `Diagnosis: ${toText(diagnosis.primary_problem_type, 'mixed')}` : 'No linked diagnosis'}
            icon={Brain}
          />
          <StatCard
            label="Created"
            value={generatedAt}
            delta={status === 'completed' ? 'Ready for execution' : 'Still in progress'}
            icon={Sparkles}
          />
        </div>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_380px]">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-on-surface">SMART Objective</h2>
              </div>
              <p className="mt-4 text-base leading-7 text-on-surface">{smartObjective}</p>
              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">Status</p>
                  <p className="mt-2 text-lg font-semibold text-on-surface">{status}</p>
                </div>
                <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                    Objective type
                  </p>
                  <p className="mt-2 text-lg font-semibold text-on-surface">{objectiveType}</p>
                </div>
              </div>
            </div>

            {renderKeyValueGrid('Baseline', baseline, 'No baseline details were captured.')}
            {renderKeyValueGrid('Target', target, 'No target definition was captured.')}
            {renderKeyValueGrid('Input Metrics', inputMetrics, 'No input metrics recorded yet.')}
            {renderArrayCards('Output Metrics', outputMetrics, 'No output metrics were generated.')}
            {renderArrayCards('Outcome Metrics', outcomeMetrics, 'No outcome metrics were generated.')}

            <section className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-5 shadow-sm md:p-6">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-semibold text-on-surface">Risk Notes</h2>
              </div>

              {riskNotes.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {riskNotes.map((note, index) => (
                    <li
                      key={`${String(note)}-${index}`}
                      className="flex items-start gap-3 rounded-2xl border border-outline-variant bg-white px-4 py-3 text-sm leading-6 text-on-surface"
                    >
                      <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-error-container text-xs font-semibold text-on-error-container">
                        {index + 1}
                      </span>
                      <span>{formatValue(note)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 rounded-2xl border border-dashed border-outline-variant bg-surface-container-low px-4 py-5 text-sm text-on-surface-variant">
                  No explicit risk notes were recorded for this objective.
                </p>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-primary bg-primary p-6 text-on-primary shadow-lg shadow-primary/20">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-primary/80">Project Context</p>
              <h2 className="mt-3 text-2xl font-semibold leading-tight">{projectName}</h2>
              <p className="mt-3 text-sm leading-6 text-on-primary/90">
                This objective was generated from the most recent completed diagnosis and is ready to feed the campaign
                plan.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-3">
                <div className="rounded-2xl border border-white/25 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-on-primary/70">Diagnosis reference</p>
                  <p className="mt-2 text-sm font-semibold">
                    {diagnosis
                      ? toText(diagnosis.diagnosis_summary, 'No diagnosis summary available.')
                      : 'No linked diagnosis'}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/25 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-on-primary/70">Model</p>
                  <p className="mt-2 text-sm font-semibold">{modelUsed}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-outline-variant bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-primary" />
                <h3 className="text-lg font-semibold text-on-surface">Next Actions</h3>
              </div>

              <div className="mt-4 space-y-3">
                <Link
                  href={`/campaign/${objectiveProjectId}`}
                  className="flex items-center justify-between rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-4 text-sm font-semibold text-on-surface transition-colors hover:border-primary hover:bg-primary/5"
                >
                  Open campaign board
                  <ChevronRight className="h-4 w-4 text-primary" />
                </Link>
                <Link
                  href={`/projects/${objectiveProjectId}/objective`}
                  className="flex items-center justify-between rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-4 text-sm font-semibold text-on-surface transition-colors hover:border-primary hover:bg-primary/5"
                >
                  Regenerate objective
                  <ChevronRight className="h-4 w-4 text-primary" />
                </Link>
                <Link
                  href={`/projects/${objectiveProjectId}/identify/step/1`}
                  className="flex items-center justify-between rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-4 text-sm font-semibold text-on-surface transition-colors hover:border-primary hover:bg-primary/5"
                >
                  Revisit diagnosis
                  <ChevronRight className="h-4 w-4 text-primary" />
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                Objective Meta
              </h3>
              <dl className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-4 rounded-2xl bg-surface-container-low px-4 py-3">
                  <dt className="text-sm text-on-surface-variant">Project</dt>
                  <dd className="text-sm font-semibold text-on-surface">{projectName}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-2xl bg-surface-container-low px-4 py-3">
                  <dt className="text-sm text-on-surface-variant">Generated</dt>
                  <dd className="text-sm font-semibold text-on-surface">{generatedAt}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-2xl bg-surface-container-low px-4 py-3">
                  <dt className="text-sm text-on-surface-variant">Objective ID</dt>
                  <dd className="max-w-[180px] truncate text-sm font-semibold text-on-surface">{String(params.id)}</dd>
                </div>
              </dl>
            </div>
          </aside>
        </section>
      </section>
    </div>
  );
}
