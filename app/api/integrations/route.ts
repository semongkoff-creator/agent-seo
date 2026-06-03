import { ok, fail } from '@/app/api/_lib/response';
import { requireUser } from '@/lib/auth/session';
import { listIntegrations } from '@/lib/services/integrations';

export async function GET() {
  try {
    const user = await requireUser();
    const data = await listIntegrations(user.id);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
