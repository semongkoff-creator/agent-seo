import type { Metadata } from 'next';
import { ResetPasswordClient } from './ResetPasswordClient';

export const metadata: Metadata = {
  title: 'Reset Password | SEO Agent'
};

export default function ResetPasswordPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const token = typeof searchParams?.token === 'string' ? searchParams.token : '';

  return <ResetPasswordClient initialToken={token} />;
}
