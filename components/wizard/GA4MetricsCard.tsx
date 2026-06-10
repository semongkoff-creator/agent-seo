import { BadgeCheck, LineChart, MousePointerClick, Users2, Zap } from 'lucide-react';
import { formatPercentValue } from '@/lib/formatters/percent';
import type { GA4MockData } from '@/types/wizard';

function MetricBox({
  label,
  value,
  trend,
  benchmark,
  subtitle
}: {
  label: string;
  value: string;
  trend?: number;
  benchmark?: number;
  subtitle?: string;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-outline-variant bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant leading-4 break-words">
        {label}
      </p>
      <p className="mt-2 break-words text-xl font-semibold tracking-tight text-on-surface sm:text-2xl">{value}</p>
      {typeof trend === 'number' ? (
        <p className={`mt-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trend >= 0 ? 'Up' : 'Down'} {Math.abs(trend)}% vs 30d
        </p>
      ) : null}
      {typeof benchmark === 'number' ? (
        <p className="mt-1 text-xs text-on-surface-variant">Benchmark: {benchmark}%</p>
      ) : null}
      {subtitle ? <p className="mt-1 text-xs text-on-surface-variant">{subtitle}</p> : null}
    </div>
  );
}

function formatCount(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}

export function GA4MetricsCard({ data }: { data: GA4MockData }) {
  const isRealData = data.source && data.source !== 'mock';

  return (
    <section className="rounded-[24px] border border-outline-variant bg-gradient-to-br from-surface-container-lowest to-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">Google Analytics 4</p>
          <h3 className="mt-1 text-lg font-semibold text-on-surface">
            {isRealData ? 'Live traffic overview' : 'Preview traffic overview'}
          </h3>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-container px-3 py-1 text-xs font-semibold text-primary">
          <BadgeCheck className="h-3.5 w-3.5" />
          {isRealData ? 'Live' : 'Preview'}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MetricBox label="Traffic" value={formatCount(data.session.value)} trend={data.session.trendPct} />
        <MetricBox label="Page Views" value={formatCount(data.pageView.value)} trend={data.pageView.trendPct} />
        <MetricBox
          label="Engagement Rate"
          value={formatPercentValue(data.engagementRate.value)}
          benchmark={data.engagementRate.benchmark}
        />
        <MetricBox
          label="Total Visitors"
          value={formatCount(data.visitor.total)}
          subtitle={`${formatCount(data.visitor.new)} new + ${formatCount(data.visitor.returning)} returning`}
        />
      </div>
    </section>
  );
}
