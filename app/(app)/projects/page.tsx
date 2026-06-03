import Link from 'next/link';
import { ArrowUpRight, LayoutGrid, ShieldCheck, Sparkles, FolderKanban, Target, Activity } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { CreateProjectModal } from './_components/CreateProjectModal';
import { requireUser } from '@/lib/auth/session';
import { getDashboardOverview } from '@/lib/services/dashboard';
import { listProjects } from '@/lib/services/projects';
import { formatWibDate } from '@/lib/time';

function formatProjectUrl(record: Record<string, unknown>) {
  return typeof record.website_url === 'string' && record.website_url ? record.website_url : 'Website not provided';
}

export default async function ProjectsPage() {
  const user = await requireUser();
  const [overview, projectsData] = await Promise.all([
    getDashboardOverview(user.id),
    listProjects(user.id, { page: 1, limit: 12 })
  ]);

  const usage = [
    { label: 'Audit quota used', value: `${projectsData.items.length} / 25` },
    { label: 'Diagnosis runs', value: String(overview.completedDiagnoses) },
    { label: 'Objectives generated', value: String(overview.completedObjectives) }
  ] as const;

  const activeProjects = projectsData.items.filter((project) => {
    const record = project as Record<string, unknown>;
    return typeof record.status !== 'string' || record.status !== 'archived';
  }).length;

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <PageHeader
          eyebrow="Projects"
          title="Active Projects"
          description="Manage and monitor each connected domain from one central place. Every project can jump into Identify, Objective, or Campaign in one click."
          actions={[{ label: 'Open Identify Hub', href: '/identify' }]}
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Health Average
              </div>
              <p className="mt-3 text-2xl font-semibold text-on-surface">
                {Math.max(0, 100 - overview.activeProjectCount * 3).toFixed(0)}%
              </p>
            </div>
            <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                <FolderKanban className="h-4 w-4 text-primary" />
                Projects Monitored
              </div>
              <p className="mt-3 text-2xl font-semibold text-on-surface">{projectsData.items.length}</p>
            </div>
            <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                <Activity className="h-4 w-4 text-primary" />
                Active Projects
              </div>
              <p className="mt-3 text-2xl font-semibold text-on-surface">{activeProjects}</p>
            </div>
          </div>
        </PageHeader>

        <div id="new-project" className="grid scroll-mt-24 grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-5 shadow-sm md:p-6">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold text-on-surface">Create a new project</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Open the modal, fill the brief, and we&apos;ll jump straight into Identify without leaving this page.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <CreateProjectModal />
              <Link href="/identify" className="text-sm font-semibold text-primary hover:underline">
                Open Identify hub
              </Link>
            </div>
            <div className="mt-5 rounded-2xl bg-surface-container-low p-4 text-sm leading-6 text-on-surface-variant">
              n8n will orchestrate the workflow after the project is created, so this step only captures the brief and
              hands it off cleanly.
            </div>
          </div>
          <div className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">Quick stats</p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {usage.map((item) => (
                <div key={item.label} className="rounded-xl bg-surface-container-low p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
                    {item.label}
                  </p>
                  <p className="mt-2 text-base font-semibold text-on-surface">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {projectsData.items.length > 0
            ? projectsData.items.map((project) => {
                const record = project as Record<string, unknown>;
                const name = typeof record.name === 'string' && record.name ? record.name : 'Unnamed Project';
                const url = formatProjectUrl(record);
                const status = typeof record.status === 'string' ? record.status : 'active';
                const currentStep = typeof record.current_step === 'number' ? record.current_step : 1;
                const updatedAt = typeof record.updated_at === 'string' ? formatWibDate(record.updated_at) : 'Recently';
                const keywords =
                  typeof record.main_business_goal === 'string' ? record.main_business_goal : 'SEO coverage';
                const projectId = String(record.id);
                const stage = typeof record.website_stage === 'string' ? record.website_stage : 'active';

                return (
                  <article key={projectId} className="rounded-[28px] border border-outline-variant bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                          {status}
                        </p>
                        <h2 className="mt-2 text-xl font-semibold text-on-surface">{name}</h2>
                        <p className="mt-1 text-sm text-on-surface-variant">{url}</p>
                      </div>
                      <span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-semibold text-on-primary-fixed-variant">
                        Step {currentStep}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant">
                        {stage}
                      </span>
                      <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant">
                        {keywords}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-3 border-y border-outline-variant/30 py-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Health</p>
                        <p className="mt-2 text-lg font-semibold text-primary">{Math.max(60, 100 - currentStep * 6)}%</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Last audit</p>
                        <p className="mt-2 text-sm font-medium text-on-surface">{updatedAt}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Keywords</p>
                        <p className="mt-2 text-sm font-medium text-on-surface">{keywords}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-end gap-4">
                      <Link href={`/projects/${projectId}/identify/step/1`} className="text-sm font-semibold text-primary hover:underline">
                        Start identify
                      </Link>
                      <Link href={`/projects/${projectId}/objective`} className="text-sm font-semibold text-primary hover:underline">
                        Open objective
                      </Link>
                      <Link href={`/campaign/${projectId}`} className="text-sm font-semibold text-primary hover:underline">
                        View report
                      </Link>
                      <ArrowUpRight className="h-4 w-4 text-primary" />
                    </div>
                  </article>
                );
              })
            : null}
        </section>
      </section>
    </div>
  );
}
