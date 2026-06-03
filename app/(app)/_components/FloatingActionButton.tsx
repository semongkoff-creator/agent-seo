'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';

export function FloatingActionButton({ href = '/identify' }: { href?: string }) {
  return (
    <Link
      href={href}
      aria-label="Create new project"
      className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 lg:hidden"
    >
      <Plus className="h-6 w-6" />
    </Link>
  );
}
