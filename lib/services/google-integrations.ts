import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db/client';
import { AppError, isMissingRelationError } from '@/lib/errors';
import { encryptSecret, decryptSecret } from '@/lib/crypto/secrets';
import {
  buildGoogleOAuthUrl,
  createGoogleOAuthState,
  exchangeGoogleOAuthCode,
  fetchGoogleUserInfo,
  refreshGoogleOAuthToken,
  revokeGoogleOAuthToken,
  verifyGoogleOAuthState
} from '@/lib/google-oauth';
import { listGSCProperties, syncGSCMetrics } from '@/lib/gsc-client';
import { listGA4Properties, syncGA4Metrics } from '@/lib/ga4-client';
import type {
  GA4Property,
  GoogleService,
  GooglePropertySelectionInput,
  GoogleSyncInput,
  GSCProperty
} from '@/lib/validators/google-integrations';

export type OAuthConnectionRow = {
  id: string;
  user_id: string;
  service: GoogleService;
  status: 'connected' | 'disconnected' | 'error';
  google_email: string | null;
  google_name: string | null;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  token_expires_at: string | null;
  scopes: unknown;
  connected_resource: Record<string, unknown> | null;
  last_synced_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function asConnection(row: Record<string, unknown>): OAuthConnectionRow {
  return {
    id: String(row.id ?? ''),
    user_id: String(row.user_id ?? ''),
    service: row.service === 'ga4' ? 'ga4' : 'gsc',
    status:
      row.status === 'disconnected' || row.status === 'error' ? row.status : 'connected',
    google_email: typeof row.google_email === 'string' ? row.google_email : null,
    google_name: typeof row.google_name === 'string' ? row.google_name : null,
    access_token_encrypted: typeof row.access_token_encrypted === 'string' ? row.access_token_encrypted : null,
    refresh_token_encrypted: typeof row.refresh_token_encrypted === 'string' ? row.refresh_token_encrypted : null,
    token_expires_at: typeof row.token_expires_at === 'string' ? row.token_expires_at : null,
    scopes: row.scopes ?? [],
    connected_resource:
      row.connected_resource && typeof row.connected_resource === 'object'
        ? (row.connected_resource as Record<string, unknown>)
        : {},
    last_synced_at: typeof row.last_synced_at === 'string' ? row.last_synced_at : null,
    created_at: typeof row.created_at === 'string' ? row.created_at : null,
    updated_at: typeof row.updated_at === 'string' ? row.updated_at : null
  };
}

async function loadConnection(userId: string, service: GoogleService) {
  const { data, error } = await db
    .from('oauth_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('service', service)
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error)) {
      return null;
    }
    throw new AppError('INTERNAL_ERROR', 'Failed to load OAuth connection', 500, { cause: error.message });
  }

  return data ? asConnection(data as Record<string, unknown>) : null;
}

async function upsertConnection(userId: string, service: GoogleService, values: Partial<OAuthConnectionRow>) {
  const payload = {
    user_id: userId,
    service,
    status: values.status ?? 'connected',
    google_email: values.google_email ?? null,
    google_name: values.google_name ?? null,
    access_token_encrypted: values.access_token_encrypted ?? null,
    refresh_token_encrypted: values.refresh_token_encrypted ?? null,
    token_expires_at: values.token_expires_at ?? null,
    scopes: values.scopes ?? [],
    connected_resource: values.connected_resource ?? {},
    last_synced_at: values.last_synced_at ?? null,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await db
    .from('oauth_connections')
    .upsert(payload, { onConflict: 'user_id,service' })
    .select('*')
    .single();

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to save OAuth connection', 500, { cause: error.message });
  }

  return asConnection(data as Record<string, unknown>);
}

async function updateConnection(userId: string, service: GoogleService, values: Partial<Record<string, unknown>>) {
  const { data, error } = await db
    .from('oauth_connections')
    .update({
      ...values,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('service', service)
    .select('*')
    .maybeSingle();

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update OAuth connection', 500, { cause: error.message });
  }

  return data ? asConnection(data as Record<string, unknown>) : null;
}

function getAccessToken(connection: OAuthConnectionRow) {
  if (!connection.access_token_encrypted) {
    return null;
  }
  return decryptSecret(connection.access_token_encrypted);
}

function getRefreshToken(connection: OAuthConnectionRow) {
  if (!connection.refresh_token_encrypted) {
    return null;
  }
  return decryptSecret(connection.refresh_token_encrypted);
}

async function ensureAccessToken(userId: string, service: GoogleService) {
  const connection = await loadConnection(userId, service);
  if (!connection || connection.status !== 'connected') {
    throw new AppError('CONFLICT', `${service.toUpperCase()} is not connected`, 400);
  }

  const accessToken = getAccessToken(connection);
  const refreshToken = getRefreshToken(connection);
  const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at).getTime() : 0;

  if (accessToken && expiresAt && expiresAt > Date.now() + 60 * 1000) {
    return { connection, accessToken };
  }

  if (!refreshToken) {
    throw new AppError('INTEGRATION_ERROR', `Missing refresh token for ${service.toUpperCase()}`, 502);
  }

  const refreshed = await refreshGoogleOAuthToken(refreshToken);
  const nextAccessToken = refreshed.access_token;
  const nextRefreshToken = refreshed.refresh_token ?? refreshToken;
  const nextExpiresAt = refreshed.expires_in ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString() : null;

  const updated = await updateConnection(userId, service, {
    access_token_encrypted: encryptSecret(nextAccessToken),
    refresh_token_encrypted: encryptSecret(nextRefreshToken),
    token_expires_at: nextExpiresAt,
    status: 'connected'
  });

  if (!updated) {
    throw new AppError('INTERNAL_ERROR', 'Failed to refresh OAuth connection', 500);
  }

  return { connection: updated, accessToken: nextAccessToken };
}

