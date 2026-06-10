import { createHmac, timingSafeEqual } from 'node:crypto';
import { AppError } from '@/lib/errors';
import type { GoogleService } from '@/lib/validators/google-integrations';

type GoogleTokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  id_token?: string;
};

export type GoogleUserInfo = {
  id: string;
  email: string;
  name?: string | null;
  picture?: string | null;
  verified_email?: boolean;
};

type OAuthState = {
  service: GoogleService;
  userId: string;
  nonce: string;
  issuedAt: number;
};

const OAUTH_SCOPE_MAP: Record<GoogleService, string[]> = {
  gsc: [
    'https://www.googleapis.com/auth/webmasters.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'openid'
  ],
  ga4: [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'openid'
  ]
};

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'http://localhost:3000';
}

function getRedirectUri() {
  return process.env.GOOGLE_OAUTH_REDIRECT_URI ?? `${getAppUrl()}/api/auth/google/callback`;
}

function getOAuthClientId() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (!clientId) {
    throw new AppError('INTEGRATION_ERROR', 'GOOGLE_OAUTH_CLIENT_ID is not configured', 502);
  }
  return clientId;
}

function getOAuthClientSecret() {
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientSecret) {
    throw new AppError('INTEGRATION_ERROR', 'GOOGLE_OAUTH_CLIENT_SECRET is not configured', 502);
  }
  return clientSecret;
}

function getStateSecret() {
  return process.env.OAUTH_STATE_SECRET ?? process.env.ENCRYPTION_KEY ?? getOAuthClientSecret();
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function signPayload(payload: string) {
  return createHmac('sha256', getStateSecret()).update(payload).digest('base64url');
}

export function createGoogleOAuthState(input: Omit<OAuthState, 'issuedAt'>) {
  const payload = JSON.stringify({ ...input, issuedAt: Date.now() } satisfies OAuthState);
  const signature = signPayload(payload);
  return `${encodeBase64Url(payload)}.${signature}`;
}

export function verifyGoogleOAuthState(state: string): OAuthState {
  const [payloadPart, signature] = state.split('.');
  if (!payloadPart || !signature) {
    throw new AppError('VALIDATION_ERROR', 'Invalid OAuth state', 400);
  }

  const payload = decodeBase64Url(payloadPart);
  const expectedSignature = signPayload(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid OAuth state signature', 400);
  }

  const parsed = JSON.parse(payload) as OAuthState;
  if (!parsed.service || !parsed.userId || !parsed.nonce || typeof parsed.issuedAt !== 'number') {
    throw new AppError('VALIDATION_ERROR', 'Invalid OAuth state payload', 400);
  }

  if (Date.now() - parsed.issuedAt > 15 * 60 * 1000) {
    throw new AppError('VALIDATION_ERROR', 'OAuth state expired', 400);
  }

  return parsed;
}

export function buildGoogleOAuthUrl(input: { service: GoogleService; state: string }) {
  const params = new URLSearchParams({
    client_id: getOAuthClientId(),
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state: input.state,
    scope: OAUTH_SCOPE_MAP[input.service].join(' ')
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function parseTokenResponse(response: Response): Promise<GoogleTokenResponse> {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = body && typeof body === 'object' ? body : {};
    throw new AppError(
      'INTEGRATION_ERROR',
      (error as { error_description?: string; error?: string }).error_description ??
        (error as { error?: string }).error ??
        'Google token request failed',
      response.status,
      { body }
    );
  }

  return body as GoogleTokenResponse;
}

async function tokenRequest(params: Record<string, string>) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: getOAuthClientId(),
      client_secret: getOAuthClientSecret(),
      ...params
    })
  });

  return parseTokenResponse(response);
}

export async function exchangeGoogleOAuthCode(code: string) {
  return tokenRequest({
    code,
    grant_type: 'authorization_code',
    redirect_uri: getRedirectUri()
  });
}

export async function refreshGoogleOAuthToken(refreshToken: string) {
  return tokenRequest({
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  });
}

export async function revokeGoogleOAuthToken(token: string) {
  const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' }
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new AppError('INTEGRATION_ERROR', body || 'Failed to revoke Google token', response.status);
  }

  return { ok: true as const };
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      authorization: `Bearer ${accessToken}`
    }
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new AppError('INTEGRATION_ERROR', 'Failed to load Google profile', response.status, { body });
  }

  return body as GoogleUserInfo;
}
