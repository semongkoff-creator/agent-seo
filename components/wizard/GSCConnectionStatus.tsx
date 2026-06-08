import { BadgeCheck, CheckCircle2 } from 'lucide-react';
import type { GSCMockData } from '@/types/wizard';

export function GSCConnectionStatus({ data }: { data: GSCMockData }) {
  return (
    <section className="rounded-[24px] border border-emerald-200 bg-emerald-50/80 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white p-3 text-emerald-600 shadow-sm">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Google Search Console</p>
            <h3 className="mt-1 text-lg font-semibold text-emerald-950">Connected mock data</h3>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
          <BadgeCheck className="h-3.5 w-3.5" />
          Mock Data
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-emerald-950">Indexed pages</span>
          <span className="text-2xl font-semibold text-emerald-950">
            {data.indexed} / {data.total}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-emerald-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${Math.min(100, Math.max(0, data.percentage))}%` }}
          />
        </div>
        <p className="text-xs text-emerald-700">{data.percentage}% of pages are indexed</p>
      </div>
    </section>
  );
}
