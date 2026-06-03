import { beforeEach, describe, expect, it, vi } from 'vitest';

const authMock = vi.hoisted(() => ({
  requireApiKeyOrUser: vi.fn(),
  requireUser: vi.fn()
}));

const serviceMock = vi.hoisted(() => ({
  getDiagnosis: vi.fn(),
  listDiagnoses: vi.fn(),
  rerunDiagnosis: vi.fn()
}));

const validationMock = vi.hoisted(() => ({
  parseJsonBody: vi.fn()
}));

vi.mock('@/lib/auth/session', () => authMock);
vi.mock('@/lib/services/diagnoses', () => serviceMock);
vi.mock('@/app/api/_lib/validation', () => validationMock);

import * as diagnosesListRoute from '@/app/api/diagnoses/route';
import * as diagnosisRoute from '@/app/api/diagnoses/[id]/route';

beforeEach(() => {
  authMock.requireApiKeyOrUser.mockReset();
  authMock.requireUser.mockReset();
  serviceMock.getDiagnosis.mockReset();
  serviceMock.listDiagnoses.mockReset();
  serviceMock.rerunDiagnosis.mockReset();
  validationMock.parseJsonBody.mockReset();
});

describe('diagnosis routes', () => {
  it('lists diagnoses', async () => {
    authMock.requireApiKeyOrUser.mockResolvedValue({ id: 'user-1' });
    serviceMock.listDiagnoses.mockResolvedValue({ items: [], page: 1, limit: 20, total: 0 });

    const response = await diagnosesListRoute.GET(new Request('http://localhost/api/diagnoses'));

    expect(response.status).toBe(200);
    expect(serviceMock.listDiagnoses).toHaveBeenCalledWith('user-1', { page: 1, limit: 20 });
  });

  it('gets diagnosis with api key auth', async () => {
    authMock.requireApiKeyOrUser.mockResolvedValue({ id: 'user-1' });
    serviceMock.getDiagnosis.mockResolvedValue({ id: 'diagnosis-1' });

    const response = await diagnosisRoute.GET(new Request('http://localhost/api/diagnoses/diagnosis-1'), {
      params: { id: 'diagnosis-1' }
    });

    expect(response.status).toBe(200);
    expect(serviceMock.getDiagnosis).toHaveBeenCalledWith('user-1', 'diagnosis-1');
  });

  it('reruns diagnosis', async () => {
    authMock.requireUser.mockResolvedValue({ id: 'user-1' });
    validationMock.parseJsonBody.mockResolvedValue({ reason: 'retry' });
    serviceMock.rerunDiagnosis.mockResolvedValue({
      jobId: 'job-1',
      diagnosisId: 'diagnosis-1',
      status: 'queued'
    });

    const response = await diagnosisRoute.POST(
      new Request('http://localhost/api/diagnoses/diagnosis-1', { method: 'POST' }),
      { params: { id: 'diagnosis-1' } }
    );

    expect(response.status).toBe(202);
    expect(serviceMock.rerunDiagnosis).toHaveBeenCalledWith('user-1', 'diagnosis-1', {
      reason: 'retry'
    });
  });
});
