"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, RefreshCw, Search, ShieldCheck, Unplug, Zap } from 'lucide-react';
import type { GA4Property, GSCProperty, GoogleService } from '@/lib/validators/google-integrations';
import type { OAuthConnectionRow } from '@/lib/services/google-integrations';

type PropertyOption = GSCProperty | GA4Property;

type Props = {
  connections: OAuthConnectionRow[];
  projectCount: number;
  initialService?: GoogleService | null;
  initialAction?: string | null;
  errorMessage?: string | null;
};

function isGSCProperty(option: PropertyOption): option is GSCProperty {
  return 'siteUrl' in option;
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function GoogleIntegrationSection({
  connections,
  projectCount,
  initialService,
  initialAction,
  errorMessage
}: Props) {
  const router = useRouter();
  const [activeService, setActiveService] = useState<GoogleService | null>(
    initialAction === 'select_property' ? initialService ?? null : null
  );
  const [loadingService, setLoadingService] = useState<GoogleService | null>(null);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [propertyError, setPropertyError] = useState<string | null>(null);
  const [syncingService, setSyncingService] = useState<GoogleService | null>(null);

  useEffect(() => {
    if (initialAction === 'select_property' && initialService) {
      setActiveService(initialService);
    }
  }, [initialAction, initialService]);

  const connectionMap = useMemo(() => {
    return new Map(connections.map((connection) => [connection.service, connection]));
  }, [connections]);

  async function handleConnect(service: GoogleService) {
    setLoadingService(service);
    setPropertyError(null);
    try {
      const response = await fetch('/api/auth/google/initiate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ service })
      });
      const body = await readJson(response);
      if (!response.ok) {
        throw new Error(body?.error?.message ?? 'Failed to start Google OAuth');
      }
      window.location.assign(body.data.url);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to start Google OAuth');
    } finally {
      setLoadingService(null);
    }
  }

  async function handleDisconnect(service: GoogleService) {
    const confirmed = window.confirm(`Disconnect ${service.toUpperCase()} from this workspace?`);
    if (!confirmed) {
      return;
    }

    setLoadingService(service);
    try {
      const response = await fetch('/api/auth/google/disconnect', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ service })
      });
      const body = await readJson(response);
      if (!response.ok) {
        throw new Error(body?.error?.message ?? 'Failed to disconnect Google account');
      }
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to disconnect Google account');
    } finally {
      setLoadingService(null);
    }
  }

  async function handleSync(service: GoogleService) {
    setSyncingService(service);
    try {
      const response = await fetch(`/api/integrations/${service}/sync`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ dateRange: 'last_28_days' })
      });
      const body = await readJson(response);
      if (!response.ok) {
        throw new Error(body?.error?.message ?? 'Failed to sync data');
      }
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to sync data');
    } finally {
      setSyncingService(null);
    }
  }

  async function openPropertyPicker(service: GoogleService) {
    setActiveService(service);
    setPropertyError(null);
    setProperties([]);

    try {
      const response = await fetch(`/api/integrations/${service}/properties`);
      const body = await readJson(response);
      if (!response.ok) {
        throw new Error(body?.error?.message ?? `Failed to load ${service.toUpperCase()} properties`);
      }
      setProperties(Array.isArray(body.data?.items) ? body.data.items : []);
    } catch (error) {
      setPropertyError(error instanceof Error ? error.message : 'Failed to load properties');
    }
  }

  async function handleSelectProperty(service: GoogleService, property: PropertyOption) {
    try {
      const response = await fetch(`/api/integrations/${service}/select-property`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          service,
          property
        })
      });
      const body = await readJson(response);
      if (!response.ok) {
        throw new Error(body?.error?.message ?? 'Failed to save selected property');
      }
      setActiveService(null);
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to save selected property');
    }
  }

  async function handleRefresh(service: GoogleService) {
    setLoadingService(service);
    try {
      const response = await fetch('/api/auth/google/refresh', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ service })
      });
      const body = await readJson(response);
      if (!response.ok) {
        throw new Error(body?.error?.message ?? 'Failed to refresh token');
      }
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to refresh token');
    } finally {
      setLoadingService(null);
    }
  }

  const services: Array<{
    service: GoogleService;
    label: string;
    description: string;
  }> = [
    {
      service: 'gsc',
      label: 'Google Search Console',
      description: 'Property selection and indexed-page sync for technical SEO.'
    },
    {
      service: 'ga4',
      label: 'Google Analytics 4',
      description: 'Sessions, page views, engagement, and visitor trends.'
    }
  ];

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Google integrations</p>
        <h2 className="mt-2 text-xl font-semibold text-on-surface">Real GSC and GA4 connection</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">
          Connect a Google account, choose the right property, then sync data directly into the SEO workflow.
        </p>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {services.map((item) => {
          const connection = connectionMap.get(item.service);
          const isConnected = connection?.status === 'connected';
          const propertyLabel = connection?.connected_resource
            ? isGSCProperty(connection.connected_resource as PropertyOption)
              ? String((connection.connected_resource as GSCProperty).siteUrl)
              : String((connection.connected_resource as GA4Property).propertyName ?? (connection.connected_resource as GA4Property).propertyId)
            : null;

          return (
            <article key={item.service} className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-white px-3 py-1 text-xs font-semibold text-on-surface-variant">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    {isConnected ? 'Connected' : 'Not connected'}
                  </div>
                  <h3 className="mt-3 text-xl font-semibold text-on-surface">{item.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">{item.description}</p>
                </div>

                <div className="rounded-2xl bg-surface-container-low p-3 text-primary">
                  <Zap className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <div className="rounded-2xl border border-outline-variant bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                    Google account
                  </p>
                  <p className="mt-1 font-medium text-on-surface">
                    {connection?.google_email ?? 'No Google account linked yet'}
                  </p>
                </div>

                <div className="rounded-2xl border border-outline-variant bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                    Selected property
                  </p>
                  <p className="mt-1 font-medium text-on-surface">{propertyLabel ?? 'Select a property after connecting'}</p>
                  {connection?.last_synced_at ? (
                    <p className="mt-1 text-xs text-on-surface-variant">
                      Last sync: {new Date(connection.last_synced_at).toLocaleString('en-US')}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {!isConnected ? (
                  <button
                    type="button"
                    onClick={() => handleConnect(item.service)}
                    disabled={loadingService === item.service}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Connect
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleDisconnect(item.service)}
                    disabled={loadingService === item.service}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-4 py-3 text-sm font-semibold text-on-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Unplug className="h-4 w-4" />
                    Disconnect
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => openPropertyPicker(item.service)}
                  disabled={!isConnected}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-4 py-3 text-sm font-semibold text-on-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Search className="h-4 w-4" />
                  Select property
                </button>

                <button
                  type="button"
                  onClick={() => handleRefresh(item.service)}
                  disabled={!isConnected || loadingService === item.service}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-4 py-3 text-sm font-semibold text-on-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh token
                </button>

                <button
                  type="button"
                  onClick={() => handleSync(item.service)}
                  disabled={!isConnected || syncingService === item.service || projectCount === 0}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <ExternalLink className="h-4 w-4" />
                  {syncingService === item.service ? 'Syncing...' : 'Sync now'}
                </button>
              </div>

              {projectCount === 0 ? (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  No project is linked to this account yet. Create a project first, or sign in with the account that owns the Kaitech project before syncing.
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {activeService ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-10 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-3xl border border-outline-variant bg-surface-container-lowest shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Property selector</p>
                <h3 className="mt-2 text-xl font-semibold text-on-surface">
                  {activeService === 'gsc' ? 'Choose a Search Console property' : 'Choose a GA4 property'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveService(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant transition-colors hover:text-on-surface"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              {propertyError ? (
                <div className="rounded-2xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
                  {propertyError}
                </div>
              ) : null}

              <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                {properties.length === 0 && !propertyError ? (
                  <div className="rounded-2xl border border-dashed border-outline-variant bg-white px-4 py-6 text-sm text-on-surface-variant">
                    No properties loaded yet. Try again after the Google connection is ready.
                  </div>
                ) : null}

                {properties.map((property) => (
                  <button
                    key={isGSCProperty(property) ? property.siteUrl : property.propertyId}
                    type="button"
                    onClick={() => handleSelectProperty(activeService, property)}
                    className="w-full rounded-2xl border border-outline-variant bg-white p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-on-surface">
                          {isGSCProperty(property) ? property.siteUrl : property.propertyName ?? property.propertyId}
                        </p>
                        <p className="mt-1 text-sm text-on-surface-variant">
                          {isGSCProperty(property)
                            ? `Permission: ${property.permissionLevel ?? 'unknown'}`
                            : `Account: ${property.accountName ?? 'unknown'}`}
                        </p>
                      </div>
                      <span className="rounded-full border border-outline-variant px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
                        Choose
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
