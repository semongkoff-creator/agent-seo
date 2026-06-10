import { ok, fail } from '@/app/api/_lib/response';
import { requireUser } from '@/lib/auth/session';
import { listGooglePropertiesForConnection } from '@/lib/services/google-integrations';

export async function GET() {
  try {
    const user = await requireUser();
    const data = await listGooglePropertiesForConnection(user.id, 'gsc');
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
