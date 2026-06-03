import type { ReactNode } from 'react';
import { FloatingActionButton } from './_components/FloatingActionButton';
import { BottomNav } from './_components/BottomNav';
import { Sidebar } from './_components/Sidebar';
import { TopBar } from './_components/TopBar';

export default function AppLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background text-on-surface lg:flex">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col lg:pl-60">
        <TopBar />
        <main className="flex-1 pb-20 lg:pb-0">{children}</main>
        <BottomNav />
      </div>
      <FloatingActionButton href="/identify" />
    </div>
  );
}
