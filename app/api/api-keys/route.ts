import { ok, fail } from '@/app/api/_lib/response';
import { parseJsonBody } from '@/app/api/_lib/validation';
import { requireUser } from '@/lib/auth/session';
import { createApiKey, listApiKeys } from '@/lib/services/api-keys';
import { createApiKeySchema } from '@/lib/validators/api-keys';

export async function GET() {
  try {
    const user = await requireUser();
    const data = await listApiKeys(user.id);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = await parseJsonBody(request, createApiKeySchema);
    const data = await createApiKey(user.id, input);
    return ok(data, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
