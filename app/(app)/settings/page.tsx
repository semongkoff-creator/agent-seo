import Link from 'next/link';
import { Globe, KeyRound, PenSquare, Plus, Sparkles } from 'lucide-react';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { db } from '@/lib/db/client';
import { requireUser } from '@/lib/auth/session';
import { listApiKeys } from '@/lib/services/api-keys';
import { listIntegrations } from '@/lib/services/integrations';
import {
  CopyApiKeyButton,
  IntegrationActionButton,
  RevokeApiKeyButton
} from './_components/SettingsActions';

const integrationLabels: Record<string, { name: string; description: string; accent: string; detailLabel: string }> = {
  gsc: {
    name: 'Search Console',
    description: 'Sync keywords and performance data.',
    accent: 'text-[#4285F4]',
    detailLabel: 'Last sync'
  },
  ga4: {
    name: 'Google Analytics 4',
    description: 'Track conversions and user behavior.',
    accent: 'text-[#FF9800]',
    detailLabel: 'Active property'
  },
  ahrefs: {
    name: 'Ahrefs API',
    description: 'Import backlink profile and ranking.',
    accent: 'text-primary',
    detailLabel: 'Credits left'
  },
  semrush: {
    name: 'SEMRush',
    description: 'Competitive audit and market data.',
    accent: 'text-[#FF642D]',
    detailLabel: 'Sync frequency'
  }
};

