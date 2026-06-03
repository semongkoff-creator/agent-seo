"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { UserPlus } from 'lucide-react';
import { AuthPanel } from '../_components/AuthPanel';
import {
  authErrorClass,
  authInputClass,
  authLabelClass,
  authLabelTextClass,
  authLinkClass,
  authPrimaryButtonClass
} from '../_components/authStyles';

type RegisterState = {
  fullName: string;
  email: string;
  password: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterState>({ fullName: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form)
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.error?.message ?? 'Failed to create account');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPanel
      eyebrow="Create Account"
      title="Start your workspace"
      description="Create an account to start the SEO diagnosis and objective workflow."
      footer={
        <div className="flex items-center justify-between text-sm">
          <span className="text-on-surface-variant">Already have an account?</span>
          <Link href="/login" className={authLinkClass}>
            Sign in
          </Link>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className={authLabelClass}>
          <span className={authLabelTextClass}>Full Name</span>
          <input
            type="text"
            value={form.fullName}
            onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
            className={authInputClass}
          />
        </label>
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
          <UserPlus className="h-4 w-4" />
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <div className="mt-4">
        <p className="text-sm text-on-surface-variant">
          By continuing, you agree to use this workspace for SEO research and campaign operations.
        </p>
      </div>
    </AuthPanel>
  );
}
