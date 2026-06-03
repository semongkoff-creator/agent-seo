"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RefreshCcw } from 'lucide-react';

type RetryDiagnosisButtonProps = {
  diagnosisId: string;
  label?: string;
};

export function RetryDiagnosisButton({ diagnosisId, label = 'Retry diagnosis' }: RetryDiagnosisButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onRetry() {
    setLoading(true);

    try {
      const response = await fetch(`/api/diagnoses/${diagnosisId}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ reason: 'rerun' })
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.error?.message ?? 'Failed to retry diagnosis');
      }

      router.push(`/diagnosis/${body?.data?.diagnosisId ?? diagnosisId}`);
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to retry diagnosis');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onRetry}
      disabled={loading}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <RefreshCcw className="h-4 w-4" />
      {loading ? 'Retrying...' : label}
    </button>
  );
}
