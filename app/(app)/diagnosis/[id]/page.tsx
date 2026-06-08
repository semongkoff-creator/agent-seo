import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { AppError } from '@/lib/errors';
import { requireUser } from '@/lib/auth/session';
import { getDiagnosis } from '@/lib/services/diagnoses';
import { getProject } from '@/lib/services/projects';
import { getAppCopy, getLocaleFromValue, LOCALE_COOKIE } from '@/lib/i18n';
import { getGA4MockData } from '@/lib/mocks/ga4';
import { getTechnicalErrors } from '@/lib/mocks/technical-errors';
import { buildAIVisibilityRows } from '@/lib/mocks/ai-visibility';
import { buildKeywordPositions } from '@/lib/mocks/gsc-keywords';
import { buildKeywordOwning } from '@/lib/mocks/keyword-owning';
import { DiagnosisMonitor } from './_components/DiagnosisMonitor';
import { RetryDiagnosisButton } from './_components/RetryDiagnosisButton';
import { DiagnosisDashboard } from './_components/DiagnosisDashboard';
import type { DiagnosisDashboardData } from '@/types/diagnosis';

export default async function DiagnosisPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const locale = getLocaleFromValue(cookies().get(LOCALE_COOKIE)?.value);
  const copy = getAppCopy(locale).diagnosis;

  let diagnosis;
  try {
    diagnosis = await getDiagnosis(user.id, params.id);
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 404) {
      notFound();
    }

    throw error;
  }

  let project;
  try {
    project = await getProject(user.id, diagnosis.project_id);
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 404) {
      notFound();
    }

    throw error;
  }

  const diagnosisRecord = diagnosis as Record<string, unknown>;
  const projectRecord = project as Record<string, unknown>;
  const projectName = typeof projectRecord.name === 'string' && projectRecord.name ? projectRecord.name : 'Unknown Project';
  const diagnosisStatus = typeof diagnosisRecord.status === 'string' ? diagnosisRecord.status : 'completed';

  if (diagnosisStatus === 'pending' || diagnosisStatus === 'processing') {
    return <DiagnosisMonitor diagnosisId={params.id} projectName={projectName} locale={locale} />;
  }

  if (diagnosisStatus === 'failed') {
    return (
      <div className="px-4 py-6 md:px-6 lg:px-8">
        <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <div className="rounded-[28px] border border-error/30 bg-error-container/20 p-6 shadow-sm md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-error">{copy.failedTitle}</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-on-surface md:text-3xl">{projectName}</h1>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant md:text-base">
              {typeof diagnosisRecord.error_message === 'string' && diagnosisRecord.error_message
                ? diagnosisRecord.error_message
                : locale === 'id'
                  ? 'Workflow diagnosis tidak selesai dengan sukses.'
                  : 'The diagnosis workflow did not complete successfully.'}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <RetryDiagnosisButton diagnosisId={params.id} />
              <Link
                href="/identify"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-outline-variant bg-white px-4 py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
              >
                {copy.backToIdentify}
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const [technicalErrors, gscKeywords, aiVisibility, ga4] = await Promise.all([
    getTechnicalErrors(project.id),
    Promise.resolve(buildKeywordPositions(project.id)),
    Promise.resolve(buildAIVisibilityRows(project.id)),
    getGA4MockData(project.id),
  ]);

  const dashboardData: DiagnosisDashboardData = {
    technicalErrors,
    keywordPositions: gscKeywords,
    aiVisibility,
    ga4: {
      ...ga4,
      bounceRate: ga4.bounceRate ?? 41,
      conversionRate: ga4.conversionRate ?? 2.4
    },
    keywordOwning: buildKeywordOwning(gscKeywords)
  };

  return (
    <DiagnosisDashboard
      diagnosisId={params.id}
      diagnosis={diagnosisRecord}
      projectId={project.id}
      projectName={projectName}
      locale={locale}
      data={dashboardData}
    />
  );
}
