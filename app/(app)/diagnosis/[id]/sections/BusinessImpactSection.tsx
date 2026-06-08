"use client";

import { useMemo } from 'react';
import { Activity } from 'lucide-react';
import type { GA4MockData, KeywordOwningRecord } from '@/types/wizard';

function MetricCard({
  label,
  value,
  subtitle
}: {
  label: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl border border-outline-variant bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-on-surface">{value}</p>
      {subtitle ? <p className="mt-1 text-xs text-on-surface-variant">{subtitle}</p> : null}
    </div>
  );
}

function DonutChart({ newVisitors, returningVisitors }: { newVisitors: number; returningVisitors: number }) {
  const total = Math.max(1, newVisitors + returningVisitors);
  const returningPct = (returningVisitors / total) * 100;

  return (
    <div className="relative mx-auto flex h-40 w-40 items-center justify-center rounded-full bg-[conic-gradient(var(--tw-gradient-stops))] from-primary via-primary to-secondary shadow-inner">
      <div
        className="absolute inset-4 rounded-full bg-white"
        style={{
          background: `conic-gradient(#4F46E5 0 ${100 - returningPct}%, #A78BFA ${100 - returningPct}% 100%)`
        }}
      />
      <div className="relative z-10 rounded-full bg-white px-4 py-3 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">Total Visitor</p>
        <p className="mt-1 text-xl font-semibold text-on-surface">{total.toLocaleString()}</p>
      </div>
    </div>
  );
}

export function BusinessImpactSection({
  ga4,
  keywordOwning
}: {
  ga4: GA4MockData;
  keywordOwning: KeywordOwningRecord;
}) {
  const bounceRate = typeof ga4.bounceRate === 'number' ? ga4.bounceRate : 41;
  const conversionRate = typeof ga4.conversionRate === 'number' ? ga4.conversionRate : 2.4;
  const visitorShare = useMemo(() => {
    const total = Math.max(1, ga4.visitor.total);
    return {
      newPct: Math.round((ga4.visitor.new / total) * 100),
      returningPct: Math.round((ga4.visitor.returning / total) * 100)
    };
  }, [ga4.visitor.new, ga4.visitor.returning, ga4.visitor.total]);

  return (
    <section className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Section 4</p>
          <h2 className="mt-2 text-2xl font-semibold text-on-surface">Business Impact</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
            Tie the diagnosis back to traffic quality, engagement, and keyword ownership so the objective stays business-first.
          </p>
        </div>

        <div className="rounded-2xl border border-outline-variant bg-white px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">Keyword Owning</p>
          <p className="mt-1 text-2xl font-semibold text-on-surface">
            {keywordOwning.top10}/{keywordOwning.total}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="rounded-[24px] border border-outline-variant bg-white p-5 shadow-sm">
          <DonutChart newVisitors={ga4.visitor.new} returningVisitors={ga4.visitor.returning} />
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-on-surface-variant">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              New {visitorShare.newPct}%
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
              Returning {visitorShare.returningPct}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Session" value={ga4.session.value.toLocaleString()} subtitle={`${ga4.session.trendPct}% vs 30d`} />
          <MetricCard label="Page View" value={ga4.pageView.value.toLocaleString()} subtitle={`${ga4.pageView.trendPct}% vs 30d`} />
          <MetricCard label="Engagement Rate" value={`${ga4.engagementRate.value}%`} subtitle={`Benchmark ${ga4.engagementRate.benchmark}%`} />
          <MetricCard label="Bounce Rate" value={`${bounceRate}%`} subtitle="Derived from GA4 mock data" />
          <MetricCard label="Conversion Rate" value={`${conversionRate}%`} subtitle="Organic conversion proxy" />
        </div>
      </div>

      <div className="mt-5 rounded-[22px] border border-outline-variant bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
          <Activity className="h-4 w-4 text-primary" />
          Keyword Owning Counter
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetricCard label="Top 10" value={keywordOwning.top10.toString()} subtitle="Keywords already winning" />
          <MetricCard label="Top 3" value={keywordOwning.top3.toString()} subtitle="Highest-value wins" />
          <MetricCard label="Total" value={keywordOwning.total.toString()} subtitle="Tracked keywords in total" />
        </div>
      </div>
    </section>
  );
}
