import { beforeEach, describe, expect, it, vi } from 'vitest';

const authMock = vi.hoisted(() => ({
  requireUser: vi.fn()
}));

const serviceMock = vi.hoisted(() => ({
  listApiKeys: vi.fn(),
  createApiKey: vi.fn(),
  revokeApiKey: vi.fn()
}));

const validationMock = vi.hoisted(() => ({
  parseJsonBody: vi.fn()
}));

vi.mock('@/lib/auth/session', () => authMock);
vi.mock('@/lib/services/api-keys', () => serviceMock);
vi.mock('@/app/api/_lib/validation', () => validationMock);

import * as apiKeysRoute from '@/app/api/api-keys/route';
import * as apiKeyIdRoute from '@/app/api/api-keys/[id]/route';

beforeEach(() => {
  authMock.requireUser.mockReset();
  serviceMock.listApiKeys.mockReset();
  serviceMock.createApiKey.mockReset();
  serviceMock.revokeApiKey.mockReset();
  validationMock.parseJsonBody.mockReset();
});

describe('api keys routes', () => {
  it('lists API keys for the current user', async () => {
    authMock.requireUser.mockResolvedValue({ id: 'user-1' });
    serviceMock.listApiKeys.mockResolvedValue({ items: [] });

    const response = await apiKeysRoute.GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(serviceMock.listApiKeys).toHaveBeenCalledWith('user-1');
    expect(body.ok).toBe(true);
  });

  it('creates API keys', async () => {
    authMock.requireUser.mockResolvedValue({ id: 'user-1' });
    validationMock.parseJsonBody.mockResolvedValue({
      label: 'Production Copilot',
      environment: 'live'
    });
    serviceMock.createApiKey.mockResolvedValue({
      id: 'key-1',
      label: 'Production Copilot',
      plaintextKey: 'sk_live_demo'
    });

    const response = await apiKeysRoute.POST(new Request('http://localhost/api/api-keys', { method: 'POST' }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(serviceMock.createApiKey).toHaveBeenCalledWith('user-1', {
      label: 'Production Copilot',
      environment: 'live'
    });
    expect(body.data.plaintextKey).toBe('sk_live_demo');
  });

  it('revokes API keys', async () => {
    authMock.requireUser.mockResolvedValue({ id: 'user-1' });
    serviceMock.revokeApiKey.mockResolvedValue({ id: 'key-1', revoked_at: '2025-01-01T00:00:00.000Z' });

    const response = await apiKeyIdRoute.DELETE(
      new Request('http://localhost/api/api-keys/key-1', { method: 'DELETE' }),
      { params: { id: '11111111-1111-1111-1111-111111111111' } }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(serviceMock.revokeApiKey).toHaveBeenCalledWith('user-1', '11111111-1111-1111-1111-111111111111');
    expect(body.ok).toBe(true);
  });
});
