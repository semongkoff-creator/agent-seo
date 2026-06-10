"use client";

import { useEffect, useRef, useState } from 'react';
import { Loader2, PlayCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AuditProgressDialog } from './AuditProgressDialog';
import type { AuditTaskRecord, AuditTaskPollResponse } from '@/types/audit';

type ApiErrorBody = {
  message?: string;
  details?: {
    cause?: string;
    status?: number;
    dataforseo_status_message?: string | null;
    response_body?: string | null;
  } | null;
};

function formatApiError(error?: ApiErrorBody | null) {
  if (!error) {
    return null;
  }

  const parts = [error.message];
  const details = error.details;

  if (details?.dataforseo_status_message) {
    parts.push(details.dataforseo_status_message);
  }

  if (details?.cause && details.cause !== details.dataforseo_status_message) {
    parts.push(details.cause);
  }

  if (details?.response_body && details.response_body !== details.cause) {
    parts.push(details.response_body);
  }

  return parts.filter(Boolean).join(' | ') || null;
}

export function RunAuditButton({
  projectId,
  label = 'Run Audit',
  className = ''
}: {
  projectId: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [task, setTask] = useState<AuditTaskRecord | null>(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  async function pollTask(taskId: string) {
    const response = await fetch(`/api/audits/status/${taskId}`);
    const body = (await response.json()) as { data?: AuditTaskPollResponse; error?: ApiErrorBody };
    if (!response.ok) {
      throw new Error(formatApiError(body?.error) ?? 'Failed to check audit status');
    }

    const nextTask = body.data?.task ?? null;
    if (nextTask && mountedRef.current) {
      setTask(nextTask);
      if (nextTask.status === 'completed') {
        setMessage('Audit completed. Refreshing technical errors...');
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        router.refresh();
      }
      if (nextTask.status === 'failed') {
        setError(nextTask.errorMessage ?? 'The audit failed.');
      }
      if (nextTask.status === 'cancelled') {
        setMessage('Audit cancelled.');
      }
    }
  }

  async function startAudit() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/audits/run', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ projectId })
      });
      const body = (await response.json()) as { data?: AuditTaskRecord; error?: ApiErrorBody };

      if (!response.ok) {
        throw new Error(formatApiError(body?.error) ?? 'Failed to start audit');
      }

      const nextTask = body.data ?? null;
      setTask(nextTask);
      setOpen(true);

      if (!nextTask?.id) {
        throw new Error('Audit task did not return an id.');
      }

      await pollTask(nextTask.id);

      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }

      intervalRef.current = window.setInterval(() => {
        void pollTask(nextTask.id).catch((pollError) => {
          setError(pollError instanceof Error ? pollError.message : 'Failed to check audit status');
        });
      }, 30_000);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : 'Failed to start audit');
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }

  async function cancelAudit() {
    if (!task?.id) {
      return;
    }

    try {
      const response = await fetch(`/api/audits/cancel/${task.id}`, {
        method: 'POST'
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(body?.error) ?? 'Failed to cancel audit');
      }

      setTask(body.data ?? task);
      setMessage('Audit cancelled.');
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Failed to cancel audit');
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void startAudit()}
        disabled={loading}
        className={[
          'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70',
          className
        ].join(' ')}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
        {label}
      </button>

      <AuditProgressDialog
        open={open}
        task={task}
        message={message}
        error={error}
        onClose={() => {
          if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setOpen(false);
          setMessage(null);
          setError(null);
        }}
        onCancel={() => void cancelAudit()}
      />
    </>
  );
}
