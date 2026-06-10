import { BadgeCheck, CheckCircle2 } from 'lucide-react';
import type { GSCMockData } from '@/types/wizard';

export function GSCConnectionStatus({ data }: { data: GSCMockData }) {
  const isRealData = data.source && data.source !== 'mock';
  const methodLabel =
    data.measurementMethod === 'url_inspection'
      ? 'URL inspection'
      : data.measurementMethod === 'hybrid_estimate'
        ? 'Hybrid estimate'
        : data.measurementMethod === 'sitemap_fallback'
          ? 'Sitemap fallback'
          : null;

  return (
    <section className="rounded-[24px] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white p-3 text-emerald-600 shadow-sm">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Google Search Console</p>
            <h3 className="mt-1 text-lg font-semibold text-emerald-950">
              {isRealData ? 'Live index coverage' : 'Preview index coverage'}
            </h3>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
          <BadgeCheck className="h-3.5 w-3.5" />
          {isRealData ? 'Live' : 'Preview'}
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
        <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-700">
          <span>{data.percentage}% of pages are indexed</span>
          {methodLabel ? (
            <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 font-medium shadow-sm">
              {methodLabel}
              {data.confidence ? ` • ${data.confidence}` : ''}
              {typeof data.sampleSize === 'number' ? ` • sample ${data.sampleSize}` : ''}
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
