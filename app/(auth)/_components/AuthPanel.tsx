import type { ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';

type AuthPanelProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthPanel({ eyebrow, title, description, children, footer }: AuthPanelProps) {
  return (
    <section className="relative isolate w-full max-w-md overflow-hidden rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:p-8">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-amber-300 to-rose-400" />
      <div className="absolute -right-16 -top-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-16 h-40 w-40 rounded-full bg-amber-200/30 blur-3xl" />

      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-primary">
          <ShieldCheck className="h-3.5 w-3.5" />
          {eyebrow}
        </div>
        <h2 className="mt-5 text-3xl font-semibold tracking-tight text-on-surface sm:text-[2rem]">{title}</h2>
        <p className="mt-3 max-w-sm text-sm leading-6 text-on-surface-variant">{description}</p>
        <div className="mt-6">{children}</div>
        {footer ? <div className="mt-6 border-t border-outline-variant/70 pt-4">{footer}</div> : null}
      </div>
    </section>
  );
}
