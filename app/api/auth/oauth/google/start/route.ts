import { ok, fail } from '@/app/api/_lib/response';
import { parseJsonBody } from '@/app/api/_lib/validation';
import { startGoogleOAuth } from '@/lib/services/auth';
import { oauthStartSchema } from '@/lib/validators/auth';

export async function POST(request: Request) {
  try {
    const input = await parseJsonBody(request, oauthStartSchema);
    const data = await startGoogleOAuth(input);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