function formatDate(value: unknown) {
  if (typeof value !== 'string' || !value) {
    return 'Recently';
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'Recently' : parsed.toLocaleDateString();
}

export default async function SettingsPage() {
  const user = await requireUser();
  const [profileResult, integrationsResult, apiKeysResult] = await Promise.all([
    db
      .from('users')
      .select('id, email, full_name, avatar_url, role, plan, timezone')
      .eq('id', user.id)
      .maybeSingle(),
    listIntegrations(user.id),
    listApiKeys(user.id)
  ]);

  const profile = profileResult.data;
  const profileName = profile?.full_name ?? user.fullName ?? 'Alex Rivera';
  const profileEmail = profile?.email ?? user.email ?? 'alex.rivera@techflow.io';
  const profileRole = profile?.role ?? user.role ?? 'Senior SEO Strategist';
  const profileTimezone = profile?.timezone ?? 'Pacific Time (PT)';
  const avatarLabel =
    profileName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0])
      .join('')
      .toUpperCase() || 'AR';

  const integrations = (integrationsResult.items.length > 0 ? integrationsResult.items : ['gsc', 'ga4', 'ahrefs', 'semrush']).map(
    (integration, index) => {
      if (typeof integration === 'string') {
        const preset = integrationLabels[integration] ?? integrationLabels.gsc;
        return {
          key: integration,
          ...preset,
          status: index < 2 ? 'Connected' : 'Not Connected',
          detailValue: index < 2 ? (integration === 'ga4' ? 'UA-8231...' : '12m ago') : index === 2 ? '--' : 'Daily'
        };
      }

      const record = integration as Record<string, unknown>;
      const provider = typeof record.provider === 'string' ? record.provider : 'gsc';
      const preset = integrationLabels[provider] ?? integrationLabels.gsc;
      const status =
        typeof record.status === 'string'
          ? record.status
          : 'disconnected';
      const detailValue =
        provider === 'gsc'
          ? formatDate(record.last_sync_at)
          : provider === 'ga4'
            ? (typeof record.metadata === 'object' && record.metadata !== null && typeof (record.metadata as Record<string, unknown>).propertyId === 'string'
                ? String((record.metadata as Record<string, unknown>).propertyId)
                : 'UA-8231...')
            : provider === 'ahrefs'
              ? (typeof record.metadata === 'object' && record.metadata !== null && typeof (record.metadata as Record<string, unknown>).credits === 'number'
                  ? String((record.metadata as Record<string, unknown>).credits)
                  : '--')
              : 'Daily';

      return {
        key: typeof record.id === 'string' ? record.id : provider,
        ...preset,
        status: status === 'connected' ? 'Connected' : 'Not Connected',
        detailValue
      };
    }
  );

  const apiKeys = apiKeysResult.items.length > 0 ? apiKeysResult.items : [
    {
      id: 'live-1',
      label: 'Production Copilot',
      key_prefix: 'sk_live_',
      created_at: '2023-10-24T00:00:00Z',
      environment: 'live',
      last_used_at: null,
      expires_at: null,
      revoked_at: null
    },
    {
      id: 'test-1',
      label: 'Staging Test Key',
      key_prefix: 'sk_test_',
      created_at: '2023-09-12T00:00:00Z',
      environment: 'test',
      last_used_at: null,
      expires_at: null,
      revoked_at: null
    }
  ];

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Settings</p>
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-on-surface md:text-3xl lg:text-4xl">
                Manage Settings
              </h1>
              <p className="hidden max-w-3xl text-sm leading-6 text-on-surface-variant sm:block md:text-base">
                Manage your account configurations, team preferences, and API integrations.
              </p>
            </div>
            <Link
              href="/identify"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              New Project
            </Link>
          </div>
        </div>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.32fr)_minmax(0,0.68fr)]">
          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm">
                {avatarLabel}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">Profile</p>
                <h2 className="mt-1 text-2xl font-semibold text-on-surface">{profileName}</h2>
                <p className="mt-1 text-sm text-on-surface-variant">{profileRole}</p>
              </div>
            </div>

            <div className="mt-6 space-y-4 text-sm text-on-surface-variant">
              <p>
                Update your personal information and how others see you on the platform. The profile area stays simple
                here so it is easy to scan on mobile.
              </p>
              <div className="rounded-2xl bg-surface-container-low p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Account highlights
                </div>
                <ul className="mt-3 space-y-2">
                  <li>Primary timezone: {profileTimezone}</li>
                  <li>Role: {profileRole}</li>
                  <li>Account email: {profileEmail}</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                  Full Name
                </span>
                <input
                  type="text"
                  defaultValue={profileName}
                  className="h-11 rounded-xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                  Email Address
                </span>
                <input
                  type="email"
                  defaultValue={profileEmail}
                  className="h-11 rounded-xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                  Role
                </span>
                <select defaultValue={profileRole} className="h-11 rounded-xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                  <option>Senior SEO Strategist</option>
                  <option>Project Manager</option>
                  <option>Developer</option>
                </select>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                  Timezone
                </span>
                <select defaultValue={profileTimezone} className="h-11 rounded-xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                  <option>Pacific Time (PT)</option>
                  <option>Eastern Time (ET)</option>
                  <option>Greenwich Mean Time (GMT)</option>
                </select>
              </label>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
              >
                <PenSquare className="h-4 w-4" />
                Save Profile
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between border-b border-outline-variant pb-2">
            <h2 className="text-xl font-semibold text-on-surface">API Integrations</h2>
            <button type="button" className="text-sm font-semibold text-primary underline underline-offset-4">
              View Documentation
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {integrations.map((integration) => (
              <article
                key={integration.key}
                className="flex flex-col gap-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`rounded-xl bg-surface-container px-3 py-3 ${integration.accent}`}>
                    <Globe className="h-5 w-5" />
                  </div>
                  <span
                    className={[
                      'rounded-full px-3 py-1 text-xs font-semibold',
                      integration.status === 'Connected'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-surface-container-high text-on-surface-variant'
                    ].join(' ')}
                  >
                    {integration.status}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-on-surface">{integration.name}</h3>
                  <p className="mt-1 text-sm text-on-surface-variant">{integration.description}</p>
                </div>
                <div className="mt-auto space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant">{integration.detailLabel}</span>
                    <span className="font-semibold text-on-surface">{integration.detailValue}</span>
                  </div>
                  <IntegrationActionButton
                    provider={integration.key}
                    connected={integration.status === 'Connected'}
                    label={integration.name}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-on-surface">API Keys</h2>
              <p className="text-sm leading-6 text-on-surface-variant">
                Manage your unique keys for programmatic access to the SEO engine.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
            >
              <KeyRound className="h-4 w-4" />
              Create Key
            </button>
          </div>

          <ResponsiveTable
            rows={apiKeys}
            getRowKey={(row) => String(row.id)}
            columns={[
              {
                key: 'label',
                label: 'Label',
                render: (row: Record<string, unknown>) => (
                  <div className="flex items-center gap-3">
                    <span className={['h-2.5 w-2.5 rounded-full', row.revoked_at ? 'bg-outline' : 'bg-emerald-500'].join(' ')} />
                    <span className="font-semibold text-on-surface">{String(row.label)}</span>
                  </div>
                )
              },
              {
                key: 'key',
                label: 'Key',
                render: (row: Record<string, unknown>) => (
                  <div className="flex items-center justify-end gap-2 md:justify-start">
                    <span className="font-mono text-sm text-on-surface-variant">
                      {`${String(row.key_prefix ?? 'sk_')}********`}
                    </span>
                    <CopyApiKeyButton value={`${String(row.key_prefix ?? 'sk_')}********`} />
                  </div>
                )
              },
              {
                key: 'created',
                label: 'Created',
                render: (row: Record<string, unknown>) => (
                  <span className="text-sm text-on-surface-variant">{formatDate(row.created_at)}</span>
                )
              },
              {
                key: 'usage',
                label: 'Usage',
                render: (row: Record<string, unknown>) => (
                  <span className="text-sm font-semibold text-on-surface">
                    {row.last_used_at ? formatDate(row.last_used_at) : 'Never used'}
                  </span>
                )
              },
              {
                key: 'actions',
                label: 'Actions',
                render: (row: Record<string, unknown>) => (
                  <RevokeApiKeyButton id={String(row.id)} label={String(row.label)} />
                )
              }
            ]}
          />
        </section>
      </section>
    </div>
  );
}
