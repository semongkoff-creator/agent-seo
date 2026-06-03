"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Copy, Settings2 } from 'lucide-react';

type IntegrationActionButtonProps = {
  provider: string;
  connected: boolean;
  label: string;
};

type RevokeApiKeyButtonProps = {
  id: string;
  label: string;
};

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function IntegrationActionButton({ provider, connected, label }: IntegrationActionButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);

    try {
      if (connected) {
        const response = await fetch(`/api/integrations/${provider}`, { method: 'DELETE' });
        const body = await readJson(response);
        if (!response.ok) {
          throw new Error(body?.error?.message ?? 'Failed to disconnect integration');
        }
      } else {
        const apiKey = window.prompt(`Enter ${label} API key (optional)`) ?? undefined;
        const propertyId = window.prompt(`Enter ${label} property ID (optional)`) ?? undefined;
        const propertyName = window.prompt(`Enter ${label} property name (optional)`) ?? undefined;

        const response = await fetch(`/api/integrations/${provider}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            apiKey: apiKey || undefined,
            property: propertyId
              ? {
                  propertyId,
                  propertyName: propertyName || undefined
                }
              : undefined
          })
        });
        const body = await readJson(response);
        if (!response.ok) {
          throw new Error(body?.error?.message ?? 'Failed to connect integration');
        }
      }

      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Action failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={[
        'inline-flex min-h-11 w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70',
        connected ? 'border border-outline-variant bg-white text-on-surface' : 'bg-primary text-on-primary'
      ].join(' ')}
    >
      {loading ? 'Working...' : connected ? 'Disconnect' : 'Connect Account'}
    </button>
  );
}

export function RevokeApiKeyButton({ id, label }: RevokeApiKeyButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    const confirmed = window.confirm(`Revoke API key "${label}"?`);
    if (!confirmed) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/api-keys/${id}`, { method: 'DELETE' });
      const body = await readJson(response);
      if (!response.ok) {
        throw new Error(body?.error?.message ?? 'Failed to revoke API key');
      }
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Action failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex min-h-11 items-center justify-center rounded-full p-2 text-on-surface-variant transition-colors hover:text-error disabled:cursor-not-allowed disabled:opacity-70"
      aria-label={`Revoke ${label}`}
    >
      <Settings2 className="h-4 w-4" />
    </button>
  );
}

export function CopyApiKeyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1 text-on-surface-variant transition-colors hover:text-primary"
      aria-label="Copy API key"
    >
      <Copy className="h-4 w-4" />
      <span className="text-xs font-semibold">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}
