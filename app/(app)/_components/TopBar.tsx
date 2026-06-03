"use client";

import { Search, Bell, History, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { MobileSidebarSheet } from './MobileSidebarSheet';

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-outline-variant bg-background px-4 md:px-6 lg:px-8">
      <div className="flex h-full items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <MobileSidebarSheet />
          <div className="hidden md:flex">
            <div className="relative min-w-[280px] lg:min-w-[360px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="search"
                placeholder="Search keywords, URLs, or projects..."
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
            Export Data
          </Link>
          <Link
            href="/identify"
            className="hidden min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90 md:inline-flex"
          >
            Run Audit
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
