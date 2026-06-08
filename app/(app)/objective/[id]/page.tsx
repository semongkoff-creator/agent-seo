import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { ArrowUpRight, CalendarRange, CheckCircle2, Clock3, Sparkles, Target } from 'lucide-react';
import { requireUser } from '@/lib/auth/session';
import { getDiagnosis } from '@/lib/services/diagnoses';
import { getObjective } from '@/lib/services/objectives';
import { getProject } from '@/lib/services/projects';
import { getLocaleFromValue, LOCALE_COOKIE, type Locale } from '@/lib/i18n';
import { formatWibDateTime } from '@/lib/time';
import { getTechnicalErrors } from '@/lib/mocks/technical-errors';
import { TechnicalPillar } from './pillars/TechnicalPillar';
import { ContentKeywordPillar } from './pillars/ContentKeywordPillar';
import { BusinessImpactPillar } from './pillars/BusinessImpactPillar';
import { formatLabel, toArray, toRecord, toText } from './pillars/utils';

type ObjectiveRecord = Record<string, unknown>;

const objectiveTypeLabels: Record<Locale, Record<string, string>> = {
  en: {
    technical_recovery: 'Technical Recovery',
    qualified_traffic: 'Qualified Traffic',
    authority_growth: 'Authority Growth',
    conversion_improvement: 'Conversion Improvement',
    foundation_building: 'Foundation Building',
    mixed: 'Mixed Objective'
  },
  id: {
    technical_recovery: 'Recovery Teknis',
    qualified_traffic: 'Traffic Tertarget',
    authority_growth: 'Growth Authority',
    conversion_improvement: 'Perbaikan Konversi',
    foundation_building: 'Bangun Fondasi',
    mixed: 'Objective Campuran'
  }
};

function objectiveTypeLabel(value: unknown, locale: Locale) {
  const label = toText(value, 'mixed');
  return objectiveTypeLabels[locale][label] ?? formatLabel(label);
}

function countFilled(values: Array<unknown>) {
  return values.filter((value) => {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value);
    }

    if (typeof value === 'boolean') {
      return true;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return Boolean(value);
  }).length;
}

function progressFromRatio(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return 100;
  }

  return Math.max(0, Math.min(100, Math.round((numerator / denominator) * 100)));
}

