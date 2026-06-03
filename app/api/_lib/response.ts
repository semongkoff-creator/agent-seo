import { AppError, normalizeError } from '@/lib/errors';

export type SuccessEnvelope<T> = {
  ok: true;
  data: T;
};

export type ErrorEnvelope = {
  ok: false;
  error: {
    code: string;
    message: string;
    details: Record<string, unknown> | null;
  };
};

export function ok<T>(data: T, init?: ResponseInit) {
  return Response.json({ ok: true, data } satisfies SuccessEnvelope<T>, init);
}

export function fail(error: unknown) {
  const normalized = normalizeError(error);

  return Response.json(
    {
      ok: false,
      error: {
        code: normalized.code,
        message: normalized.message,
        details: normalized.details ?? null
      }
    } satisfies ErrorEnvelope,
    { status: normalized.statusCode }
  );
}

export function notImplemented(message = 'Not implemented yet') {
  return fail(new AppError('INTERNAL_ERROR', message, 501));
}
