import type { LucideIcon } from 'lucide-react';

type StatCardProps = {
  label: string;
  value: string;
  delta?: string;
  icon?: LucideIcon;
  toneClassName?: string;
  children?: React.ReactNode;
};

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  toneClassName = 'text-on-surface',
  children
}: StatCardProps) {
  return (
    <article className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">{label}</p>
          <p className={`mt-3 text-3xl font-semibold tracking-tight ${toneClassName}`}>{value}</p>
          {delta ? <p className="mt-2 text-sm text-on-surface-variant">{delta}</p> : null}
        </div>
        {Icon ? (
          <div className="rounded-xl bg-surface-container px-3 py-3 text-on-surface-variant">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>

      {children ? <div className="mt-4">{children}</div> : null}
    </article>
  );
}
