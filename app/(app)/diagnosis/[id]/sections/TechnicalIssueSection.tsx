"use client";

import { useMemo, useState } from 'react';
import { CheckCircle2, FileText, RefreshCcw } from 'lucide-react';
import { ErrorDetailModal } from '@/components/wizard/ErrorDetailModal';
import { SeverityBadge } from '@/components/ui/severity-badge';
import type { TechnicalErrorRecord, TechnicalErrorStatus } from '@/types/wizard';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function severityWeight(severity: TechnicalErrorRecord['severity']) {
  switch (severity) {
    case 'critical':
      return 4;
    case 'high':
      return 3;
    case 'medium':
      return 2;
    default:
      return 1;
  }
}

export function calculateTechnicalHealthScore(errors: TechnicalErrorRecord[]) {
  if (errors.length === 0) {
    return 100;
  }

  const maxWeight = errors.reduce((sum, error) => sum + severityWeight(error.severity), 0);
  const weightedScore = errors.reduce((sum, error) => {
    const weight = severityWeight(error.severity);
    if (error.status === 'fixed') {
      return sum + weight;
    }

    if (error.status === 'in_progress') {
      return sum + weight * 0.5;
    }

    return sum;
  }, 0);

  return Math.max(0, Math.min(100, Math.round((weightedScore / maxWeight) * 100)));
}

function statusLabel(status: TechnicalErrorStatus) {
  switch (status) {
    case 'fixed':
      return 'Fixed';
    case 'in_progress':
      return 'In progress';
    default:
      return 'Open';
  }
}

function statusTone(status: TechnicalErrorStatus) {
  switch (status) {
    case 'fixed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'in_progress':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    default:
      return 'bg-rose-50 text-rose-700 border-rose-200';
  }
}

export function TechnicalIssueSection({
  projectId,
  errors,
  healthScore,
  loading,
  onToggleStatus,
  onSelectError
}: {
  projectId: string;
  errors: TechnicalErrorRecord[];
  healthScore: number;
  loading: boolean;
  onToggleStatus: (errorId: string, nextStatus: TechnicalErrorStatus) => Promise<void>;
  onSelectError: (error: TechnicalErrorRecord) => void;
}) {
  const [previewError, setPreviewError] = useState<TechnicalErrorRecord | null>(null);

  const fixedCount = useMemo(() => errors.filter((error) => error.status === 'fixed').length, [errors]);

  return (
    <section className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Section 1</p>
          <h2 className="mt-2 text-2xl font-semibold text-on-surface">Technical Issue</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
            Prioritize errors that are blocking crawlability, rendering, or indexation before scaling content.
          </p>
        </div>

        <div className="flex gap-3">
          <div className="rounded-2xl border border-outline-variant bg-white px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
              Technical Health
            </p>
            <p className="mt-1 text-2xl font-semibold text-on-surface">{healthScore}/100</p>
          </div>
          <div className="rounded-2xl border border-outline-variant bg-white px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">Fixed</p>
            <p className="mt-1 text-2xl font-semibold text-on-surface">{fixedCount}/{errors.length}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3">
        {errors.length > 0 ? (
          errors.map((error) => {
            const checked = error.status === 'fixed';
            return (
              <div
                key={error.id}
                className={cn(
                  'rounded-[22px] border bg-white p-4 shadow-sm transition',
                  checked ? 'border-emerald-200 opacity-70' : 'border-outline-variant hover:border-primary/40'
                )}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => void onToggleStatus(error.id, checked ? 'open' : 'fixed')}
                      disabled={loading}
                      className={cn(
                        'mt-1 inline-flex h-6 w-6 items-center justify-center rounded-md border',
                        checked ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-outline-variant bg-white'
                      )}
                      aria-label={`Toggle ${error.errorType}`}
                      aria-pressed={checked}
                    >
                      {checked ? <CheckCircle2 className="h-4 w-4" /> : null}
                    </button>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={cn('font-semibold text-on-surface', checked && 'line-through')}>
                          {error.errorType}
                        </p>
                        <span className="rounded-full border border-outline-variant px-2.5 py-1 text-xs font-semibold text-on-surface-variant">
                          {error.source}
                        </span>
                        <SeverityBadge severity={error.severity} label={error.severity} />
                        <span className={cn('rounded-full border px-2.5 py-1 text-xs font-semibold', statusTone(error.status))}>
                          {statusLabel(error.status)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-on-surface-variant">
                        {error.count} affected URL{error.count > 1 ? 's' : ''}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {error.affectedUrls.slice(0, 2).map((url) => (
                          <span key={url} className="rounded-full bg-surface-container-low px-3 py-1 text-xs text-primary">
                            {url}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectError(error);
                        setPreviewError(error);
                      }}
                      disabled={loading}
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-outline-variant bg-white px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
                    >
                      <FileText className="h-4 w-4" />
                      View details
                    </button>
                    <button
                      type="button"
                      onClick={() => void onToggleStatus(error.id, error.status === 'in_progress' ? 'open' : 'in_progress')}
                      disabled={loading}
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-outline-variant bg-white px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
                    >
                      <RefreshCcw className="h-4 w-4" />
                      Mark progress
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-[22px] border border-dashed border-outline-variant bg-surface-container-low p-6 text-sm text-on-surface-variant">
            No technical errors found yet. The checklist will appear once data is available for {projectId}.
          </div>
        )}
      </div>

      <ErrorDetailModal error={previewError} onClose={() => setPreviewError(null)} />
    </section>
  );
}
