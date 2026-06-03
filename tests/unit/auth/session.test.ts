import { beforeEach, describe, expect, it, vi } from 'vitest';

const headersState = vi.hoisted(() => new Map<string, string>());
const dbMock = vi.hoisted(() => ({
  from: vi.fn()
}));

vi.mock('next/headers', () => ({
  headers: () => ({
    get: (name: string) => headersState.get(name.toLowerCase()) ?? null
  })
}));

vi.mock('@/lib/db/client', () => ({
  db: dbMock
}));

import { AppError } from '@/lib/errors';
import { getUser, requireApiKeyOrUser, requireUser } from '@/lib/auth/session';

function mockQuery(resultMap: Record<string, unknown>) {
  const chain: Record<string, any> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.maybeSingle = vi.fn(async () => resultMap.maybeSingle ?? { data: null, error: null });
  return chain;
}

beforeEach(() => {
  headersState.clear();
  dbMock.from.mockReset();
});

describe('session helpers', () => {
  it('reads session user from headers', async () => {
    headersState.set('x-user-id', 'user-1');
    headersState.set('x-user-email', 'demo@example.com');

    await expect(getUser()).resolves.toEqual({
      id: 'user-1',
      email: 'demo@example.com',
      fullName: null,
      avatarUrl: null,
      role: null
    });
  });

  it('requires a user session', async () => {
    await expect(requireUser()).rejects.toBeInstanceOf(AppError);
  });

  it('accepts api key bearer auth when session headers are absent', async () => {
    headersState.set('authorization', 'Bearer sk_live_testtoken');

    dbMock.from.mockImplementation((table: string) => {
      if (table === 'api_keys') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: 'key-1',
                  user_id: 'user-2',
                  revoked_at: null,
                  expires_at: null
                },
                error: null
              })
            })
          }),
          update: () => ({
            eq: () => ({})
          })
        };
      }

      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: 'user-2',
                  email: 'api@example.com',
                  full_name: 'API User',
                  avatar_url: null,
                  role: 'member'
                },
                error: null
              })
            })
          })
        };
      }

      return mockQuery({ maybeSingle: { data: null, error: null } });
    });

    await expect(requireApiKeyOrUser()).resolves.toEqual({
      id: 'user-2',
      email: 'api@example.com',
      fullName: 'API User',
      avatarUrl: null,
      role: 'member'
    });
  });
});
