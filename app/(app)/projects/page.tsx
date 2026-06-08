import Link from 'next/link';
import { cookies } from 'next/headers';
import { ArrowUpRight, FolderKanban, Target } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { CreateProjectModal } from './_components/CreateProjectModal';
import { requireUser } from '@/lib/auth/session';
import { getAppCopy, getLocaleFromValue, LOCALE_COOKIE } from '@/lib/i18n';
import { listProjects } from '@/lib/services/projects';
import { formatWibDate } from '@/lib/time';
import { formatBusinessGoalLabel } from '@/types/wizard';

function formatProjectUrl(record: Record<string, unknown>) {
  return typeof record.website_url === 'string' && record.website_url ? record.website_url : 'Website not provided';
}

export default async function ProjectsPage() {
  const user = await requireUser();
  const locale = getLocaleFromValue(cookies().get(LOCALE_COOKIE)?.value);
  const copy = getAppCopy(locale);
  const projectCopy = copy.projects;
  const projectsData = await listProjects(user.id, { page: 1, limit: 12 });

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <PageHeader
          eyebrow={projectCopy.eyebrow}
          title={projectCopy.title}
          description={projectCopy.description}
          actions={[{ label: projectCopy.openIdentifyHub, href: '/identify' }]}
        />

        <div id="new-project" className="grid scroll-mt-24 grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-5 shadow-sm md:p-6">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold text-on-surface">{projectCopy.createTitle}</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              {projectCopy.createBody}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <CreateProjectModal />
              <Link href="/identify" className="text-sm font-semibold text-primary hover:underline">
                {projectCopy.openIdentifyHub}
              </Link>
            </div>
            <div className="mt-5 rounded-2xl bg-surface-container-low p-4 text-sm leading-6 text-on-surface-variant">
              {locale === 'id'
                ? 'n8n akan mengorkestrasi workflow setelah project dibuat, jadi langkah ini hanya menangkap brief lalu menulis hasil akhir ke Supabase.'
                : 'n8n will orchestrate the workflow after the project is created, so this step only captures the brief and lets the workflow write the final result to Supabase.'}
            </div>
          </div>
          <div className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-5 shadow-sm md:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
              {projectCopy.howItWorks}
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-surface-container-low p-4">
                <p className="text-sm font-semibold text-on-surface">{projectCopy.step1}</p>
                <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                  {projectCopy.step1Body}
                </p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-4">
                <p className="text-sm font-semibold text-on-surface">{projectCopy.step2}</p>
                <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                  {projectCopy.step2Body}
                </p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-4">
                <p className="text-sm font-semibold text-on-surface">{projectCopy.step3}</p>
                <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                  {projectCopy.step3Body}
                </p>
              </div>
            </div>
          </div>
        </div>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {projectsData.items.length > 0 ? (
            projectsData.items.map((project) => {
              const record = project as Record<string, unknown>;
              const name = typeof record.name === 'string' && record.name ? record.name : 'Unnamed Project';
              const url = formatProjectUrl(record);
              const status = typeof record.status === 'string' ? record.status : 'active';
              const currentStep = typeof record.current_step === 'number' ? record.current_step : 1;
              const updatedAt = typeof record.updated_at === 'string' ? formatWibDate(record.updated_at) : 'Recently';
              const keywords = formatBusinessGoalLabel(record.main_business_goal);
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
          ) : (
            <div className="md:col-span-2 rounded-[28px] border border-dashed border-outline-variant bg-surface-container-lowest p-8 text-center shadow-sm">
              <FolderKanban className="mx-auto h-6 w-6 text-primary" />
              <h2 className="mt-3 text-xl font-semibold text-on-surface">{projectCopy.emptyTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                {projectCopy.emptyBody}
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <CreateProjectModal />
                <Link href="/identify" className="text-sm font-semibold text-primary hover:underline">
                  {projectCopy.openIdentifyHub}
                </Link>
              </div>
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
