"use client";

import { useRouter } from 'next/navigation';
import { LogOut, ShieldAlert, X } from 'lucide-react';
import { useState } from 'react';

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function LogoutButton({
  compact = false,
  onLoggedOut
}: {
  compact?: boolean;
  onLoggedOut?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      const body = await readJson(response);
      if (!response.ok) {
        throw new Error(body?.error?.message ?? 'Failed to logout');
      }

      onLoggedOut?.();
      router.push('/login');
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to logout');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={loading}
        className={[
          'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-white px-4 py-3 text-sm font-semibold text-on-surface shadow-sm transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-70',
          compact ? 'w-full' : 'w-auto'
        ].join(' ')}
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>

      {open ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/70 bg-white/92 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.45)]">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-amber-300 to-rose-400" />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant bg-white text-on-surface-variant transition-colors hover:text-on-surface"
              aria-label="Close logout dialog"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="px-6 pb-6 pt-8 sm:px-8 sm:pt-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-700">
                <ShieldAlert className="h-3.5 w-3.5" />
                Logout confirmation
              </div>

              <h3 className="mt-4 text-2xl font-semibold tracking-tight text-on-surface">Keluar dari akun ini?</h3>
              <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                Kamu akan keluar dari sesi aktif dan perlu login lagi untuk lanjut mengelola project, diagnosis, dan integrasi.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-outline-variant bg-white px-4 py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setOpen(false);
                    await handleLogout();
                  }}
                  disabled={loading}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <LogOut className="h-4 w-4" />
                  {loading ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
