import Link from 'next/link';
import { ArrowUpRight, Megaphone, Plus, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { requireUser } from '@/lib/auth/session';
import { getDashboardOverview } from '@/lib/services/dashboard';
import { listProjects } from '@/lib/services/projects';
import { formatBusinessGoalLabel } from '@/types/wizard';

function toText(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

export default async function CampaignsPage() {
  const user = await requireUser();
  const [overview, projectsData] = await Promise.all([
    getDashboardOverview(user.id),
    listProjects(user.id, { page: 1, limit: 12 })
  ]);

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <PageHeader
          eyebrow="Campaigns"
          title="Campaign Hub"
          description="A high-level view of all project campaigns with quick links back to diagnosis and objective workflows."
          actions={[{ label: 'New Project', href: '/projects' }]}
        />

        <div className="rounded-[28px] border border-outline-variant bg-primary-container px-5 py-5 shadow-sm md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-primary-container/75">
                Campaign Control Room
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-on-primary-container">
                Keep every project moving by jumping from campaign overview into diagnose, define objective, and execute.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/45 px-3 py-1 text-xs font-semibold text-on-primary-container">
                {overview.activeProjectCount} active
              </span>
              <span className="rounded-full bg-white/45 px-3 py-1 text-xs font-semibold text-on-primary-container">
                {overview.completedDiagnoses} diagnosed
              </span>
              <span className="rounded-full bg-white/45 px-3 py-1 text-xs font-semibold text-on-primary-container">
                {overview.completedObjectives} objectives
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="Active Projects" value={String(overview.activeProjectCount)} delta="Campaigns in motion" icon={Megaphone} />
          <StatCard label="Completed Diagnoses" value={String(overview.completedDiagnoses)} delta="Ready for planning" icon={Sparkles} />
          <StatCard label="Completed Objectives" value={String(overview.completedObjectives)} delta="Execution anchors" icon={ArrowUpRight} />
        </div>

        {projectsData.items.length > 0 ? (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projectsData.items.map((project) => {
              const record = project as Record<string, unknown>;
              const projectId = String(record.id);
              const projectName = toText(record.name, 'Project');
              const goal = formatBusinessGoalLabel(record.main_business_goal);
              const stage = toText(record.website_stage, 'active');
              const step = typeof record.current_step === 'number' ? record.current_step : 1;

              return (
                <article key={projectId} className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">{goal}</p>
                  <h2 className="mt-2 text-xl font-semibold text-on-surface">{projectName}</h2>
                  <p className="mt-4 text-sm leading-6 text-on-surface-variant">
                    Campaign stage: {stage}. Current step: {step}. Use the links below to continue the workflow.
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-surface-container-low p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                        Step
                      </p>
                      <p className="mt-2 text-sm font-semibold text-on-surface">{step}</p>
                    </div>
                    <div className="rounded-2xl bg-surface-container-low p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                        Stage
                      </p>
                      <p className="mt-2 text-sm font-semibold text-on-surface">{stage}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <Link href={`/campaign/${projectId}`} className="text-sm font-semibold text-primary hover:underline">
                      Open campaign
                    </Link>
                    <div className="flex items-center gap-3">
                      <Link href={`/projects/${projectId}/identify/step/1`} className="text-sm font-semibold text-primary hover:underline">
                        Diagnose
                      </Link>
                      <Link href={`/projects/${projectId}/objective`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                        Objective
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <div className="rounded-[28px] border border-dashed border-outline-variant bg-surface-container-lowest p-8 text-center shadow-sm">
            <Plus className="mx-auto h-6 w-6 text-primary" />
            <h2 className="mt-3 text-xl font-semibold text-on-surface">No campaigns yet</h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Create a project first, then start the identify flow to populate the campaign timeline.
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
