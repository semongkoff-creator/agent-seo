import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import { AppError } from '@/lib/errors';
import { ensureN8nSignature, verifyN8nSignature } from '@/lib/n8n/verifier';

function sign(body: string, secret: string, timestamp: number) {
  return createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
}

describe('verifyN8nSignature', () => {
  const secret = 'test-secret';
  const body = JSON.stringify({ hello: 'world' });
  const timestamp = Math.floor(Date.now() / 1000);
  const originalSecret = process.env.APP_WEBHOOK_SECRET;

  afterEach(() => {
    process.env.APP_WEBHOOK_SECRET = originalSecret;
  });

  it('accepts a valid signature', () => {
    const signature = sign(body, secret, timestamp);
    expect(
      verifyN8nSignature({
        body,
        signature,
        timestampHeader: String(timestamp),
        secret
      })
    ).toBe(true);
  });

  it('rejects an expired signature', () => {
    const signature = sign(body, secret, timestamp - 1000);
    expect(
      verifyN8nSignature({
        body,
        signature,
        timestampHeader: String(timestamp - 1000),
        secret,
        maxAgeSeconds: 300
      })
    ).toBe(false);
  });

  it('throws when secret is missing in ensure helper', () => {
    delete process.env.APP_WEBHOOK_SECRET;
    expect(() =>
      ensureN8nSignature({
        body,
        signature: sign(body, secret, timestamp),
        timestampHeader: String(timestamp)
      })
    ).toThrow(AppError);
  });
});
