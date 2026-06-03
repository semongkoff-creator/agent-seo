'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HelpCircle, Plus, User } from 'lucide-react';
import { primaryNavItems } from './nav-data';
import { getAppCopy, type Locale } from '@/lib/i18n';

function isActive(pathname: string, href: string) {
  if (href === '/dashboard') {
    return pathname === '/' || pathname === '/dashboard';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const copy = getAppCopy(locale).shell;

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-outline-variant bg-surface p-md lg:flex">
      <div className="mb-xl px-sm">
        <h1 className="text-headline-md font-bold text-primary">{copy.appName}</h1>
        <p className="text-body-sm text-on-surface-variant">{copy.subtitle}</p>
      </div>

      <nav className="flex-1 space-y-1">
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href as any}
              className={[
                'flex min-h-11 items-center gap-md rounded-lg px-md py-sm transition-colors',
                active
                  ? 'bg-primary-container font-semibold text-on-primary-container'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              ].join(' ')}
            >
              <Icon className="h-5 w-5" />
              <span className="text-body-md">{copy[item.labelKey]}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-outline-variant pt-md">
        <Link
          href="/projects#new-project"
          className="mb-md flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-on-primary transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          {copy.newProject}
        </Link>

        <div className="space-y-1">
          <Link
            href="/settings"
            className="flex min-h-11 items-center gap-md rounded-lg px-md py-sm text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
          >
            <User className="h-5 w-5" />
            <span className="text-body-md">{copy.profile}</span>
          </Link>
          <Link
            href="/settings"
            className="flex min-h-11 items-center gap-md rounded-lg px-md py-sm text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
          >
            <HelpCircle className="h-5 w-5" />
            <span className="text-body-md">{copy.help}</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
