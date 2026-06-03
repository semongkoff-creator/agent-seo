import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const RESET_TTL_SECONDS = 60 * 60 * 24;

function base64Url(input: Buffer) {
  return input.toString('base64url');
}

function hashSha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function createPlainToken() {
  return base64Url(randomBytes(32));
}

export function hashToken(token: string) {
  return hashSha256(token);
}

export function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `v1.${salt.toString('hex')}.${derived.toString('hex')}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [version, saltHex, hashHex] = storedHash.split('.');
  if (version !== 'v1' || !saltHex || !hashHex) {
    return false;
  }

  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(password, salt, expected.length);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createAuthSessionTokens() {
  const accessToken = createPlainToken();
  const refreshToken = createPlainToken();
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;

  return {
    accessToken,
    refreshToken,
    accessTokenHash: hashToken(accessToken),
    refreshTokenHash: hashToken(refreshToken),
    expiresAt
  };
}

export function createPasswordResetToken() {
  const token = createPlainToken();
  const expiresAt = new Date(Date.now() + RESET_TTL_SECONDS * 1000);

  return {
    token,
    tokenHash: hashToken(token),
    expiresAt
  };
}

