import { X } from 'lucide-react';
import type { TechnicalErrorRecord } from '@/types/wizard';

function getRecommendedFix(errorType: string) {
  const lower = errorType.toLowerCase();

  if (lower.includes('redirect')) {
    return 'Collapse redirect chains into a single destination and update internal links to the final URL.';
  }

  if (lower.includes('canonical')) {
    return 'Align canonical tags with the preferred indexable URL and make sure duplicates point to the same destination.';
  }

  if (lower.includes('noindex')) {
    return 'Remove accidental noindex directives from important pages and verify template-level settings.';
  }

  if (lower.includes('mobile')) {
    return 'Review responsive breakpoints, tap targets, and viewport handling on the affected templates.';
  }

  return 'Audit the affected URLs, compare them with the winning templates, and fix the highest-impact pattern first.';
}

export function ErrorDetailModal({
  error,
  onClose
}: {
  error: TechnicalErrorRecord | null;
  onClose: () => void;
}) {
  if (!error) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-4 sm:items-center sm:py-8">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close dialog overlay"
        onClick={onClose}
      />

      <div className="relative z-10 w-[min(96vw,960px)] max-h-[calc(100vh-2rem)] overflow-hidden rounded-[32px] border border-outline-variant bg-surface-container-lowest shadow-2xl sm:max-h-[calc(100vh-4rem)]">
        <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4 md:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
              Technical Error Detail
            </p>
            <h3 className="mt-1 text-xl font-semibold text-on-surface">{error.errorType}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container-low"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto p-5 md:p-6">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
              <span className="rounded-full bg-surface-container px-3 py-1">{error.source}</span>
              <span className="rounded-full bg-surface-container px-3 py-1">{error.severity}</span>
              <span className="rounded-full bg-surface-container px-3 py-1">{error.status}</span>
              <span className="rounded-full bg-surface-container px-3 py-1">{error.count} URLs</span>
            </div>

            <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
              <h4 className="text-sm font-semibold text-on-surface">Affected URLs</h4>
              <ul className="mt-3 space-y-2 text-sm">
                {error.affectedUrls.map((url) => (
                  <li key={url} className="rounded-xl bg-white px-3 py-2 font-mono text-primary">
                    {url}
                  </li>
                ))}
              </ul>
            </section>

            {error.screenshots.length > 0 ? (
              <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
                <h4 className="text-sm font-semibold text-on-surface">Screenshots</h4>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {error.screenshots.map((url) => (
                    <img
                      key={url}
                      src={url}
                      alt="Error screenshot"
                      className="rounded-2xl border border-outline-variant bg-white"
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
              <h4 className="text-sm font-semibold text-on-surface">Recommended fix</h4>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">{getRecommendedFix(error.errorType)}</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
