import { createHmac, timingSafeEqual } from 'node:crypto';
import { AppError } from '@/lib/errors';

function signPayload(body: string, secret: string, timestamp: number) {
  return createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
}

export function verifyN8nSignature(params: {
  body: string;
  signature: string | null;
  timestampHeader: string | null;
  secret?: string;
  maxAgeSeconds?: number;
}) {
  const { body, signature, timestampHeader, secret = process.env.APP_WEBHOOK_SECRET, maxAgeSeconds = 300 } = params;

  if (!secret) {
    throw new AppError('INTEGRATION_ERROR', 'Webhook secret is not configured', 502);
  }

  if (!signature || !timestampHeader) {
    return false;
  }

  const timestamp = Number(timestampHeader);
  if (!Number.isFinite(timestamp)) {
    return false;
  }

  const age = Math.abs(Date.now() / 1000 - timestamp);
  if (age > maxAgeSeconds) {
    return false;
  }

  const expected = signPayload(body, secret, timestamp);
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(signature, 'hex');

  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(a, b);
}

export function ensureN8nSignature(params: {
  body: string;
  signature: string | null;
  timestampHeader: string | null;
}) {
  const valid = verifyN8nSignature(params);
  if (!valid) {
    throw new AppError('UNAUTHORIZED', 'Invalid webhook signature', 401);
  }
}
