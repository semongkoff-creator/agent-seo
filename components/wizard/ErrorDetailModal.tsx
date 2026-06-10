"use client";

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { TechnicalErrorRecord } from '@/types/wizard';
import { formatAffectedUrlLabel } from '@/lib/technical-errors';
import { HowToFixContent } from './HowToFixContent';

type TabKey = 'affected_urls' | 'how_to_fix';

export function ErrorDetailModal({
  error,
  onClose
}: {
  error: TechnicalErrorRecord | null;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('affected_urls');

  const tabs = useMemo(
    () => [
      { key: 'affected_urls' as const, label: 'Affected URLs' },
      { key: 'how_to_fix' as const, label: 'How to Fix' }
    ],
    []
  );

  useEffect(() => {
    setActiveTab('affected_urls');
  }, [error?.id]);

  if (!error) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-4 sm:items-center sm:py-8">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close dialog overlay"
        onClick={onClose}
      />

      <div className="relative z-10 w-[min(96vw,980px)] max-h-[calc(100vh-2rem)] overflow-hidden rounded-[32px] border border-outline-variant bg-surface-container-lowest shadow-2xl sm:max-h-[calc(100vh-4rem)]">
        <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4 md:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">Technical Error Detail</p>
            <h3 className="mt-1 text-xl font-semibold text-on-surface">{error.errorType}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container-low"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto p-5 md:p-6">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
              <span className="rounded-full bg-surface-container px-3 py-1">{error.source}</span>
              <span className="rounded-full bg-surface-container px-3 py-1">{error.severity}</span>
              <span className="rounded-full bg-surface-container px-3 py-1">{error.status}</span>
              <span className="rounded-full bg-surface-container px-3 py-1">{error.count} URLs</span>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-outline-variant pb-3">
              {tabs.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={[
                      'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                      active ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                    ].join(' ')}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {activeTab === 'affected_urls' ? (
              <section className="space-y-3 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold text-on-surface">Affected URLs</h4>
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                    {error.affectedUrls.length} items
                  </span>
                </div>

                <div className="space-y-3">
                  {error.affectedUrls.length > 0 ? (
                    error.affectedUrls.map((item) => (
                      <div key={`${item.url}-${item.reason ?? 'url'}`} className="rounded-2xl border border-outline-variant bg-white p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-mono text-sm text-primary">{item.url}</p>
                            {item.reason ? <p className="mt-1 text-sm text-on-surface-variant">{item.reason}</p> : null}
                          </div>
                          <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                            {typeof item.statusCode === 'number' ? (
                              <span className="rounded-full bg-surface-container px-2.5 py-1">HTTP {item.statusCode}</span>
                            ) : null}
                            {item.detectedAt ? <span className="rounded-full bg-surface-container px-2.5 py-1">{item.detectedAt}</span> : null}
                          </div>
                        </div>

                        {item.additionalInfo && Object.keys(item.additionalInfo).length > 0 ? (
                          <pre className="mt-3 overflow-x-auto rounded-2xl bg-surface-container-low p-3 text-xs text-on-surface-variant">
                            {JSON.stringify(item.additionalInfo, null, 2)}
                          </pre>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-outline-variant bg-white p-4 text-sm text-on-surface-variant">
                      No URL-level details available for this issue.
                    </div>
                  )}
                </div>
              </section>
            ) : (
              <HowToFixContent errorType={error.errorType} />
            )}

            <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
              <h4 className="text-sm font-semibold text-on-surface">Quick Summary</h4>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                {error.errorType} is affecting {error.count} URL{error.count > 1 ? 's' : ''}.{' '}
                {error.affectedUrls.length > 0 ? `The first affected URL is ${formatAffectedUrlLabel(error.affectedUrls[0])}.` : ''}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
