import { ok, fail } from '@/app/api/_lib/response';
import { requireUser } from '@/lib/auth/session';
import { revokeApiKey } from '@/lib/services/api-keys';
import { apiKeyIdParamsSchema } from '@/lib/validators/api-keys';

type Params = { params: { id: string } };

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const parsed = apiKeyIdParamsSchema.parse(params);
    const user = await requireUser();
    const data = await revokeApiKey(user.id, parsed.id);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
