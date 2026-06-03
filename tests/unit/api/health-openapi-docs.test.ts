import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const dbMock = vi.hoisted(() => ({
  from: vi.fn()
}));

vi.mock('@/lib/db/client', () => ({
  db: dbMock
}));

import * as healthRoute from '@/app/api/health/route';
import * as openapiRoute from '@/app/api/openapi/route';
import * as docsRoute from '@/app/api/docs/route';

const originalNodeEnv = process.env.NODE_ENV;
const env = process.env as NodeJS.ProcessEnv & { NODE_ENV?: string };

beforeEach(() => {
  dbMock.from.mockReset();
});

afterEach(() => {
  env.NODE_ENV = originalNodeEnv;
});

describe('health and docs routes', () => {
  it('returns health information', async () => {
    dbMock.from.mockReturnValue({
      select: () => ({
        limit: async () => ({ error: null })
      })
    });

    const response = await healthRoute.GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.db).toBe('ok');
  });

  it('returns openapi spec', async () => {
    const response = await openapiRoute.GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.openapi).toBe('3.1.0');
    expect(body.data.paths['/api/projects']).toBeTruthy();
  });

  it('returns docs html in development', async () => {
    const previousEnv = env.NODE_ENV;
    env.NODE_ENV = 'development';

    const response = await docsRoute.GET();
    const text = await response.text();

    env.NODE_ENV = previousEnv;

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(text).toContain('SEO Agent API');
  });
});
