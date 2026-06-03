import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Bot, Sparkles } from 'lucide-react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.06),_transparent_34%),radial-gradient(circle_at_80%_20%,_rgba(67,97,238,0.16),_transparent_30%),linear-gradient(180deg,#f8faff_0%,#eef2ff_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.36)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.36)_1px,transparent_1px)] bg-[size:28px_28px] opacity-30" />
      <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-amber-200/30 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-stretch lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <aside className="relative hidden flex-col justify-between overflow-hidden p-8 lg:flex xl:p-12">
          <div className="absolute inset-0 rounded-[32px] border border-white/50 bg-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-sm" />
          <div className="absolute -right-20 top-8 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -bottom-24 left-8 h-64 w-64 rounded-full bg-rose-300/20 blur-3xl" />

          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-semibold text-primary shadow-sm">
              <BadgeCheck className="h-4 w-4" />
              SEO Agent
            </Link>

            <div className="mt-10 max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-primary shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Supabase + n8n workspace
              </div>
              <h1 className="mt-6 text-5xl font-semibold tracking-tight text-on-surface xl:text-6xl">
                Diagnose SEO problems and turn them into measurable growth objectives.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-on-surface-variant">
                A focused Next.js workspace for guided SEO analysis, live project tracking, and AI workflows that feel
                more like a product than a prototype.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ['Live data', 'Supabase-backed'],
                ['AI workflows', 'n8n webhooks'],
                ['Responsive UI', 'Mobile first']
              ].map(([title, subtitle]) => (
                <div key={title} className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.5)] backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">{title}</p>
                  <p className="mt-2 text-sm font-medium text-on-surface">{subtitle}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[28px] border border-white/70 bg-surface-container-lowest/80 p-5 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.5)] backdrop-blur">
              <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
                <Bot className="h-4 w-4 text-primary" />
                Current flow
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  ['1', 'Identify problem', 'Gather signals, content, and competitor context.'],
                  ['2', 'Generate objective', 'Translate diagnosis into SMART goals.'],
                  ['3', 'Run campaign', 'Track tasks, progress, and outcomes.']
                ].map(([step, title, text]) => (
                  <div key={step} className="rounded-2xl border border-outline-variant/70 bg-white/90 p-4">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px]">{step}</span>
                      {title}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-on-surface-variant">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative mt-8 flex items-center justify-between text-xs font-medium text-on-surface-variant">
            <span>Built for a mobile-first operations flow.</span>
            <span className="inline-flex items-center gap-2">
              Protected session
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </aside>

        <main className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/70 bg-white/75 px-4 py-3 text-sm text-on-surface shadow-[0_12px_28px_-22px_rgba(15,23,42,0.5)] backdrop-blur lg:hidden">
              <Link href="/" className="inline-flex items-center gap-2 font-semibold text-primary">
                <BadgeCheck className="h-4 w-4" />
                SEO Agent
              </Link>
              <span className="text-xs font-medium text-on-surface-variant">Secure workspace</span>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
