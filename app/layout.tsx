import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import './globals.css';
import { getLocaleFromValue, LOCALE_COOKIE } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'SEO Agent',
  description: 'SEO diagnosis and objective generation platform'
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const locale = getLocaleFromValue(cookies().get(LOCALE_COOKIE)?.value);

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
