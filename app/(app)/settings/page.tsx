import Link from 'next/link';
import { KeyRound, PenSquare, Plus, Sparkles } from 'lucide-react';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { db } from '@/lib/db/client';
import { requireUser } from '@/lib/auth/session';
import { listApiKeys } from '@/lib/services/api-keys';
import { listGoogleOAuthConnections } from '@/lib/services/google-integrations';
import { formatWibDate } from '@/lib/time';
import { CopyApiKeyButton, RevokeApiKeyButton } from './_components/SettingsActions';
import { GoogleIntegrationSection } from './_components/GoogleIntegrationSection';

function formatDate(value: unknown) {
  if (typeof value !== 'string' || !value) {
    return 'Recently';
  }
  return formatWibDate(value);
}

type SettingsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const user = await requireUser();
  const [profileResult, apiKeysResult, googleConnectionsResult, projectsResult] = await Promise.all([
    db
      .from('users')
      .select('id, email, full_name, avatar_url, role, plan, timezone')
      .eq('id', user.id)
      .maybeSingle(),
    listApiKeys(user.id),
    listGoogleOAuthConnections(user.id),
    db.from('projects').select('id, name, website_url').eq('user_id', user.id).order('created_at', { ascending: false })
  ]);

  const profile = profileResult.data;
  const profileName = profile?.full_name ?? user.fullName ?? 'Your account';
  const profileEmail = profile?.email ?? user.email ?? '';
  const profileRole = profile?.role ?? user.role ?? 'Member';
  const profileTimezone = profile?.timezone ?? 'Asia/Jakarta (WIB)';
  const avatarLabel =
    profileName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0])
      .join('')
      .toUpperCase() || 'AR';

  const apiKeys = apiKeysResult.items;
  const connectionItems = googleConnectionsResult.items;
  const userProjects = projectsResult.data ?? [];
  const integrationService =
    typeof searchParams?.integration === 'string' ? (searchParams.integration as 'gsc' | 'ga4') : null;
  const integrationAction = typeof searchParams?.action === 'string' ? searchParams.action : null;
  const integrationError = typeof searchParams?.error === 'string' ? searchParams.error : null;

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Settings</p>
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-on-surface md:text-3xl lg:text-4xl">
                Workspace settings
              </h1>
              <p className="hidden max-w-3xl text-sm leading-6 text-on-surface-variant sm:block md:text-base">
                Manage your account details and the essentials needed to run the SEO workflow cleanly.
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
                Update your personal information and keep the workspace simple so the core flow stays easy to use.
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

        <GoogleIntegrationSection
          connections={connectionItems}
          projectCount={userProjects.length}
          initialService={integrationService}
          initialAction={integrationAction}
          errorMessage={integrationError}
        />

        <section className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-on-surface">API Keys</h2>
              <p className="text-sm leading-6 text-on-surface-variant">
                Use API keys when another app, script, or scheduled job needs machine access without signing in as a
                user.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
            >
              <KeyRound className="h-4 w-4" />
              Create API key
            </button>
          </div>

          {apiKeys.length > 0 ? (
            <ResponsiveTable
              rows={apiKeys}
              getRowKey={(row) => String(row.id)}
              columns={[
                {
                  key: 'label',
                  label: 'Label',
                  render: (row: Record<string, unknown>) => (
                    <div className="flex items-center gap-3">
                      <span
                        className={[
                          'h-2.5 w-2.5 rounded-full',
                          row.revoked_at ? 'bg-outline' : 'bg-emerald-500'
                        ].join(' ')}
                      />
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
          ) : (
            <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low p-6 text-sm leading-6 text-on-surface-variant">
              No API keys yet. Create one only if another tool or script needs machine access to the SEO API.
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
