"use client";

import { useEffect, useState } from 'react';
import { Activity, RefreshCw } from 'lucide-react';

type PSIAuditRecord = {
  sourceLabel?: string;
  overallPass?: boolean;
  primary?: {
    url: string;
    lcp?: { value: number; score: string };
    cls?: { value: number; score: string };
    inp?: { value: number; score: string };
    performanceScore?: number;
    accessibilityScore?: number;
    bestPracticesScore?: number;
    seoScore?: number;
    fetchedAt?: string;
  } | null;
  auditedUrls?: number;
  records?: Array<{
    url: string;
    lcp?: { value: number; score: string };
    cls?: { value: number; score: string };
    inp?: { value: number; score: string };
    performanceScore?: number;
    accessibilityScore?: number;
    bestPracticesScore?: number;
    seoScore?: number;
  }>;
};

function scoreClass(score: string | undefined) {
  if (score === 'good') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (score === 'poor') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

export function CoreWebVitalsCard({
  projectId,
  value,
  onChange
}: {
  projectId: string;
  value: boolean;
  onChange?: (value: boolean) => void;
}) {
  const [summary, setSummary] = useState<PSIAuditRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadLatest() {
    const response = await fetch(`/api/psi/status/${projectId}`);
    const body = (await response.json()) as { data?: PSIAuditRecord | null };
    if (response.ok) {
      setSummary(body.data ?? null);
      if (typeof body.data?.overallPass === 'boolean') {
        onChange?.(body.data.overallPass);
      }
    }
  }

  useEffect(() => {
    void loadLatest().finally(() => setLoading(false));
  }, [projectId]);

  async function syncNow() {
    setSyncing(true);
    setNotice(null);
    try {
      const response = await fetch('/api/psi/run', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ projectId })
      });
      const body = (await response.json()) as {
        ok?: boolean;
        data?: { summary?: PSIAuditRecord; records?: PSIAuditRecord[]; message?: string | null };
        error?: { message?: string };
      };
      if (response.ok) {
        const next = body.data?.summary ?? null;
        setSummary(next);
        if (typeof next?.overallPass === 'boolean') {
          onChange?.(next.overallPass);
        }
        setNotice(body.data?.message ?? null);
      } else {
        setNotice(body.error?.message ?? 'PSI refresh failed. Showing the last saved data, if available.');
      }
    } finally {
      setSyncing(false);
    }
  }

  const primary = summary?.primary;
  const latest = primary ?? summary?.records?.[0] ?? null;

  return (
    <section className="flex h-full flex-col rounded-[24px] border border-outline-variant bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">Core Web Vitals</p>
          <h3 className="mt-1 text-3xl font-semibold text-on-surface">{loading ? '...' : value ? 'Pass' : 'Needs Work'}</h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            {summary?.auditedUrls ? `${summary.auditedUrls} URL${summary.auditedUrls > 1 ? 's' : ''} audited` : 'No PSI audit yet'}
          </p>
        </div>
        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
          <Activity className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex-1 space-y-2">
        {latest ? (
          <>
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface-container-low px-3 py-2 text-sm">
              <span className="text-on-surface-variant">LCP</span>
              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${scoreClass(latest.lcp?.score)}`}>
                {(latest.lcp?.value ?? 0) > 0 ? `${((latest.lcp?.value ?? 0) / 1000).toFixed(1)}s` : 'n/a'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface-container-low px-3 py-2 text-sm">
              <span className="text-on-surface-variant">CLS</span>
              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${scoreClass(latest.cls?.score)}`}>
                {(latest.cls?.value ?? 0).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface-container-low px-3 py-2 text-sm">
              <span className="text-on-surface-variant">INP</span>
              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${scoreClass(latest.inp?.score)}`}>
                {Math.round(latest.inp?.value ?? 0)}ms
              </span>
            </div>
          </>
        ) : (
          <p className="rounded-2xl bg-surface-container-low px-3 py-3 text-sm text-on-surface-variant">
            Use PSI sync to populate Core Web Vitals.
          </p>
        )}
      </div>

      {notice ? <p className="mt-3 text-xs leading-5 text-on-surface-variant">{notice}</p> : null}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-outline-variant pt-4 text-xs">
        <span className="inline-flex items-center rounded-full bg-surface-container px-3 py-1 font-semibold text-on-surface-variant">
          Source: PageSpeed Insights
        </span>
        <button
          type="button"
          onClick={() => void syncNow()}
          disabled={syncing}
          className="inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-white px-3 py-2 font-semibold text-on-surface transition-colors hover:bg-surface-container-low disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing' : 'Refresh'}
        </button>
      </div>
    </section>
  );
}
