import Link from 'next/link';
import { cookies } from 'next/headers';
import {
  ArrowUpRight,
  BarChart3,
  Activity,
  Brain,
  ChevronRight,
  Clock3,
  FolderPlus,
  Route,
  Sparkles,
  Target,
  TriangleAlert
} from 'lucide-react';
import { HorizontalScrollSnap } from '@/components/ui/horizontal-scroll-snap';
import { PageHeader } from '@/components/ui/page-header';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { StatCard } from '@/components/ui/stat-card';
import { requireUser } from '@/lib/auth/session';
import { getAppCopy, getLocaleFromValue, LOCALE_COOKIE } from '@/lib/i18n';
import { getDashboardOverview, listDashboardInsights } from '@/lib/services/dashboard';
import { listDiagnoses } from '@/lib/services/diagnoses';
import { listProjects } from '@/lib/services/projects';
import { formatWibDateTime } from '@/lib/time';

type ProjectRowData = {
  id: string;
  name: string;
  industry: string;
  visibility: string;
  score: number;
  trend: string;
};

type DiagnosisRowData = {
  id: string;
  project: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
};

type InsightRowData = {
  title: string;
  body: string;
  action: string;
  href: string;
};

type WorkflowStep = {
  title: string;
  body: string;
  action: string;
  href: string;
  icon: typeof FolderPlus;
};

type ActivityRow = {
  event_type?: string | null;
  created_at?: string | null;
};

const workflowSteps: WorkflowStep[] = [
  {
    title: 'Set up a project',
    body: 'Capture the domain, audience, and business context so n8n has a clean starting point.',
    action: 'Open project setup',
    href: '/projects#new-project',
    icon: FolderPlus
  },
  {
    title: 'Run identify',
    body: 'Send the brief to n8n to generate the first diagnosis and collect the signal set.',
    action: 'Open identify flow',
    href: '/identify',
    icon: Route
  },
  {
    title: 'Define an objective',
    body: 'Turn the diagnosis into a SMART objective once the problem statement is clear.',
    action: 'Open objective builder',
    href: '/objective',
    icon: Sparkles
  }
];

const activityLabels: Record<string, string> = {
  project_created: 'Project created',
  diagnosis_run: 'Diagnosis run',
  objective_generated: 'Objective generated',
  api_request: 'API request'
};

function getNextAction(projectCount: number, diagnosisCount: number, objectiveCount: number) {
  if (projectCount === 0) {
    return {
      title: 'Create your first project',
      body: 'Capture the domain and business goal first, then hand the brief over to n8n.',
      action: 'New project',
      href: '/projects#new-project'
    };
  }

  if (diagnosisCount === 0) {
    return {
      title: 'Run the identify workflow',
      body: 'Let n8n analyze the brief and return the first diagnosis signal set.',
      action: 'Start identify',
      href: '/identify'
    };
  }

  if (objectiveCount === 0) {
    return {
      title: 'Define a smart objective',
      body: 'Turn the latest diagnosis into a clear objective with measurable outcomes.',
      action: 'Open objective',
      href: '/objective'
    };
  }

  return {
    title: 'Review live projects',
    body: 'The workflow is already moving. Open projects to refine the next campaign steps.',
    action: 'Open projects',
    href: '/projects'
  };
}

function Sparkline() {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 36" className="h-9 w-28">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
        points="2,28 18,24 32,18 48,20 64,12 80,14 96,8 118,10"
      />
    </svg>
  );
}

