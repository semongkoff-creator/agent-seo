import { createHmac } from 'node:crypto';
import { AppError } from '@/lib/errors';

export type N8nTriggerPayload = {
  jobId: string;
  projectId: string;
  userId: string;
  action: 'identify_problem' | 'define_objective';
  payload: Record<string, unknown>;
  callbackUrl: string;
};

function signPayload(body: string, secret: string) {
  return createHmac('sha256', secret).update(body).digest('hex');
}

export async function triggerJob(payload: N8nTriggerPayload) {
  const url =
    (payload.action === 'identify_problem'
      ? process.env.N8N_IDENTIFY_WEBHOOK_URL
      : process.env.N8N_OBJECTIVE_WEBHOOK_URL) ?? process.env.N8N_WEBHOOK_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;

  if (!url || !secret) {
    throw new AppError('INTEGRATION_ERROR', 'N8N webhook is not configured', 502);
  }

  const wirePayload = {
    ...payload,
    job_id: payload.jobId,
    project_id: payload.projectId,
    user_id: payload.userId,
    callback_url: payload.callbackUrl
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
