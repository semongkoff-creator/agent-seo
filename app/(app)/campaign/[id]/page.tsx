import Link from 'next/link';
import {
  ArrowUpRight,
  ChevronRight,
  History,
  Megaphone,
  NotebookText,
  Sparkles
} from 'lucide-react';
import { HorizontalScrollSnap } from '@/components/ui/horizontal-scroll-snap';
import { requireUser } from '@/lib/auth/session';
import { getCampaignOverview } from '@/lib/services/tasks';
import { getProject } from '@/lib/services/projects';

const trackerLabels = ['Identify', 'Diagnose', 'Plan', 'Optimize', 'Content', 'Backlinks', 'Review'] as const;

export default async function CampaignPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const [project, campaign] = await Promise.all([
    getProject(user.id, params.id),
    getCampaignOverview(user.id, params.id)
  ]);
  const projectRecord = project as Record<string, unknown>;
  const projectName = typeof projectRecord.name === 'string' && projectRecord.name ? projectRecord.name : 'Campaign Dashboard';

  const metrics = [
    { label: 'Organic Traffic', value: '142,500', delta: '+12.4%' },
    { label: 'Organic Leads', value: '842', delta: '-2.1%' },
    { label: 'Top 10 Keywords', value: '34', delta: '+4' }
  ] as const;

  const taskRows = campaign.tasks.length > 0 ? campaign.tasks : [
    { title: 'Fix 404 redirects in Blog', impact: 'high', status: 'pending' },
    { title: 'Optimize Metadata for Home', impact: 'medium', status: 'in_progress' },
    { title: 'Internal Linking: AI Landing', impact: 'low', status: 'pending' }
  ];

  const progressByStep = new Map<number, string>();
  for (const row of campaign.campaignProgress) {
    progressByStep.set(Number((row as Record<string, unknown>).step_number ?? 0), String((row as Record<string, unknown>).status ?? 'not_started'));
  }

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Campaign</p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-on-surface md:text-3xl lg:text-4xl">
                {projectName}
              </h1>
              <p className="hidden max-w-3xl text-sm leading-6 text-on-surface-variant sm:block md:text-base">
                Track progress across the seven-step plan, monitor key metrics, and keep the AI insights close at hand.
              </p>
            </div>
            <div className="inline-flex min-h-11 items-center gap-2 rounded-full bg-surface-container px-4 py-3 text-sm text-on-surface-variant">
              <History className="h-4 w-4" />
              Last updated: Recently
            </div>
          </div>
        </div>

        <HorizontalScrollSnap className="pb-2">
          {trackerLabels.map((step, index) => {
            const status = progressByStep.get(index + 1) ?? (index === 0 ? 'in_progress' : 'locked');
            const completed = status === 'completed';
            const current = status === 'in_progress';

            return (
              <div
                key={step}
                className={[
                  'snap-start min-w-[120px] rounded-2xl border px-4 py-4 text-center',
                  completed
                    ? 'border-primary bg-primary-container text-on-primary-container'
                    : current
                      ? 'border-primary bg-white text-on-surface'
                      : 'border-outline-variant bg-white text-on-surface-variant'
                ].join(' ')}
              >
                <div
                  className={[
                    'mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full',
                    completed
                      ? 'bg-white/20 text-on-primary-container'
                      : current
                        ? 'bg-primary-fixed text-on-primary-fixed-variant'
                        : 'bg-surface-container'
                  ].join(' ')}
                >
                  {completed ? '✓' : index + 1}
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em]">{step}</p>
              </div>
            );
          })}
        </HorizontalScrollSnap>

        <HorizontalScrollSnap className="pb-2">
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className="snap-start min-w-[280px] rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                    {metric.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-on-surface">{metric.value}</p>
                </div>
                <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant">
                  {metric.delta}
                </span>
              </div>
              <div className="mt-5 h-28 rounded-2xl bg-surface-container-low">
                <div className="flex h-full items-end gap-2 px-4 pb-4">
                  <div className="h-8 flex-1 rounded-t-lg bg-primary/20" />
                  <div className="h-12 flex-1 rounded-t-lg bg-primary/30" />
                  <div className="h-10 flex-1 rounded-t-lg bg-primary/20" />
                  <div className="h-16 flex-1 rounded-t-lg bg-primary/40" />
                  <div className="h-14 flex-1 rounded-t-lg bg-primary/30" />
                  <div className="h-20 flex-1 rounded-t-lg bg-primary" />
                </div>
              </div>
            </article>
          ))}
        </HorizontalScrollSnap>

        <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="border-b border-outline-variant px-4 py-4 md:px-6">
            <nav className="flex gap-4 overflow-x-auto">
              {['Overview', 'Tasks', 'Metrics', 'Diagnosis', 'Objective'].map((tab, index) => (
                <button
                  key={tab}
                  type="button"
                  className={[
                    'min-h-11 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                    index === 0
                      ? 'bg-primary-container text-on-primary-container'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  ].join(' ')}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex flex-col gap-6 p-4 md:p-6 xl:flex-row">
            <div className="flex-1 space-y-6">
              <div className="rounded-2xl border border-outline-variant bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-on-surface">Traffic Over Time</h2>
                  <div className="flex gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-surface-container px-3 py-1">7D</span>
                    <span className="rounded-full bg-primary text-on-primary px-3 py-1">30D</span>
                    <span className="rounded-full bg-surface-container px-3 py-1">90D</span>
                  </div>
                </div>
                <div className="h-[240px] rounded-2xl bg-surface-container-low p-4">
                  <div className="flex h-full items-end gap-2">
                    <div className="h-1/2 flex-1 rounded-t-lg bg-primary/20" />
                    <div className="h-[58%] flex-1 rounded-t-lg bg-primary/30" />
                    <div className="h-[52%] flex-1 rounded-t-lg bg-primary/25" />
                    <div className="h-[70%] flex-1 rounded-t-lg bg-primary/40" />
                    <div className="h-[62%] flex-1 rounded-t-lg bg-primary/35" />
                    <div className="h-[85%] flex-1 rounded-t-lg bg-primary" />
                    <div className="h-[66%] flex-1 rounded-t-lg bg-primary/30" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-outline-variant bg-white p-5">
                  <h3 className="text-lg font-semibold text-on-surface">Keyword Distribution</h3>
                  <div className="mt-4 space-y-4">
                    {[
                      { label: 'Position 1-3', value: '128', width: '25%' },
                      { label: 'Position 4-10', value: '452', width: '45%' },
                      { label: 'Position 11-20', value: '1,024', width: '80%' }
                    ].map((item) => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                          <span>{item.label}</span>
                          <span>{item.value}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-surface-container">
                          <div className="h-full rounded-full bg-primary" style={{ width: item.width }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-outline-variant bg-white p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-on-surface">Priority Tasks</h3>
                    <Link href="/projects" className="text-sm font-semibold text-primary hover:underline">
                      View all
                    </Link>
                  </div>
                  <ul className="space-y-3">
                    {taskRows.map((task, index) => {
                      const record = task as Record<string, unknown>;
                      const title = typeof record.title === 'string' ? record.title : `Task ${index + 1}`;
                      const impact = typeof record.impact === 'string' ? record.impact : 'medium';
                      return (
                        <li key={title} className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-low px-3 py-3">
                          <input type="checkbox" className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-on-surface">{title}</p>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                              {impact === 'high' ? 'High Impact' : impact === 'medium' ? 'Medium Impact' : 'Planned'}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-on-surface-variant" />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>

            <aside className="flex w-full flex-col gap-4 xl:w-80">
              <Link
                href={`/projects/${params.id}/objective`}
                className="rounded-2xl border border-outline-variant bg-primary-container p-5 text-on-primary-container shadow-sm"
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-on-primary-container/80">
                  <Sparkles className="h-4 w-4" />
                  Recommended Next Action
                </div>
                <p className="mt-3 text-sm leading-6">
                  Prioritize the content authority cluster to regain visibility in primary SERPs.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold">
                  Apply strategy
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </Link>

              <Link
                href={`/projects/${params.id}/identify/step/1`}
                className="rounded-2xl border border-outline-variant bg-primary-container p-5 text-on-primary-container shadow-sm"
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-on-primary-container/80">
                  <Megaphone className="h-4 w-4" />
                  AI Insight
                </div>
                <p className="mt-3 text-sm leading-6">
                  The highest-value short term move is still internal linking cleanup across the product library.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold">
                  Open diagnosis
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </Link>

              <div className="rounded-2xl border border-outline-variant bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
                  <NotebookText className="h-4 w-4 text-primary" />
                  Campaign notes
                </div>
                <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                  These insights will later be powered by live campaign data and webhook-driven updates from n8n.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </section>
    </div>
  );
}
