"use client";

import { Search, Bell, History, ArrowUpRight, Languages } from 'lucide-react';
import Link from 'next/link';
import { MobileSidebarSheet } from './MobileSidebarSheet';
import { getAppCopy, type Locale, LOCALE_COOKIE } from '@/lib/i18n';
import { useTransition } from 'react';

function LanguageToggle({ locale }: { locale: Locale }) {
  const [pending, startTransition] = useTransition();

  function setLocale(nextLocale: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${nextLocale}; path=/; max-age=31536000`;
    startTransition(() => {
      window.location.reload();
    });
  }

  return (
    <div className="inline-flex items-center overflow-hidden rounded-full border border-outline-variant bg-surface-container-low p-1 text-xs font-semibold shadow-sm">
      <span className="inline-flex items-center justify-center gap-1.5 rounded-full px-2.5 py-2 text-on-surface-variant">
        <Languages className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Language</span>
      </span>
      <button
        type="button"
        onClick={() => setLocale('en')}
        disabled={pending}
        className={[
          'rounded-full px-3 py-2 transition-colors',
          locale === 'en'
            ? 'bg-primary text-on-primary'
            : 'text-on-surface-variant hover:bg-surface-container-high',
          pending ? 'cursor-wait opacity-70' : ''
        ].join(' ')}
        aria-pressed={locale === 'en'}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale('id')}
        className={[
          'rounded-full px-3 py-2 transition-colors',
          locale === 'id'
            ? 'bg-primary text-on-primary'
            : 'text-on-surface-variant hover:bg-surface-container-high',
          pending ? 'cursor-wait opacity-70' : ''
        ].join(' ')}
        aria-pressed={locale === 'id'}
        disabled={pending}
      >
        ID
      </button>
    </div>
  );
}

export function TopBar({ locale }: { locale: Locale }) {
  const copy = getAppCopy(locale).shell;

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-outline-variant bg-background px-4 md:px-6 lg:px-8">
      <div className="flex h-full items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <MobileSidebarSheet locale={locale} />
          <div className="hidden md:flex">
            <div className="relative min-w-[280px] lg:min-w-[360px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="search"
                placeholder={copy.searchPlaceholder}
                className="h-11 w-full rounded-full border border-outline-variant bg-surface-container-low pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-outline-variant bg-surface text-on-surface-variant md:hidden"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <LanguageToggle locale={locale} />
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="hidden min-h-11 min-w-11 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high md:inline-flex"
            aria-label="History"
          >
            <History className="h-5 w-5" />
          </button>
          <Link
            href="/projects"
            className="hidden min-h-11 items-center justify-center rounded-lg border border-outline-variant px-4 py-3 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high md:inline-flex"
          >
            {copy.exportData}
          </Link>
          <Link
            href="/identify"
            className="hidden min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90 md:inline-flex"
          >
            {copy.runAudit}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
