import Link from 'next/link';
import { ArrowRight, Sparkles, WandSparkles } from 'lucide-react';
import { requireUser } from '@/lib/auth/session';
import { listProjects } from '@/lib/services/projects';

export default async function IdentifyLandingPage() {
  const user = await requireUser();
  const projects = await listProjects(user.id, { page: 1, limit: 8 });

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-primary">Identify Problem</p>
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-on-surface md:text-3xl lg:text-4xl">
                Start a diagnosis flow
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant md:text-base">
                Pick a project and continue the identify wizard. The draft autosaves on each step, then hands off to
                n8n when you submit.
              </p>
            </div>
            <Link
              href="/projects"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary transition-all hover:-translate-y-0.5"
            >
              <Sparkles className="h-4 w-4" />
              View Projects
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.35fr)_minmax(0,0.65fr)]">
          <article className="rounded-[28px] border border-outline-variant bg-primary/10 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <WandSparkles className="h-4 w-4" />
              Flow overview
            </div>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-on-surface">
              <li>1. Pick a project</li>
              <li>2. Fill the 6-step wizard</li>
              <li>3. Draft autosaves every second</li>
              <li>4. Submit to n8n for diagnosis</li>
              <li>5. Review the live diagnosis page</li>
            </ol>
          </article>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {projects.items.length > 0 ? (
              projects.items.map((project) => {
                const record = project as Record<string, unknown>;
                const id = String(record.id ?? '');
                const name = typeof record.name === 'string' && record.name ? record.name : 'Untitled Project';
                const url =
                  typeof record.website_url === 'string' && record.website_url ? record.website_url : 'Website not provided';
                const stage = typeof record.website_stage === 'string' ? record.website_stage : 'existing';
                const stageLabel = stage.replace(/_/g, ' ');

                return (
                  <article key={id} className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.26em] text-primary">{stageLabel}</p>
                    <h2 className="mt-2 text-xl font-semibold text-on-surface">{name}</h2>
                    <p className="mt-1 text-sm text-on-surface-variant">{url}</p>
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <Link
                        href={`/projects/${id}/identify/step/1`}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary transition-all hover:-translate-y-0.5"
                      >
                        Open Wizard
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link href={`/campaign/${id}`} className="text-sm font-semibold text-on-surface-variant hover:text-primary">
                        View campaign
                      </Link>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-[28px] border border-dashed border-outline-variant bg-white p-6 text-sm text-on-surface-variant">
                No projects yet. Create one first, then return here to start the identify flow.
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
