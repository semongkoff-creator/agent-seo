import { ok, fail } from '@/app/api/_lib/response';
import { parseJsonBody } from '@/app/api/_lib/validation';
import { requireUser } from '@/lib/auth/session';
import { refreshGoogleOAuthConnection } from '@/lib/services/google-integrations';
import { googleOAuthServiceQuerySchema } from '@/lib/validators/google-integrations';

export async function POST(request: Request) {
  try {
    const input = await parseJsonBody(request, googleOAuthServiceQuerySchema);
    const user = await requireUser();
    const data = await refreshGoogleOAuthConnection(user.id, input.service);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
