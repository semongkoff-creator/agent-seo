import { createHmac } from 'node:crypto';
import { AppError } from '@/lib/errors';

export type N8nTriggerPayload = {
  jobId: string;
  projectId: string;
  userId: string;
  action: 'identify_problem' | 'define_objective';
  payload: Record<string, unknown>;
};

function signPayload(body: string, secret: string) {
  return createHmac('sha256', secret).update(body).digest('hex');
}

function resolveWebhookUrl(action: N8nTriggerPayload['action']) {
  if (action === 'identify_problem') {
    return process.env.N8N_IDENTIFY_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL || null;
  }

  return process.env.N8N_OBJECTIVE_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL || null;
}

export async function triggerJob(payload: N8nTriggerPayload) {
  const url = resolveWebhookUrl(payload.action);
  const secret = process.env.N8N_WEBHOOK_SECRET;

  if (!url || !secret) {
    const missingUrlEnv =
      payload.action === 'identify_problem'
        ? 'N8N_IDENTIFY_WEBHOOK_URL'
        : 'N8N_OBJECTIVE_WEBHOOK_URL';
    throw new AppError('INTEGRATION_ERROR', `N8N webhook is not configured. Set ${missingUrlEnv} and N8N_WEBHOOK_SECRET.`, 502);
  }

  const wirePayload = {
    ...payload,
    job_id: payload.jobId,
    project_id: payload.projectId,
    user_id: payload.userId
  };
  const body = JSON.stringify(wirePayload);
  const signature = signPayload(body, secret);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-app-signature': signature
    },
    body
  });

  if (!response.ok) {
    throw new AppError('N8N_ERROR', `n8n webhook failed with status ${response.status}`, 502, {
      status: response.status
    });
  }

  return response.json().catch(() => ({ ok: true, received: true }));
}