function ProjectRow({ project }: { project: ProjectRowData }) {
  return (
    <Link
      href={`/projects/${project.id}` as any}
      className="block rounded-2xl border border-outline-variant bg-white p-4 transition-transform hover:-translate-y-0.5 md:p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-on-surface">{project.name}</p>
          <p className="mt-1 text-sm text-on-surface-variant">{project.industry}</p>
        </div>
        <span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-semibold text-on-primary-fixed-variant">
          {project.trend}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-surface-container-low p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">Visibility</p>
          <p className="mt-2 text-lg font-semibold text-on-surface">{project.visibility}</p>
        </div>
        <div className="rounded-xl bg-surface-container-low p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">Authority Score</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container-high">
              <div className="h-full rounded-full bg-primary" style={{ width: `${project.score}%` }} />
            </div>
            <p className="text-lg font-semibold text-on-surface">{project.score}</p>
          </div>
        </div>
        <div className="rounded-xl bg-surface-container-low p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">Trend</p>
          <div className="mt-1 text-primary">
            <Sparkline />
          </div>
        </div>
      </div>
    </Link>
  );
}

function DiagnosisCard({ diagnosis }: { diagnosis: DiagnosisRowData }) {
  return (
    <Link
      href={`/diagnosis/${diagnosis.id}` as any}
      className="snap-start rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm transition-transform hover:-translate-y-0.5 md:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">{diagnosis.project}</p>
          <h3 className="mt-2 text-lg font-semibold text-on-surface">{diagnosis.title}</h3>
        </div>
        <SeverityBadge severity={diagnosis.severity} label={diagnosis.severity} />
      </div>
      <p className="mt-3 text-sm leading-6 text-on-surface-variant">{diagnosis.summary}</p>
      <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
        View diagnosis
        <ArrowUpRight className="h-4 w-4" />
      </div>
    </Link>
  );
}

function InsightCard({ insight }: { insight: InsightRowData }) {
  return (
    <Link
      href={insight.href as any}
      className="rounded-2xl border border-outline-variant bg-primary-container p-5 text-on-primary-container shadow-sm"
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-on-primary-container/80">
        <Brain className="h-4 w-4" />
        AI Insight
      </div>
      <h3 className="mt-3 text-lg font-semibold">{insight.title}</h3>
      <p className="mt-3 text-sm leading-6 text-on-primary-container/90">{insight.body}</p>
      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold">
        {insight.action}
        <ChevronRight className="h-4 w-4" />
      </div>
    </Link>
  );
}

function WorkflowCard({ step }: { step: WorkflowStep }) {
  const Icon = step.icon;

  return (
    <Link
      href={step.href as any}
      className="rounded-2xl border border-outline-variant bg-surface-container-low p-4 transition-transform hover:-translate-y-0.5"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary-container p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-on-surface-variant">Step</p>
          <h3 className="mt-1 text-lg font-semibold text-on-surface">{step.title}</h3>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-on-surface-variant">{step.body}</p>
      <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
        {step.action}
        <ArrowUpRight className="h-4 w-4" />
      </div>
    </Link>
  );
}

function mapInsights(source: Awaited<ReturnType<typeof listDashboardInsights>>['items']): InsightRowData[] {
  return source.map((item, index) => {
    const record = item as Record<string, unknown>;
    const title = typeof record.title === 'string' && record.title ? record.title : `Insight ${index + 1}`;
    const body = typeof record.body === 'string' && record.body ? record.body : 'AI-generated insight available.';
    const action = typeof record.action_label === 'string' && record.action_label ? record.action_label : 'Open insight';
    const href = typeof record.action_url === 'string' && record.action_url ? record.action_url : '/projects';

    return { title, body, action, href };
  });
}

function mapProjectRows(source: Awaited<ReturnType<typeof listProjects>>['items']): ProjectRowData[] {
  return source.map((project, index) => {
    const record = project as Record<string, unknown>;
    const id = String(record.id ?? '');
    const name = typeof record.name === 'string' && record.name ? record.name : `Project ${index + 1}`;
    const industry = typeof record.industry === 'string' && record.industry ? record.industry : 'Uncategorized';
    const goal = typeof record.main_business_goal === 'string' ? record.main_business_goal : 'n/a';
    const status = typeof record.status === 'string' ? record.status : 'active';
    const currentStep = typeof record.current_step === 'number' ? record.current_step : index + 1;

    return {
      id,
      name,
      industry,
      visibility: `${goal} - step ${currentStep}`,
      score: status === 'active' ? 76 + Math.min(10, index * 3) : 58 + Math.min(10, index * 2),
      trend: status === 'active' ? 'Recently updated' : 'Archived'
    };
  });
}

