"use client";

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Mail } from 'lucide-react';
import { AuthPanel } from '../_components/AuthPanel';
import {
  authErrorClass,
  authHelpClass,
  authInputClass,
  authLabelClass,
  authLabelTextClass,
  authLinkClass,
  authPrimaryButtonClass,
  authSuccessClass
} from '../_components/authStyles';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setResetLink(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.error?.message ?? 'Failed to send reset email');
      }

      setMessage('Reset instructions were sent if the email exists.');
      if (body?.data?.resetUrl) {
        setResetLink(body.data.resetUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPanel
      eyebrow="Recovery"
      title="Reset your password"
      description="We will send you a recovery link so you can get back into your workspace."
      footer={
        <div className="flex items-center justify-between text-sm">
          <span className="text-on-surface-variant">Remembered it?</span>
          <Link href="/login" className={authLinkClass}>
            Sign in
          </Link>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className={authLabelClass}>
          <span className={authLabelTextClass}>Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={authInputClass}
          />
        </label>

        {error ? (
          <p className={authErrorClass}>
            {error}
          </p>
        ) : null}
        {message ? (
          <div className={authSuccessClass}>
            <p>{message}</p>
            {resetLink ? (
              <p className="mt-2 break-all text-sm font-medium">
                Dev reset link: <Link href={resetLink as any}>{resetLink}</Link>
              </p>
            ) : null}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className={authPrimaryButtonClass}
        >
          <Mail className="h-4 w-4" />
          {loading ? 'Sending...' : 'Send recovery email'}
        </button>
      </form>

      <div className="mt-4">
        <p className={authHelpClass}>
          Use the email tied to your workspace. If the account exists, we will send a reset link right away.
        </p>
      </div>
    </AuthPanel>
  );
}
