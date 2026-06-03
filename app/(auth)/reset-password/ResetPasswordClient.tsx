"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { LockKeyhole } from 'lucide-react';
import { AuthPanel } from '../_components/AuthPanel';
import {
  authErrorClass,
  authHelpClass,
  authInputClass,
  authLabelClass,
  authLabelTextClass,
  authLinkClass,
  authPrimaryButtonClass
} from '../_components/authStyles';

type ResetPasswordClientProps = {
  initialToken?: string;
};

export function ResetPasswordClient({ initialToken = '' }: ResetPasswordClientProps) {
  const router = useRouter();
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.error?.message ?? 'Failed to reset password');
      }

      router.push('/login');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPanel
      eyebrow="Reset Password"
      title="Choose a new password"
      description="Enter the reset token from your email and set a fresh password."
      footer={
        <div className="flex items-center justify-between text-sm">
          <span className="text-on-surface-variant">Need to go back?</span>
          <Link href="/login" className={authLinkClass}>
            Sign in
          </Link>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className={authLabelClass}>
          <span className={authLabelTextClass}>Reset Token</span>
          <input
            type="text"
            required
            value={token}
            onChange={(event) => setToken(event.target.value)}
            className={authInputClass}
          />
        </label>
        <label className={authLabelClass}>
          <span className={authLabelTextClass}>New Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={authInputClass}
          />
        </label>
        <label className={authLabelClass}>
          <span className={authLabelTextClass}>Confirm Password</span>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={authInputClass}
          />
        </label>

        {error ? <p className={authErrorClass}>{error}</p> : null}

        <button type="submit" disabled={loading} className={authPrimaryButtonClass}>
          <LockKeyhole className="h-4 w-4" />
          {loading ? 'Updating password...' : 'Update password'}
        </button>
      </form>

      <div className="mt-4">
        <p className={authHelpClass}>
          The token can be pasted from the recovery link in your inbox. Once it is verified, the new password will
          replace the old one immediately.
        </p>
      </div>
    </AuthPanel>
  );
}