function mapDiagnoses(source: Awaited<ReturnType<typeof listDiagnoses>>['items']): DiagnosisRowData[] {
  return source.map((item, index) => {
    const record = item as Record<string, unknown>;
    const id = String(record.id ?? '');
    const project = typeof record.project_name === 'string' && record.project_name ? record.project_name : `Project ${index + 1}`;
    const title = typeof record.primary_problem_type === 'string' && record.primary_problem_type
      ? record.primary_problem_type.replace(/_/g, ' ')
      : 'Diagnosis';
    const summary = typeof record.diagnosis_summary === 'string' && record.diagnosis_summary
      ? record.diagnosis_summary
      : 'Diagnosis summary will appear after n8n stores the result in Supabase.';
    const severity =
      typeof record.severity === 'string' && ['low', 'medium', 'high', 'critical'].includes(record.severity)
        ? (record.severity as DiagnosisRowData['severity'])
        : 'medium';

    return { id, project, title, summary, severity };
  });
}

function mapActivityCounts(source: ActivityRow[]) {
  const counts = Object.entries(activityLabels).map(([eventType, label]) => {
    const count = source.filter((item) => item.event_type === eventType).length;
    return { label, count };
  });

  const latest = source[0]?.created_at ?? null;

  return { counts, latest };
}

