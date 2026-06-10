"use client";

import { useEffect, useState } from 'react';
import { RefreshCw, Smartphone } from 'lucide-react';

type GSCInspectionSummary = {
  sourceLabel?: string;
  mobileUsabilityIssuesTotal?: number;
  mobileUsabilityBreakdown?: Record<string, number>;
  inspectedUrls?: number;
  inspectedAt?: string;
};

function formatLabel(value: string) {
  return value.replace(/_/g, ' ');
}

export function MobileUsabilityCard({
  projectId,
  value,
  onChange
}: {
  projectId: string;
  value: number;
  onChange?: (value: number) => void;
}) {
  const [summary, setSummary] = useState<GSCInspectionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  async function loadLatest() {
    const response = await fetch(`/api/gsc/status/${projectId}`);
    const body = (await response.json()) as { data?: GSCInspectionSummary | null };
    if (response.ok) {
      setSummary(body.data ?? null);
      if (typeof body.data?.mobileUsabilityIssuesTotal === 'number') {
        onChange?.(body.data.mobileUsabilityIssuesTotal);
      }
    }
  }

  useEffect(() => {
    void loadLatest().finally(() => setLoading(false));
  }, [projectId]);

  async function syncNow() {
    setSyncing(true);
    try {
      const response = await fetch('/api/gsc/inspect-batch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ projectId })
      });
      const body = (await response.json()) as { data?: GSCInspectionSummary | null };
      if (response.ok) {
        const next = body.data ?? null;
        setSummary(next);
        if (typeof next?.mobileUsabilityIssuesTotal === 'number') {
          onChange?.(next.mobileUsabilityIssuesTotal);
        }
      }
    } finally {
      setSyncing(false);
    }
  }

  const breakdown = summary?.mobileUsabilityBreakdown ?? {};
  const topBreakdown = Object.entries(breakdown).slice(0, 3);

  return (
    <section className="flex h-full flex-col rounded-[24px] border border-outline-variant bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">Mobile Usability</p>
          <h3 className="mt-1 text-3xl font-semibold text-on-surface">{loading ? '...' : value}</h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            {summary?.inspectedUrls ? `${summary.inspectedUrls} URLs inspected` : 'No GSC inspection yet'}
          </p>
        </div>
        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
          <Smartphone className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex-1 space-y-2 rounded-2xl bg-surface-container-low p-3">
        {topBreakdown.length > 0 ? (
          topBreakdown.map(([label, count]) => (
            <div key={label} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-on-surface-variant">{formatLabel(label)}</span>
              <span className="font-semibold text-on-surface">{count}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-on-surface-variant">Use GSC sync to populate mobile usability issues.</p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-outline-variant pt-4 text-xs">
        <span className="inline-flex items-center rounded-full bg-surface-container px-3 py-1 font-semibold text-on-surface-variant">
          Source: GSC URL Inspection
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
