'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function AppError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-md rounded-[28px] border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-error-container text-error">
          <span className="text-xl font-semibold">!</span>
        </div>
        <h1 className="mt-5 text-center text-2xl font-semibold tracking-tight text-on-surface">Something went wrong</h1>
        <p className="mt-3 text-center text-sm leading-6 text-on-surface-variant">
          Please try again. If the issue keeps happening, go back to Projects and reopen the workflow.
        </p>
        {error.digest ? (
          <p className="mt-4 rounded-2xl bg-surface-container-low px-4 py-3 text-center font-mono text-xs text-on-surface-variant">
            Error ID: {error.digest}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
          >
            Try again
          </button>
          <Link
            href="/projects"
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-outline-variant bg-white px-4 py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    </div>
  );
}
