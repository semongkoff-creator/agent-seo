import { describe, expect, it } from 'vitest';
import { AppError, normalizeError, toResponse } from '@/lib/errors';

describe('errors', () => {
  it('normalizes AppError unchanged', () => {
    const error = new AppError('FORBIDDEN', 'Denied', 403, { reason: 'nope' });
    const normalized = normalizeError(error);

    expect(normalized.code).toBe('FORBIDDEN');
    expect(normalized.statusCode).toBe(403);
    expect(normalized.details).toEqual({ reason: 'nope' });
  });

  it('wraps generic errors', () => {
    const normalized = normalizeError(new Error('Boom'));

    expect(normalized.code).toBe('INTERNAL_ERROR');
    expect(normalized.message).toBe('Boom');
  });

  it('creates a json response envelope', async () => {
    const response = toResponse(new AppError('NOT_FOUND', 'Missing', 404));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Missing',
        details: null
      }
    });
  });
});
