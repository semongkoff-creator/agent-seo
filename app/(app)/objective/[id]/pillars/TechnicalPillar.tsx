"use client";

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { CheckCircle2, ChevronRight, FileText, RefreshCcw, ShieldCheck } from 'lucide-react';
import { ErrorDetailModal } from '@/components/wizard/ErrorDetailModal';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { useTechnicalErrors } from '@/lib/hooks/useTechnicalErrors';
import type { Locale } from '@/lib/i18n';
import type { TechnicalErrorRecord, TechnicalErrorStatus } from '@/types/wizard';
import { getEstimatedEffort } from './utils';

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

function statusLabel(status: TechnicalErrorStatus, locale: Locale) {
  const labels: Record<Locale, Record<TechnicalErrorStatus, string>> = {
    en: {
      open: 'Open',
      in_progress: 'In progress',
      fixed: 'Fixed'
    },
    id: {
      open: 'Open',
      in_progress: 'Sedang dikerjakan',
      fixed: 'Selesai'
    }
  };

  return labels[locale][status];
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

function groupLabel(key: 'critical' | 'high' | 'medium' | 'low' | 'fixed', locale: Locale) {
  const labels: Record<Locale, Record<typeof key, string>> = {
    en: {
      critical: 'Critical',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      fixed: 'Fixed'
    },
    id: {
      critical: 'Kritis',
      high: 'Tinggi',
      medium: 'Sedang',
      low: 'Rendah',
      fixed: 'Selesai'
    }
  };

  return labels[locale][key];
}

function groupTone(key: 'critical' | 'high' | 'medium' | 'low' | 'fixed') {
  switch (key) {
    case 'critical':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'high':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'medium':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'low':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    default:
      return 'bg-surface-container text-on-surface-variant border-outline-variant';
  }
}

function PriorityGroup({
  label,
  count,
  tone,
  defaultOpen,
  children
}: {
  label: string;
  count: number;
  tone: string;
  defaultOpen: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-outline-variant bg-white p-4">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold', tone)}>
          {label}
          <span className="opacity-70">({count})</span>
        </span>
        <ChevronRight className={cn('h-4 w-4 text-on-surface-variant transition-transform', open && 'rotate-90')} />
      </button>

      {open ? <div className="mt-4 space-y-3">{children}</div> : null}
    </div>
  );
}

function ChecklistItem({
  error,
  loading,
  onToggleStatus,
  onOpenDetail,
  locale
}: {
  error: TechnicalErrorRecord;
  loading: boolean;
  onToggleStatus: (errorId: string, nextStatus: TechnicalErrorStatus) => Promise<void>;
  onOpenDetail: (error: TechnicalErrorRecord) => void;
  locale: Locale;
}) {
  const checked = error.status === 'fixed';

  return (
    <div
      className={cn(
        'rounded-2xl border p-4 transition-shadow',
        checked ? 'border-emerald-200 bg-emerald-50/40' : 'border-outline-variant bg-surface-container-lowest hover:shadow-sm'
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
              <p className={cn('font-semibold text-on-surface', checked && 'line-through')}>{error.errorType}</p>
              <span className="rounded-full border border-outline-variant px-2.5 py-1 text-xs font-semibold text-on-surface-variant">
                {error.source}
              </span>
              <SeverityBadge severity={error.severity} label={error.severity} />
              <span className={cn('rounded-full border px-2.5 py-1 text-xs font-semibold', statusTone(error.status))}>
                {statusLabel(error.status, locale)}
              </span>
            </div>

            <p className="mt-2 text-sm text-on-surface-variant">
              {error.count} affected URL{error.count > 1 ? 's' : ''} - Est. effort {getEstimatedEffort(error.severity)}
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
            onClick={() => onOpenDetail(error)}
            disabled={loading}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-outline-variant bg-white px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
          >
            <FileText className="h-4 w-4" />
            {locale === 'id' ? 'Lihat detail' : 'View details'}
          </button>
          <button
            type="button"
            onClick={() => void onToggleStatus(error.id, error.status === 'in_progress' ? 'open' : 'in_progress')}
            disabled={loading}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-outline-variant bg-white px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
          >
            <RefreshCcw className="h-4 w-4" />
            {locale === 'id' ? 'Tandai progress' : 'Mark progress'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TechnicalPillar({
  projectId,
  diagnosisId,
  initialErrors,
  locale
}: {
  projectId: string;
  diagnosisId: string | null;
  initialErrors: TechnicalErrorRecord[];
  locale: Locale;
}) {
  const { errors, fixedCount, loading, updateStatus } = useTechnicalErrors(projectId, initialErrors);
  const [previewError, setPreviewError] = useState<TechnicalErrorRecord | null>(null);

  const grouped = useMemo(() => {
    const activeErrors = errors.filter((error) => error.status !== 'fixed');
    return {
      critical: activeErrors.filter((error) => error.severity === 'critical'),
      high: activeErrors.filter((error) => error.severity === 'high'),
      medium: activeErrors.filter((error) => error.severity === 'medium'),
      low: activeErrors.filter((error) => error.severity === 'low'),
      fixed: errors.filter((error) => error.status === 'fixed')
    };
  }, [errors]);

  const progress = errors.length > 0 ? Math.round((fixedCount / errors.length) * 100) : 100;
  const healthScore = calculateTechnicalHealthScore(errors);

  return (
    <section className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            {locale === 'id' ? 'Pillar 1' : 'Pillar 1'}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-on-surface">
            {locale === 'id' ? 'Technical' : 'Technical'}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
            {locale === 'id'
              ? 'Dikerjakan duluan dan sinkron dengan checklist di halaman Diagnosis.'
              : 'Work on this first. It stays in sync with the checklist on the Diagnosis page.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="rounded-2xl border border-outline-variant bg-white px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
              {locale === 'id' ? 'Technical Health' : 'Technical Health'}
            </p>
            <p className="mt-1 text-2xl font-semibold text-on-surface">{healthScore}/100</p>
          </div>
          <div className="rounded-2xl border border-outline-variant bg-white px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
              {locale === 'id' ? 'Fixed' : 'Fixed'}
            </p>
            <p className="mt-1 text-2xl font-semibold text-on-surface">
              {fixedCount}/{errors.length}
            </p>
          </div>
          <Link
            href={diagnosisId ? `/diagnosis/${diagnosisId}` : '/diagnosis'}
            className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-outline-variant bg-white px-4 py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
          >
            <ShieldCheck className="h-4 w-4 text-primary" />
            {locale === 'id' ? 'View in Diagnosis' : 'View in Diagnosis'}
          </Link>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-on-surface">
            {fixedCount} {locale === 'id' ? 'dari' : 'of'} {errors.length} {locale === 'id' ? 'issue selesai' : 'issues resolved'}
          </span>
          <span className="font-semibold text-on-surface">{progress}%</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-surface-container">
          <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4">
        {errors.length > 0 ? (
          <>
            {grouped.critical.length > 0 ? (
              <PriorityGroup label={groupLabel('critical', locale)} count={grouped.critical.length} tone={groupTone('critical')} defaultOpen>
                {grouped.critical.map((error) => (
                  <ChecklistItem
                    key={error.id}
                    error={error}
                    loading={loading}
                    onToggleStatus={updateStatus}
                    onOpenDetail={setPreviewError}
                    locale={locale}
                  />
                ))}
              </PriorityGroup>
            ) : null}
            {grouped.high.length > 0 ? (
              <PriorityGroup label={groupLabel('high', locale)} count={grouped.high.length} tone={groupTone('high')} defaultOpen>
                {grouped.high.map((error) => (
                  <ChecklistItem
                    key={error.id}
                    error={error}
                    loading={loading}
                    onToggleStatus={updateStatus}
                    onOpenDetail={setPreviewError}
                    locale={locale}
                  />
                ))}
              </PriorityGroup>
            ) : null}
            {grouped.medium.length > 0 ? (
              <PriorityGroup label={groupLabel('medium', locale)} count={grouped.medium.length} tone={groupTone('medium')} defaultOpen>
                {grouped.medium.map((error) => (
                  <ChecklistItem
                    key={error.id}
                    error={error}
                    loading={loading}
                    onToggleStatus={updateStatus}
                    onOpenDetail={setPreviewError}
                    locale={locale}
                  />
                ))}
              </PriorityGroup>
            ) : null}
            {grouped.low.length > 0 ? (
              <PriorityGroup label={groupLabel('low', locale)} count={grouped.low.length} tone={groupTone('low')} defaultOpen={false}>
                {grouped.low.map((error) => (
                  <ChecklistItem
                    key={error.id}
                    error={error}
                    loading={loading}
                    onToggleStatus={updateStatus}
                    onOpenDetail={setPreviewError}
                    locale={locale}
                  />
                ))}
              </PriorityGroup>
            ) : null}
            {grouped.fixed.length > 0 ? (
              <PriorityGroup label={groupLabel('fixed', locale)} count={grouped.fixed.length} tone={groupTone('fixed')} defaultOpen={false}>
                {grouped.fixed.map((error) => (
                  <ChecklistItem
                    key={error.id}
                    error={error}
                    loading={loading}
                    onToggleStatus={updateStatus}
                    onOpenDetail={setPreviewError}
                    locale={locale}
                  />
                ))}
              </PriorityGroup>
            ) : null}
          </>
        ) : (
          <div className="rounded-[22px] border border-dashed border-outline-variant bg-surface-container-low p-6 text-sm text-on-surface-variant">
            {locale === 'id'
              ? 'Belum ada technical issue untuk project ini.'
              : 'No technical issues have been loaded for this project yet.'}
          </div>
        )}
      </div>

      <ErrorDetailModal error={previewError} onClose={() => setPreviewError(null)} />
    </section>
  );
}
