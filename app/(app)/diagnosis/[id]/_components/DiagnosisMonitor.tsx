"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCcw, Sparkles } from 'lucide-react';

type DiagnosisMonitorProps = {
  diagnosisId: string;
  projectName: string;
};

const narration = [
  'Checking crawlability, indexability, and site structure.',
  'Comparing intent coverage with current ranking signals.',
  'Estimating authority gaps versus competitor domains.',
  'Evaluating conversion friction across organic landing pages.',
  'Preparing the structured diagnosis payload.',
  'Waiting for the background workflow to finish.'
];

export function DiagnosisMonitor({ diagnosisId, projectName }: DiagnosisMonitorProps) {
  const router = useRouter();
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(12);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ticker = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % narration.length);
      setProgress((current) => Math.min(80, current + 6));
    }, 3500);

    return () => window.clearInterval(ticker);
  }, []);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const response = await fetch(`/api/diagnoses/${diagnosisId}`, { cache: 'no-store' });
        const body = await response.json();
        const status = body?.data?.status ?? body?.status;

        if (!active) return;

        if (status === 'completed' || status === 'failed') {
          router.refresh();
          return;
        }

        setError(null);
      } catch (pollError) {
        if (!active) return;
        setError(pollError instanceof Error ? pollError.message : 'Unable to check diagnosis status');
      }
    };

    void poll();
    const interval = window.setInterval(() => {
      void poll();
    }, 4000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [diagnosisId, router]);

  useEffect(() => {
    const source = new EventSource(`/api/diagnoses/${diagnosisId}/stream`);

    source.addEventListener('connected', (event) => {
      if (event instanceof MessageEvent) {
        setError(null);
      }
    });

    source.addEventListener('diagnosis', (event) => {
      if (!(event instanceof MessageEvent)) {
        return;
      }

      try {
        const payload = JSON.parse(String(event.data)) as { status?: string };
        if (payload.status === 'completed' || payload.status === 'failed') {
          setProgress(100);
          router.refresh();
        } else {
          setError(null);
        }
      } catch {
        // ignore malformed stream payloads, the poll fallback will recover
      }
    });

    source.onerror = () => {
      // Keep the monitoring UI alive; the poll fallback will recover if needed.
    };

    return () => {
      source.close();
    };
  }, [diagnosisId, router]);

  const progressStyle = useMemo(() => ({ width: `${progress}%` }), [progress]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10 md:px-6 lg:px-8">
      <div className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-primary">Diagnosis running</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-on-surface md:text-3xl lg:text-4xl">
              {projectName}
            </h1>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant md:text-base">
              The analysis is still processing in the background. We read the latest status from Supabase and refresh
              as soon as the result is stored.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary">
            <Loader2 className="h-4 w-4 animate-spin" />
            Reading Supabase updates
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-outline-variant bg-white p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-on-surface">Progress</span>
            <span className="font-semibold text-primary">{progress}%</span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface-container-high">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={progressStyle} />
          </div>
          <p className="mt-3 text-sm text-on-surface-variant">{narration[messageIndex]}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-on-surface-variant">Project</p>
          <p className="mt-2 text-lg font-semibold text-on-surface">{projectName}</p>
          <p className="mt-1 text-sm text-on-surface-variant">Diagnosis ID: {diagnosisId}</p>
        </div>
        <div className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-on-surface-variant">Checks</p>
          <ul className="mt-3 space-y-2 text-sm text-on-surface-variant">
            <li className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Crawlability and indexing
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Relevance and authority gaps
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Conversion friction signals
            </li>
          </ul>
        </div>
      </div>

      {error ? (
        <div className="rounded-[28px] border border-error/30 bg-error-container/20 p-5 text-sm text-on-error-container">
          <p className="font-semibold">Monitoring issue</p>
          <p className="mt-2">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      ) : null}
    </div>
  );
}
