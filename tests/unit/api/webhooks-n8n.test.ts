import { beforeEach, describe, expect, it, vi } from 'vitest';

const verifierMock = vi.hoisted(() => ({
  ensureN8nSignature: vi.fn()
}));

const serviceMock = vi.hoisted(() => ({
  processDiagnosisComplete: vi.fn(),
  processObjectiveComplete: vi.fn()
}));

vi.mock('@/lib/n8n/verifier', () => verifierMock);
vi.mock('@/lib/services/webhooks', () => serviceMock);

import * as diagnosisRoute from '@/app/api/webhooks/n8n/diagnosis-complete/route';
import * as objectiveRoute from '@/app/api/webhooks/n8n/objective-complete/route';

beforeEach(() => {
  verifierMock.ensureN8nSignature.mockReset();
  serviceMock.processDiagnosisComplete.mockReset();
  serviceMock.processObjectiveComplete.mockReset();
});

describe('n8n diagnosis callback route', () => {
  it('returns ok on a valid callback', async () => {
    verifierMock.ensureN8nSignature.mockReturnValue(undefined);
    serviceMock.processDiagnosisComplete.mockResolvedValue({ ok: true });

    const payload = {
      job_id: '11111111-1111-1111-1111-111111111111',
      project_id: '22222222-2222-2222-2222-222222222222',
      diagnosis_id: '33333333-3333-3333-3333-333333333333',
      status: 'completed',
      result: {
        primary_problem_type: 'mixed',
        severity: 'medium',
        confidence_score: 88,
        diagnosis_summary: 'Summary',
        root_cause: 'Root cause',
        evidence: [],
        business_impact: { summary: 'Impact', metrics: [] },
        campaign_readiness: 'ready',
        recommended_next_step: 'Next step',
        objective_direction: 'traffic',
        not_recommended_actions: [],
        warnings: [],
        model_used: 'demo'
      }
    };

    const response = await diagnosisRoute.POST(
      new Request('http://localhost/api/webhooks/n8n/diagnosis-complete', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-n8n-signature': 'abc',
          'x-n8n-timestamp': '1710000000'
        },
        body: JSON.stringify(payload)
      })
    );
    const body = await response.json();

    expect(serviceMock.processDiagnosisComplete).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
  });

  it('returns validation error for invalid json', async () => {
    verifierMock.ensureN8nSignature.mockReturnValue(undefined);

    const response = await diagnosisRoute.POST(
      new Request('http://localhost/api/webhooks/n8n/diagnosis-complete', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-n8n-signature': 'abc',
          'x-n8n-timestamp': '1710000000'
        },
        body: '{'
      })
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns ok on a valid objective callback', async () => {
    verifierMock.ensureN8nSignature.mockReturnValue(undefined);
    serviceMock.processObjectiveComplete.mockResolvedValue({ ok: true });

    const payload = {
      job_id: '11111111-1111-1111-1111-111111111111',
      project_id: '22222222-2222-2222-2222-222222222222',
      objective_id: '44444444-4444-4444-4444-444444444444',
      status: 'completed',
      result: {
        objective_type: 'mixed',
        smart_objective: 'Increase traffic',
        risk_notes: [],
        model_used: 'demo'
      }
    };

    const response = await objectiveRoute.POST(
      new Request('http://localhost/api/webhooks/n8n/objective-complete', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-n8n-signature': 'abc',
          'x-n8n-timestamp': '1710000000'
        },
        body: JSON.stringify(payload)
      })
    );
    const body = await response.json();

    expect(serviceMock.processObjectiveComplete).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
  });
});