export default async function ObjectivePage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const locale = getLocaleFromValue(cookies().get(LOCALE_COOKIE)?.value);

  let objective: ObjectiveRecord;
  try {
    objective = (await getObjective(user.id, params.id)) as ObjectiveRecord;
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error && (error as { statusCode?: number }).statusCode === 404) {
      notFound();
    }

    throw error;
  }

  const projectId = String(objective.project_id);

  let project: ObjectiveRecord;
  let diagnosis: ObjectiveRecord | null = null;

  try {
    [project, diagnosis] = await Promise.all([
      getProject(user.id, projectId) as Promise<ObjectiveRecord>,
      objective.diagnosis_id
        ? getDiagnosis(user.id, String(objective.diagnosis_id))
            .then((result) => result as ObjectiveRecord)
            .catch((error) => {
              if (error instanceof Error && 'statusCode' in error && (error as { statusCode?: number }).statusCode === 404) {
                return null;
            }

            throw error;
          })
        : Promise.resolve(null),
    ]);
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error && (error as { statusCode?: number }).statusCode === 404) {
      notFound();
    }

    throw error;
  }

  const technicalErrors = await getTechnicalErrors(projectId);
  const projectName = toText(project.name, 'Project');
  const smartObjective = toText(
    objective.smart_objective,
    locale === 'id'
      ? 'Objective akan tampil setelah hasil final tersimpan.'
      : 'The objective will appear once the final output is stored.'
  );
  const objectiveType = objectiveTypeLabel(objective.objective_type, locale);
  const status = toText(objective.status, 'pending');
  const createdAt = toText(objective.completed_at ?? objective.created_at, 'Recently');
  const generatedAt = formatWibDateTime(createdAt);
  const objectiveTarget = toRecord(objective.target);
  const objectiveOutput = toRecord(objective.output_metrics);
  const objectiveInput = toRecord(objective.input_metrics);
  const businessGoal = toRecord(objectiveInput.business_goal);
  const riskNotes = toArray(objective.risk_notes).slice(0, 3);

  const technicalProgress = progressFromRatio(
    technicalErrors.filter((error) => error.status === 'fixed').length,
    technicalErrors.length
  );
  const contentProgress = progressFromRatio(
    countFilled([
      smartObjective,
      objectiveOutput.action_items,
      objectiveOutput.target_metrics,
      objectiveOutput.keywords,
      objectiveOutput.content_plan
    ]),
    5
  );
  const businessProgress = progressFromRatio(
    countFilled([
      businessGoal.business_target_value,
      objectiveTarget,
      objectiveOutput.roi_estimate,
      objective.achievability_percent
    ]),
    4
  );
  const overallProgress = Math.round((technicalProgress + contentProgress + businessProgress) / 3);

  const diagnosisHref = diagnosis && typeof diagnosis.id === 'string' ? `/diagnosis/${diagnosis.id}` : '/diagnosis';

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="rounded-[32px] border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-4xl space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {objectiveType}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  {status}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant">
                  <CalendarRange className="h-3.5 w-3.5 text-primary" />
                  {generatedAt}
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-primary">
                  {locale === 'id' ? 'Objective' : 'Objective'}
                </p>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-on-surface md:text-3xl lg:text-4xl">
                  {projectName}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant md:text-base">{smartObjective}</p>
              </div>

              <div className="space-y-3 rounded-[24px] border border-outline-variant bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm font-semibold text-on-surface">
                    {locale === 'id' ? 'Overall progress' : 'Overall progress'}
                  </p>
                  <p className="text-sm font-semibold text-on-surface">{overallProgress}%</p>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-surface-container">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${overallProgress}%` }} />
                </div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <div className="rounded-2xl bg-surface-container-low px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                      {locale === 'id' ? 'Technical' : 'Technical'}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-on-surface">{technicalProgress}%</p>
                  </div>
                  <div className="rounded-2xl bg-surface-container-low px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                      {locale === 'id' ? 'Content' : 'Content'}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-on-surface">{contentProgress}%</p>
                  </div>
                  <div className="rounded-2xl bg-surface-container-low px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                      {locale === 'id' ? 'Business' : 'Business'}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-on-surface">{businessProgress}%</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-[28px] border border-outline-variant bg-white p-5 shadow-sm lg:min-w-[320px]">
              <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
                <Clock3 className="h-4 w-4 text-primary" />
                {locale === 'id' ? 'Snapshot' : 'Snapshot'}
              </div>
              <p className="text-sm leading-6 text-on-surface-variant">
                {locale === 'id'
                  ? 'Gunakan objective ini sebagai rencana kerja yang langsung bisa dieksekusi.'
                  : 'Use this objective as an execution-ready working plan.'}
              </p>
              <Link
                href={diagnosisHref as any}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary transition-transform hover:-translate-y-0.5"
              >
                {locale === 'id' ? 'Buka Diagnosis' : 'Open Diagnosis'}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                  {locale === 'id' ? 'Diagnosis reference' : 'Diagnosis reference'}
                </p>
                <p className="mt-2 text-sm leading-6 text-on-surface">
                  {diagnosis
                    ? toText(diagnosis.diagnosis_summary, locale === 'id' ? 'Belum ada ringkasan diagnosis.' : 'No diagnosis summary available yet.')
                    : locale === 'id'
                      ? 'Diagnosis belum terhubung.'
                      : 'No diagnosis is linked to this objective yet.'}
                </p>
              </div>
              <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                  {locale === 'id' ? 'Generated at' : 'Generated at'}
                </p>
                <p className="mt-2 text-sm font-semibold text-on-surface">{generatedAt}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <TechnicalPillar
            projectId={projectId}
            diagnosisId={diagnosis && typeof diagnosis.id === 'string' ? diagnosis.id : null}
            initialErrors={technicalErrors}
            locale={locale}
          />
          <ContentKeywordPillar objective={objective} locale={locale} />
          <BusinessImpactPillar objective={objective} locale={locale} />
        </div>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-5 shadow-sm md:p-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold text-on-surface">
                {locale === 'id' ? 'Ringkasan meta' : 'Meta summary'}
              </h2>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-outline-variant bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                  {locale === 'id' ? 'Project' : 'Project'}
                </p>
                <p className="mt-2 text-sm font-semibold text-on-surface">{projectName}</p>
              </div>
              <div className="rounded-2xl border border-outline-variant bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                  {locale === 'id' ? 'Objective ID' : 'Objective ID'}
                </p>
                <p className="mt-2 truncate text-sm font-semibold text-on-surface">{String(params.id)}</p>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-outline-variant bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <h3 className="text-lg font-semibold text-on-surface">
                  {locale === 'id' ? 'Quick Actions' : 'Quick Actions'}
                </h3>
              </div>

              <div className="mt-4 space-y-3">
                <Link
                  href={diagnosisHref as any}
                  className="flex items-center justify-between rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-4 text-sm font-semibold text-on-surface transition-colors hover:border-primary hover:bg-primary/5"
                >
                  {locale === 'id' ? 'Lihat diagnosis' : 'View diagnosis'}
                  <ArrowUpRight className="h-4 w-4 text-primary" />
                </Link>
                <Link
                  href={`/projects/${projectId}/objective` as any}
                  className="flex items-center justify-between rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-4 text-sm font-semibold text-on-surface transition-colors hover:border-primary hover:bg-primary/5"
                >
                  {locale === 'id' ? 'Regenerate objective' : 'Regenerate objective'}
                  <ArrowUpRight className="h-4 w-4 text-primary" />
                </Link>
                <Link
                  href={`/campaign/${projectId}` as any}
                  className="flex items-center justify-between rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-4 text-sm font-semibold text-on-surface transition-colors hover:border-primary hover:bg-primary/5"
                >
                  {locale === 'id' ? 'Buka campaign board' : 'Open campaign board'}
                  <ArrowUpRight className="h-4 w-4 text-primary" />
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                {locale === 'id' ? 'Risk Notes' : 'Risk Notes'}
              </h3>
              {riskNotes.length > 0 ? (
                <ul className="mt-4 space-y-2 text-sm leading-6 text-on-surface-variant">
                  {riskNotes.map((note, index) => (
                    <li key={`${String(note)}-${index}`} className="rounded-2xl border border-outline-variant bg-white px-4 py-3">
                      {String(note)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 rounded-2xl border border-dashed border-outline-variant bg-surface-container-low px-4 py-5 text-sm text-on-surface-variant">
                  {locale === 'id'
                    ? 'Belum ada risk notes eksplisit untuk objective ini.'
                    : 'No explicit risk notes were recorded for this objective.'}
                </p>
              )}
            </div>

            <div className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
                <CalendarRange className="h-4 w-4 text-primary" />
                {locale === 'id' ? 'Objective Meta' : 'Objective Meta'}
              </div>
              <dl className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-4 rounded-2xl bg-surface-container-low px-4 py-3">
                  <dt className="text-sm text-on-surface-variant">{locale === 'id' ? 'Type' : 'Type'}</dt>
                  <dd className="text-sm font-semibold text-on-surface">{objectiveType}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-2xl bg-surface-container-low px-4 py-3">
                  <dt className="text-sm text-on-surface-variant">{locale === 'id' ? 'Status' : 'Status'}</dt>
                  <dd className="text-sm font-semibold text-on-surface">{status}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-2xl bg-surface-container-low px-4 py-3">
                  <dt className="text-sm text-on-surface-variant">{locale === 'id' ? 'Project' : 'Project'}</dt>
                  <dd className="max-w-[180px] truncate text-sm font-semibold text-on-surface">{projectName}</dd>
                </div>
              </dl>
            </div>
          </aside>
        </section>
      </section>
    </div>
  );
}
