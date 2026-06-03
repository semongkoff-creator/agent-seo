import { ok } from '../_lib/response';
import { db } from '@/lib/db/client';

export async function GET() {
  let dbStatus: 'ok' | 'fail' = 'ok';
  let n8nStatus: 'ok' | 'fail' = 'fail';

  try {
    const { error } = await db.from('users').select('id').limit(1);
    if (error) {
      dbStatus = 'fail';
    }
  } catch {
    dbStatus = 'fail';
  }

  const hasN8nEndpoint =
    Boolean(process.env.N8N_WEBHOOK_URL) ||
    Boolean(process.env.N8N_IDENTIFY_WEBHOOK_URL) ||
    Boolean(process.env.N8N_OBJECTIVE_WEBHOOK_URL);

  if (hasN8nEndpoint && process.env.N8N_WEBHOOK_SECRET) {
    n8nStatus = 'ok';
  }

  return ok({
    version: '0.1.0',
    db: dbStatus,
    n8n: n8nStatus
  });
}
