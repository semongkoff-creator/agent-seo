import { beforeEach, describe, expect, it, vi } from 'vitest';

const authMock = vi.hoisted(() => ({
  requireApiKeyOrUser: vi.fn(),
  requireUser: vi.fn()
}));

const serviceMock = vi.hoisted(() => ({
  createProject: vi.fn(),
  listProjects: vi.fn()
}));

const validationMock = vi.hoisted(() => ({
  parseJsonBody: vi.fn()
}));

vi.mock('@/lib/auth/session', () => authMock);
vi.mock('@/lib/services/projects', () => serviceMock);
vi.mock('@/app/api/_lib/validation', () => validationMock);

import * as projectsRoute from '@/app/api/projects/route';

beforeEach(() => {
  authMock.requireApiKeyOrUser.mockReset();
  authMock.requireUser.mockReset();
  serviceMock.createProject.mockReset();
  serviceMock.listProjects.mockReset();
  validationMock.parseJsonBody.mockReset();
});

describe('projects route', () => {
  it('lists projects for authenticated users', async () => {
    authMock.requireApiKeyOrUser.mockResolvedValue({ id: 'user-1' });
    serviceMock.listProjects.mockResolvedValue({ items: [], page: 1, limit: 20, total: 0 });

    const response = await projectsRoute.GET(new Request('http://localhost/api/projects?page=1&limit=20'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(serviceMock.listProjects).toHaveBeenCalledWith('user-1', {
      page: 1,
      limit: 20,
      status: undefined
    });
    expect(body.ok).toBe(true);
  });

  it('creates projects with user auth', async () => {
    authMock.requireUser.mockResolvedValue({ id: 'user-1' });
    validationMock.parseJsonBody.mockResolvedValue({
      name: 'Alpha',
      websiteUrl: 'https://example.com'
    });
    serviceMock.createProject.mockResolvedValue({ id: 'project-1' });

    const response = await projectsRoute.POST(new Request('http://localhost/api/projects', { method: 'POST' }));
    const body = await response.json();

    expect(authMock.requireUser).toHaveBeenCalled();
    expect(serviceMock.createProject).toHaveBeenCalledWith('user-1', {
      name: 'Alpha',
      websiteUrl: 'https://example.com'
    });
    expect(response.status).toBe(201);
    expect(body.data.id).toBe('project-1');
  });
});
