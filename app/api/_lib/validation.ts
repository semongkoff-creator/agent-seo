import { z } from 'zod';
import { AppError } from '@/lib/errors';

export async function parseJsonBody<T extends z.ZodTypeAny>(request: Request, schema: T) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    throw new AppError('VALIDATION_ERROR', 'Request body must be valid JSON', 422);
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Validation failed', 422, {
      issues: parsed.error.issues
    });
  }

  return parsed.data as z.infer<T>;
}