export async function getGoogleAccessToken(userId: string, service: GoogleService) {
  const { accessToken } = await ensureAccessToken(userId, service);
  return accessToken;
}

export async function getGoogleConnection(userId: string, service: GoogleService) {
  const connection = await loadConnection(userId, service);
  return connection;
}

function metricDateRange(input?: string) {
  if (!input) {
    return 'last_28_days';
  }
  return input;
}

function extractProjectHint(service: GoogleService, resource: Record<string, unknown>) {
  if (service === 'gsc') {
    const propertyUrl = String(resource.siteUrl ?? resource.property_url ?? '').trim();
    if (!propertyUrl) {
      return null;
    }

    try {
      const url = new URL(propertyUrl);
      return url.hostname.replace(/^www\./, '');
    } catch {
      return propertyUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');
    }
  }

  const names = [resource.propertyName, resource.accountName].filter((value): value is string => typeof value === 'string');
  if (names.length === 0) {
    return null;
  }

  return names
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

async function resolveProjectIdForSync(userId: string, service: GoogleService, connection: OAuthConnectionRow) {
  const resource = connection.connected_resource ?? {};
  const hint = extractProjectHint(service, resource);

  if (hint) {
    const { data: matchedProjects } = await db
      .from('projects')
      .select('id, name, website_url')
      .eq('user_id', userId)
      .or(`name.ilike.%${hint}%,website_url.ilike.%${hint}%`)
      .order('updated_at', { ascending: false })
      .limit(1);

    const matchedProject = (matchedProjects ?? [])[0] as { id?: string } | undefined;
    if (matchedProject?.id) {
      return String(matchedProject.id);
    }
  }

  const { data: latestProject } = await db
    .from('projects')
    .select('id')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return latestProject?.id ? String(latestProject.id) : null;
}

export async function listGoogleOAuthConnections(userId: string) {
  const { data, error } = await db.from('oauth_connections').select('*').eq('user_id', userId);
  if (error) {
    if (isMissingRelationError(error)) {
      return { items: [] as OAuthConnectionRow[] };
    }

    throw new AppError('INTERNAL_ERROR', 'Failed to list OAuth connections', 500, { cause: error.message });
  }

  return {
    items: (data ?? []).map((row) => asConnection(row as Record<string, unknown>))
  };
}

export async function startGoogleOAuthConnection(userId: string, service: GoogleService) {
  const state = createGoogleOAuthState({
    service,
    userId,
    nonce: randomUUID()
  });

  return {
    url: buildGoogleOAuthUrl({ service, state })
  };
}

export async function completeGoogleOAuthConnection(input: {
  userId: string;
  code: string;
  state: string;
}) {
  const state = verifyGoogleOAuthState(input.state);
  if (state.userId !== input.userId) {
    throw new AppError('FORBIDDEN', 'OAuth state does not match current user', 403);
  }

  const token = await exchangeGoogleOAuthCode(input.code);
  const accessToken = token.access_token;
  const refreshToken = token.refresh_token;
  const expiresAt = token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null;
  const profile = await fetchGoogleUserInfo(accessToken);

  const connection = await upsertConnection(input.userId, state.service, {
    status: 'connected',
    google_email: profile.email,
    google_name: profile.name ?? null,
    access_token_encrypted: encryptSecret(accessToken),
    refresh_token_encrypted: refreshToken ? encryptSecret(refreshToken) : null,
    token_expires_at: expiresAt,
    scopes: token.scope ? token.scope.split(' ') : [],
    connected_resource: {}
  });

  return connection;
}

export async function disconnectGoogleOAuthConnection(userId: string, service: GoogleService) {
  const connection = await loadConnection(userId, service);
  if (!connection) {
    return null;
  }

  const accessToken = connection.access_token_encrypted ? decryptSecret(connection.access_token_encrypted) : null;
  const refreshToken = connection.refresh_token_encrypted ? decryptSecret(connection.refresh_token_encrypted) : null;

  if (refreshToken) {
    await revokeGoogleOAuthToken(refreshToken).catch(() => null);
  } else if (accessToken) {
    await revokeGoogleOAuthToken(accessToken).catch(() => null);
  }

  return updateConnection(userId, service, {
    status: 'disconnected',
    access_token_encrypted: null,
    refresh_token_encrypted: null,
    token_expires_at: null,
    connected_resource: {},
    last_synced_at: null
  });
}

export async function refreshGoogleOAuthConnection(userId: string, service: GoogleService) {
  const { connection, accessToken } = await ensureAccessToken(userId, service);

  return {
    connection,
    accessToken
  };
}

export async function listGooglePropertiesForConnection(userId: string, service: GoogleService) {
  const { accessToken } = await ensureAccessToken(userId, service);

  if (service === 'gsc') {
    const properties = await listGSCProperties(accessToken);
    return { items: properties };
  }

  const properties = await listGA4Properties(accessToken);
  return { items: properties };
}

export async function selectGoogleProperty(input: {
  userId: string;
  service: GoogleService;
  property: GooglePropertySelectionInput['property'];
}) {
  const connection = await loadConnection(input.userId, input.service);
  if (!connection) {
    throw new AppError('NOT_FOUND', `${input.service.toUpperCase()} connection not found`, 404);
  }

  const nextResource = {
    ...input.property,
    selectedAt: new Date().toISOString()
  };

  return updateConnection(input.userId, input.service, {
    connected_resource: nextResource
  });
}

async function insertMetricsRecords(
  projectId: string,
  sourceConnectionId: string,
  dataSource: string,
  dateRange: string,
  records: Array<{ metricType: string; metricValue: Record<string, unknown> }>
) {
  const timestamp = new Date().toISOString();
  const rows = records.map((record) => ({
    project_id: projectId,
    metric_type: record.metricType,
    metric_value: record.metricValue,
    data_source: dataSource,
    date_range: dateRange,
    source_connection_id: sourceConnectionId,
    measured_at: timestamp
  }));

  return rows;
}

export async function syncGoogleMetrics(input: GoogleSyncInput & { userId: string; projectId?: string }) {
  const connection = await loadConnection(input.userId, input.service);
  if (!connection || connection.status !== 'connected') {
    throw new AppError('CONFLICT', `${input.service.toUpperCase()} is not connected`, 400);
  }

  const selectedResource = connection.connected_resource ?? {};
  let metricRows: Array<{ metricType: string; metricValue: Record<string, unknown> }> = [];
  let destinationTable = input.service === 'gsc' ? 'gsc_metrics' : 'ga4_metrics';

  if (input.service === 'gsc') {
    const propertyUrl = String(selectedResource.siteUrl ?? selectedResource.property_url ?? '');
    if (!propertyUrl) {
      throw new AppError('VALIDATION_ERROR', 'GSC property has not been selected', 400);
    }
    const { accessToken } = await ensureAccessToken(input.userId, 'gsc');
    metricRows = await syncGSCMetrics({
      accessToken,
      propertyUrl,
      dateRange: metricDateRange(input.dateRange)
    });
  } else {
    const propertyId = String(selectedResource.propertyId ?? selectedResource.property_id ?? '');
    if (!propertyId) {
      throw new AppError('VALIDATION_ERROR', 'GA4 property has not been selected', 400);
    }
    const { accessToken } = await ensureAccessToken(input.userId, 'ga4');
    metricRows = await syncGA4Metrics({
      accessToken,
      propertyId,
      dateRange: metricDateRange(input.dateRange)
    });
  }

  const targetProjectId = input.projectId ?? (await resolveProjectIdForSync(input.userId, input.service, connection));
  if (!targetProjectId) {
    throw new AppError(
      'NOT_FOUND',
      'No project available for sync. Create a project first or sign in with the account that owns the Kaitech project.',
      404
    );
  }

  const dataSource = input.service === 'gsc' ? 'gsc_api' : 'ga4_api';

  const { error: deleteError } = await db
    .from(destinationTable)
    .delete()
    .eq('project_id', targetProjectId)
    .in('data_source', [dataSource, 'google_api']);

  if (deleteError) {
    throw new AppError('INTERNAL_ERROR', `Failed to clear previous ${input.service.toUpperCase()} metrics`, 500, {
      cause: deleteError.message
    });
  }

  const { error } = await db.from(destinationTable).insert(
    await insertMetricsRecords(targetProjectId, connection.id, dataSource, metricDateRange(input.dateRange), metricRows)
  );

  if (error) {
    throw new AppError('INTERNAL_ERROR', `Failed to save ${input.service.toUpperCase()} metrics`, 500, {
      cause: error.message
    });
  }

  await updateConnection(input.userId, input.service, {
    last_synced_at: new Date().toISOString()
  });

  return {
    ok: true as const,
    records: metricRows,
    table: destinationTable,
    projectId: targetProjectId
  };
}

export async function getGooglePropertySnapshot(userId: string, service: GoogleService) {
  const connection = await loadConnection(userId, service);
  if (!connection) {
    return {
      connected: false,
      connection: null as OAuthConnectionRow | null
    };
  }

  return {
    connected: connection.status === 'connected',
    connection
  };
}
