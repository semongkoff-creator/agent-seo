import { ok, fail } from '@/app/api/_lib/response';
import { AppError } from '@/lib/errors';
import { processDiagnosisComplete } from '@/lib/services/webhooks';
import { diagnosisCompleteWebhookSchema } from '@/lib/validators/webhooks';
import { ensureN8nSignature } from '@/lib/n8n/verifier';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    ensureN8nSignature({
      body,
      signature: request.headers.get('x-n8n-signature'),
      timestampHeader: request.headers.get('x-n8n-timestamp')
    });

    let json: unknown;
    try {
      json = JSON.parse(body);
    } catch {
      throw new AppError('VALIDATION_ERROR', 'Webhook body must be valid JSON', 422);
    }

    const payload = diagnosisCompleteWebhookSchema.parse(json);
    const result = await processDiagnosisComplete(payload);
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
