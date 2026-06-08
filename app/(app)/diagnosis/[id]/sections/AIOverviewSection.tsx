"use client";

import { useMemo, useState } from 'react';
import { BadgeCheck, MessageSquare, Sparkles } from 'lucide-react';
import type { AIVisibilityRecord, AIVisibilityEngine } from '@/types/wizard';

const ENGINE_LABELS: Record<AIVisibilityEngine, string> = {
  gemini: 'Gemini',
  chatgpt: 'ChatGPT'
};

function MetricCard({
  label,
  value,
  hint
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-outline-variant bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-on-surface">{value}</p>
      <p className="mt-1 text-xs text-on-surface-variant">{hint}</p>
    </div>
  );
}

export function calculateAIVisibilityMetrics(rows: AIVisibilityRecord[]) {
  if (rows.length === 0) {
    return {
      visibilityScore: 0,
      detectionRate: 0,
      top3Visibility: 0,
      avgPosition: 0
    };
  }

  const visibilityScore = Math.round(rows.reduce((sum, row) => sum + row.visibilityScore, 0) / rows.length);
  const detectionRate = Number((rows.reduce((sum, row) => sum + row.detectionRate, 0) / rows.length).toFixed(1));
  const top3Visibility = rows.reduce((sum, row) => sum + row.top3Visibility, 0);
  const avgPosition = Number((rows.reduce((sum, row) => sum + row.avgPosition, 0) / rows.length).toFixed(2));

  return {
    visibilityScore,
    detectionRate,
    top3Visibility,
    avgPosition
  };
}

export function AIOverviewSection({
  geminiRows,
  chatgptRows
}: {
  geminiRows: AIVisibilityRecord[];
  chatgptRows: AIVisibilityRecord[];
}) {
  const [engine, setEngine] = useState<AIVisibilityEngine>('gemini');
  const rows = engine === 'gemini' ? geminiRows : chatgptRows;
  const metrics = useMemo(() => calculateAIVisibilityMetrics(rows), [rows]);

  return (
    <section className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Section 3</p>
          <h2 className="mt-2 text-2xl font-semibold text-on-surface">AI Overview</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
            Track how often the brand is surfaced in generative search and compare Gemini versus ChatGPT coverage.
          </p>
        </div>

        <div className="inline-flex rounded-full border border-outline-variant bg-white p-1">
          {(['gemini', 'chatgpt'] as const).map((item) => {
            const active = engine === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setEngine(item)}
                className={[
                  'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                  active ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-low'
                ].join(' ')}
              >
                {item === 'gemini' ? <Sparkles className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                {ENGINE_LABELS[item]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Visibility Score" value={`${metrics.visibilityScore}/100`} hint="Overall presence in AI answers" />
        <MetricCard label="Detection Rate" value={`${metrics.detectionRate}%`} hint="Queries that mention the brand" />
        <MetricCard label="Top 3 Visibility" value={String(metrics.top3Visibility)} hint="Keywords appearing in top 3 citations" />
        <MetricCard label="Avg Position" value={metrics.avgPosition ? `#${metrics.avgPosition}` : '-'} hint="Average citation position" />
      </div>

      <div className="mt-5 overflow-hidden rounded-[22px] border border-outline-variant bg-white">
        <div className="flex items-center justify-between border-b border-outline-variant/60 px-4 py-3">
          <p className="text-sm font-semibold text-on-surface">Per-keyword breakdown</p>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <BadgeCheck className="h-3.5 w-3.5" />
            {ENGINE_LABELS[engine]} Mock
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-outline-variant/50">
            <thead className="bg-surface-container-low">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
                <th className="px-4 py-3">Keyword</th>
                <th className="px-4 py-3">Visibility</th>
                <th className="px-4 py-3">Citation Position</th>
                <th className="px-4 py-3">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {rows.map((row) => (
                <tr key={row.id} className="text-sm">
                  <td className="px-4 py-4 font-medium text-on-surface">{row.keyword}</td>
                  <td className="px-4 py-4">
                    <span
                      className={[
                        'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                        row.visibilityScore > 55
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-surface-container-low text-on-surface-variant'
                      ].join(' ')}
                    >
                      {row.visibilityScore > 55 ? 'Visible' : 'Not Visible'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-on-surface-variant">#{row.avgPosition}</td>
                  <td className="px-4 py-4 text-on-surface">{row.visibilityScore}/100</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
