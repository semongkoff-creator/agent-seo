import { BadgeAlert, ChevronRight, CircleAlert } from 'lucide-react';
import type { TechnicalErrorRecord } from '@/types/wizard';
import { formatAffectedUrlLabel } from '@/lib/technical-errors';

const severityClasses: Record<TechnicalErrorRecord['severity'], string> = {
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  critical: 'bg-rose-50 text-rose-700 border-rose-200'
};

export function ErrorCardsGrid({
  errors,
  onSelect
}: {
  errors: TechnicalErrorRecord[];
  onSelect: (error: TechnicalErrorRecord) => void;
}) {
  return (
    <section className="rounded-[24px] border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">Technical Errors</p>
          <h3 className="mt-1 text-lg font-semibold text-on-surface">Click a card for details</h3>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-container px-3 py-1 text-xs font-semibold text-primary">
          <BadgeAlert className="h-3.5 w-3.5" />
          {errors.length} issues
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {errors.map((error) => (
          <button
            key={error.id}
            type="button"
            onClick={() => onSelect(error)}
            className={`group flex h-full min-h-[18rem] flex-col rounded-[24px] border border-outline-variant bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md ${
              error.status === 'fixed' ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="rounded-full border border-outline-variant px-3 py-1 text-xs font-semibold text-on-surface-variant">
                {error.source}
              </span>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${severityClasses[error.severity]}`}>
                {error.severity}
              </span>
            </div>

            <p className="mt-4 text-3xl font-semibold text-on-surface">{error.count}</p>
            <p className="mt-1 text-base font-semibold leading-6 text-on-surface">{error.errorType}</p>

            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-on-surface-variant">
              <span>{error.status === 'fixed' ? 'Fixed' : 'Open issue'}</span>
              <span className="inline-flex items-center gap-1 font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                View details
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-on-surface-variant">
              <CircleAlert className="h-3.5 w-3.5" />
              {error.affectedUrls.length} affected URLs
            </div>

            <div className="mt-4 flex-1 space-y-2">
              {error.affectedUrls.slice(0, 1).map((item) => (
                <div
                  key={`${error.id}-${item.url}`}
                  className="rounded-2xl bg-surface-container-low px-3 py-2 text-left text-xs leading-5 text-primary break-words"
                >
                  {formatAffectedUrlLabel(item)}
                </div>
              ))}
              {error.affectedUrls.length > 1 ? (
                <div className="rounded-2xl border border-dashed border-outline-variant px-3 py-2 text-xs text-on-surface-variant">
                  +{error.affectedUrls.length - 1} more affected URL{error.affectedUrls.length - 1 > 1 ? 's' : ''}
                </div>
              ) : null}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
