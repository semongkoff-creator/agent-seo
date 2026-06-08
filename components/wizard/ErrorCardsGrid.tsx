import { BadgeAlert, ChevronRight, CircleAlert } from 'lucide-react';
import type { TechnicalErrorRecord } from '@/types/wizard';

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
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">Technical Errors</p>
          <h3 className="mt-1 text-lg font-semibold text-on-surface">Click a card for details</h3>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-container px-3 py-1 text-xs font-semibold text-primary">
          <BadgeAlert className="h-3.5 w-3.5" />
          {errors.length} issues
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {errors.map((error) => (
          <button
            key={error.id}
            type="button"
            onClick={() => onSelect(error)}
            className={`group rounded-[24px] border border-outline-variant bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md ${
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
            <p className="mt-1 text-sm font-medium text-on-surface">{error.errorType}</p>

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
          </button>
        ))}
      </div>
    </section>
  );
}
