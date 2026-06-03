'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getAppCopy, type Locale } from '@/lib/i18n';

export function FloatingActionButton({
  href = '/projects#new-project',
  locale
}: {
  href?: string;
  locale: Locale;
}) {
  const copy = getAppCopy(locale).shell;

  return (
    <Link
      href={href as any}
      aria-label={copy.newProject}
      className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 lg:hidden"
    >
      <Plus className="h-6 w-6" />
    </Link>
  );
}
