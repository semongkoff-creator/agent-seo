const accessCookieName = 'seo-agent-access-token';
const refreshCookieName = 'seo-agent-refresh-token';

function isSecureCookie() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? '';
  return appUrl.startsWith('https://');
}

function baseCookieOptions(maxAgeSeconds?: number) {
  const parts = ['Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (isSecureCookie()) {
    parts.push('Secure');
  }
  if (typeof maxAgeSeconds === 'number') {
    parts.push(`Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`);
  }
  return parts.join('; ');
}

export function buildAuthSetCookieHeaders(input: {
  accessToken: string;
  refreshToken: string;
  expiresAt?: number | null;
}) {
  const headers: string[] = [];
  const accessMaxAge =
    typeof input.expiresAt === 'number' && Number.isFinite(input.expiresAt)
      ? Math.max(0, Math.floor(input.expiresAt - Date.now() / 1000))
      : undefined;

  headers.push(`${accessCookieName}=${encodeURIComponent(input.accessToken)}; ${baseCookieOptions(accessMaxAge)}`);
  headers.push(`${refreshCookieName}=${encodeURIComponent(input.refreshToken)}; ${baseCookieOptions(accessMaxAge)}`);
  return headers;
}

export function buildClearAuthCookieHeaders() {
  const expired = `${baseCookieOptions(0)}; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  return [
    `${accessCookieName}=; ${expired}`,
    `${refreshCookieName}=; ${expired}`
  ];
}

export function attachSetCookieHeaders(response: Response, cookies: string[]) {
  for (const cookie of cookies) {
    response.headers.append('Set-Cookie', cookie);
  }
  return response;
}

export const authCookieNames = {
  accessToken: accessCookieName,
  refreshToken: refreshCookieName
} as const;
