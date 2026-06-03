import { beforeEach, describe, expect, it, vi } from 'vitest';

const authMock = vi.hoisted(() => ({
  requireUser: vi.fn()
}));

const serviceMock = vi.hoisted(() => ({
  listIntegrations: vi.fn(),
  connectIntegration: vi.fn(),
  disconnectIntegration: vi.fn()
}));

const validationMock = vi.hoisted(() => ({
  parseJsonBody: vi.fn()
}));

vi.mock('@/lib/auth/session', () => authMock);
vi.mock('@/lib/services/integrations', () => serviceMock);
vi.mock('@/app/api/_lib/validation', () => validationMock);

import * as integrationsRoute from '@/app/api/integrations/route';
import * as integrationProviderRoute from '@/app/api/integrations/[provider]/route';

beforeEach(() => {
  authMock.requireUser.mockReset();
  serviceMock.listIntegrations.mockReset();
  serviceMock.connectIntegration.mockReset();
  serviceMock.disconnectIntegration.mockReset();
  validationMock.parseJsonBody.mockReset();
});

describe('integrations routes', () => {
  it('lists integrations for current user', async () => {
    authMock.requireUser.mockResolvedValue({ id: 'user-1' });
    serviceMock.listIntegrations.mockResolvedValue({ items: [] });

    const response = await integrationsRoute.GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(serviceMock.listIntegrations).toHaveBeenCalledWith('user-1');
    expect(body.ok).toBe(true);
  });

  it('connects an integration provider', async () => {
    authMock.requireUser.mockResolvedValue({ id: 'user-1' });
    validationMock.parseJsonBody.mockResolvedValue({
      apiKey: 'secret-key',
      property: { propertyId: 'prop-1', propertyName: 'Demo Property' }
    });
    serviceMock.connectIntegration.mockResolvedValue({
      id: 'integration-1',
      provider: 'gsc',
      status: 'connected'
    });

    const response = await integrationProviderRoute.POST(
      new Request('http://localhost/api/integrations/gsc', { method: 'POST' }),
      { params: { provider: 'gsc' } }
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(serviceMock.connectIntegration).toHaveBeenCalledWith('user-1', 'gsc', {
      apiKey: 'secret-key',
      property: { propertyId: 'prop-1', propertyName: 'Demo Property' }
    });
    expect(body.data.status).toBe('connected');
  });

  it('disconnects an integration provider', async () => {
    authMock.requireUser.mockResolvedValue({ id: 'user-1' });
    serviceMock.disconnectIntegration.mockResolvedValue({
      id: 'integration-1',
      status: 'disconnected'
    });

    const response = await integrationProviderRoute.DELETE(
      new Request('http://localhost/api/integrations/gsc', { method: 'DELETE' }),
      { params: { provider: 'gsc' } }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(serviceMock.disconnectIntegration).toHaveBeenCalledWith('user-1', 'gsc');
    expect(body.ok).toBe(true);
  });
});
