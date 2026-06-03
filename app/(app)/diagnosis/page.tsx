import Link from 'next/link';
import { ArrowUpRight, Brain, Clock3, RefreshCcw, ShieldAlert, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { StatCard } from '@/components/ui/stat-card';
import { requireUser } from '@/lib/auth/session';
import { listDiagnoses } from '@/lib/services/diagnoses';
import { listProjects } from '@/lib/services/projects';

function toText(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function toArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

export default async function DiagnosesPage() {
  const user = await requireUser();
  const [diagnosesData, projectsData] = await Promise.all([
    listDiagnoses(user.id, { page: 1, limit: 12 }),
    listProjects(user.id, { page: 1, limit: 50 })
  ]);

  const projectMap = new Map<string, string>();
  for (const project of projectsData.items) {
    const record = project as Record<string, unknown>;
    const projectId = typeof record.id === 'string' ? record.id : '';
    const projectName = toText(record.name, 'Project');
    if (projectId) {
      projectMap.set(projectId, projectName);
    }
  }

  const diagnoses = diagnosesData.items;
  const totalDiagnoses = diagnosesData.total;
  const completedDiagnoses = diagnoses.filter((item) => toText((item as Record<string, unknown>).status, '') === 'completed').length;
  const latestCount = diagnoses.filter((item) => {
    const record = item as Record<string, unknown>;
    return toArray(record.evidence).length > 0;
  }).length;

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <PageHeader
          eyebrow="Diagnoses"
          title="Diagnosis Library"
          description="A single place to review the latest findings, retrigger a project, or jump back into identify mode."
          actions={[{ label: 'New Diagnosis', href: '/identify' }]}
        />

        <div className="rounded-[28px] border border-primary/20 bg-primary-container px-5 py-5 shadow-sm md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-primary-container/75">
                Live Diagnosis Hub
              </p>
              <p className="mt-2 text-base leading-6 text-on-primary-container">
                Review what the system has already found, then jump straight back into the project that needs attention.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/45 px-3 py-1 text-xs font-semibold text-on-primary-container">
                {totalDiagnoses} records
              </span>
              <span className="rounded-full bg-white/45 px-3 py-1 text-xs font-semibold text-on-primary-container">
                {completedDiagnoses} completed
              </span>
              <span className="rounded-full bg-white/45 px-3 py-1 text-xs font-semibold text-on-primary-container">
                {latestCount} with evidence
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="Total Diagnoses" value={String(totalDiagnoses)} delta="Across all projects" icon={Brain} />
          <StatCard label="Completed" value={String(completedDiagnoses)} delta="Ready for objective" icon={Sparkles} />
          <StatCard label="With Evidence" value={String(latestCount)} delta="Recent signal rich runs" icon={ShieldAlert} />
        </div>

        {diagnoses.length > 0 ? (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {diagnoses.map((diagnosis) => {
              const record = diagnosis as Record<string, unknown>;
              const id = String(record.id);
              const projectId = String(record.project_id ?? '');
              const projectName = projectMap.get(projectId) ?? (projectId || 'Project');
              const summary = toText(
                record.diagnosis_summary,
                'The diagnosis summary will appear once the workflow returns its structured result.'
              );
              const severity = toText(record.severity, 'medium').toLowerCase() as 'low' | 'medium' | 'high' | 'critical';
              const status = toText(record.status, 'pending');
              const createdAt = toText(record.completed_at ?? record.created_at, 'Recently');
              const createdLabel = createdAt ? new Date(createdAt).toLocaleDateString() : 'Recently';

              return (
                <article key={id} className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                        {projectName}
                      </p>
                      <h2 className="mt-2 text-xl font-semibold text-on-surface">
                        {toText(record.primary_problem_type, 'Mixed').replace(/_/g, ' ')}
                      </h2>
                    </div>
                    <SeverityBadge severity={severity} label={toText(record.severity, 'medium')} />
                  </div>

                  <p className="mt-4 text-sm leading-6 text-on-surface-variant">{summary}</p>

                  <div className="mt-4 rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                          Linked Project
                        </p>
                        <p className="mt-1 text-sm font-semibold text-on-surface">{projectName}</p>
                      </div>
                      <Clock3 className="h-4 w-4 text-primary" />
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-surface-container-low p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                        Status
                      </p>
                      <p className="mt-2 text-sm font-semibold text-on-surface">{status}</p>
                    </div>
                    <div className="rounded-2xl bg-surface-container-low p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                        Date
                      </p>
                      <p className="mt-2 text-sm font-semibold text-on-surface">{createdLabel}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <Link href={`/diagnosis/${id}`} className="text-sm font-semibold text-primary hover:underline">
                      Open diagnosis
                    </Link>
                    <Link href={`/projects/${projectId}/identify/step/1`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                      Rerun
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <div className="rounded-[28px] border border-dashed border-outline-variant bg-surface-container-lowest p-8 text-center shadow-sm">
            <RefreshCcw className="mx-auto h-6 w-6 text-primary" />
            <h2 className="mt-3 text-xl font-semibold text-on-surface">No diagnoses yet</h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Start from Identify to generate the first diagnostic pass for your projects.
            </p>
            <Link
              href="/identify"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary"
            >
              Start identify
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
