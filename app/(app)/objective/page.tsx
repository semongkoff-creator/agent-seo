import Link from 'next/link';
import { ArrowUpRight, CheckCircle2, Target, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { requireUser } from '@/lib/auth/session';
import { listObjectives } from '@/lib/services/objectives';
import { listProjects } from '@/lib/services/projects';

function toText(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

export default async function ObjectivesPage() {
  const user = await requireUser();
  const [objectivesData, projectsData] = await Promise.all([
    listObjectives(user.id, { page: 1, limit: 12 }),
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

  const totalObjectives = objectivesData.total;
  const completedObjectives = objectivesData.items.filter(
    (item) => toText((item as Record<string, unknown>).status, '') === 'completed'
  ).length;
  const inProgressObjectives = objectivesData.items.filter(
    (item) => toText((item as Record<string, unknown>).status, '') !== 'completed'
  ).length;

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <PageHeader
          eyebrow="Objectives"
          title="Objective Library"
          description="Review the generated SMART objectives, jump back into the builder, or open the related campaign."
          actions={[{ label: 'Define Objective', href: '/projects' }]}
        />

        <div className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Execution Anchor</p>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">
                Generated objectives are your bridge between diagnosis and campaign execution. Open one to inspect the
                SMART wording, baseline, and target definitions in full.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-semibold text-on-primary-fixed-variant">
                {totalObjectives} total
              </span>
              <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant">
                {completedObjectives} ready
              </span>
              <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant">
                {inProgressObjectives} in progress
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="Total Objectives" value={String(totalObjectives)} delta="Generated records" icon={Target} />
          <StatCard label="Completed" value={String(completedObjectives)} delta="Ready to use" icon={CheckCircle2} />
          <StatCard label="In Progress" value={String(inProgressObjectives)} delta="Needs attention" icon={TrendingUp} />
        </div>

        {objectivesData.items.length > 0 ? (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {objectivesData.items.map((objective) => {
              const record = objective as Record<string, unknown>;
              const id = String(record.id);
              const projectId = String(record.project_id ?? '');
              const projectName = projectMap.get(projectId) ?? (projectId || 'Project');
              const status = toText(record.status, 'pending');
              const objectiveType = toText(record.objective_type, 'mixed').replace(/_/g, ' ');
              const smartObjective = toText(
                record.smart_objective,
                'The SMART objective will appear here once the generation workflow completes.'
              );
              const generatedAt = toText(record.completed_at ?? record.created_at, 'Recently');
              const generatedLabel = generatedAt ? new Date(generatedAt).toLocaleDateString() : 'Recently';

              return (
                <article key={id} className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">{projectName}</p>
                  <h2 className="mt-2 text-xl font-semibold text-on-surface">{objectiveType}</h2>
              <p className="mt-4 text-sm leading-6 text-on-surface-variant">{smartObjective}</p>

                  <div className="mt-4 rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                          Linked Project
                        </p>
                        <p className="mt-1 text-sm font-semibold text-on-surface">{projectName}</p>
                      </div>
                      <TrendingUp className="h-4 w-4 text-primary" />
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
                      <p className="mt-2 text-sm font-semibold text-on-surface">{generatedLabel}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <Link href={`/objective/${id}`} className="text-sm font-semibold text-primary hover:underline">
                      Open objective
                    </Link>
                    <Link href={`/campaign/${projectId}`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                      Campaign
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <div className="rounded-[28px] border border-dashed border-outline-variant bg-surface-container-lowest p-8 text-center shadow-sm">
            <Target className="mx-auto h-6 w-6 text-primary" />
            <h2 className="mt-3 text-xl font-semibold text-on-surface">No objectives yet</h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Run a diagnosis and then open the project objective builder to generate the first SMART objective.
            </p>
            <Link
              href="/projects"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary"
            >
              Open projects
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
