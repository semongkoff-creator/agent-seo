import pino from 'pino';
import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContext = {
  requestId: string;
  userId?: string | null;
};

const requestStorage = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext<T>(context: RequestContext, fn: () => T): T {
  return requestStorage.run(context, fn);
}

export function getRequestContext(): RequestContext | undefined {
  return requestStorage.getStore();
}

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  mixin() {
    const context = requestStorage.getStore();
    return context
      ? {
          request_id: context.requestId,
          user_id: context.userId ?? null
        }
      : {};
  }
});

export function getRequestLogger() {
  return logger.child(getRequestContext() ? { ...getRequestContext() } : {});
}
