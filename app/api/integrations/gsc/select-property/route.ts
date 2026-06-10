import { ok, fail } from '@/app/api/_lib/response';
import { parseJsonBody } from '@/app/api/_lib/validation';
import { requireUser } from '@/lib/auth/session';
import { selectGoogleProperty } from '@/lib/services/google-integrations';
import { googlePropertySelectionSchema } from '@/lib/validators/google-integrations';

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = await parseJsonBody(request, googlePropertySelectionSchema);
    const data = await selectGoogleProperty({
      userId: user.id,
      service: input.service,
      property: input.property
    });
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
