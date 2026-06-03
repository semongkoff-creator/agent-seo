import { beforeEach, describe, expect, it, vi } from 'vitest';

const authMock = vi.hoisted(() => ({
  requireApiKeyOrUser: vi.fn(),
  requireUser: vi.fn()
}));

const serviceMock = vi.hoisted(() => ({
  getObjective: vi.fn(),
  listObjectives: vi.fn(),
  regenerateObjective: vi.fn()
}));

const validationMock = vi.hoisted(() => ({
  parseJsonBody: vi.fn()
}));

vi.mock('@/lib/auth/session', () => authMock);
vi.mock('@/lib/services/objectives', () => serviceMock);
vi.mock('@/app/api/_lib/validation', () => validationMock);

import * as objectivesListRoute from '@/app/api/objectives/route';
import * as objectiveRoute from '@/app/api/objectives/[id]/route';
import * as regenerateRoute from '@/app/api/objectives/[id]/regenerate/route';

beforeEach(() => {
  authMock.requireApiKeyOrUser.mockReset();
  authMock.requireUser.mockReset();
  serviceMock.getObjective.mockReset();
  serviceMock.listObjectives.mockReset();
  serviceMock.regenerateObjective.mockReset();
  validationMock.parseJsonBody.mockReset();
});

describe('objectives routes', () => {
  it('lists objectives', async () => {
    authMock.requireUser.mockResolvedValue({ id: 'user-1' });
    serviceMock.listObjectives.mockResolvedValue({ items: [], page: 1, limit: 20, total: 0 });

    const response = await objectivesListRoute.GET(new Request('http://localhost/api/objectives'));
    expect(response.status).toBe(200);
    expect(serviceMock.listObjectives).toHaveBeenCalledWith('user-1', {
      page: 1,
      limit: 20,
      projectId: undefined
    });
  });

  it('gets objective with api key auth', async () => {
    authMock.requireApiKeyOrUser.mockResolvedValue({ id: 'user-1' });
    serviceMock.getObjective.mockResolvedValue({ id: 'objective-1' });

    const response = await objectiveRoute.GET(
      new Request('http://localhost/api/objectives/objective-1'),
      { params: { id: 'objective-1' } }
    );

    expect(response.status).toBe(200);
    expect(serviceMock.getObjective).toHaveBeenCalledWith('user-1', 'objective-1');
  });

  it('regenerates objective', async () => {
    authMock.requireUser.mockResolvedValue({ id: 'user-1' });
    validationMock.parseJsonBody.mockResolvedValue({ reason: 'retry' });
    serviceMock.regenerateObjective.mockResolvedValue({
      jobId: 'job-1',
      objectiveId: 'objective-1',
      status: 'queued'
    });

    const response = await regenerateRoute.POST(
      new Request('http://localhost/api/objectives/objective-1/regenerate', { method: 'POST' }),
      { params: { id: 'objective-1' } }
    );

    expect(response.status).toBe(202);
    expect(serviceMock.regenerateObjective).toHaveBeenCalledWith('user-1', 'objective-1', {
      reason: 'retry'
    });
  });
});
