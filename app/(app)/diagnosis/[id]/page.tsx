import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppError } from '@/lib/errors';
import { requireUser } from '@/lib/auth/session';
import { getDiagnosis } from '@/lib/services/diagnoses';
import { getProject } from '@/lib/services/projects';
import { DiagnosisMonitor } from './_components/DiagnosisMonitor';
import { RetryDiagnosisButton } from './_components/RetryDiagnosisButton';
import { DiagnosisResultView } from './_components/DiagnosisResultView';

export default async function DiagnosisPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
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
    return <DiagnosisMonitor diagnosisId={params.id} projectName={projectName} />;
  }

  if (diagnosisStatus === 'failed') {
    return (
      <div className="px-4 py-6 md:px-6 lg:px-8">
        <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <div className="rounded-[28px] border border-error/30 bg-error-container/20 p-6 shadow-sm md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-error">Diagnosis failed</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-on-surface md:text-3xl">
              {projectName}
            </h1>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant md:text-base">
              {typeof diagnosisRecord.error_message === 'string' && diagnosisRecord.error_message
                ? diagnosisRecord.error_message
                : 'The diagnosis workflow did not complete successfully.'}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <RetryDiagnosisButton diagnosisId={params.id} />
              <Link
                href="/identify"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-outline-variant bg-white px-4 py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
              >
                Back to identify
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <DiagnosisResultView
      diagnosisId={params.id}
      diagnosis={diagnosisRecord}
      projectName={projectName}
      projectId={diagnosis.project_id}
    />
  );
}