function EmptyState({
  title,
  body,
  actionLabel,
  href
}: {
  title: string;
  body: string;
  actionLabel: string;
  href: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low p-6">
      <h3 className="text-lg font-semibold text-on-surface">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">{body}</p>
      <Link href={href as any} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
        {actionLabel}
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const locale = getLocaleFromValue(cookies().get(LOCALE_COOKIE)?.value);
  const copy = getAppCopy(locale);
  const dashboardCopy = copy.dashboard;
  const overview = await getDashboardOverview(user.id);
  const projectData = await listProjects(user.id, { page: 1, limit: 3 });
  const diagnosisData = await listDiagnoses(user.id, { page: 1, limit: 3 });
  const insightData = await listDashboardInsights(user.id);

  const metrics = [
    {
      label: 'Aggregate Health',
      value: `${Math.max(0, 100 - overview.activeProjectCount * 3.4).toFixed(1)}%`,
      delta: `+${overview.completedObjectives} objectives`,
      tone: 'text-primary',
      icon: BarChart3
    },
    {
      label: 'Active Alerts',
      value: String(Math.max(0, overview.projectCount - overview.completedDiagnoses)),
      delta: `${overview.completedDiagnoses} diagnoses`,
      tone: 'text-error',
      icon: TriangleAlert
    },
    {
      label: 'Goals In Motion',
      value: String(overview.completedObjectives),
      delta: `${overview.activeProjectCount} active projects`,
      tone: 'text-secondary',
      icon: Target
    }
  ] as const;

  const projectRows = mapProjectRows(projectData.items);
  const diagnosisRows = mapDiagnoses(diagnosisData.items);
  const insights = mapInsights(insightData.items);
  const activityData = mapActivityCounts(overview.recentEvents as ActivityRow[]);
  const nextAction = getNextAction(overview.projectCount, overview.completedDiagnoses, overview.completedObjectives);
  const activeProjectSummary =
    projectRows[0]?.name ?? (overview.projectCount > 0 ? 'Workspace active' : 'Workspace waiting');
  const latestDiagnosisSummary =
    diagnosisRows[0]?.title ?? (overview.completedDiagnoses > 0 ? 'Latest diagnosis available' : 'No diagnosis yet');

  return (
    <div className="relative overflow-hidden px-4 py-6 md:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top_left,_rgba(78,70,229,0.18),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.12),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.8),_rgba(255,255,255,0))]"
      />
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <PageHeader
          eyebrow={dashboardCopy.eyebrow}
          title={dashboardCopy.title}
          description={dashboardCopy.description}
          actions={[
            { label: copy.shell.newProject, href: '/projects#new-project' as any },
            { label: dashboardCopy.openProjects, href: '/projects' as any }
          ]}
        />

        <section className="overflow-hidden rounded-[2rem] border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div className="relative overflow-hidden px-5 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(78,70,229,0.12),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(99,102,241,0.08),_transparent_30%)]"
              />
              <div className="relative flex flex-col gap-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary-container px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                    <Activity className="h-4 w-4" />
                    {dashboardCopy.liveWorkspace}
                  </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                      <Clock3 className="h-4 w-4" />
                      {dashboardCopy.jakartaTime}
                      <span className="normal-case tracking-normal">
                      {activityData.latest
                        ? formatWibDateTime(activityData.latest)
                        : dashboardCopy.waitingForEvent}
                      </span>
                    </span>
                </div>

                <div className="max-w-3xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                    {dashboardCopy.orchestratedBy}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-on-surface md:text-3xl">
                    {dashboardCopy.heroTitle}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface-variant md:text-base">
                    {dashboardCopy.heroBody}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-outline-variant bg-white/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                      {copy.shell.projects}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-on-surface">{overview.projectCount}</p>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {locale === 'id'
                        ? `${overview.activeProjectCount} aktif, ${Math.max(
                            0,
                            overview.projectCount - overview.activeProjectCount
                          )} diarsipkan`
                        : `${overview.activeProjectCount} active, ${Math.max(
                            0,
                            overview.projectCount - overview.activeProjectCount
                          )} archived`}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-outline-variant bg-white/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                      {copy.shell.diagnoses}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-on-surface">{overview.completedDiagnoses}</p>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {locale === 'id'
                        ? 'Sinyal tersimpan di Supabase setelah n8n selesai'
                        : 'Signals stored in Supabase after n8n completes'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-outline-variant bg-white/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                      {copy.shell.objectives}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-on-surface">{overview.completedObjectives}</p>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {locale === 'id' ? 'Target SMART siap dieksekusi' : 'SMART targets ready for execution'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-outline-variant bg-white/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                      {locale === 'id' ? 'Aksi berikutnya' : 'Next action'}
                    </p>
                    <p className="mt-2 text-base font-semibold text-on-surface">{nextAction.title}</p>
                    <p className="mt-1 text-sm text-on-surface-variant">{nextAction.body}</p>
                  </div>
                </div>
              </div>
            </div>

          <div className="border-t border-outline-variant bg-surface-container-low px-5 py-5 sm:px-6 sm:py-6 lg:border-l lg:border-t-0 lg:px-7 lg:py-8">
              <div className="flex h-full flex-col justify-between gap-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                    {locale === 'id' ? 'Aksi yang disarankan' : 'Recommended action'}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-on-surface">{nextAction.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-on-surface-variant">{nextAction.body}</p>
                </div>

                <div className="space-y-3">
                  <Link
                    href={nextAction.href as any}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
                  >
                    {nextAction.action}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                  <div className="grid grid-cols-2 gap-3">
                    {activityData.counts.map((activity) => (
                      <div key={activity.label} className="rounded-2xl border border-outline-variant bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                          {activity.label}
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-on-surface">{activity.count}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {metrics.map((metric) => (
            <StatCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              delta={metric.delta}
              icon={metric.icon}
              toneClassName={metric.tone}
            />
          ))}
        </div>

        <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="flex items-center justify-between border-b border-outline-variant px-4 py-4 md:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                {dashboardCopy.quickStart}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-on-surface">{dashboardCopy.quickStartTitle}</h2>
            </div>
            <Link href={'/projects' as any} className="text-sm font-semibold text-primary hover:underline">
              {dashboardCopy.openProjects}
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 px-4 py-4 md:grid-cols-3 md:px-6">
            {workflowSteps.map((step) => (
              <WorkflowCard key={step.title} step={step} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="flex items-center justify-between border-b border-outline-variant px-4 py-4 md:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                {dashboardCopy.activeProjects}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-on-surface">{dashboardCopy.activeProjectsTitle}</h2>
            </div>
            <Link href={'/projects' as any} className="text-sm font-semibold text-primary hover:underline">
              {locale === 'id' ? 'Lihat semua' : 'View all'}
            </Link>
          </div>

          {projectRows.length > 0 ? (
            <HorizontalScrollSnap className="px-4 py-4 md:overflow-visible md:px-6" contentClassName="md:grid md:grid-cols-1">
              {projectRows.map((project) => (
                <div key={project.id} className="min-w-[280px] md:min-w-0">
                  <ProjectRow project={project} />
                </div>
              ))}
            </HorizontalScrollSnap>
          ) : (
            <div className="px-4 py-4 md:px-6">
              <EmptyState
                title={dashboardCopy.noProjectsTitle}
                body={dashboardCopy.noProjectsBody}
                actionLabel={copy.shell.newProject}
                href="/projects#new-project"
              />
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex-1">
            <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm">
              <div className="flex items-center justify-between border-b border-outline-variant px-4 py-4 md:px-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                    {dashboardCopy.recentDiagnoses}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-on-surface">{dashboardCopy.recentDiagnosesTitle}</h2>
                </div>
                <Link href={'/diagnosis' as any} className="text-sm font-semibold text-primary hover:underline">
                  {locale === 'id' ? 'Buka terbaru' : 'Open latest'}
                </Link>
              </div>

              {diagnosisRows.length > 0 ? (
                <HorizontalScrollSnap
                  className="px-4 py-4 md:overflow-visible md:px-6"
                  contentClassName="md:grid md:grid-cols-2 xl:grid-cols-3"
                >
                  {diagnosisRows.map((diagnosis) => (
                    <div key={diagnosis.id} className="min-w-[260px] md:min-w-0">
                      <DiagnosisCard diagnosis={diagnosis} />
                    </div>
                  ))}
                </HorizontalScrollSnap>
              ) : (
                <div className="px-4 py-4 md:px-6">
                  <EmptyState
                    title={dashboardCopy.noDiagnosesTitle}
                    body={dashboardCopy.noDiagnosesBody}
                    actionLabel={locale === 'id' ? 'Mulai identify' : 'Start identify'}
                    href="/identify"
                  />
                </div>
              )}
            </div>
          </div>

          <aside className="flex w-full flex-col gap-4 xl:sticky xl:top-24 xl:self-start">
            {insights.length > 0 ? (
              insights.map((insight) => <InsightCard key={insight.title} insight={insight} />)
            ) : (
              <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                  {dashboardCopy.workspacePulse}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-on-surface">{activeProjectSummary}</h3>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">{latestDiagnosisSummary}</p>
                <div className="mt-4 rounded-2xl bg-primary-container p-4 text-on-primary-container">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-primary-container/80">
                    {locale === 'id' ? 'Status n8n' : 'n8n status'}
                  </p>
                  <p className="mt-2 text-sm leading-6">
                    {locale === 'id'
                      ? 'Gunakan workflow engine untuk menjaga identify, diagnosis, dan objective tetap sinkron.'
                      : 'Use the workflow engine to keep identify, diagnosis, and objective generation in sync.'}
                  </p>
                  <Link
                    href="/projects"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-sm font-semibold"
                  >
                    {dashboardCopy.openProjects}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}
          </aside>
        </section>
      </section>
    </div>
  );
}
