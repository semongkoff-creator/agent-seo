"use client";

import { useMemo, useState } from 'react';
import { ArrowUpRight, ChevronDown, ChevronUp } from 'lucide-react';
import type { KeywordPositionRecord } from '@/types/wizard';

const filters = [
  { value: 'all', label: 'All Keywords' },
  { value: 'top10', label: 'Top 10' },
  { value: 'opportunity', label: 'Opportunity (11-30)' },
  { value: 'longtail', label: 'Long-tail (31+)' }
] as const;

function trendGlyph(trend: KeywordPositionRecord['trend']) {
  switch (trend) {
    case 'up':
      return <ChevronUp className="h-4 w-4 text-emerald-600" />;
    case 'down':
      return <ChevronDown className="h-4 w-4 text-rose-600" />;
    case 'new':
      return <ArrowUpRight className="h-4 w-4 text-primary" />;
    default:
      return <span className="text-xs font-semibold text-on-surface-variant">Flat</span>;
  }
}

function positionTone(position: number) {
  if (position <= 3) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (position <= 10) return 'bg-primary/10 text-primary border-primary/20';
  if (position <= 30) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-surface-container-low text-on-surface-variant border-outline-variant';
}

export function KeywordPositionSection({
  rows
}: {
  rows: KeywordPositionRecord[];
}) {
  const [filter, setFilter] = useState<(typeof filters)[number]['value']>('all');

  const filteredRows = useMemo(() => {
    switch (filter) {
      case 'top10':
        return rows.filter((row) => row.position <= 10);
      case 'opportunity':
        return rows.filter((row) => row.position >= 11 && row.position <= 30);
      case 'longtail':
        return rows.filter((row) => row.position >= 31);
      default:
        return rows;
    }
  }, [filter, rows]);

  return (
    <section className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Section 2</p>
          <h2 className="mt-2 text-2xl font-semibold text-on-surface">Keyword Position</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
            See which keywords are already winning, which ones need a push, and where the opportunity gap sits.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((item) => {
            const active = filter === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={[
                  'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                  active
                    ? 'border-primary bg-primary text-on-primary'
                    : 'border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-low'
                ].join(' ')}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-[22px] border border-outline-variant bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-outline-variant/50">
            <thead className="bg-surface-container-low">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
                <th className="px-4 py-3">Keyword</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">URL Ranking</th>
                <th className="px-4 py-3">Volume</th>
                <th className="px-4 py-3">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {filteredRows.length > 0 ? (
                filteredRows.map((row) => (
                  <tr key={row.id} className="text-sm">
                    <td className="px-4 py-4 font-medium text-on-surface">{row.keyword}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${positionTone(row.position)}`}>
                        #{row.position}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-primary">{row.urlRanking || '-'}</td>
                    <td className="px-4 py-4 text-on-surface-variant">{row.searchVolume.toLocaleString()}</td>
                    <td className="px-4 py-4">{trendGlyph(row.trend)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8 text-sm text-on-surface-variant" colSpan={5}>
                    No keywords match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
