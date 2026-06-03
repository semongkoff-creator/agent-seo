"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { LogIn, Sparkles } from 'lucide-react';
import { AuthPanel } from '../_components/AuthPanel';
import {
  authErrorClass,
  authInputClass,
  authLabelClass,
  authLabelTextClass,
  authLinkClass,
  authPrimaryButtonClass,
  authSecondaryButtonClass
} from '../_components/authStyles';

type LoginState = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<LoginState>({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form)
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.error?.message ?? 'Failed to sign in');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/oauth/google/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ provider: 'google' })
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.error?.message ?? 'Failed to start Google sign in');
      }

      if (body?.data?.url) {
        window.location.href = body.data.url;
      } else {
        throw new Error('OAuth URL missing');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start Google sign in');
      setLoading(false);
    }
  }

  return (
    <AuthPanel
      eyebrow="Sign In"
      title="Welcome back"
      description="Sign in to your SEO Agent workspace and continue the guided analysis flow."
      footer={
        <div className="flex items-center justify-between text-sm">
          <span className="text-on-surface-variant">No account yet?</span>
          <Link href="/register" className={authLinkClass}>
            Create account
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
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            className={authInputClass}
          />
        </label>
        <label className={authLabelClass}>
          <span className={authLabelTextClass}>Password</span>
          <input
            type="password"
            required
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            className={authInputClass}
          />
        </label>

        {error ? (
          <p className={authErrorClass}>
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className={authPrimaryButtonClass}
        >
          <LogIn className="h-4 w-4" />
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <button
          type="button"
          onClick={onGoogle}
          className={authSecondaryButtonClass}
        >
          <Sparkles className="h-4 w-4 text-primary" />
          Continue with Google
        </button>
        <Link href="/forgot-password" className="text-center text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary">
          Forgot password?
        </Link>
      </div>
    </AuthPanel>
  );
}
