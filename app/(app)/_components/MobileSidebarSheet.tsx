'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { primaryNavItems } from './nav-data';

function isActive(pathname: string, href: string) {
  if (href === '/dashboard') {
    return pathname === '/' || pathname === '/dashboard';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileSidebarSheet() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const title = useMemo(() => {
    const active = primaryNavItems.find((item) => isActive(pathname, item.href));
    return active?.label ?? 'SEO Agent';
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-outline-variant bg-surface text-on-surface-variant lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-on-surface/40"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-[85vw] max-w-sm flex-col border-r border-outline-variant bg-surface p-md shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">SEO Agent</p>
                <h2 className="text-lg font-semibold text-on-surface">{title}</h2>
              </div>
              <button
                type="button"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="space-y-1">
              {primaryNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href as any}
                    onClick={() => setOpen(false)}
                    className={[
                      'flex min-h-11 items-center gap-md rounded-lg px-md py-sm transition-colors',
                      active
                        ? 'bg-primary-container font-semibold text-on-primary-container'
                        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                    ].join(' ')}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-body-md">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      ) : null}
    </>
  );
}
