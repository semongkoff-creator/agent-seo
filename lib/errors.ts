export type AppErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'INTEGRATION_ERROR'
  | 'N8N_ERROR'
  | 'QUOTA_EXCEEDED';

export class AppError extends Error {
  code: AppErrorCode;
  statusCode: number;
  details?: Record<string, unknown>;

  constructor(code: AppErrorCode, message: string, statusCode = 500, details?: Record<string, unknown>) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError('INTERNAL_ERROR', error.message || 'Unexpected error', 500);
  }

  return new AppError('INTERNAL_ERROR', 'Unexpected error', 500, { error });
}

export function toResponse(error: unknown): Response {
  const normalized = normalizeError(error);
  const body = {
    ok: false,
    error: {
      code: normalized.code,
      message: normalized.message,
      details: normalized.details ?? null
    }
  };

  return Response.json(body, { status: normalized.statusCode });
}
