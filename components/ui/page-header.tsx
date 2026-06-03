import Link from 'next/link';
import type { ReactNode } from 'react';

type Action = {
  label: string;
  href?: string;
  onClick?: () => void;
};

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: Action[];
  children?: ReactNode;
};

export function PageHeader({
  eyebrow = 'SEO Agent',
  title,
  description,
  actions = [],
  children
}: PageHeaderProps) {
  return (
    <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">{eyebrow}</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-on-surface md:text-3xl lg:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="hidden max-w-3xl text-sm leading-6 text-on-surface-variant sm:block md:text-base">
              {description}
            </p>
          ) : null}
        </div>

        {actions.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {actions.map((action) =>
              action.href ? (
                <Link
                  key={action.label}
                  href={action.href as any}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
                >
                  {action.label}
                </Link>
              ) : (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
                >
                  {action.label}
                </button>
              )
            )}
          </div>
        ) : null}
      </div>

      {children ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}
