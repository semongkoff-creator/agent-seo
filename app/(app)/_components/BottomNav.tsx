'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, FolderKanban, LayoutDashboard, Megaphone, Settings } from 'lucide-react';

const items = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/diagnosis', label: 'Diagnoses', icon: Activity },
  { href: '/campaign', label: 'Campaigns', icon: Megaphone },
  { href: '/settings', label: 'Settings', icon: Settings }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant bg-surface lg:hidden">
      <div className="grid h-16 grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex min-h-16 flex-col items-center justify-center gap-1 px-2 text-[11px] transition-colors',
                active ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant'
              ].join(' ')}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
