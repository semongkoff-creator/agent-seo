import { ok, fail } from '@/app/api/_lib/response';
import { parseJsonBody } from '@/app/api/_lib/validation';
import { requireUser } from '@/lib/auth/session';
import { startGoogleOAuthConnection } from '@/lib/services/google-integrations';
import { googleOAuthInitiateSchema } from '@/lib/validators/google-integrations';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const input = googleOAuthInitiateSchema.parse({
      service: url.searchParams.get('service')
    });
    const user = await requireUser();
    const data = await startGoogleOAuthConnection(user.id, input.service);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = await parseJsonBody(request, googleOAuthInitiateSchema);
    const user = await requireUser();
    const data = await startGoogleOAuthConnection(user.id, input.service);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
