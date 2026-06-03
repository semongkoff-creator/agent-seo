import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { FloatingActionButton } from './_components/FloatingActionButton';
import { BottomNav } from './_components/BottomNav';
import { Sidebar } from './_components/Sidebar';
import { TopBar } from './_components/TopBar';
import { getLocaleFromValue, LOCALE_COOKIE } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default function AppLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const locale = getLocaleFromValue(cookies().get(LOCALE_COOKIE)?.value);

  return (
    <div className="min-h-screen bg-background text-on-surface lg:flex">
      <Sidebar locale={locale} />
      <div className="flex min-h-screen flex-1 flex-col lg:pl-60">
        <TopBar locale={locale} />
        <main className="flex-1 pb-20 lg:pb-0">{children}</main>
        <BottomNav locale={locale} />
      </div>
      <FloatingActionButton href="/identify" locale={locale} />
    </div>
  );
}
