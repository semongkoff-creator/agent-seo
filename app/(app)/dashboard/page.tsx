import Link from 'next/link';
import {
  ArrowUpRight,
  BarChart3,
  Brain,
  ChevronRight,
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
import { getDashboardOverview, listDashboardInsights } from '@/lib/services/dashboard';
import { listDiagnoses } from '@/lib/services/diagnoses';
import { listProjects } from '@/lib/services/projects';

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
      : 'Diagnosis summary will appear after n8n completes the workflow.';
    const severity =
      typeof record.severity === 'string' && ['low', 'medium', 'high', 'critical'].includes(record.severity)
        ? (record.severity as DiagnosisRowData['severity'])
        : 'medium';

    return { id, project, title, summary, severity };
  });
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

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <PageHeader
          eyebrow="Dashboard"
          title="Dashboard Overview"
          description="Track active SEO projects, review the latest signals, and move from setup to n8n-powered execution in fewer steps."
          actions={[
            { label: 'Create Project', href: '/projects#new-project' as any },
            { label: 'Open Projects', href: '/projects' as any }
          ]}
        />

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
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">Quick Start</p>
              <h2 className="mt-1 text-lg font-semibold text-on-surface">The shortest path from brief to workflow</h2>
            </div>
            <Link href={'/projects' as any} className="text-sm font-semibold text-primary hover:underline">
              Open projects
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
                Active Projects
              </p>
              <h2 className="mt-1 text-lg font-semibold text-on-surface">Visibility, authority, and trend</h2>
            </div>
            <Link href={'/projects' as any} className="text-sm font-semibold text-primary hover:underline">
              View all
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
                title="No projects yet"
                body="Create your first project to start the identify workflow. Once n8n returns data, the project cards will populate automatically."
                actionLabel="Create project"
                href="/projects#new-project"
              />
            </div>
          )}
        </section>

        <section className="flex flex-col gap-6 xl:flex-row">
          <div className="flex-1">
            <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm">
              <div className="flex items-center justify-between border-b border-outline-variant px-4 py-4 md:px-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                    Recent Diagnoses
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-on-surface">Latest diagnosis signals</h2>
                </div>
                <Link href={'/diagnosis' as any} className="text-sm font-semibold text-primary hover:underline">
                  Open latest
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
                    title="No diagnoses yet"
                    body="When identify runs through n8n and writes back to Supabase, the diagnosis cards will appear here."
                    actionLabel="Start identify"
                    href="/identify"
                  />
                </div>
              )}
            </div>
          </div>

          <aside className="flex w-full flex-col gap-4 xl:w-80">
            {insights.length > 0 ? (
              insights.map((insight) => <InsightCard key={insight.title} insight={insight} />)
            ) : (
              <EmptyState
                title="No AI insights yet"
                body="n8n will generate these after diagnoses or objectives are processed, so this space stays honest until data arrives."
                actionLabel="Open projects"
                href="/projects"
              />
            )}
          </aside>
        </section>
      </section>
    </div>
  );
}
