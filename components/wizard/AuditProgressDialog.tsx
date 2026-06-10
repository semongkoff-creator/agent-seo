"use client";

import { useEffect, useMemo, useRef } from 'react';
import { X, Loader2, CircleAlert, BadgeDollarSign, Clock3, ShieldCheck } from 'lucide-react';
import type { AuditTaskRecord } from '@/types/audit';

function statusLabel(status: AuditTaskRecord['status']) {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'cancelled':
      return 'Cancelled';
    case 'parsing':
      return 'Parsing';
    case 'in_progress':
      return 'In progress';
    default:
      return 'Queued';
  }
}

export function AuditProgressDialog({
  open,
  task,
  message,
  error,
  onClose,
  onCancel
}: {
  open: boolean;
  task: AuditTaskRecord | null;
  message: string | null;
  error: string | null;
  onClose: () => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const progress = task?.progressPercent ?? 0;
  const hasTerminalState = task?.status === 'completed' || task?.status === 'failed' || task?.status === 'cancelled';

  const severityBreakdown = useMemo(() => task?.errorsBySeverity ?? {}, [task]);

  return (
    <dialog
      ref={dialogRef}
      className="w-[min(92vw,720px)] rounded-[32px] border border-outline-variant bg-surface-container-lowest p-0 text-on-surface shadow-2xl backdrop:bg-black/50"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="flex items-start justify-between border-b border-outline-variant px-5 py-4 md:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">Run Audit</p>
          <h3 className="mt-1 text-xl font-semibold text-on-surface">DataForSEO crawl progress</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container-low"
          aria-label="Close audit dialog"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-5 px-5 py-5 md:px-6">
        {message ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-2xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-on-error-container">
            {error}
          </div>
        ) : null}

        <div className="rounded-[26px] border border-outline-variant bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-on-surface-variant">
            <span className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-3 py-1">
              <Loader2 className={['h-3.5 w-3.5', hasTerminalState ? 'animate-none' : 'animate-spin'].join(' ')} />
              {statusLabel(task?.status ?? 'queued')}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-3 py-1">
              <BadgeDollarSign className="h-3.5 w-3.5" />
              Est. ${((task?.estimatedCostUsd ?? 0) || 0).toFixed(4)}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-3 py-1">
              <Clock3 className="h-3.5 w-3.5" />
              {task?.pagesCrawled ?? 0} / {task?.pagesTotal ?? task?.maxCrawlPages ?? 0} pages
            </span>
          </div>

          <div className="mt-4">
            <div className="h-3 rounded-full bg-surface-container-high">
              <div
                className="h-3 rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-on-surface-variant">{progress}% crawled</p>
          </div>

          {task?.totalErrorsFound ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(['critical', 'high', 'medium', 'low'] as const).map((severity) => (
                <div key={severity} className="rounded-2xl border border-outline-variant bg-surface-container-low p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">{severity}</p>
                  <p className="mt-1 text-lg font-semibold text-on-surface">{severityBreakdown[severity] ?? 0}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-lg text-sm leading-6 text-on-surface-variant">
            We poll DataForSEO for crawl progress, then save normalized errors back to Supabase once the crawl is complete.
          </p>
          <div className="flex items-center gap-2">
            {task?.status === 'completed' ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
                Finished
              </span>
            ) : null}
            {task?.status === 'failed' || task?.status === 'cancelled' ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                <CircleAlert className="h-4 w-4" />
                {statusLabel(task.status)}
              </span>
            ) : null}
            {!hasTerminalState ? (
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-outline-variant bg-white px-4 py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
              >
                Cancel audit
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary transition-colors hover:opacity-90"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
