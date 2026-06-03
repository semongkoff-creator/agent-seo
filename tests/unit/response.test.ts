import { describe, expect, it } from 'vitest';
import { fail, ok } from '@/app/api/_lib/response';
import { AppError } from '@/lib/errors';

describe('response helpers', () => {
  it('wraps success payloads', async () => {
    const response = ok({ hello: 'world' }, { status: 201 });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({
      ok: true,
      data: { hello: 'world' }
    });
  });

  it('wraps failures from AppError', async () => {
    const response = fail(new AppError('UNAUTHORIZED', 'Nope', 401));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});
